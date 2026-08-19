/**
 * Headless verification of the Agent Mode harness against the REAL game modules.
 * No browser: we stub the DOM/WebGL bits the modules touch, then run the
 * observation builder + pathfinder over genuine world data.
 */
const { eldervilleWorldPos, eldervilleTileAt, isBlocked, groundAtWorld, CAVE_LANDMARKS, CAVE_TILE, FORGE_TILE } =
  await import("../world.ts");

// Import the REAL pathfinder rather than reimplementing it. This file used to
// carry a hand-copied duplicate of gridFor/findPath, and that copy silently
// inherited a `h: 48` village grid -- so the tests happily passed while the
// shipping pathfinder could not route to the southern strip of the map. Test
// the real thing or you are only testing your copy of the bug.
const { findPath, gridFor } = await import("../pathfinding.ts");
const { SPAWN, SIZE } = await import("../world.ts");

let fail = 0;
const ok = (cond: boolean, msg: string) => { console.log((cond?"  PASS  ":"  FAIL  ")+msg); if(!cond)fail++; };

console.log("\n=== village routes the agent must be able to walk (from spawn tile 12,11) ===");
const spawn = {tx:12,ty:11};
const targets: [string,number,number][] = [
  ["Red House door", 12,10], ["Council Hall door",32,10],
  ["Farmer's Homestead door",12,28], ["Weaver's Homestead door",32,28],
  ["Elder Moss",59,35], ["Central Well",58,36], ["Elder Sage",32,12],
  ["Elder Thorn",16,26], ["Bazaar Trader",15,40], ["Forge",FORGE_TILE.tx,FORGE_TILE.ty],
  ["Training dummies",36,6], ["Cave mouth",CAVE_TILE.tx,CAVE_TILE.ty],
  ["Grain sack",30,36], ["Blade-trial spot",36,6],
  ["Dummy 1",34,6],["Dummy 2",36,6],["Dummy 3",38,6],
  // districts added with the twelve-trial spine
  ["Plaza Watchhouse door",44,14],["Founders' Plaza",44,12],["Granary door",26,60],
  ["Orchard hut door",10,42],["Quarry floor",64,62],["Aqueduct cistern",44,48],
  ["Sluice head",42,46],["Sluice middle",48,46],["Sluice last",54,46],
  ["Brazier west",32,4],["Brazier east",36,4],["Brazier centre",40,4],
  ["Orchard row 1",9,38],["Orchard row 2",13,40],["Orchard row 3",17,38],
  ["Scrap 1",61,60],["Scrap 2",67,61],["Scrap 3",63,65],
];
for (const [name,tx,ty] of targets) {
  const p = findPath("village", spawn, {tx,ty});
  ok(!!p, `${name.padEnd(26)} -> ${p ? p.length+" tiles" : "NO PATH"}`);
}

console.log("\n=== interior routes ===");
for (const [area, from, to, label] of [
  ["home",{tx:4,ty:5},{tx:7,ty:9},"home spawn -> exit mat"],
  ["home",{tx:7,ty:8},{tx:6,ty:5},"home -> Tinslaire"],
  ["home",{tx:7,ty:8},{tx:9,ty:4},"home -> sword case"],
  ["council",{tx:7,ty:8},{tx:6,ty:4},"council -> study desk"],
  ["council",{tx:7,ty:8},{tx:7,ty:2},"council -> archive bookcase"],
  ["homesteadA",{tx:7,ty:8},{tx:6,ty:6},"homesteadA -> Widow Oren"],
  ["watchhouse",{tx:7,ty:8},{tx:7,ty:4},"watchhouse -> watch roster"],
  ["granary",{tx:7,ty:8},{tx:3,ty:5},"granary -> tally board"],
  ["granary",{tx:7,ty:8},{tx:2,ty:2},"granary -> sack 1"],
  ["granary",{tx:7,ty:8},{tx:10,ty:6},"granary -> sack 4"],
  ["orchardHut",{tx:7,ty:8},{tx:6,ty:6},"orchardHut -> Orchard Keeper"],
  ["cave",{tx:7,ty:19},{tx:CAVE_LANDMARKS.boss.tx,ty:CAVE_LANDMARKS.boss.ty},"cave spawn -> boss"],
  ["cave",{tx:7,ty:5},{tx:CAVE_LANDMARKS.exitMat.tx,ty:CAVE_LANDMARKS.exitMat.ty},"cave boss -> exit mat"],
] as any[]) {
  const p = findPath(area, from, to);
  ok(!!p, `${label.padEnd(30)} -> ${p ? p.length+" tiles" : "NO PATH"}`);
}

console.log("\n=== adjacency fallback (targets that are solid props) ===");
for (const [name,tx,ty] of [["Central Well",58,36],["Forge",FORGE_TILE.tx,FORGE_TILE.ty],["Dummy 2",36,6]] as any[]) {
  const w = eldervilleWorldPos(tx,ty);
  const solid = isBlocked(w.x,w.z);
  const p = findPath("village", spawn, {tx,ty});
  ok(solid && !!p, `${name} is solid(${solid}) but reachable via adjacency: ${!!p}`);
}

console.log("\n=== the village grid must cover the whole world, not a slice of it ===");
{
  const g = gridFor("village");
  ok(g.w === SIZE && g.h === SIZE, `village grid is ${g.w}x${g.h} (world is ${SIZE}x${SIZE})`);

  // Flood-fill the true walkable region from the player's spawn, then assert the
  // pathfinder can reach every tile of it. A grid that under-declares its bounds
  // shows up here as a pile of NO PATH results in the southern rows.
  const walk = (tx: number, ty: number) => {
    const w = eldervilleWorldPos(tx, ty);
    return !isBlocked(w.x, w.z) && groundAtWorld(w.x, w.z) > 1.5;
  };
  const { tx: stx, ty: sty } = eldervilleTileAt(SPAWN.x, SPAWN.z);
  const seen = new Set<number>([sty * SIZE + stx]);
  const queue = [[stx, sty]];
  let maxTy = 0;
  while (queue.length) {
    const [x, y] = queue.shift()!;
    if (y > maxTy) maxTy = y;
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= SIZE || ny >= SIZE) continue;
      const k = ny * SIZE + nx;
      if (seen.has(k) || !walk(nx, ny)) continue;
      seen.add(k);
      queue.push([nx, ny]);
    }
  }
  ok(maxTy >= 48, `walkable region extends to ty=${maxTy} (must be inside the grid)`);

  let unreachable = 0;
  const missed: string[] = [];
  for (const k of seen) {
    const tx = k % SIZE, ty = Math.floor(k / SIZE);
    const path = findPath("village", { tx: stx, ty: sty }, { tx, ty });
    // The path must actually END on the requested tile. Checking only for a
    // non-null result is too weak: findPath falls back to "a walkable neighbour
    // of the goal", so an out-of-bounds goal one row past the grid edge still
    // returns a path to the row above it and looks like success.
    const last = path?.[path.length - 1];
    if (!last || last.tx !== tx || last.ty !== ty) {
      unreachable++;
      if (missed.length < 6) missed.push(`(${tx},${ty})`);
    }
  }
  ok(unreachable === 0,
    `all ${seen.size} spawn-reachable tiles are pathable${unreachable ? " -- missed " + missed.join(" ") : ""}`);
}

console.log(fail===0 ? "\nALL PATHFINDING CHECKS PASSED" : `\n${fail} FAILURE(S)`);
