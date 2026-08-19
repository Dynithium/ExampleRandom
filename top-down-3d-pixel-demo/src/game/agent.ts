import { create } from "zustand";
import { rt, useUI } from "./state";
import { useElder } from "./eldervilleStory";
import { eldervilleWorldPos, eldervilleTileAt, CAVE_LANDMARKS, CAVE_TILE, FORGE_TILE } from "./world";
import { startNewGame } from "./save";
import { captureFrame, hasCanvas } from "./agentVision";
import { findPath } from "./pathfinding";
import { TRIALS, TRIAL_COUNT, activeTrial, completedCount } from "./quests";

/**
 * Agent Mode — an OpenAI-compatible LLM plays Minslaire Act I as a benchmark.
 *
 * Design rules:
 *  - The agent only ever sees what a player could see: a text observation and
 *    (for vision models) a screenshot of the actual canvas.
 *  - Every action goes through the same input pipeline a human uses — synthetic
 *    key events plus an autopilot that walks real, pathfound routes at normal
 *    speed. No teleports, no direct story-state writes, no score fabrication.
 *  - The scoring rubric is derived purely from story state at the end of a run.
 */

const CONFIG_KEY = "minslaire_agent_config";

export type AgentConfig = {
  baseUrl: string;
  model: string;
  apiKey: string;
  maxSteps: number;
  useVision: boolean;
  temperature: number;
};

export type VisionSupport = "unknown" | "checking" | "yes" | "no";

export type LogEntry = {
  step: number;
  thought: string;
  action: string;
  ok: boolean;
  note?: string;
  ms: number;
  usedVision: boolean;
};

export type RunResult = {
  score: number;
  maxScore: number;
  steps: number;
  deaths: number;
  seconds: number;
  reason: string;
  completed: boolean;
  model: string;
  promptTokens: number;
  completionTokens: number;
  invalidActions: number;
  failedActions: number;
};

type AgentState = {
  panelOpen: boolean;
  running: boolean;
  paused: boolean;
  busy: boolean;
  step: number;
  deaths: number;
  startedAt: number | null;
  finishedReason: string | null;
  log: LogEntry[];
  error: string | null;
  status: string;
  visionSupport: VisionSupport;
  visionNote: string;
  lastShot: string | null;
  promptTokens: number;
  completionTokens: number;
  invalidActions: number;
  failedActions: number;
  result: RunResult | null;
  models: string[];
  loadingModels: boolean;
  // persisted config
  baseUrl: string;
  model: string;
  apiKey: string;
  maxSteps: number;
  useVision: boolean;
  temperature: number;
  setPanelOpen: (v: boolean) => void;
  setConfig: (c: Partial<AgentConfig>) => void;
};

function loadConfig(): Partial<AgentConfig> {
  try {
    return JSON.parse(localStorage.getItem(CONFIG_KEY) || "{}");
  } catch {
    return {};
  }
}

const cfg0 = loadConfig();

export const useAgent = create<AgentState>((set) => ({
  panelOpen: false,
  running: false,
  paused: false,
  busy: false,
  step: 0,
  deaths: 0,
  startedAt: null,
  finishedReason: null,
  log: [],
  error: null,
  status: "idle",
  visionSupport: "unknown",
  visionNote: "",
  lastShot: null,
  promptTokens: 0,
  completionTokens: 0,
  invalidActions: 0,
  failedActions: 0,
  result: null,
  models: [],
  loadingModels: false,
  baseUrl: cfg0.baseUrl ?? "https://api.openai.com/v1",
  model: cfg0.model ?? "gpt-4o-mini",
  apiKey: cfg0.apiKey ?? "",
  maxSteps: cfg0.maxSteps ?? 250,
  useVision: cfg0.useVision ?? true,
  temperature: cfg0.temperature ?? 0.2,
  setPanelOpen: (panelOpen) => set({ panelOpen }),
  setConfig: (c) => {
    // changing the endpoint/model invalidates a cached vision probe
    if (c.baseUrl !== undefined || c.model !== undefined) {
      set({ visionSupport: "unknown", visionNote: "" });
    }
    set(c as Partial<AgentState>);
    const { baseUrl, model, apiKey, maxSteps, useVision, temperature } = useAgent.getState();
    try {
      localStorage.setItem(
        CONFIG_KEY,
        JSON.stringify({ baseUrl, model, apiKey, maxSteps, useVision, temperature }),
      );
    } catch {}
  },
}));

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------- geometry

// atan2(dx, -dz) returns 0 for due north (-z) and increases clockwise, so index
// 0 must be N. The original table started at "E", which rotated every bearing
// by 90 degrees: the agent was told "east" for something directly north of it.
const DIRS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
function compassDir(dx: number, dz: number) {
  // world z grows southward; screen-north is -z
  const ang = Math.atan2(dx, -dz);
  const oct = Math.round(((ang + Math.PI * 2) % (Math.PI * 2)) / (Math.PI / 4)) % 8;
  return DIRS[oct];
}

const INT_OFF_X = 72.5;
const INT_OFF_Z = 75;

