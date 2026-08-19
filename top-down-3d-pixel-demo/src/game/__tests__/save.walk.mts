/**
 * Save/load durability across a whole playthrough.
 *
 * save.roundtrip.mts proves one mid-game state survives a round trip. This is
 * the harsher version: it walks all twelve trials and, after EVERY stage,
 * saves, reloads, and asserts the reloaded store is byte-identical on every
 * persisted field and that quest progress is unchanged.
 *
 * This is the check that would have caught loadGame() silently dropping the
 * trial 5-10 fields, at the exact stage where the loss began.
 */
const store = new Map<string, string>();
(globalThis as any).window = { addEventListener() {}, removeEventListener() {} };
(globalThis as any).localStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => { store.set(k, v); },
  removeItem: (k: string) => { store.delete(k); },
};
(globalThis as any).document = { createElement: () => ({ getContext: () => null }) };

const { useElder } = await import("../eldervilleStory.ts");
const { saveGame, loadGame } = await import("../save.ts");
const { TRIALS, completedCount, activeTrial } = await import("../quests.ts");

const s = () => useElder.getState();
let fail = 0;
const ok = (c: boolean, m: string) => {
  if (!c) { console.log("  FAIL  " + m); fail++; }
};

/** Every field save.ts persists, so we can diff a reload field by field. */
const PERSISTED = [
  "wellTrialState", "scholarTrialState", "scholarDials", "widowTrialState", "carryingGrain",
  "marketTrialState", "combatTrialState", "dummyHealth", "hasSword", "caveStage", "bossHealth",
  "carryingBody", "hasCompass", "currentArea", "eldersAtDoorReady", "eldersDoorDialogDone",
  "tinslaireInsideTalked",
  "watchTrialState", "braziersLit", "watchOrder", "sluiceTrialState", "sluiceGates",
  "blightTrialState", "rowsInspected", "blightRow", "tallyTrialState", "sacksWeighed",
  "musterTrialState", "musterStep", "scrapTrialState", "scrapHealth",
] as const;

const snap = () => {
  const st = s() as any;
  return Object.fromEntries(PERSISTED.map((k) => [k, JSON.stringify(st[k])]));
};

useElder.setState({ eldersDoorDialogDone: true, tinslaireInsideTalked: true, currentArea: "village" });

