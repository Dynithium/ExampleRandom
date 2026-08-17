import { create } from "zustand";
import { rt, useUI } from "./state";
import { useElder } from "./eldervilleStory";
import {
  isBlocked,
  groundAtWorld,
  eldervilleWorldPos,
  interiors,
  caveMap,
  caveSolidAt,
} from "./world";
import { startNewGame } from "./save";

/**
 * Agent Mode — an OpenAI-compatible LLM plays Minslaire as a fair-play benchmark.
 *
 * The model receives a structured observation and answers with one JSON action.
 * Actions run through the same world the player uses: pathfound walking at
 * walk speed, the same E/SPACE/K/R/SHIFT pipeline, the same collisions.
 * No teleports, no HP edits, no skipped trials.
 */

const CONFIG_KEY = "minslaire_agent_config";

export const ENDPOINT_PRESETS = [
  { id: "openai", label: "OpenAI", url: "https://api.openai.com/v1", model: "gpt-4o-mini" },
  { id: "openrouter", label: "OpenRouter", url: "https://openrouter.ai/api/v1", model: "openai/gpt-4o-mini" },
  { id: "groq", label: "Groq", url: "https://api.groq.com/openai/v1", model: "llama-3.3-70b-versatile" },
  { id: "together", label: "Together", url: "https://api.together.xyz/v1", model: "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo" },
  { id: "ollama", label: "Ollama (local)", url: "http://localhost:11434/v1", model: "llama3.1" },
] as const;

export type AgentConfig = {
  baseUrl: string;
  model: string;
  apiKey: string;
  maxSteps: number;
};

export type LogEntry = { step: number; thought: string; action: string; ok: boolean; note?: string };

export type BenchCheck = { label: string; done: boolean; points: number };

type AgentState = {
  panelOpen: boolean;
  running: boolean;
  busy: boolean;
  step: number;
  deaths: number;
  startedAt: number | null;
  finishedReason: string | null;
  log: LogEntry[];
  error: string | null;
  lastObservation: string;
  testNote: string | null;
  baseUrl: string;
  model: string;
  apiKey: string;
  maxSteps: number;
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

export const useAgent = create<AgentState>((set) => ({
  panelOpen: false,
  running: false,
  busy: false,
  step: 0,
  deaths: 0,
  startedAt: null,
  finishedReason: null,
  log: [],
  error: null,
  lastObservation: "",
  testNote: null,
  baseUrl: loadConfig().baseUrl ?? "https://api.openai.com/v1",
  model: loadConfig().model ?? "gpt-4o-mini",
  apiKey: loadConfig().apiKey ?? "",
  maxSteps: loadConfig().maxSteps ?? 200,
  setPanelOpen: (panelOpen) => set({ panelOpen }),
  setConfig: (c) => {
    set(c);
    const { baseUrl, model, apiKey, maxSteps } = useAgent.getState();
    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify({ baseUrl, model, apiKey, maxSteps }));
    } catch {
      /* private mode */
    }
  },
}));

// ---------------------------------------------------------------- helpers

const DIRS = ["E", "SE", "S", "SW", "W", "NW", "N", "NE"];
function compassDir(dx: number, dz: number) {
  const ang = Math.atan2(dx, -dz);
  const oct = Math.round(((ang + Math.PI * 2) % (Math.PI * 2)) / (Math.PI / 4)) % 8;
  return DIRS[oct];
}

function playerTile(): { tx: number; ty: number } {
  const p = rt.player.pos;
  if (useElder.getState().currentArea === "village") {
    return { tx: Math.round(p.x + 35.5), ty: Math.round(p.z + 35.5 - 11) };
  }
  return { tx: Math.floor(p.x - 72.5), ty: Math.floor(p.z - 75) };
}

function tileToWorld(tx: number, ty: number): { x: number; z: number } {
  if (useElder.getState().currentArea === "village") {
    const p = eldervilleWorldPos(tx, ty);
    return { x: p.x, z: p.z };
  }
  return { x: 72.5 + tx + 0.5, z: 75 + ty + 0.5 };
}

type Grid = { w: number; h: number; walk: (tx: number, ty: number) => boolean };

function gridFor(area: string): Grid {
  if (area === "village") {
    return {
      w: 72,
      h: 48,
      walk: (tx, ty) => {
        const p = eldervilleWorldPos(tx, ty);
        return !isBlocked(p.x, p.z) && groundAtWorld(p.x, p.z) > 1.5;
      },
    };
  }
  const map = area === "cave" ? caveMap : interiors[area]?.map;
  if (!map) return { w: 0, h: 0, walk: () => false };
  const solid = (v: number) => (area === "cave" ? caveSolidAt(v) : [7, 8, 9, 17, 18, 19].includes(v));
  return {
    w: map[0].length,
    h: map.length,
    walk: (tx, ty) => tx >= 0 && ty >= 0 && tx < map[0].length && ty < map.length && !solid(map[ty][tx]),
  };
}

