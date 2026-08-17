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
 * Agent Mode — an OpenAI-compatible LLM plays Minslaire as a benchmark.
 *
 * The agent receives a structured text observation (position, objective, dialog,
 * nearby points of interest) and answers with one JSON action. Actions run through
 * the same input pipeline as a human player — synthetic key events and an autopilot
 * that walks real, pathfound routes at normal speed. No teleports, no state edits.
 */

const CONFIG_KEY = "minslaire_agent_config";

export type AgentConfig = {
  baseUrl: string;
  model: string;
  apiKey: string;
  maxSteps: number;
};

type LogEntry = { step: number; thought: string; action: string; ok: boolean; note?: string };

type AgentState = {
  panelOpen: boolean;
  running: boolean;
  busy: boolean; // awaiting the LLM or an action to finish
  step: number;
  deaths: number;
  startedAt: number | null;
  finishedReason: string | null;
  log: LogEntry[];
  error: string | null;
  // runtime config (persisted)
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
  baseUrl: loadConfig().baseUrl ?? "https://api.openai.com/v1",
  model: loadConfig().model ?? "gpt-4o-mini",
  apiKey: loadConfig().apiKey ?? "",
  maxSteps: loadConfig().maxSteps ?? 200,
  setPanelOpen: (panelOpen) => set({ panelOpen }),
  setConfig: (c) => {
    set(c as any);
    const { baseUrl, model, apiKey, maxSteps } = useAgent.getState();
    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify({ baseUrl, model, apiKey, maxSteps }));
    } catch {}
  },
}));

// ---------------------------------------------------------------- helpers

const DIRS = ["E", "SE", "S", "SW", "W", "NW", "N", "NE"];
function compassDir(dx: number, dz: number) {
  // world z grows southward; screen-north is -z
  const ang = Math.atan2(dx, -dz);
  const oct = Math.round(((ang + Math.PI * 2) % (Math.PI * 2)) / (Math.PI / 4)) % 8;
  return DIRS[oct];
}