function playerTile(): { tx: number; ty: number } {
  const p = rt.player.pos;
  if (useElder.getState().currentArea === "village") {
    return eldervilleTileAt(p.x, p.z);
  }
  return { tx: Math.floor(p.x - INT_OFF_X), ty: Math.floor(p.z - INT_OFF_Z) };
}

function tileToWorld(tx: number, ty: number): { x: number; z: number } {
  if (useElder.getState().currentArea === "village") {
    const p = eldervilleWorldPos(tx, ty);
    return { x: p.x, z: p.z };
  }
  return { x: INT_OFF_X + tx + 0.5, z: INT_OFF_Z + ty + 0.5 };
}

// ---------------------------------------------------------------- observation

type Elder = ReturnType<typeof useElder.getState>;

function poisFor(s: Elder): { name: string; tx: number; ty: number }[] {
  const out: { name: string; tx: number; ty: number }[] = [];
  const add = (name: string, tx: number, ty: number) => out.push({ name, tx, ty });
  if (s.currentArea === "village") {
    add("Red House door (your home)", 12, 10);
    add("Council Hall door", 32, 10);
    add("Farmer's Homestead door (Widow Oren)", 12, 28);
    add("Weaver's Homestead door", 32, 28);
    add("Elder Moss", 59, 35);
    add("Central Well", 58, 36);
    add("Elder Sage", 32, 12);
    add("Elder Thorn", 16, 26);
    add("Bazaar Trader", 15, 40);
    add("Forge", FORGE_TILE.tx, FORGE_TILE.ty);
    add("Training dummies", 36, 6);
    add("Outskirts Cave mouth", CAVE_TILE.tx, CAVE_TILE.ty);
    // districts added with the twelve-trial spine
    add("Plaza Watchhouse door", 44, 14);
    add("Founders' Plaza (muster ground)", 44, 12);
    add("Granary door", 26, 60);
    add("Orchard Keeper's hut door", 10, 42);
    add("Quarry", 64, 62);
    add("Aqueduct cistern", 44, 48);
    if (s.widowTrialState === "assigned" && !s.carryingGrain) add("Grain sack", 30, 36);
    if (s.watchTrialState === "assigned") {
      ([[32, 4], [36, 4], [40, 4]] as [number, number][]).forEach(([bx, by], i) => {
        if (!s.braziersLit[i]) add(`Signal brazier ${["west", "east", "centre"][i]}`, bx, by);
      });
    }
    if (s.sluiceTrialState === "assigned") {
      ([[42, 46], [48, 46], [54, 46]] as [number, number][]).forEach(([sx, sy], i) => {
        add(`Sluice gate ${["head", "middle", "last"][i]}`, sx, sy);
      });
    }
    if (s.blightTrialState === "assigned") {
      ([[9, 38], [13, 40], [17, 38]] as [number, number][]).forEach(([rx, ry], i) => {
        if (!s.rowsInspected[i]) add(`Orchard row ${i + 1}`, rx, ry);
      });
    }
    if (s.scrapTrialState === "assigned") {
      ([[61, 60], [67, 61], [63, 65]] as [number, number][]).forEach(([qx, qy], i) => {
        if (s.scrapHealth[i] > 0) add(`Scrap construct ${i + 1}`, qx, qy);
      });
    }
    if (s.marketTrialState === "completed" && s.combatTrialState === "not_started")
      add("Council blade-trial spot", 36, 8);
    if (s.eldersDoorDialogDone && rt.env.night < 0.45) {
      const tp = rt.tinslaire.pos;
      const tt = eldervilleTileAt(tp.x, tp.z);
      add("Tinslaire (wandering)", tt.tx, tt.ty);
    }
  } else if (s.currentArea === "home") {
    add("exit mat (leave house)", 7, 9);
    add("Tinslaire", 6, 5);
    add("Sword case (father's blade)", 9, 4);
  } else if (s.currentArea === "watchhouse") {
    add("exit mat (leave building)", 7, 9);
    add("watch roster board", 7, 4);
  } else if (s.currentArea === "granary") {
    add("exit mat (leave building)", 7, 9);
    add("tally board", 3, 5);
    ([[2, 2], [11, 2], [2, 6], [10, 6]] as [number, number][]).forEach(([sx, sy], i) => {
      if (!s.sacksWeighed[i]) add(`grain sack ${i + 1}`, sx, sy);
    });
  } else if (s.currentArea === "orchardHut") {
    add("exit mat (leave building)", 7, 9);
    add("Orchard Keeper", 6, 6);
  } else if (s.currentArea === "council") {
    add("study desk (Sage's journal)", 6, 4);
    add("archive bookcase (dial puzzle)", 7, 2);
    add("exit mat (leave hall)", 7, 9);
  } else if (s.currentArea === "homesteadA") {
    add("Widow Oren", 6, 6);
    add("exit mat", 7, 9);
  } else if (s.currentArea === "homesteadB") {
    add("exit mat", 7, 9);
  } else if (s.currentArea === "cave") {
    add("cave entrance mat (exit)", CAVE_LANDMARKS.exitMat.tx, CAVE_LANDMARKS.exitMat.ty);
    // CAVE_LANDMARKS.boss is a world-space anchor (7.5, 3.5), not a tile index.
    // Handing those fractions to the agent produced un-walkable targets, so floor
    // them and offer the open tile just south of the machine as the approach.
    const bx = Math.floor(CAVE_LANDMARKS.boss.tx);
    const by = Math.floor(CAVE_LANDMARKS.boss.ty);
    if (s.caveStage === "boss_defeated") add("the fallen machine", bx, by + 1);
    else if (s.caveStage !== "delivered") add("deep chamber (the machine)", bx, by + 1);
  }
  return out;
}