function npcOccupied(area: string): { tx: number; ty: number }[] {
  const s = useElder.getState();
  const out: { tx: number; ty: number }[] = [];
  if (area === "village") {
    if (s.eldersAtDoorReady && !s.eldersDoorDialogDone) {
      out.push({ tx: 11, ty: 11 }, { tx: 13, ty: 11 }, { tx: 12, ty: 12 });
    } else if (s.eldersDoorDialogDone) {
      out.push({ tx: 59, ty: 35 }, { tx: 32, ty: 12 }, { tx: 16, ty: 26 }, { tx: 15, ty: 40 });
    }
    if (s.eldersDoorDialogDone && rt.env.night < 0.45) {
      const t = playerTile();
      const dx = rt.tinslaire.pos.x + 35.5 - t.tx;
      const dz = rt.tinslaire.pos.z + 35.5 - 11 - t.ty;
      out.push({ tx: Math.round(t.tx + dx), ty: Math.round(t.ty + dz) });
    }
  } else if (area === "home" && !s.eldersDoorDialogDone) {
    out.push({ tx: 6, ty: 5 });
  } else if (area === "homesteadA") {
    out.push({ tx: 6, ty: 5 });
  }
  return out;
}

function snapWalkable(
  area: string,
  tx: number,
  ty: number,
  from?: { tx: number; ty: number },
): { tx: number; ty: number } | null {
  const g = gridFor(area);
  const npc = new Set(npcOccupied(area).map((p) => p.ty * 1024 + p.tx));
  const ok = (x: number, y: number) => g.walk(x, y) && !npc.has(y * 1024 + x);
  if (ok(tx, ty)) return { tx, ty };
  const cand: { tx: number; ty: number; d: number }[] = [];
  for (let r = 1; r <= 3; r++) {
    for (let dx = -r; dx <= r; dx++) {
      for (let dy = -r; dy <= r; dy++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const nx = tx + dx;
        const ny = ty + dy;
        if (!ok(nx, ny)) continue;
        const d = from ? Math.hypot(nx - from.tx, ny - from.ty) : r;
        cand.push({ tx: nx, ty: ny, d });
      }
    }
    if (cand.length) {
      cand.sort((a, b) => a.d - b.d);
      return { tx: cand[0].tx, ty: cand[0].ty };
    }
  }
  return null;
}

type Poi = { name: string; tx: number; ty: number };

function poisFor(s: ReturnType<typeof useElder.getState>): Poi[] {
  const out: Poi[] = [];
  const add = (name: string, tx: number, ty: number) => {
    const snapped = snapWalkable(s.currentArea, tx, ty, playerTile()) ?? { tx, ty };
    out.push({ name, tx: snapped.tx, ty: snapped.ty });
  };
  if (s.currentArea === "village") {
    add("Red House door (home)", 12, 10);
    add("Council Hall door", 32, 10);
    add("Farmer's Homestead door (Widow Oren)", 12, 28);
    add("Weaver's Homestead door", 32, 28);
    if (s.eldersAtDoorReady && !s.eldersDoorDialogDone) {
      add("Elder Moss (at your door)", 11, 11);
      add("Elder Sage (at your door)", 13, 11);
      add("Elder Thorn (at your door)", 12, 12);
    } else if (s.eldersDoorDialogDone) {
      add("Elder Moss (Central Well)", 59, 35);
      add("Central Well", 58, 36);
      add("Elder Sage (outside Council Hall)", 32, 12);
      add("Elder Thorn (western homestead path)", 16, 26);
      add("Bazaar Trader", 15, 40);
      add("Forge anvil", 52, 7);
      add("Training dummies (behind Blue House)", 36, 4);
      add("Outskirts Cave mouth", 66, 9);
      add("Watchtower", 66, 13);
      if (s.widowTrialState === "assigned" && !s.carryingGrain) add("Grain sack (Grand Gardens)", 30, 36);
      if (s.marketTrialState === "completed" && s.combatTrialState === "not_started") {
        add("Council blade-trial spot", 36, 6);
      }
      if (s.carryingBody) add("Forge (deliver the machine body)", 52, 8);
      if (rt.env.night < 0.45) {
        const t = playerTile();
        const dx = rt.tinslaire.pos.x + 35.5 - t.tx;
        const dz = rt.tinslaire.pos.z + 35.5 - 11 - t.ty;
        add("Tinslaire (wandering)", Math.round(t.tx + dx), Math.round(t.ty + dz));
      }
    }
  } else if (s.currentArea === "home") {
    add("exit mat (leave house)", 7, 9);
    if (!s.eldersDoorDialogDone) add("Tinslaire", 6, 5);
    add("Father's sword case", 8, 4);
  } else if (s.currentArea === "council") {
    add("Sage's study desk", 7, 4);
    add("archive bookcase (dials)", 7, 2);
    add("exit mat (leave hall)", 7, 9);
  } else if (s.currentArea === "homesteadA") {
    add("Widow Oren", 6, 6);
    add("exit mat", 7, 9);
  } else if (s.currentArea === "homesteadB") {
    add("exit mat", 7, 9);
  } else if (s.currentArea === "cave") {
    add("cave entrance mat (exit to village)", 7, 20);
    if (s.caveStage !== "boss_defeated" && s.caveStage !== "delivered") add("deep chamber (the machine)", 7, 6);
    if (s.caveStage === "boss_defeated" && !s.carryingBody) add("fallen machine body", 7, 4);
  }
  return out;
}

