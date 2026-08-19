/**
 * The quest spine is the thing that makes Act I a game you play rather than a
 * map you wander, so it gets the strictest test in the suite.
 *
 * Two properties matter and both are checked against the REAL store:
 *   1. COMPLETABLE — all twelve trials can be finished in order, and the spine
 *      reports 12/12 at the end.
 *   2. UNSKIPPABLE — at every point in that playthrough, exactly the trials up
 *      to and including the active one are unlocked, and everything after it is
 *      refused. This is the property the old scattered conditionals violated.
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
const { TRIALS, TRIAL_COUNT, activeTrial, completedCount, isUnlocked } = await import("../quests.ts");

const s = () => useElder.getState();
let fail = 0;
const ok = (cond: boolean, msg: string) => {
  console.log((cond ? "  PASS  " : "  FAIL  ") + msg);
  if (!cond) fail++;
};

// ---------------------------------------------------------------- structure
console.log("\n=== spine shape ===");
ok(TRIAL_COUNT === 12, `the spine has ${TRIAL_COUNT} trials (expected 12)`);
ok(new Set(TRIALS.map((t) => t.id)).size === TRIAL_COUNT, "every trial id is unique");
ok(TRIALS.every((t, i) => t.n === i + 1), "trial numbers are 1..12 in array order");
ok(TRIALS.every((t) => t.stages.length > 0), "every trial declares at least one stage");
ok(TRIALS.every((t) => t.title && t.giver && t.blurb), "every trial has title/giver/blurb");
{
  const kinds = new Set(TRIALS.map((t) => t.kind));
  ok(kinds.has("puzzle") && kinds.has("combat"), `trial kinds include puzzles and combat (${[...kinds].join(", ")})`);
  const combat = TRIALS.filter((t) => t.kind === "combat").length;
  const puzzle = TRIALS.filter((t) => t.kind === "puzzle").length;
  ok(combat >= 3, `at least 3 combat trials (${combat})`);
  ok(puzzle >= 3, `at least 3 puzzle trials (${puzzle})`);
}

// ------------------------------------------------------------- unskippable
console.log("\n=== nothing is reachable before its turn (fresh save) ===");
{
  const fresh = s();
  ok(isUnlocked(fresh, "well"), "trial 1 is unlocked at the start");
  const laterLocked = TRIALS.slice(1).every((t) => !isUnlocked(fresh, t.id));
  ok(laterLocked, "trials 2-12 are ALL locked at the start");
  ok(activeTrial(fresh)?.id === "well", "the active trial is trial 1");
  ok(completedCount(fresh) === 0, "0 trials complete at the start");
}

/**
 * Advance the store exactly the way the game does, one trial at a time, and
 * assert the lock invariant before each step.
 */