const drive: { id: string; stages: (() => void)[] }[] = [
  { id: "well", stages: [() => s().setWellTrialState("assigned"), () => s().setWellTrialState("inspected"), () => s().setWellTrialState("completed")] },
  {
    id: "scholar",
    stages: [
      () => s().setScholarTrialState("assigned"),
      () => { useElder.setState({ currentArea: "council" }); s().setScholarTrialState("desk_read"); },
      () => s().setScholarTrialState("puzzle_solved"),
      () => { useElder.setState({ currentArea: "village" }); s().setScholarTrialState("completed"); },
    ],
  },
  {
    id: "widow",
    stages: [
      () => s().setWidowTrialState("assigned"),
      () => useElder.setState({ carryingGrain: true }),
      () => { useElder.setState({ currentArea: "homesteadA" }); },
      () => { useElder.setState({ carryingGrain: false, currentArea: "village" }); s().setWidowTrialState("delivered"); },
      () => s().setWidowTrialState("completed"),
    ],
  },
  { id: "market", stages: [() => s().setMarketTrialState("overpaid"), () => s().setMarketTrialState("completed")] },
  {
    id: "watch",
    stages: [
      () => { useElder.setState({ currentArea: "watchhouse" }); },
      () => { useElder.setState({ currentArea: "village" }); s().setWatchTrialState("assigned"); },
      () => { for (const i of s().watchOrder) s().lightBrazier(i); },
      () => s().setWatchTrialState("completed"),
    ],
  },
  {
    id: "sluice",
    stages: [
      () => s().setSluiceTrialState("assigned"),
      () => { const target = [2, 0, 1]; for (let i = 0; i < 3; i++) while (s().sluiceGates[i] !== target[i]) s().cycleSluice(i); },
      () => s().setSluiceTrialState("completed"),
    ],
  },
  {
    id: "blight",
    stages: [
      () => { useElder.setState({ currentArea: "orchardHut" }); },
      () => { useElder.setState({ currentArea: "village" }); s().setBlightTrialState("assigned"); },
      () => [0, 1, 2].forEach((i) => s().inspectRow(i)),
      () => s().setBlightTrialState("completed"),
    ],
  },
  {
    id: "tally",
    stages: [
      () => { useElder.setState({ currentArea: "granary" }); s().setTallyTrialState("assigned"); },
      () => [0, 1, 2, 3].forEach((i) => s().weighSack(i)),
      () => { useElder.setState({ currentArea: "village" }); s().setTallyTrialState("completed"); },
    ],
  },
  { id: "muster", stages: [() => s().setMusterTrialState("assigned"), () => { for (const m of ["guard", "dodge", "strike"] as const) s().answerMuster(m); }, () => s().setMusterTrialState("completed")] },
  {
    id: "scrap",
    stages: [
      () => s().setScrapTrialState("assigned"),
      () => { for (let i = 0; i < 3; i++) for (let h = 0; h < 2; h++) s().damageScrap(i, 20); },
      () => s().setScrapTrialState("completed"),
    ],
  },
  {
    id: "blade",
    stages: [
      () => s().setCombatTrialState("assigned"),
      () => { for (let i = 0; i < 3; i++) for (let h = 0; h < 3; h++) s().damageDummy(i, 20); },
      () => { useElder.setState({ currentArea: "home" }); },
      () => { useElder.setState({ hasSword: true, currentArea: "village" }); },
    ],
  },
  {
    id: "cave",
    stages: [
      () => s().setCaveStage("entered"),
      () => { useElder.setState({ currentArea: "cave" }); s().setCaveStage("boss_awake"); },
      () => { for (let i = 0; i < 4; i++) s().damageBoss(12); },
      () => useElder.setState({ carryingBody: true }),
      () => { useElder.setState({ currentArea: "village" }); },
      () => useElder.setState({ carryingBody: false, hasCompass: true, caveStage: "delivered" }),
    ],
  },
];

let stages = 0;
for (const trial of drive) {
  for (let i = 0; i < trial.stages.length; i++) {
    trial.stages[i]();
    stages++;

    const before = snap();
    const doneBefore = completedCount(s() as any);
    const activeBefore = activeTrial(s() as any)?.id ?? null;

    saveGame();
    // Scramble the live store so a no-op load cannot pass by accident.
    useElder.setState({
      musterStep: 99, braziersLit: [true, true, true], sluiceGates: [9, 9, 9],
      scrapHealth: [1, 2, 3], sacksWeighed: [true, true, true, true],
      rowsInspected: [true, true, true], currentArea: "nowhere",
    } as any);
    const loaded = loadGame();
    ok(loaded !== false, `${trial.id} stage ${i}: loadGame() accepted the save`);

    const after = snap();
    for (const k of PERSISTED) {
      ok(before[k] === after[k], `${trial.id} stage ${i}: ${k} survived (${before[k]} -> ${after[k]})`);
    }
    ok(completedCount(s() as any) === doneBefore, `${trial.id} stage ${i}: completed count held at ${doneBefore}`);
    ok((activeTrial(s() as any)?.id ?? null) === activeBefore, `${trial.id} stage ${i}: active trial held at ${activeBefore}`);
  }
}

console.log(`  checked ${stages} stages across ${drive.length} trials, ${TRIALS.length} in the spine`);
ok(completedCount(s() as any) === TRIALS.length, "all twelve trials complete at the end of the walk");
console.log(fail ? `\n${fail} SAVE-WALK FAILURE(S)` : "\nSAVE WALK OK — EVERY STAGE SURVIVES A RELOAD");
process.exit(fail ? 1 : 0);