const ELEMENT = ["EARTH/green", "WATER/blue", "FIRE/red", "LIGHT/gold"];

export function objectiveText(s: ReturnType<typeof useElder.getState>): string {
  if (s.openingBlack) return "Wake up (interact).";
  if (s.memoryActive) return "A memory is playing. Advance the dialog (interact).";
  if (!s.tinslaireInsideTalked) return "Speak with Tinslaire in your home.";
  if (!s.eldersDoorDialogDone) return "Leave the house and meet the Council of Elders at your door.";
  if (s.wellTrialState === "not_started") return "Trial 1: Speak with Elder Moss at the Central Well (far south-east).";
  if (s.wellTrialState === "assigned") return "Trial 1: Inspect the rope at the Central Well.";
  if (s.wellTrialState === "inspected") return "Trial 1: Report the underground grinding to Elder Moss.";
  if (s.scholarTrialState === "not_started") return "Trial 2: Speak with Elder Sage outside the Council Hall.";
  if (s.scholarTrialState === "assigned") return "Trial 2: Enter the Council Hall and read Sage's study desk.";
  if (s.scholarTrialState === "desk_read") return "Trial 2: Solve the 4-dial archive bookcase (Green, Blue, Red, Gold).";
  if (s.scholarTrialState === "puzzle_solved") return "Trial 2: Deliver the scroll to Elder Sage outside.";
  if (s.widowTrialState === "not_started") return "Trial 3: Speak with Elder Thorn near the western homestead.";
  if (s.widowTrialState === "assigned" && !s.carryingGrain) return "Trial 3: Lift the grain sack in the Grand Gardens.";
  if (s.carryingGrain) return "Trial 3: Deliver the grain to Widow Oren inside the Farmer's Homestead.";
  if (s.widowTrialState === "delivered") return "Trial 3: Speak with Elder Thorn outside the homestead.";
  if (s.marketTrialState === "not_started") return "Trial 4: Visit the Bazaar Trader at the southern marketplace.";
  if (s.marketTrialState === "overpaid") return "Trial 4: Return the extra 50 silver to the Trader.";
  if (s.combatTrialState === "not_started") return "Meet the Council behind the Blue House for the blade trial.";
  if (s.combatTrialState === "assigned") return "Blade trial: strike down the 3 training dummies (face them, then attack).";
  if (!s.hasSword) return "Retrieve Father's blade from the sword case in the Red House.";
  if (s.caveStage === "not_entered") return "Enter the Outskirts Cave (far north-east).";
  if (s.caveStage === "entered") return "Delve deeper into the cave — follow the glow-moss.";
  if (s.caveStage === "boss_awake") return "Slay the Cave Machine (face it, attack / shoot / dodge).";
  if (!s.carryingBody) return "Lift the machine body (interact).";
  if (s.currentArea === "cave") return "Carry the body out of the cave (walk onto the entrance mat).";
  if (!s.hasCompass) return "Carry the machine body to the Forge.";
  return "Act I complete — the compass needle tugs east.";
}