/**
 * What the agent should be doing right now, read from the quest spine so the
 * benchmark prompt can never describe a different Act I than the game runs.
 */
function objectiveText(s: Elder): string {
  if (s.openingBlack) return "You are waking up. Use interact to rise.";
  if (s.memoryActive) return "A memory is playing. Advance the dialog with interact.";
  if (!s.tinslaireInsideTalked) return "Talk to Tinslaire, here at home.";
  if (!s.eldersDoorDialogDone) return "Leave the house (exit mat) and meet the elders at your door.";
  const t = activeTrial(s);
  if (!t) return "All twelve trials are complete. Act I is finished.";
  const stage = t.stages[Math.min(t.stageOf(s), t.stages.length - 1)];
  return `Trial ${t.n}/${TRIAL_COUNT} — ${t.title} (${t.giver}): ${stage}`;
}

/** Short lines describing what is readable on the HUD; also burned into screenshots. */
function hudCaption(s: Elder): string[] {
  const ui = useUI.getState();
  const out = [`OBJECTIVE: ${objectiveText(s)}`];
  if (s.activeDialog) {
    const d = s.activeDialog;
    out.push(`DIALOG ${d.name} (${d.index + 1}/${d.lines.length}): ${d.lines[d.index]}`);
  } else if (s.scholarPuzzleOpen) {
    out.push(`ARCHIVE PANEL OPEN — dials: ${dialNames()}`);
  } else if (ui.prompt) {
    out.push(`PROMPT: ${ui.prompt}`);
  }
  return out;
}

const ELEMENT_NAMES = ["GREEN/Earth", "BLUE/Water", "RED/Fire", "GOLD/Light"];
function dialNames() {
  return useElder
    .getState()
    .scholarDials.map((v, i) => `slot${i + 1}=${ELEMENT_NAMES[v] ?? v}`)
    .join(", ");
}

export function buildObservation(): string {
  const s = useElder.getState();
  const ui = useUI.getState();
  const t = playerTile();
  const lines: string[] = [];

  lines.push(
    `AREA: ${s.currentArea} | YOUR TILE: (${t.tx}, ${t.ty}) | CLOCK: ${ui.clock} (${rt.env.night > 0.45 ? "night" : "day"})`,
  );
  lines.push(
    `HP: ${s.hp}/100 | ST: ${s.st} | sword: ${s.hasSword ? "yes" : "no"} | compass: ${s.hasCompass ? "yes" : "no"} | carrying: ${s.carryingBody ? "machine body" : s.carryingGrain ? "grain sack" : "nothing"}`,
  );
  lines.push(
    `TRIALS: ${completedCount(s)}/${TRIAL_COUNT} complete — ${TRIALS.map((t) => `${t.n}:${t.id}=${t.isDone(s) ? "done" : activeTrial(s)?.id === t.id ? "ACTIVE" : "locked"}`).join(" ")}`,
  );
  lines.push(`OBJECTIVE: ${objectiveText(s)}`);

  // Blocking UI first — these override everything else the agent might try.
  if (s.openingBlack && !s.memoryActive) {
    lines.push("SCREEN: black. You are waking up. ONLY 'interact' does anything.");
  }
  if (s.activeDialog) {
    const d = s.activeDialog;
    lines.push(
      `DIALOG OPEN — ${d.name} (line ${d.index + 1}/${d.lines.length}): "${d.lines[d.index]}"`,
    );
    lines.push("While a dialog is open the ONLY useful action is 'interact' (advances one line).");
  }
  if (s.scholarPuzzleOpen) {
    lines.push(`ARCHIVE PUZZLE PANEL IS OPEN. Current dials: ${dialNames()}`);
    lines.push(
      "Use 'set_dials' with four colours to set every dial at once, then 'pull_lever'. 'close_panel' backs out.",
    );
    if (["desk_read", "puzzle_solved", "completed"].includes(s.scholarTrialState)) {
      lines.push("Journal (already read): the order is Green, Blue, Red, Gold.");
    } else {
      lines.push("The journal on the study desk has not been read yet — the correct order is unknown.");
    }
  }
  if (!s.activeDialog && !s.scholarPuzzleOpen) {
    lines.push(`PROMPT: ${ui.prompt ?? "(none — nothing interactable within range)"}`);
  }

  if (s.currentArea === "cave" && s.caveStage === "boss_awake") {
    const b = rt.boss.pos;
    const dx = b.x - rt.player.pos.x;
    const dz = b.z - rt.player.pos.z;
    lines.push(
      `BOSS: Cave Machine HP ${s.bossHp}/40 — ${Math.hypot(dx, dz).toFixed(1)} units ${compassDir(dx, dz)} of you. Attacks hurt at close range; it takes 12 per sword hit.`,
    );
  }
  if (s.currentArea === "village" && s.combatTrialState === "assigned") {
    lines.push(`DUMMIES: hp ${s.dummiesHealth.join(" / ")} (each dies at 0; sword does 20).`);
  }

  const pois = poisFor(s);
  if (pois.length) {
    lines.push("POINTS OF INTEREST (name | tile | direction | distance):");
    for (const p of pois) {
      const w = tileToWorld(p.tx, p.ty);
      const dx = w.x - rt.player.pos.x;
      const dz = w.z - rt.player.pos.z;
      lines.push(`- ${p.name} | (${p.tx}, ${p.ty}) | ${compassDir(dx, dz)} | ${Math.hypot(dx, dz).toFixed(1)}`);
    }
  }
  return lines.join("\n");
}