function playerTile(): { tx: number; ty: number } {
  const p = rt.player.pos;
  if (useElder.getState().currentArea === "village") {
    // inverse of eldervilleWorldPos (tile centers, OX=0 / OZ=11 offsets)
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

/** POIs the observation offers, per area, with contextual filtering. */
function poisFor(s: ReturnType<typeof useElder.getState>): { name: string; tx: number; ty: number }[] {
  const out: { name: string; tx: number; ty: number }[] = [];
  const add = (name: string, tx: number, ty: number) => out.push({ name, tx, ty });
  if (s.currentArea === "village") {
    add("Red House door (home)", 12, 10);
    add("Council Hall door", 32, 10);
    add("Farmer's Homestead door", 12, 28);
    add("Weaver's Homestead door", 32, 28);
    add("Elder Moss", 59, 35);
    add("Central Well", 58, 36);
    add("Elder Sage", 32, 12);
    add("Elder Thorn", 16, 26);
    add("Bazaar Trader", 15, 40);
    add("Forge", 52, 7);
    add("Training dummies", 36, 4);
    add("Outskirts Cave mouth", 66, 9);
    add("Watchtower", 66, 13);
    if (s.widowTrialState === "assigned" && !s.carryingGrain) add("Grain sack", 30, 36);
    if (s.marketTrialState === "completed" && s.combatTrialState === "not_started") add("Council blade-trial spot", 36, 6);
    if (s.carryingBody) add("Forge (deliver body)", 52, 8);
    if (s.eldersDoorDialogDone && rt.env.night < 0.45) {
      const t = playerTile();
      const dx = rt.tinslaire.pos.x + 35.5 - t.tx;
      const dz = rt.tinslaire.pos.z + 35.5 - 11 - t.ty;
      if (Math.abs(dx) < 30 && Math.abs(dz) < 30) add("Tinslaire", Math.round(t.tx + dx), Math.round(t.ty + dz));
    }
  } else if (s.currentArea === "home") {
    add("exit mat (leave house)", 7, 9);
    add("Tinslaire", 6, 5);
    add("Sword case", 9, 4);
  } else if (s.currentArea === "council") {
    add("study desk", 6, 4);
    add("archive bookcase", 7, 2);
    add("exit mat (leave hall)", 7, 9);
  } else if (s.currentArea === "homesteadA") {
    add("Widow Oren", 6, 5);
    add("exit mat", 7, 9);
  } else if (s.currentArea === "cave") {
    add("cave entrance mat (exit)", 7, 20);
    if (s.caveStage !== "boss_defeated") add("deep chamber (the machine)", 7, 6);
  }
  return out;
}

export function buildObservation(): string {
  const s = useElder.getState();
  const ui = useUI.getState();
  const t = playerTile();
  const lines: string[] = [];

  const area = s.currentArea === "village" ? "village" : s.currentArea;
  lines.push(`AREA: ${area} | TILE: (${t.tx}, ${t.ty}) | CLOCK: ${ui.clock} (${rt.env.night > 0.45 ? "night" : "day"})`);
  lines.push(
    `HP: ${s.hp} | ST: ${s.st} | sword: ${s.hasSword ? "yes" : "no"} | compass: ${s.hasCompass ? "yes" : "no"} | carrying: ${s.carryingBody ? "machine body" : s.carryingGrain ? "grain sack" : "nothing"}`,
  );
  lines.push(
    `TRIALS: well=${s.wellTrialState} scholar=${s.scholarTrialState} widow=${s.widowTrialState} market=${s.marketTrialState} combat=${s.combatTrialState} cave=${s.caveStage}`,
  );
  lines.push(`OBJECTIVE: ${objectiveText(s)}`);
  lines.push(`PROMPT: ${ui.prompt ?? "(none)"}`);
  if (s.activeDialog) {
    lines.push(
      `DIALOG OPEN — ${s.activeDialog.name} (line ${s.activeDialog.index + 1}/${s.activeDialog.lines.length}): "${s.activeDialog.lines[s.activeDialog.index]}"`,
    );
  }
  if (s.currentArea === "cave" && s.caveStage === "boss_awake") {
    const b = rt.boss.pos;
    const dx = b.x - rt.player.pos.x, dz = b.z - rt.player.pos.z;
    lines.push(`BOSS: Cave Machine HP ${s.bossHp}/40, ${Math.hypot(dx, dz).toFixed(1)} units ${compassDir(dx, dz)} of you`);
  }
  const pois = poisFor(s);
  if (pois.length) {
    lines.push("POINTS OF INTEREST (tile | direction | distance):");
    for (const p of pois) {
      const w = tileToWorld(p.tx, p.ty);
      const dx = w.x - rt.player.pos.x, dz = w.z - rt.player.pos.z;
      lines.push(`- ${p.name} (${p.tx}, ${p.ty}) | ${compassDir(dx, dz)} | ${Math.hypot(dx, dz).toFixed(1)}`);
    }
  }
  return lines.join("\n");
}

function objectiveText(s: ReturnType<typeof useElder.getState>): string {
  if (s.openingBlack) return "You are waking up. Press interact.";
  if (s.memoryActive) return "A memory is playing. Advance the dialog.";
  if (!s.eldersDoorDialogDone) {
    return s.tinslaireInsideTalked ? "Meet the elders at your door (outside)." : "Talk to Tinslaire at home, then leave.";
  }
  if (s.wellTrialState !== "completed") return "Trial 1: Elder Moss at the Central Well.";
  if (s.scholarTrialState !== "completed") return "Trial 2: Elder Sage — study desk then archive dials in the Council Hall.";
  if (s.widowTrialState !== "completed") return "Trial 3: Elder Thorn — grain sack to Widow Oren.";
  if (s.marketTrialState !== "completed") return "Trial 4: Bazaar Trader — return the extra coins.";
  if (s.combatTrialState !== "completed") return "Blade trial: 3 training dummies behind the Blue House.";
  if (!s.hasSword) return "Take your father's blade from the sword case at home.";
  if (s.caveStage === "not_entered") return "Enter the Outskirts Cave (far north-east).";
  if (s.caveStage === "entered") return "Delve deeper into the cave.";
  if (s.caveStage === "boss_awake") return "Defeat the Cave Machine.";
  if (!s.carryingBody) return "Lift the machine body (E).";
  if (s.currentArea === "cave") return "Carry the body out of the cave.";
  return "Carry the body to the Forge.";
}

// ---------------------------------------------------------------- pathfinding

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

function findPath(area: string, from: { tx: number; ty: number }, to: { tx: number; ty: number }) {
  const g = gridFor(area);
  if (!g.walk(to.tx, to.ty)) return null;
  const start = from.ty * g.w + from.tx;
  const goal = to.ty * g.w + to.tx;
  if (from.tx < 0 || from.ty < 0 || from.tx >= g.w || from.ty >= g.h) return null;
  const prev = new Map<number, number>();
  prev.set(start, -1);
  const q = [start];
  while (q.length) {
    const c = q.shift()!;
    if (c === goal) break;
    const cx = c % g.w, cy = Math.floor(c / g.w);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nx = cx + dx, ny = cy + dy;
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

const VALID_ACTIONS = ["interact", "move_to", "face", "attack", "shoot", "dodge", "guard", "wait", "stop"];

function dispatchKey(code: string, down = true) {
  window.dispatchEvent(new KeyboardEvent(down ? "keydown" : "keyup", { code, bubbles: true }));
}

/** Execute one action. Resolves when the action is done (or failed). */
async function executeAction(action: string, args: any): Promise<{ ok: boolean; note?: string }> {
  const s = useElder.getState();
  switch (action) {
    case "interact":
      dispatchKey("KeyE");
      await sleep(350);
      return { ok: true };
    case "attack":
      dispatchKey("Space");
      await sleep(420);
      return { ok: true };
    case "shoot":
      dispatchKey("KeyK");
      await sleep(700);
      return { ok: true };
    case "guard":
      dispatchKey("KeyR", !!args?.on);
      await sleep(200);
      return { ok: true, note: args?.on ? "guard up" : "guard down" };
    case "dodge": {
      const dir = String(args?.dir ?? "back").toLowerCase();
      const map: Record<string, [number, number]> = {
        n: [0, 1], north: [0, 1], s: [0, -1], south: [0, -1],
        e: [1, 0], east: [1, 0], w: [-1, 0], west: [-1, 0],
        ne: [0.7, 0.7], nw: [-0.7, 0.7], se: [0.7, -0.7], sw: [-0.7, -0.7],
      };
      const m = map[dir];
      if (!m) return { ok: false, note: `bad dir "${args?.dir}"` };
      rt.input.x = m[0];
      rt.input.y = m[1];
      dispatchKey("ShiftLeft");
      await sleep(120);
      rt.input.x = 0;
      rt.input.y = 0;
      await sleep(350);
      return { ok: true, note: `dodged ${dir}` };
    }
    case "face": {
      const w = tileToWorld(Number(args?.tx), Number(args?.ty));
      rt.agent.faceTarget = w;
      await sleep(350);
      rt.agent.faceTarget = null;
      return { ok: true, note: `facing (${args?.tx}, ${args?.ty})` };
    }
    case "wait": {
      const sec = Math.min(3, Math.max(0.1, Number(args?.seconds ?? 1)));
      await sleep(sec * 1000);
      return { ok: true, note: `${sec}s` };
    }
    case "move_to": {
      if (s.activeDialog || s.memoryActive || s.openingBlack) return { ok: false, note: "dialog open — interact first" };
      const to = { tx: Math.round(Number(args?.tx)), ty: Math.round(Number(args?.ty)) };
      if (!Number.isFinite(to.tx) || !Number.isFinite(to.ty)) return { ok: false, note: "bad tile" };
      const from = playerTile();
      const path = findPath(s.currentArea, from, to);
      if (!path) return { ok: false, note: `no walkable path to (${to.tx}, ${to.ty})` };
      rt.agent.path = path.slice(1).map((p) => tileToWorld(p.tx, p.ty));
      rt.agent.pathIdx = 0;
      // wait for arrival (or get stuck and give up)
      const t0 = Date.now();
      const lastPos = { x: rt.player.pos.x, z: rt.player.pos.z };
      let lastProgress = Date.now();
      while (rt.agent.path && Date.now() - t0 < 60_000) {
        await sleep(150);
        const moved = Math.hypot(rt.player.pos.x - lastPos.x, rt.player.pos.z - lastPos.z);
        lastPos.x = rt.player.pos.x;
        lastPos.z = rt.player.pos.z;
        if (moved > 0.05) lastProgress = Date.now();
        if (Date.now() - lastProgress > 2500) {
          rt.agent.path = null;
          return { ok: false, note: "got stuck en route" };
        }
      }
      const done = !rt.agent.path;
      rt.agent.path = null;
      return done
        ? { ok: true, note: `arrived (${playerTile().tx}, ${playerTile().ty})` }
        : { ok: false, note: "move timed out" };
    }
    case "stop":
      return { ok: true, note: "agent requested stop" };
    default:
      return { ok: false, note: `unknown action "${action}"` };
  }
}

// ---------------------------------------------------------------- LLM + loop

const SYSTEM_PROMPT = `You are an AI agent playing Minslaire, a retro top-down action RPG. Your goal: complete Act I.
Beat of the story: wake up -> talk to Tinslaire -> meet the elders outside -> pass the four virtue trials (well, scholar, widow, market) -> pass the blade trial on training dummies -> take your father's sword at home -> enter the Outskirts Cave -> defeat the Cave Machine -> carry its body to the Forge and receive the compass.
Reply with ONE JSON object only, no markdown:
{"thought": "one short sentence", "action": "<name>", ...args}
Actions:
- {"action":"interact"} press E: talk, inspect, advance the current dialog line, wake up
- {"action":"move_to","tx":N,"ty":N} walk (pathfound) to a tile; use POI tiles from the observation
- {"action":"face","tx":N,"ty":N} turn in place (needed before attack hits)
- {"action":"attack"} sword swing in the direction you face
- {"action":"shoot"} fire an arrow in the direction you face
- {"action":"dodge","dir":"n|s|e|w|ne|nw|se|sw"} quick dodge roll
- {"action":"guard","on":true} hold your guard (false to release)
- {"action":"wait","seconds":0.5}
- {"action":"stop"} end the run when Act I is complete (compass received)
Tips: when DIALOG OPEN appears, your only useful action is interact (once per line). Move to a POI adjacent to a person before interacting. The well trial: talk to Moss, inspect the well, talk to Moss. The scholar trial: talk to Sage, read the desk inside, interact with the bookcase and solve dials in the order Green, Blue, Red, Gold (interact cycles each dial; the puzzle opens a panel — when the archive panel is open, actions are suspended, so just wait 1s steps until it closes). Attack the dummies/boss only while facing them.`;

function extractJson(text: string): any | null {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const a = cleaned.indexOf("{");
  const b = cleaned.lastIndexOf("}");
  if (a === -1 || b <= a) return null;
  try {
    return JSON.parse(cleaned.slice(a, b + 1));
  } catch {
    return null;
  }
}

async function callLLM(observation: string, history: string[]): Promise<{ thought: string; action: string; args: any }> {
  const { baseUrl, model, apiKey } = useAgent.getState();
  const url = baseUrl.replace(/\/+$/, "") + "/chat/completions";
  const user = history.length ? `RECENT ACTIONS:\n${history.slice(-8).join("\n")}\n\nOBSERVATION:\n${observation}` : `OBSERVATION:\n${observation}`;
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 90_000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 300,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: user },
        ],
      }),
      signal: ctl.signal,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`API ${res.status}: ${body.slice(0, 200)}`);
    }
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content ?? "";
    const parsed = extractJson(text);
    if (!parsed || typeof parsed.action !== "string") throw new Error(`unparseable reply: ${text.slice(0, 200)}`);
    return { thought: String(parsed.thought ?? ""), action: parsed.action, args: parsed };
  } finally {
    clearTimeout(timer);
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

let runToken = 0;

export async function stepOnce(): Promise<void> {
  const a = useAgent.getState();
  if (a.busy) return;
  const token = ++runToken;
  useAgent.setState({ busy: true, error: null });
  try {
    const observation = buildObservation();
    const reply = await callLLM(observation, a.log.map((l) => `#${l.step} ${l.action} -> ${l.ok ? "ok" : l.note ?? "ok"}`));
    if (token !== runToken) return;
    const action = reply.action;
    if (!VALID_ACTIONS.includes(action)) throw new Error(`invalid action "${action}"`);
    const argsStr = Object.entries(reply.args ?? {})
      .filter(([k]) => k !== "action" && k !== "thought")
      .map(([k, v]) => `${k}=${v}`)
      .join(" ");
    const res = await executeAction(action, reply.args);
    if (token !== runToken) return;
    const step = useAgent.getState().step + 1;
    const log = [...useAgent.getState().log, { step, thought: reply.thought, action: action + (argsStr ? `(${argsStr})` : ""), ok: res.ok, note: res.note }];
    if (log.length > 80) log.splice(0, log.length - 80);
    useAgent.setState({ step, log });
    if (action === "stop") {
      stopRun(`agent stopped at step ${step}`);
    }
  } catch (e: any) {
    useAgent.setState({ error: String(e?.message ?? e) });
    stopRun("error");
  } finally {
    if (token === runToken) useAgent.setState({ busy: false });
  }
}

export function startRun() {
  const { baseUrl, model, apiKey } = useAgent.getState();
  if (!baseUrl || !model || !apiKey) {
    useAgent.setState({ error: "Set endpoint, model, and API key first." });
    return;
  }
  // fresh benchmark run: reset the game and hand control to the agent
  if (!useUI.getState().started) startNewGame();
  useUI.setState({ pauseMenu: false });
  useAgent.setState({
    running: true,
    busy: false,
    step: 0,
    deaths: 0,
    startedAt: Date.now(),
    finishedReason: null,
    log: [],
    error: null,
  });
  rt.agent.path = null;
  rt.agent.faceTarget = null;
  void runLoop();
}

export function stopRun(reason: string) {
  useAgent.setState({ running: false, busy: false, finishedReason: reason });
  rt.agent.path = null;
  rt.agent.faceTarget = null;
  rt.input.x = 0;
  rt.input.y = 0;
  runToken++;
}

async function runLoop() {
  while (useAgent.getState().running) {
    const a = useAgent.getState();
    if (a.step >= a.maxSteps) {
      stopRun(`step limit reached (${a.maxSteps})`);
      return;
    }
    const s = useElder.getState();
    if (s.hasCompass) {
      stopRun("★ RUN COMPLETE — compass received (Act I finished)");
      return;
    }
    await stepOnce();
    await sleep(250);
  }
}

// death counter
window.addEventListener("minslaire:death", () => {
  if (useAgent.getState().running) {
    useAgent.setState({ deaths: useAgent.getState().deaths + 1 });
  }
});

/** Benchmark score derived from story state. */
export function benchmarkProgress() {
  const s = useElder.getState();
  const checks: { label: string; done: boolean; points: number }[] = [
    { label: "Trial 1 · Well's Echo", done: s.wellTrialState === "completed", points: 1 },
    { label: "Trial 2 · Scholar's Request", done: s.scholarTrialState === "completed", points: 1 },
    { label: "Trial 3 · Widow's Task", done: s.widowTrialState === "completed", points: 1 },
    { label: "Trial 4 · Honest Change", done: s.marketTrialState === "completed", points: 1 },
    { label: "Blade Trial", done: s.combatTrialState === "completed", points: 1 },
    { label: "Father's Blade taken", done: s.hasSword, points: 1 },
    { label: "Cave entered", done: s.caveStage !== "not_entered", points: 1 },
    { label: "Cave Machine slain", done: ["boss_defeated", "delivered"].includes(s.caveStage), points: 2 },
    { label: "Body delivered · Compass received", done: s.hasCompass, points: 2 },
  ];
  const score = checks.reduce((n, c) => n + (c.done ? c.points : 0), 0);
  return { checks, score, maxScore: 11 };
}