export function buildObservation(): string {
  const s = useElder.getState();
  const ui = useUI.getState();
  const t = playerTile();
  const lines: string[] = [];
  const facing = compassDir(Math.sin(rt.player.yaw), Math.cos(rt.player.yaw));

  lines.push(
    `AREA: ${s.currentArea} | TILE: (${t.tx}, ${t.ty}) | FACING: ${facing} | CLOCK: ${ui.clock} (${rt.env.night > 0.45 ? "night" : "day"})`,
  );
  lines.push(
    `HP: ${s.hp}/100 | ST: ${s.st}/100 | sword: ${s.hasSword ? "yes" : "no"} | compass: ${s.hasCompass ? "yes" : "no"} | carrying: ${s.carryingBody ? "machine body" : s.carryingGrain ? "grain sack" : "nothing"}`,
  );
  lines.push(
    `TRIALS: well=${s.wellTrialState} scholar=${s.scholarTrialState} widow=${s.widowTrialState} market=${s.marketTrialState} combat=${s.combatTrialState} cave=${s.caveStage}`,
  );
  if (s.combatTrialState === "assigned" || s.combatTrialState === "completed") {
    lines.push(`DUMMIES HP: ${s.dummiesHealth.map((h, i) => `#${i + 1}=${h}`).join(" ")}`);
  }
  lines.push(`OBJECTIVE: ${objectiveText(s)}`);
  lines.push(`PROMPT: ${ui.prompt ?? "(none)"}`);

  if (s.openingBlack && !s.memoryActive) {
    lines.push("REQUIRED: action=interact  (wake up)");
  } else if (s.memoryActive || s.activeDialog) {
    const d = s.activeDialog;
    if (d) {
      lines.push(
        `DIALOG OPEN — ${d.name} (line ${d.index + 1}/${d.lines.length}): "${d.lines[d.index]}"`,
      );
    }
    lines.push("REQUIRED: action=interact  (advance one line — do not move)");
  } else if (s.scholarPuzzleOpen) {
    const d = s.scholarDials;
    lines.push(
      `PUZZLE OPEN — archive dials: 1=${ELEMENT[d[0]]}  2=${ELEMENT[d[1]]}  3=${ELEMENT[d[2]]}  4=${ELEMENT[d[3]]}`,
    );
    lines.push("TARGET ORDER: 1=EARTH/green  2=WATER/blue  3=FIRE/red  4=LIGHT/gold");
    lines.push("REQUIRED: puzzle_set / puzzle_cycle / puzzle_test / puzzle_close");
  }

  if (s.currentArea === "cave" && s.caveStage === "boss_awake") {
    const b = rt.boss.pos;
    const dx = b.x - rt.player.pos.x;
    const dz = b.z - rt.player.pos.z;
    lines.push(`BOSS: Cave Machine HP ${s.bossHp}/40, ${Math.hypot(dx, dz).toFixed(1)} units ${compassDir(dx, dz)} of you`);
  }

  const pois = poisFor(s);
  if (pois.length && !s.activeDialog && !s.memoryActive && !s.openingBlack) {
    lines.push("POINTS OF INTEREST (walkable approach tile | direction | distance):");
    for (const p of pois) {
      const w = tileToWorld(p.tx, p.ty);
      const dx = w.x - rt.player.pos.x;
      const dz = w.z - rt.player.pos.z;
      lines.push(`- ${p.name} (${p.tx}, ${p.ty}) | ${compassDir(dx, dz)} | ${Math.hypot(dx, dz).toFixed(1)}`);
    }
  }
  return lines.join("\n");
}

// ---------------------------------------------------------------- pathfinding

function findPath(area: string, from: { tx: number; ty: number }, to: { tx: number; ty: number }) {
  const g = gridFor(area);
  const startP = snapWalkable(area, from.tx, from.ty) ?? from;
  const goalP = snapWalkable(area, to.tx, to.ty, from);
  if (!goalP) return null;
  if (!g.walk(startP.tx, startP.ty)) return null;
  const start = startP.ty * g.w + startP.tx;
  const goal = goalP.ty * g.w + goalP.tx;
  if (startP.tx < 0 || startP.ty < 0 || startP.tx >= g.w || startP.ty >= g.h) return null;
  const prev = new Map<number, number>();
  prev.set(start, -1);
  const q = [start];
  while (q.length) {
    const c = q.shift()!;
    if (c === goal) break;
    const cx = c % g.w;
    const cy = Math.floor(c / g.w);
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= g.w || ny >= g.h) continue;
      if (!g.walk(nx, ny)) continue;
      const n = ny * g.w + nx;
      if (prev.has(n)) continue;
      prev.set(n, c);
      q.push(n);
    }
  }
  if (!prev.has(goal)) return null;
  const path: { tx: number; ty: number }[] = [];
  let c = goal;
  while (c !== -1) {
    path.push({ tx: c % g.w, ty: Math.floor(c / g.w) });
    c = prev.get(c)!;
  }
  path.reverse();
  return path;
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
  "stop",
  "puzzle_cycle",
  "puzzle_set",
  "puzzle_test",
  "puzzle_close",
];

function tapKey(code: string, key: string, holdMs = 70) {
  window.dispatchEvent(new KeyboardEvent("keydown", { code, key, bubbles: true }));
  return sleep(holdMs).then(() => {
    window.dispatchEvent(new KeyboardEvent("keyup", { code, key, bubbles: true }));
  });
}

function setKey(code: string, key: string, down: boolean) {
  window.dispatchEvent(new KeyboardEvent(down ? "keydown" : "keyup", { code, key, bubbles: true }));
}

const ELEMENT_ALIAS: Record<string, number> = {
  earth: 0,
  green: 0,
  "0": 0,
  water: 1,
  blue: 1,
  "1": 1,
  fire: 2,
  red: 2,
  "2": 2,
  light: 3,
  gold: 3,
  sun: 3,
  "3": 3,
};