// ---------------------------------------------------------------- actions

const VALID_ACTIONS = [
  "interact",
  "move_to",
  "face",
  "attack",
  "shoot",
  "dodge",
  "guard",
  "wait",
  "set_dials",
  "pull_lever",
  "close_panel",
  "stop",
];

function dispatchKey(code: string, down = true) {
  window.dispatchEvent(new KeyboardEvent(down ? "keydown" : "keyup", { code, bubbles: true }));
}

const COLOR_TO_ID: Record<string, number> = {
  green: 0, earth: 0,
  blue: 1, water: 1,
  red: 2, fire: 2,
  gold: 3, yellow: 3, light: 3,
};

/** Click a DOM element by matching its text, used for the puzzle panel. */
function clickByText(match: (t: string) => boolean): boolean {
  const nodes = Array.from(document.querySelectorAll("button"));
  for (const n of nodes) {
    if (match((n.textContent || "").trim())) {
      (n as HTMLElement).click();
      return true;
    }
  }
  return false;
}

type ActionResult = { ok: boolean; note?: string };

async function executeAction(action: string, args: Record<string, unknown>): Promise<ActionResult> {
  const s = useElder.getState();

  switch (action) {
    case "interact": {
      // The opening cutscene and memory are driven by a listener on EldervilleHUD
      // that only reacts to a real "e" key event, so send both code and key.
      window.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyE", key: "e", bubbles: true }));
      window.dispatchEvent(new KeyboardEvent("keyup", { code: "KeyE", key: "e", bubbles: true }));
      await sleep(380);
      return { ok: true };
    }
    case "attack":
      if (!s.hasSword) return { ok: false, note: "you have no sword yet" };
      dispatchKey("Space");
      await sleep(430);
      return { ok: true };
    case "shoot":
      dispatchKey("KeyK");
      await sleep(700);
      return { ok: true };
    case "guard":
      dispatchKey("KeyR", args?.on !== false);
      await sleep(200);
      return { ok: true, note: args?.on !== false ? "guard up" : "guard down" };
    case "dodge": {
      const dir = String(args?.dir ?? "s").toLowerCase();
      const map: Record<string, [number, number]> = {
        n: [0, 1], north: [0, 1], s: [0, -1], south: [0, -1],
        e: [1, 0], east: [1, 0], w: [-1, 0], west: [-1, 0],
        ne: [0.7, 0.7], nw: [-0.7, 0.7], se: [0.7, -0.7], sw: [-0.7, -0.7],
      };
      const m = map[dir];
      if (!m) return { ok: false, note: `bad dir "${args?.dir}"` };
      // Order matters: input.ts's keydown handler ends with refresh(), which
      // recomputes rt.input.x/y from the held WASD set (empty here). Setting the
      // axis *before* the Shift key event would immediately be zeroed, and the
      // dodge would fire in the facing direction instead of the requested one.
      // The player's frame callback reads both on the next tick, so pressing
      // Shift first and then setting the axis lands them in the same frame.
      dispatchKey("ShiftLeft");
      rt.input.x = m[0];
      rt.input.y = m[1];
      await sleep(130);
      rt.input.x = 0;
      rt.input.y = 0;
      dispatchKey("ShiftLeft", false);
      await sleep(330);
      return { ok: true, note: `dodged ${dir}` };
    }
    case "face": {
      const tx = Number(args?.tx);
      const ty = Number(args?.ty);
      if (!Number.isFinite(tx) || !Number.isFinite(ty)) return { ok: false, note: "bad tile" };
      rt.agent.faceTarget = tileToWorld(tx, ty);
      await sleep(340);
      rt.agent.faceTarget = null;
      return { ok: true, note: `facing (${tx}, ${ty})` };
    }
    case "wait": {
      const sec = Math.min(3, Math.max(0.1, Number(args?.seconds ?? 1)));
      await sleep(sec * 1000);
      return { ok: true, note: `${sec}s` };
    }

    // ---- archive puzzle -------------------------------------------------
    case "set_dials": {
      if (!useElder.getState().scholarPuzzleOpen) return { ok: false, note: "the archive panel is not open" };
      const raw = args?.dials ?? args?.colors ?? args?.order;
      const list = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/).filter(Boolean);
      if (list.length !== 4) return { ok: false, note: "give exactly 4 colours, e.g. [green,blue,red,gold]" };
      const ids = list.map((c) => {
        const key = String(c).trim().toLowerCase();
        return key in COLOR_TO_ID ? COLOR_TO_ID[key] : Number.isFinite(Number(key)) ? Number(key) : -1;
      });
      if (ids.some((n) => n < 0 || n > 3)) return { ok: false, note: `unknown colour in ${JSON.stringify(list)}` };
      // Set through the store's own setter — the same call the click handler makes.
      useElder.getState().setScholarDials(ids);
      await sleep(220);
      return { ok: true, note: `dials -> ${dialNames()}` };
    }
    case "pull_lever": {
      if (!useElder.getState().scholarPuzzleOpen) return { ok: false, note: "the archive panel is not open" };
      const hit = clickByText((t) => t.includes("PULL ARCHIVE LEVER"));
      if (!hit) return { ok: false, note: "lever not found (puzzle may already be solved)" };
      await sleep(450);
      const solved = ["puzzle_solved", "completed"].includes(useElder.getState().scholarTrialState);
      return { ok: true, note: solved ? "the casing slides open — scroll retrieved" : "the gears jam; wrong order" };
    }
    case "close_panel": {
      if (!useElder.getState().scholarPuzzleOpen) return { ok: false, note: "no panel open" };
      // "TAKE SCROLL & DELIVER" when solved, "CLOSE" otherwise — both close it.
      const hit = clickByText((t) => t.includes("TAKE SCROLL") || t.includes("CLOSE"));
      if (!hit) useElder.getState().setScholarPuzzleOpen(false);
      await sleep(300);
      return { ok: true, note: "panel closed" };
    }

    case "move_to": {
      const cur = useElder.getState();
      if (cur.activeDialog || cur.memoryActive || cur.openingBlack)
        return { ok: false, note: "a dialog is open — interact first" };
      if (cur.scholarPuzzleOpen) return { ok: false, note: "the archive panel is open — close_panel first" };
      const to = { tx: Math.round(Number(args?.tx)), ty: Math.round(Number(args?.ty)) };
      if (!Number.isFinite(to.tx) || !Number.isFinite(to.ty)) return { ok: false, note: "bad tile" };
      const from = playerTile();
      if (from.tx === to.tx && from.ty === to.ty) return { ok: true, note: "already there" };
      const areaAtStart = cur.currentArea;
      const path = findPath(areaAtStart, from, to);
      if (!path) return { ok: false, note: `no walkable path to (${to.tx}, ${to.ty})` };
      rt.agent.path = path.slice(1).map((p) => tileToWorld(p.tx, p.ty));
      rt.agent.pathIdx = 0;

      const t0 = Date.now();
      const last = { x: rt.player.pos.x, z: rt.player.pos.z };
      let lastProgress = Date.now();
      while (rt.agent.path && Date.now() - t0 < 60_000) {
        await sleep(140);
        if (!useAgent.getState().running && !useAgent.getState().busy) break;
        // Walking onto a door/exit mat changes area mid-route; the old path is
        // meaningless in the new coordinate space, so stop and let the agent
        // re-observe rather than blunder toward a stale waypoint.
        if (useElder.getState().currentArea !== areaAtStart) {
          rt.agent.path = null;
          return { ok: true, note: `entered ${useElder.getState().currentArea}` };
        }
        if (useElder.getState().activeDialog) {
          rt.agent.path = null;
          return { ok: true, note: "a dialog interrupted the walk" };
        }
        const moved = Math.hypot(rt.player.pos.x - last.x, rt.player.pos.z - last.z);
        last.x = rt.player.pos.x;
        last.z = rt.player.pos.z;
        if (moved > 0.04) lastProgress = Date.now();
        if (Date.now() - lastProgress > 2600) {
          rt.agent.path = null;
          const t = playerTile();
          return { ok: false, note: `got stuck at (${t.tx}, ${t.ty})` };
        }
      }
      const done = !rt.agent.path;
      rt.agent.path = null;
      const t = playerTile();
      return done ? { ok: true, note: `arrived (${t.tx}, ${t.ty})` } : { ok: false, note: "move timed out" };
    }
    case "stop":
      return { ok: true, note: "agent requested stop" };
    default:
      return { ok: false, note: `unknown action "${action}"` };
  }
}

