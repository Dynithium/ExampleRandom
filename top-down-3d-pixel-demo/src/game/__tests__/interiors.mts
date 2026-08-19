/**
 * Interior integrity suite.
 *
 * The village↔interior seam is easy to break silently: an interior can lose its
 * exit mat, drift out of sync with the door that leads to it, or grow a wall
 * that strands part of its floor. None of that shows up in the store-level
 * suites, and in-game it reads as "the door does nothing" or "I am stuck in a
 * room". This walks every interior the way a player would.
 *
 * It also checks the objective marker: every trial stage that points inside a
 * building must point at a tile the player can actually stand on.
 */
(globalThis as any).window = { addEventListener() {}, removeEventListener() {} };
(globalThis as any).localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
(globalThis as any).document = { createElement: () => ({ getContext: () => null }) };

const w = await import("../world.ts");
const pf = await import("../pathfinding.ts");
const q = await import("../quests.ts");
const story = await import("../eldervilleStory.ts");

let fail = 0;
const ok = (c: boolean, m: string) => {
  console.log((c ? "  PASS  " : "  FAIL  ") + m);
  if (!c) fail++;
};

/** Tiles a player can never occupy (walls, furniture, fittings). */
const SOLID = [7, 8, 9, 17, 18, 19];
const EXIT_MAT = 16;

for (const [id, def] of Object.entries(w.interiors)) {
  const map = def.map;

  let mat: [number, number] | null = null;
  map.forEach((row, y) => row.forEach((t, x) => { if (t === EXIT_MAT) mat = [x, y]; }));
  ok(!!mat, `${id}: has an exit mat`);

  const door = w.villageDoors.find((d) => d.interior === id);
  ok(!!door, `${id}: is reachable from a village door`);
  if (door) {
    ok(
      def.outside[0] === door.tx && def.outside[1] === door.ty,
      `${id}: interior.outside matches the door that opens it`,
    );
    const p = w.eldervilleWorldPos(door.tx, door.ty);
    ok(!w.isBlocked(p.x, p.z), `${id}: the door tile itself is walkable`);
  }

  if (mat) {
    const [mx, my] = mat as [number, number];
    let stranded = 0;
    for (let y = 0; y < map.length; y++) {
      for (let x = 0; x < map[0].length; x++) {
        if (SOLID.includes(map[y][x])) continue;
        if (!pf.findPath(id, { tx: mx, ty: my }, { tx: x, ty: y })) stranded++;
      }
    }
    ok(stranded === 0, `${id}: every open floor tile is reachable from the mat (${stranded} stranded)`);
  }
}

// Objective markers that point indoors must point at standable floor.
const s = () => story.useElder.getState();
let badTargets = 0;
for (const trial of q.TRIALS) {
  const target = trial.where(s() as any);
  if (!target || target.area === "village") continue;
  const def = (w.interiors as any)[target.area];
  if (!def) {
    console.log(`  FAIL  ${trial.id}: points at unknown interior "${target.area}"`);
    badTargets++;
    continue;
  }
  const tile = def.map[target.ty]?.[target.tx];
  if (tile === undefined || SOLID.includes(tile)) badTargets++;
}
ok(badTargets === 0, `all indoor objective markers land on standable floor (${badTargets} bad)`);

console.log(fail ? `\n${fail} INTERIOR FAILURE(S)` : "\nINTERIORS OK");
process.exit(fail ? 1 : 0);