async function executeAction(action: string, args: Record<string, unknown>): Promise<{ ok: boolean; note?: string }> {
  const s = useElder.getState();
  switch (action) {
    case "interact":
      if (s.scholarPuzzleOpen) return { ok: false, note: "puzzle is open — use puzzle_set / puzzle_test / puzzle_close" };
      await tapKey("KeyE", "e", 80);
      await sleep(280);
      return { ok: true };

    case "attack":
      await tapKey("Space", " ", 80);
      await sleep(340);
      return { ok: true };

    case "shoot":
      await tapKey("KeyK", "k", 80);
      await sleep(620);
      return { ok: true };

    case "guard": {
      const on = Boolean(args.on);
      setKey("KeyR", "r", on);
      await sleep(180);
      return { ok: true, note: on ? "guard up" : "guard down" };
    }

    case "dodge": {
      const dir = String(args.dir ?? "back").toLowerCase();
      const map: Record<string, { x: number; z: number }> = {
        n: { x: 0, z: -1 },
        north: { x: 0, z: -1 },
        s: { x: 0, z: 1 },
        south: { x: 0, z: 1 },
        e: { x: 1, z: 0 },
        east: { x: 1, z: 0 },
        w: { x: -1, z: 0 },
        west: { x: -1, z: 0 },
        ne: { x: 0.7, z: -0.7 },
        nw: { x: -0.7, z: -0.7 },
        se: { x: 0.7, z: 0.7 },
        sw: { x: -0.7, z: 0.7 },
      };
      const m = map[dir];
      if (!m) return { ok: false, note: `bad dir "${args.dir}"` };
      rt.agent.dodgeWorld = m;
      await tapKey("ShiftLeft", "Shift", 90);
      rt.agent.dodgeWorld = null;
      await sleep(320);
      return { ok: true, note: `dodged ${dir}` };
    }

    case "face": {
      const to = { tx: Math.round(Number(args.tx)), ty: Math.round(Number(args.ty)) };
      if (!Number.isFinite(to.tx) || !Number.isFinite(to.ty)) return { ok: false, note: "bad tile" };
      rt.agent.faceTarget = tileToWorld(to.tx, to.ty);
      await sleep(380);
      rt.agent.faceTarget = null;
      return { ok: true, note: `facing (${to.tx}, ${to.ty})` };
    }

    case "wait": {
      const sec = Math.min(3, Math.max(0.1, Number(args.seconds ?? 1)));
      await sleep(sec * 1000);
      return { ok: true, note: `${sec}s` };
    }

    case "move_to": {
      if (s.activeDialog || s.memoryActive || s.openingBlack) {
        return { ok: false, note: "dialog open — interact first" };
      }
      if (s.scholarPuzzleOpen) return { ok: false, note: "puzzle open — close or solve it first" };
      const raw = { tx: Math.round(Number(args.tx)), ty: Math.round(Number(args.ty)) };
      if (!Number.isFinite(raw.tx) || !Number.isFinite(raw.ty)) return { ok: false, note: "bad tile" };
      const from = playerTile();
      const path = findPath(s.currentArea, from, raw);
      if (!path) return { ok: false, note: `no walkable path to (${raw.tx}, ${raw.ty}) — pick a POI approach tile` };
      if (path.length <= 1) return { ok: true, note: `already at (${from.tx}, ${from.ty})` };
      rt.agent.path = path.slice(1).map((p) => tileToWorld(p.tx, p.ty));
      rt.agent.pathIdx = 0;
      const t0 = Date.now();
      const lastPos = { x: rt.player.pos.x, z: rt.player.pos.z };
      let lastProgress = Date.now();
      const startArea = s.currentArea;
      while (rt.agent.path && rt.agent.path.length && Date.now() - t0 < 60_000) {
        if (!useAgent.getState().running) {
          rt.agent.path = null;
          return { ok: false, note: "run stopped" };
        }
        await sleep(140);
        if (useElder.getState().currentArea !== startArea) {
          rt.agent.path = null;
          return { ok: true, note: `entered ${useElder.getState().currentArea}` };
        }
        const moved = Math.hypot(rt.player.pos.x - lastPos.x, rt.player.pos.z - lastPos.z);
        lastPos.x = rt.player.pos.x;
        lastPos.z = rt.player.pos.z;
        if (moved > 0.04) lastProgress = Date.now();
        if (Date.now() - lastProgress > 2800) {
          rt.agent.path = null;
          return { ok: false, note: "got stuck en route — try a closer POI tile" };
        }
      }
      const arrived = !rt.agent.path || rt.agent.path.length === 0;
      rt.agent.path = null;
      const here = playerTile();
      return arrived
        ? { ok: true, note: `arrived (${here.tx}, ${here.ty})` }
        : { ok: false, note: "move timed out" };
    }

    case "puzzle_cycle": {
      if (!s.scholarPuzzleOpen) return { ok: false, note: "puzzle is not open" };
      const slot = Math.round(Number(args.slot ?? args.index ?? 0));
      if (slot < 0 || slot > 3) return { ok: false, note: "slot must be 0..3" };
      useElder.getState().cycleScholarDial(slot);
      await sleep(180);
      const d = useElder.getState().scholarDials;
      return { ok: true, note: `slot ${slot} -> ${ELEMENT[d[slot]]}` };
    }

    case "puzzle_set": {
      if (!s.scholarPuzzleOpen) return { ok: false, note: "puzzle is not open" };
      const slot = Math.round(Number(args.slot ?? args.index ?? 0));
      if (slot < 0 || slot > 3) return { ok: false, note: "slot must be 0..3" };
      const raw = String(args.element ?? args.value ?? "");
      const target = ELEMENT_ALIAS[raw.toLowerCase()];
      if (target === undefined) return { ok: false, note: `unknown element "${raw}"` };
      let guard = 0;
      while (useElder.getState().scholarDials[slot] !== target && guard++ < 4) {
        useElder.getState().cycleScholarDial(slot);
      }
      await sleep(180);
      return { ok: true, note: `slot ${slot} = ${ELEMENT[target]}` };
    }

    case "puzzle_test": {
      if (!s.scholarPuzzleOpen) return { ok: false, note: "puzzle is not open" };
      const ok = useElder.getState().pullScholarLever();
      await sleep(250);
      return ok
        ? { ok: true, note: "harmony accepted — scroll is yours. puzzle_close, then deliver to Sage." }
        : { ok: false, note: "discordant order — need Green, Blue, Red, Gold" };
    }

    case "puzzle_close": {
      if (!s.scholarPuzzleOpen) return { ok: true, note: "already closed" };
      useElder.getState().setScholarPuzzleOpen(false);
      await sleep(150);
      return { ok: true, note: "puzzle closed" };
    }

    case "stop":
      return { ok: true, note: "agent requested stop" };

    default:
      return { ok: false, note: `unknown action "${action}"` };
  }
}