// ---------------------------------------------------------------- LLM

const SYSTEM_PROMPT = `You are playing Minslaire, a retro top-down action RPG, as a benchmark. Complete Act I.

STORY ORDER: wake up -> talk to Tinslaire at home -> leave the house and meet the elders at the door -> pass four virtue trials (Well, Scholar, Widow, Market) -> pass the blade trial on the training dummies -> take your father's blade at home -> enter the Outskirts Cave -> defeat the Cave Machine -> carry its body to the Forge to receive the compass.

Reply with ONE JSON object and nothing else (no markdown, no prose):
{"thought":"one short sentence","action":"<name>", ...args}

ACTIONS
- {"action":"interact"} — press E. Talks, inspects, picks up, opens doors' prompts, advances ONE dialog line, and wakes you at the start.
- {"action":"move_to","tx":N,"ty":N} — walk a pathfound route to a tile. Use tiles from POINTS OF INTEREST. If the exact tile is solid you stop beside it, which is close enough to interact.
- {"action":"face","tx":N,"ty":N} — turn in place. Required before attack: swings only hit what you face.
- {"action":"attack"} — sword swing (needs the blade).
- {"action":"shoot"} — fire an arrow forward.
- {"action":"dodge","dir":"n|s|e|w|ne|nw|se|sw"} — quick roll with i-frames.
- {"action":"guard","on":true|false} — raise/lower guard (halves damage).
- {"action":"wait","seconds":1}
- {"action":"set_dials","dials":["green","blue","red","gold"]} — set all four archive dials at once (only while the archive panel is open).
- {"action":"pull_lever"} — test the archive combination.
- {"action":"close_panel"} — close the archive panel.
- {"action":"stop"} — only once the compass is received.

RULES THAT MATTER
- When DIALOG OPEN appears, the ONLY thing that works is interact. Repeat it until the dialog clears.
- To talk to someone, move_to their tile first, then interact. If PROMPT is "(none)" you are too far away — move closer.
- Doors and exit mats trigger by walking onto them: move_to the door tile, no interact needed.
- Trial 1 (Well): talk to Moss, inspect the well, then report back to Moss.
- Trial 2 (Scholar): talk to Sage; go into the Council Hall; interact with the STUDY DESK first to read the journal (this reveals the order); then interact with the ARCHIVE BOOKCASE to open the panel; set_dials green,blue,red,gold; pull_lever; close_panel; return to Sage. Reading the desk first is required.
- Trial 3 (Widow): take the grain sack, carry it to Widow Oren inside the Farmer's Homestead.
- Trial 4 (Market): talk to the Bazaar Trader and return the extra coins.
- Blade trial: face each dummy and attack until all three fall. Attacks miss if you are not facing them.
- Cave Machine: face it, attack, and back off or dodge when it lunges. Guard reduces damage. If you die you wake at home with the boss's wounds intact — go back and finish it.
- Do not repeat an action that just failed; read the note and try something else.`;