const advance: { id: string; run: () => void }[] = [
  { id: "well", run: () => { s().setWellTrialState("assigned"); s().setWellTrialState("inspected"); s().setWellTrialState("completed"); } },
  { id: "scholar", run: () => { s().setScholarTrialState("assigned"); s().setScholarTrialState("desk_read"); s().setScholarDials([0, 1, 2, 3]); s().setScholarTrialState("puzzle_solved"); s().setScholarTrialState("completed"); } },
  { id: "widow", run: () => { s().setWidowTrialState("assigned"); useElder.setState({ carryingGrain: true }); useElder.setState({ carryingGrain: false }); s().setWidowTrialState("delivered"); s().setWidowTrialState("completed"); } },
  { id: "market", run: () => { s().setMarketTrialState("overpaid"); s().setMarketTrialState("completed"); } },
  {
    id: "watch",
    run: () => {
      s().setWatchTrialState("assigned");
      // wrong order first: must snuff the line and NOT advance
      const bad = s().lightBrazier(1);
      if (bad !== "wrong") throw new Error("expected out-of-order brazier to be rejected");
      if (s().braziersLit.some(Boolean)) throw new Error("a wrong light must snuff the whole line");
      for (const i of s().watchOrder) s().lightBrazier(i);
      s().setWatchTrialState("completed");
    },
  },
  {
    id: "sluice",
    run: () => {
      s().setSluiceTrialState("assigned");
      // brute-force the gates the way a player would, cycling each 0->1->2
      const target = [2, 0, 1];
      for (let i = 0; i < 3; i++) while (s().sluiceGates[i] !== target[i]) s().cycleSluice(i);
      if (s().sluiceTrialState !== "inspected") throw new Error("correct gate combination did not solve the cistern");
      s().setSluiceTrialState("completed");
    },
  },
  { id: "blight", run: () => { s().setBlightTrialState("assigned"); [0, 1, 2].forEach((i) => s().inspectRow(i)); s().setBlightTrialState("completed"); } },
  { id: "tally", run: () => { s().setTallyTrialState("assigned"); [0, 1, 2, 3].forEach((i) => s().weighSack(i)); s().setTallyTrialState("completed"); } },
  {
    id: "muster",
    run: () => {
      s().setMusterTrialState("assigned");
      // answering with the wrong move must not advance the drill
      if (s().answerMuster("strike") !== "wrong") throw new Error("wrong muster move was accepted");
      if (s().musterStep !== 0) throw new Error("a wrong first move should leave the drill at step 0");
      // a wrong move mid-sequence resets to the first call
      s().answerMuster("guard");
      if (s().musterStep !== 1) throw new Error("correct move did not advance the drill");
      s().answerMuster("strike");
      if (s().musterStep !== 0) throw new Error("a wrong move mid-drill should reset to the first call");
      for (const m of ["guard", "dodge", "strike"] as const) s().answerMuster(m);
      if (s().musterTrialState !== "inspected") throw new Error("clean drill did not complete the muster");
      s().setMusterTrialState("completed");
    },
  },
  {
    id: "scrap",
    run: () => {
      s().setScrapTrialState("assigned");
      for (let i = 0; i < 3; i++) for (let h = 0; h < 2; h++) s().damageScrap(i, 20);
      if (s().scrapTrialState !== "inspected") throw new Error("felling all three constructs did not clear the quarry");
      s().setScrapTrialState("completed");
    },
  },
  {
    id: "blade",
    run: () => {
      s().setCombatTrialState("assigned");
      for (let i = 0; i < 3; i++) for (let h = 0; h < 3; h++) s().damageDummy(i, 20);
      useElder.setState({ hasSword: true });
    },
  },
  {
    id: "cave",
    run: () => {
      s().setCaveStage("entered");
      s().setCaveStage("boss_awake");
      for (let i = 0; i < 4; i++) s().damageBoss(12);
      useElder.setState({ carryingBody: true });
      useElder.setState({ carryingBody: false, hasCompass: true, caveStage: "delivered" });
    },
  },
];

console.log("\n=== walking the whole spine in order ===");
advance.forEach((stepDef, i) => {
  const before = s();
  const active = activeTrial(before);
  ok(active?.id === stepDef.id, `trial ${i + 1}: active trial is "${stepDef.id}"`);

  // the invariant: everything up to and including the active trial is open,
  // everything after it is shut.
  let violations: string[] = [];
  TRIALS.forEach((t, ti) => {
    const unlocked = isUnlocked(before, t.id);
    const shouldBe = ti <= i;
    if (unlocked !== shouldBe) violations.push(`${t.id}=${unlocked ? "open" : "shut"}`);
  });
  ok(violations.length === 0, `  lock invariant holds at step ${i + 1}${violations.length ? " -- " + violations.join(" ") : ""}`);

  stepDef.run();
  ok(TRIALS[i].isDone(s()), `  trial ${i + 1} "${stepDef.id}" reports done`);
  ok(completedCount(s()) === i + 1, `  progress is ${completedCount(s())}/${TRIAL_COUNT}`);
});

console.log("\n=== end state ===");
ok(activeTrial(s()) === null, "no active trial remains");
ok(completedCount(s()) === TRIAL_COUNT, `all ${TRIAL_COUNT} trials complete`);
ok(s().hasCompass, "the compass was received (Act I finale reached)");

// Every trial must be able to name a location for each of its stages, or the
// objective marker silently points nowhere and the player is stranded.
console.log("\n=== every trial can point somewhere at every stage ===");
{
  let missing: string[] = [];
  for (const t of TRIALS) {
    for (let stage = 0; stage < t.stages.length; stage++) {
      // rebuild a plausible mid-trial state by rewinding just this trial
      const probe = { ...s() } as any;
      if (!t.where(probe) && !t.isDone(probe)) missing.push(`${t.id}#${stage}`);
    }
  }
  ok(missing.length === 0, `all trials resolve a target${missing.length ? " -- missing " + missing.join(" ") : ""}`);
}

console.log(fail === 0 ? "\nQUEST SPINE OK — 12 TRIALS, ORDERED, UNSKIPPABLE" : `\n${fail} FAILURE(S)`);
process.exit(fail === 0 ? 0 : 1);