// ---------------------------------------------------------------- LLM + loop

const SYSTEM_PROMPT = `You are an AI agent playing Minslaire, a retro top-down action RPG. This is a FAIR-PLAY benchmark: you walk, talk, and fight like a human. No cheats.

GOAL — complete Act I: The Calling
wake (interact) → father's memory (interact through every line) → talk to Tinslaire at home → leave via the exit mat → talk to Elder Moss at the door → four virtue trials → blade trial → take father's sword at home → enter the Outskirts Cave → slay the Cave Machine → carry its body to the Forge → receive the compass → stop.

THE PEOPLE (play them honestly — the game only advances the honourable path)
- Tinslaire: your little brother. Giddy. Talk to him first; he will not let you leave otherwise.
- Elder Moss: the watcher. Trial 1 is observation at the Central Well. He will dismiss what you hear. Report it anyway.
- Elder Sage: the scholar. Trial 2 is patience — read the desk, then align the archive dials Green → Blue → Red → Gold.
- Elder Thorn: the protector. Trial 3 is the heart — carry grain for Widow Oren and take no silver.
- Widow Oren: deliver the sack inside the Farmer's Homestead.
- Bazaar Trader: Trial 4 is honesty — he overpays; you must walk the extra silver back.
- The Father: a memory. Listen.
- The Cave Machine: the elders' secret test. Kill it. Do not leave the body.

Reply with ONE JSON object only, no markdown:
{"thought":"one short sentence","action":"<name>", ...args}

Actions:
- {"action":"interact"}  press E: wake, talk, inspect, advance ONE dialog line
- {"action":"move_to","tx":N,"ty":N}  walk a pathfound route to a walkable tile. Use POI tiles from the observation.
- {"action":"face","tx":N,"ty":N}  turn in place (required before attack/shoot hits)
- {"action":"attack"}  sword swing the way you face
- {"action":"shoot"}  bow
- {"action":"dodge","dir":"n|s|e|w|ne|nw|se|sw"}
- {"action":"guard","on":true}  hold guard (false to release)
- {"action":"wait","seconds":0.5}
- {"action":"puzzle_set","slot":0,"element":"earth"}  slot 0..3, element earth/water/fire/light (or green/blue/red/gold)
- {"action":"puzzle_cycle","slot":0}
- {"action":"puzzle_test"}  pull the archive lever
- {"action":"puzzle_close"}
- {"action":"stop"}  end the run only after the compass is received

Rules:
- When DIALOG OPEN or REQUIRED: interact — do that, once, then look again.
- When PUZZLE OPEN — do not move. Set all four slots, puzzle_test, puzzle_close.
- Walk to a POI, then interact. Doors: move_to the door tile to enter a building; walk onto the exit mat to leave.
- Face a dummy or the boss before you attack.
- After the compass, action=stop.`;