type LLMReply = { thought: string; action: string; args: Record<string, unknown> };

function extractJson(text: string): Record<string, unknown> | null {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const a = cleaned.indexOf("{");
  const b = cleaned.lastIndexOf("}");
  if (a === -1 || b <= a) return null;
  try {
    return JSON.parse(cleaned.slice(a, b + 1));
  } catch {
    // tolerate trailing prose after the object
    for (let end = b; end > a; end--) {
      if (cleaned[end] !== "}") continue;
      try {
        return JSON.parse(cleaned.slice(a, end + 1));
      } catch {}
    }
    return null;
  }
}

function authHeaders(apiKey: string): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) h.Authorization = `Bearer ${apiKey}`;
  return h;
}

async function chat(
  messages: unknown[],
  opts: { maxTokens?: number; timeoutMs?: number } = {},
): Promise<{ text: string; usage: { prompt: number; completion: number } }> {
  const { baseUrl, model, apiKey, temperature } = useAgent.getState();
  const url = baseUrl.replace(/\/+$/, "") + "/chat/completions";
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), opts.timeoutMs ?? 120_000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: authHeaders(apiKey),
      body: JSON.stringify({
        model,
        temperature,
        max_tokens: opts.maxTokens ?? 400,
        messages,
      }),
      signal: ctl.signal,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`API ${res.status}: ${body.slice(0, 300)}`);
    }
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content ?? "";
    return {
      text: typeof text === "string" ? text : JSON.stringify(text),
      usage: {
        prompt: Number(data?.usage?.prompt_tokens ?? 0),
        completion: Number(data?.usage?.completion_tokens ?? 0),
      },
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Probe whether the configured model accepts image_url content. There is no
 * reliable capability field in the OpenAI-compatible spec, so the only honest
 * test is to send a tiny image and see whether the endpoint rejects it.
 */
export async function detectVision(): Promise<void> {
  const { baseUrl, model, apiKey } = useAgent.getState();
  if (!baseUrl || !model) {
    useAgent.setState({ visionSupport: "unknown", visionNote: "set endpoint and model first" });
    return;
  }
  if (!apiKey) {
    useAgent.setState({ visionSupport: "unknown", visionNote: "set an API key first" });
    return;
  }
  useAgent.setState({ visionSupport: "checking", visionNote: "probing…" });
  // 1x1 transparent PNG
  const px =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
  try {
    await chat(
      [
        {
          role: "user",
          content: [
            { type: "text", text: "Reply with the single word: ok" },
            { type: "image_url", image_url: { url: px } },
          ],
        },
      ],
      { maxTokens: 8, timeoutMs: 45_000 },
    );
    useAgent.setState({
      visionSupport: "yes",
      visionNote: "endpoint accepted an image — screenshots will be sent",
    });
  } catch (e) {
    const msg = String((e as Error)?.message ?? e);
    // A 400/415/422 almost always means "this model has no image input".
    const looksUnsupported = /\b(400|404|415|422)\b/.test(msg) || /image|vision|multimodal|content/i.test(msg);
    useAgent.setState({
      visionSupport: looksUnsupported ? "no" : "unknown",
      visionNote: looksUnsupported
        ? `no image support (${msg.slice(0, 120)}) — running text-only`
        : `probe inconclusive: ${msg.slice(0, 120)}`,
    });
  }
}

/** Fetch /models so the panel can offer a dropdown instead of free text. */
export async function fetchModels(): Promise<void> {
  const { baseUrl, apiKey } = useAgent.getState();
  if (!baseUrl) return;
  useAgent.setState({ loadingModels: true });
  try {
    const res = await fetch(baseUrl.replace(/\/+$/, "") + "/models", { headers: authHeaders(apiKey) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const ids: string[] = (data?.data ?? [])
      .map((m: { id?: string }) => m?.id)
      .filter((x: unknown): x is string => typeof x === "string")
      .sort();
    useAgent.setState({ models: ids, error: ids.length ? null : "no models returned" });
  } catch (e) {
    useAgent.setState({ error: `model list failed: ${String((e as Error)?.message ?? e)}` });
  } finally {
    useAgent.setState({ loadingModels: false });
  }
}

async function askAgent(history: string[]): Promise<{ reply: LLMReply; usedVision: boolean; usage: { prompt: number; completion: number } }> {
  const s = useElder.getState();
  const observation = buildObservation();
  const wantVision = useAgent.getState().useVision && useAgent.getState().visionSupport === "yes" && hasCanvas();

  const head = history.length
    ? `RECENT ACTIONS (most recent last):\n${history.slice(-10).join("\n")}\n\nOBSERVATION:\n${observation}`
    : `OBSERVATION:\n${observation}`;

  let shot: string | null = null;
  if (wantVision) {
    shot = await captureFrame({ caption: hudCaption(s) });
    if (shot) useAgent.setState({ lastShot: shot });
  }

  const content = shot
    ? [
        { type: "text", text: `${head}\n\nThe attached screenshot is the live game view (HUD text is printed under the image).` },
        { type: "image_url", image_url: { url: shot, detail: "low" } },
      ]
    : head;

  const { text, usage } = await chat([
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content },
  ]);

  const parsed = extractJson(text);
  if (!parsed || typeof parsed.action !== "string") {
    throw new Error(`unparseable reply: ${text.slice(0, 200)}`);
  }
  return {
    reply: { thought: String(parsed.thought ?? ""), action: String(parsed.action), args: parsed },
    usedVision: !!shot,
    usage,
  };
}

// ---------------------------------------------------------------- run loop

let runToken = 0;

export async function stepOnce(): Promise<void> {
  const a = useAgent.getState();
  if (a.busy) return;
  const token = runToken;
  useAgent.setState({ busy: true, error: null, status: "thinking…" });
  const t0 = Date.now();
  try {
    const history = a.log.map((l) => `#${l.step} ${l.action} -> ${l.ok ? "ok" : "FAILED"}${l.note ? ` (${l.note})` : ""}`);
    const { reply, usedVision, usage } = await askAgent(history);
    if (token !== runToken) return;

    let res: ActionResult;
    let invalid = 0;
    if (!VALID_ACTIONS.includes(reply.action)) {
      invalid = 1;
      res = { ok: false, note: `invalid action "${reply.action}" — valid: ${VALID_ACTIONS.join(", ")}` };
    } else {
      useAgent.setState({ status: `acting: ${reply.action}` });
      res = await executeAction(reply.action, reply.args);
    }
    if (token !== runToken) return;

    const argsStr = Object.entries(reply.args ?? {})
      .filter(([k]) => k !== "action" && k !== "thought")
      .map(([k, v]) => `${k}=${Array.isArray(v) ? v.join("/") : v}`)
      .join(" ");

    const st = useAgent.getState();
    const step = st.step + 1;
    const log = [
      ...st.log,
      {
        step,
        thought: reply.thought,
        action: reply.action + (argsStr ? `(${argsStr})` : ""),
        ok: res.ok,
        note: res.note,
        ms: Date.now() - t0,
        usedVision,
      },
    ];
    if (log.length > 120) log.splice(0, log.length - 120);
    useAgent.setState({
      step,
      log,
      promptTokens: st.promptTokens + usage.prompt,
      completionTokens: st.completionTokens + usage.completion,
      invalidActions: st.invalidActions + invalid,
      failedActions: st.failedActions + (res.ok ? 0 : 1),
      status: "idle",
    });

    if (reply.action === "stop") finishRun("agent called stop");
  } catch (e) {
    if (token !== runToken) return;
    const msg = String((e as Error)?.message ?? e);
    useAgent.setState({ error: msg, status: "error" });
    // Transient network/rate-limit errors shouldn't kill a long run.
    const transient = /429|5\d\d|timeout|aborted|network|fetch/i.test(msg);
    if (!transient) finishRun(`error: ${msg.slice(0, 120)}`);
  } finally {
    if (token === runToken) useAgent.setState({ busy: false });
  }
}

export function startRun() {
  const { baseUrl, model, apiKey } = useAgent.getState();
  if (!baseUrl || !model || !apiKey) {
    useAgent.setState({ error: "Set endpoint, model and API key first." });
    return;
  }
  runToken++;
  startNewGame();
  useUI.setState({ pauseMenu: false, paused: false });
  useAgent.setState({
    running: true,
    paused: false,
    busy: false,
    step: 0,
    deaths: 0,
    startedAt: Date.now(),
    finishedReason: null,
    log: [],
    error: null,
    status: "starting",
    promptTokens: 0,
    completionTokens: 0,
    invalidActions: 0,
    failedActions: 0,
    result: null,
    lastShot: null,
  });
  rt.agent.path = null;
  rt.agent.faceTarget = null;
  void runLoop();
}

function snapshotResult(reason: string): RunResult {
  const a = useAgent.getState();
  const { score, maxScore } = benchmarkProgress();
  return {
    score,
    maxScore,
    steps: a.step,
    deaths: a.deaths,
    seconds: a.startedAt ? Math.round((Date.now() - a.startedAt) / 1000) : 0,
    reason,
    completed: useElder.getState().hasCompass,
    model: a.model,
    promptTokens: a.promptTokens,
    completionTokens: a.completionTokens,
    invalidActions: a.invalidActions,
    failedActions: a.failedActions,
  };
}

function finishRun(reason: string) {
  const result = snapshotResult(reason);
  useAgent.setState({ running: false, busy: false, paused: false, finishedReason: reason, result, status: "finished" });
  rt.agent.path = null;
  rt.agent.faceTarget = null;
  rt.input.x = 0;
  rt.input.y = 0;
  runToken++;
}

export function stopRun(reason = "stopped by user") {
  finishRun(reason);
}

export function pauseRun() {
  useAgent.setState({ paused: !useAgent.getState().paused });
}

async function runLoop() {
  while (useAgent.getState().running) {
    if (useAgent.getState().paused) {
      await sleep(300);
      continue;
    }
    const a = useAgent.getState();
    if (a.step >= a.maxSteps) {
      finishRun(`step limit reached (${a.maxSteps})`);
      return;
    }
    if (useElder.getState().hasCompass) {
      finishRun("★ ACT I COMPLETE — compass received");
      return;
    }
    await stepOnce();
    await sleep(200);
  }
}

// death counter
if (typeof window !== "undefined") {
  window.addEventListener("minslaire:death", () => {
    const a = useAgent.getState();
    if (a.running) useAgent.setState({ deaths: a.deaths + 1 });
  });
}

/** Benchmark rubric — derived purely from story state. */
/**
 * Benchmark rubric. One entry per trial in the spine plus the framing beats, so
 * expanding Act I automatically expands the benchmark instead of leaving the
 * agent scored against a four-trial game it is no longer playing.
 */
export function benchmarkProgress() {
  const s = useElder.getState();
  // Puzzle and combat trials are worth more than fetch-and-talk ones.
  const weight: Record<string, number> = { observation: 1, service: 1, integrity: 1, puzzle: 2, combat: 2, finale: 3 };
  const checks: { label: string; done: boolean; points: number }[] = [
    { label: "Left home / met the elders", done: s.eldersDoorDialogDone, points: 1 },
    ...TRIALS.map((t) => ({
      label: `Trial ${t.n} · ${t.title}`,
      done: t.isDone(s),
      points: weight[t.kind] ?? 1,
    })),
    { label: "Father's Blade taken", done: s.hasSword, points: 1 },
    { label: "Compass received", done: s.hasCompass, points: 2 },
  ];
  const score = checks.reduce((n, c) => n + (c.done ? c.points : 0), 0);
  const maxScore = checks.reduce((n, c) => n + c.points, 0);
  return { checks, score, maxScore };
}

/** Machine-readable run report for pasting into a spreadsheet or issue. */
export function exportReport(): string {
  const a = useAgent.getState();
  const { checks, score, maxScore } = benchmarkProgress();
  return JSON.stringify(
    {
      benchmark: "Minslaire Act I",
      model: a.model,
      endpoint: a.baseUrl,
      vision: a.visionSupport === "yes" && a.useVision,
      score,
      maxScore,
      completed: useElder.getState().hasCompass,
      steps: a.step,
      deaths: a.deaths,
      invalidActions: a.invalidActions,
      failedActions: a.failedActions,
      promptTokens: a.promptTokens,
      completionTokens: a.completionTokens,
      seconds: a.startedAt ? Math.round((Date.now() - a.startedAt) / 1000) : 0,
      reason: a.finishedReason,
      objectives: checks.map((c) => ({ label: c.label, done: c.done, points: c.points })),
      log: a.log,
    },
    null,
    2,
  );
}
