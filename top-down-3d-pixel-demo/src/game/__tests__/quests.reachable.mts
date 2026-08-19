/**
 * Walk Act I the way a player does and prove you are never stranded.
 *
 * The spine test proves the twelve trials can be *completed in the store*. This
 * one proves the player can physically get to each one: at every stage of every
 * trial we ask the objective system where to go, then path there from wherever
 * the previous stage left us. A trial that points at a blocked tile, an
 * unreachable district, or nowhere at all fails here.
 */
const store = new Map<string, string>();
(globalThis as any).window = { addEventListener() {}, removeEventListener() {}, dispatchEvent() {}, AudioContext: undefined };
(globalThis as any).localStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
};
(globalThis as any).document = { querySelectorAll: () => [] };

const { useElder } = await import("../eldervilleStory.ts");
const { TRIALS, activeTrial } = await import("../quests.ts");
const { findPath } = await import("../pathfinding.ts");
const { SPAWN, eldervilleTileAt, villageDoors, interiors, isBlocked, groundAtWorld, eldervilleWorldPos } = await import("../world.ts");

const s = () => useElder.getState();
let fail = 0;
const ok = (cond: boolean, msg: string) => {
  console.log((cond ? "  PASS  " : "  FAIL  ") + msg);
  if (!cond) fail++;
};

/** Where the player currently stands, as a village tile. */
let cur = eldervilleTileAt(SPAWN.x, SPAWN.z);

/**
 * Resolve the active trial's target and confirm it is reachable.
 * Interior targets are checked in two parts: village -> that building's door,
 * then door -> the tile inside, on the interior grid.
 */
function checkTarget(label: string) {
  const st = s();
  const t = activeTrial(st);
  if (!t) return;
  const w = t.where(st);
  ok(!!w, `${label}: resolves a target`);
  if (!w) return;

  if (w.area === "village") {
    const p = findPath("village", cur, { tx: w.tx, ty: w.ty });
    ok(!!p, `${label}: village (${w.tx},${w.ty}) reachable from (${cur.tx},${cur.ty})${p ? ` in ${p.length}` : " — NO PATH"}`);
    if (p) cur = p[p.length - 1];
  } else {
    const door = villageDoors.find((d) => d.interior === w.area);
    ok(!!door, `${label}: interior "${w.area}" has a door in the village`);
    if (!door) return;
    const toDoor = findPath("village", cur, { tx: door.tx, ty: door.ty });
    ok(!!toDoor, `${label}: door of ${w.area} (${door.tx},${door.ty}) reachable${toDoor ? "" : " — NO PATH"}`);
    if (toDoor) cur = toDoor[toDoor.length - 1];
    const map = interiors[w.area];
    ok(!!map, `${label}: interior "${w.area}" exists`);
    if (!map) return;
    // inside: from the exit mat to the objective tile
    const inside = findPath(w.area, { tx: 7, ty: 9 }, { tx: Math.floor(w.tx), ty: Math.floor(w.ty) });
    ok(!!inside, `${label}: inside ${w.area}, (${Math.floor(w.tx)},${Math.floor(w.ty)}) reachable from the mat${inside ? "" : " — NO PATH"}`);
  }
}

// Every POI a trial can send you to must be a real, standable tile.
console.log("\n=== every village objective tile is standable ===");
{
  const villageTargets: [string, number, number][] = [
    ["Moss", 59, 35], ["well", 58, 36], ["Sage", 32, 12], ["Thorn", 16, 26], ["trader", 15, 40],
    ["grain sack", 30, 36], ["plaza", 44, 12], ["blade spot", 36, 8], ["dummies", 36, 6],
    ["cistern", 44, 48], ["quarry", 64, 62], ["cave mouth", 90, 8], ["forge", 52, 7],
    ["brazier W", 32, 4], ["brazier E", 36, 4], ["brazier C", 40, 4],
    ["sluice head", 42, 46], ["sluice mid", 48, 46], ["sluice last", 54, 46],
    ["orchard row 1", 9, 38], ["orchard row 2", 13, 40], ["orchard row 3", 17, 38],
    ["scrap 1", 61, 60], ["scrap 2", 67, 61], ["scrap 3", 63, 65],
  ];
  const unreachable: string[] = [];
  for (const [name, tx, ty] of villageTargets) {
    // Either the tile itself is standable, or a neighbour is (props are solid
    // on purpose — you interact from beside them).
    const p = eldervilleWorldPos(tx, ty);
    const standable = !isBlocked(p.x, p.z) && groundAtWorld(p.x, p.z) > 1.5;
    let neighbourOk = false;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const q = eldervilleWorldPos(tx + dx, ty + dy);
      if (!isBlocked(q.x, q.z) && groundAtWorld(q.x, q.z) > 1.5) neighbourOk = true;
    }
    if (!standable && !neighbourOk) unreachable.push(`${name}(${tx},${ty})`);
  }
  ok(unreachable.length === 0, `all ${villageTargets.length} objective tiles are approachable${unreachable.length ? " — " + unreachable.join(" ") : ""}`);
}

// ------------------------------------------------------------------ the walk
console.log("\n=== walking the spine, checking reachability at each stage ===");
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

for (const trial of drive) {
  const t = TRIALS.find((x) => x.id === trial.id)!;
  console.log(`\n  -- Trial ${t.n}: ${t.title}`);
  checkTarget(`T${t.n} stage 0`);
  trial.stages.forEach((run, i) => {
    run();
    // cave/interior-only stages have no village target; checkTarget handles null
    if (s().currentArea === "village") checkTarget(`T${t.n} stage ${i + 1}`);
  });
  ok(t.isDone(s()), `  trial ${t.n} "${t.id}" finished`);
}

console.log("\n=== finish ===");
ok(activeTrial(s()) === null, "Act I complete — no active trial remains");
console.log(fail === 0 ? "\nREACHABILITY OK — NO STAGE STRANDS THE PLAYER" : `\n${fail} FAILURE(S)`);
process.exit(fail === 0 ? 0 : 1);