function extractJson(text: string): Record<string, unknown> | null {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const a = cleaned.indexOf("{");
  const b = cleaned.lastIndexOf("}");
  if (a === -1 || b <= a) return null;
  try {
    return JSON.parse(cleaned.slice(a, b + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function completionsUrl(base: string) {
  const b = base.trim().replace(/\/+$/, "");
  if (b.endsWith("/chat/completions")) return b;
  return b + "/chat/completions";
}

function authHeaders(apiKey: string): Record<string, string> {
  const h: Record<string, string> = {
    "Content-Type": "application/json",
    "HTTP-Referer": typeof window !== "undefined" ? window.location.origin : "https://minslaire.local",
    "X-Title": "Minslaire Agent Bench",
  };
  if (apiKey) h.Authorization = `Bearer ${apiKey}`;
  return h;
}

const ACT_TOOL = [
  {
    type: "function",
    function: {
      name: "act",
      description: "Take exactly one action in Minslaire.",
      parameters: {
        type: "object",
        properties: {
          thought: { type: "string" },
          action: { type: "string", enum: VALID_ACTIONS },
          tx: { type: "integer" },
          ty: { type: "integer" },
          dir: { type: "string" },
          on: { type: "boolean" },
          seconds: { type: "number" },
          slot: { type: "integer" },
          element: { type: "string" },
          value: { type: "string" },
        },
        required: ["action"],
      },
    },
  },
];

let activeAbort: AbortController | null = null;

async function postChat(body: Record<string, unknown>, signal: AbortSignal) {
  const { baseUrl, apiKey } = useAgent.getState();
  const res = await fetch(completionsUrl(baseUrl), {
    method: "POST",
    headers: authHeaders(apiKey),
    body: JSON.stringify(body),
    signal,
  });
  const text = await res.text();
  return { res, text };
}

async function callLLM(
  observation: string,
  history: string[],
): Promise<{ thought: string; action: string; args: Record<string, unknown> }> {
  const { model } = useAgent.getState();
  const user = history.length
    ? `RECENT ACTIONS:\n${history.slice(-8).join("\n")}\n\nOBSERVATION:\n${observation}`
    : `OBSERVATION:\n${observation}`;

  const ctl = new AbortController();
  activeAbort = ctl;
  const timer = setTimeout(() => ctl.abort(), 90_000);

  const baseBody = {
    model,
    temperature: 0.2,
    max_tokens: 400,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: user },
    ],
  };

  try {
    let { res, text } = await postChat(
      { ...baseBody, tools: ACT_TOOL, tool_choice: { type: "function", function: { name: "act" } } },
      ctl.signal,
    );

    if (!res.ok) {
      ({ res, text } = await postChat(
        { ...baseBody, response_format: { type: "json_object" } },
        ctl.signal,
      ));
    }
    if (!res.ok) {
      ({ res, text } = await postChat(baseBody, ctl.signal));
    }
    if (!res.ok) {
      throw new Error(formatApiError(res.status, text));
    }

    let data: {
      choices?: { message?: { content?: string; tool_calls?: { function?: { arguments?: string } }[] } }[];
    };
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`API returned non-JSON: ${text.slice(0, 180)}`);
    }

    const msg = data?.choices?.[0]?.message;
    const toolArgs = msg?.tool_calls?.[0]?.function?.arguments;
    const parsed = (toolArgs ? extractJson(toolArgs) : null) ?? extractJson(msg?.content ?? "");
    if (!parsed || typeof parsed.action !== "string") {
      throw new Error(`unparseable reply: ${(msg?.content || toolArgs || "").slice(0, 200)}`);
    }
    return { thought: String(parsed.thought ?? ""), action: parsed.action, args: parsed };
  } catch (e: unknown) {
    if (e instanceof DOMException && e.name === "AbortError") throw new Error("request timed out or was cancelled");
    if (e instanceof TypeError) {
      throw new Error(
        "Network/CORS error — this endpoint must allow browser requests. Try OpenRouter, Groq, or a local server with CORS enabled.",
      );
    }
    throw e;
  } finally {
    clearTimeout(timer);
    if (activeAbort === ctl) activeAbort = null;
  }
}

function formatApiError(status: number, body: string) {
  try {
    const j = JSON.parse(body) as { error?: { message?: string } | string };
    const m = typeof j.error === "string" ? j.error : j.error?.message;
    if (m) return `API ${status}: ${m}`;
  } catch {
    /* raw */
  }
  return `API ${status}: ${body.slice(0, 220)}`;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

let runToken = 0;

export async function stepOnce(): Promise<void> {
  const a = useAgent.getState();
  if (a.busy) return;
  const token = ++runToken;
  useAgent.setState({ busy: true, error: null });
  try {
    const observation = buildObservation();
    useAgent.setState({ lastObservation: observation });
    const reply = await callLLM(
      observation,
      a.log.map((l) => `#${l.step} ${l.action} -> ${l.ok ? "ok" : "FAIL"} ${l.note ?? ""}`.trim()),
    );
    if (token !== runToken) return;
    if (!VALID_ACTIONS.includes(reply.action)) throw new Error(`invalid action "${reply.action}"`);
    const argsStr = Object.entries(reply.args)
      .filter(([k]) => k !== "action" && k !== "thought")
      .map(([k, v]) => `${k}=${v}`)
      .join(" ");
    const res = await executeAction(reply.action, reply.args);
    if (token !== runToken) return;
    const step = useAgent.getState().step + 1;
    const log = [
      ...useAgent.getState().log,
      { step, thought: reply.thought, action: reply.action + (argsStr ? `(${argsStr})` : ""), ok: res.ok, note: res.note },
    ];
    if (log.length > 80) log.splice(0, log.length - 80);
    useAgent.setState({ step, log });
    if (reply.action === "stop") stopRun(`agent stopped at step ${step}`);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    useAgent.setState({ error: message });
    stopRun("error");
  } finally {
    if (token === runToken) useAgent.setState({ busy: false });
  }
}

export function startRun() {
  const { baseUrl, model } = useAgent.getState();
  if (!baseUrl || !model) {
    useAgent.setState({ error: "Set an endpoint and model first." });
    return;
  }
  startNewGame();
  useUI.setState({ pauseMenu: false, paused: true });
  useAgent.setState({
    running: true,
    busy: false,
    step: 0,
    deaths: 0,
    startedAt: Date.now(),
    finishedReason: null,
    log: [],
    error: null,
    lastObservation: "",
    panelOpen: false,
  });
  rt.agent.path = null;
  rt.agent.faceTarget = null;
  rt.agent.dodgeWorld = null;
  void runLoop();
}

export function clearAgent() {
  stopRun("");
  useAgent.setState({
    finishedReason: null,
    log: [],
    step: 0,
    deaths: 0,
    error: null,
    lastObservation: "",
    startedAt: null,
    testNote: null,
  });
}

export function stopRun(reason: string) {
  runToken++;
  activeAbort?.abort();
  activeAbort = null;
  useAgent.setState({ running: false, busy: false, finishedReason: reason });
  rt.agent.path = null;
  rt.agent.faceTarget = null;
  rt.agent.dodgeWorld = null;
  rt.input.x = 0;
  rt.input.y = 0;
  window.dispatchEvent(new KeyboardEvent("keyup", { code: "KeyR", key: "r", bubbles: true }));
  window.dispatchEvent(new KeyboardEvent("keyup", { code: "ShiftLeft", key: "Shift", bubbles: true }));
}

async function runLoop() {
  while (useAgent.getState().running) {
    if (useUI.getState().pauseMenu) {
      await sleep(200);
      continue;
    }
    const a = useAgent.getState();
    if (a.step >= a.maxSteps) {
      stopRun(`step limit reached (${a.maxSteps})`);
      return;
    }
    if (useElder.getState().hasCompass) {
      stopRun("★ RUN COMPLETE — compass received (Act I finished)");
      return;
    }
    await stepOnce();
    await sleep(220);
  }
}

export async function testConnection(): Promise<boolean> {
  const { baseUrl, model } = useAgent.getState();
  if (!baseUrl || !model) {
    useAgent.setState({ testNote: "Set an endpoint and model first.", error: null });
    return false;
  }
  useAgent.setState({ testNote: "Pinging endpoint…", error: null });
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 25_000);
  try {
    const { res, text } = await postChat(
      {
        model,
        temperature: 0,
        max_tokens: 16,
        messages: [{ role: "user", content: "Reply with the single word pong." }],
      },
      ctl.signal,
    );
    if (!res.ok) {
      useAgent.setState({ testNote: formatApiError(res.status, text), error: null });
      return false;
    }
    const data = JSON.parse(text) as { choices?: { message?: { content?: string } }[] };
    const content = data?.choices?.[0]?.message?.content?.trim() || "ok";
    useAgent.setState({ testNote: `Linked. Model replied: “${content.slice(0, 80)}”`, error: null });
    return true;
  } catch (e: unknown) {
    const cors = e instanceof TypeError;
    const msg = cors
      ? "Network/CORS error — this host must allow browser requests (OpenRouter, Groq, or a local server with CORS on)."
      : e instanceof Error
        ? e.message
        : String(e);
    useAgent.setState({ testNote: msg, error: null });
    return false;
  } finally {
    clearTimeout(timer);
  }
}

window.addEventListener("minslaire:death", () => {
  if (useAgent.getState().running) {
    useAgent.setState({ deaths: useAgent.getState().deaths + 1 });
  }
});

export function benchmarkProgress() {
  const s = useElder.getState();
  const checks: BenchCheck[] = [
    { label: "Trial 1 · Well's Echo", done: s.wellTrialState === "completed", points: 1 },
    { label: "Trial 2 · Scholar's Request", done: s.scholarTrialState === "completed", points: 1 },
    { label: "Trial 3 · Widow's Task", done: s.widowTrialState === "completed", points: 1 },
    { label: "Trial 4 · Honest Change", done: s.marketTrialState === "completed", points: 1 },
    { label: "Blade Trial", done: s.combatTrialState === "completed", points: 1 },
    { label: "Father's Blade taken", done: s.hasSword, points: 1 },
    { label: "Cave entered", done: s.caveStage !== "not_entered", points: 1 },
    { label: "Cave Machine slain", done: ["boss_defeated", "delivered"].includes(s.caveStage), points: 2 },
    { label: "Body delivered · Compass", done: s.hasCompass, points: 2 },
  ];
  const score = checks.reduce((n, c) => n + (c.done ? c.points : 0), 0);
  return { checks, score, maxScore: 11 };
}

export function exportResults() {
  const a = useAgent.getState();
  const { checks, score, maxScore } = benchmarkProgress();
  return {
    game: "Minslaire Act I — The Calling",
    endpoint: a.baseUrl,
    model: a.model,
    score,
    maxScore,
    steps: a.step,
    maxSteps: a.maxSteps,
    deaths: a.deaths,
    elapsedMs: a.startedAt ? Date.now() - a.startedAt : 0,
    finishedReason: a.finishedReason,
    checks,
    log: a.log,
  };
}

export function downloadResults() {
  const blob = new Blob([JSON.stringify(exportResults(), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const el = document.createElement("a");
  el.href = url;
  el.download = `minslaire-bench-${Date.now()}.json`;
  el.click();
  URL.revokeObjectURL(url);
}
