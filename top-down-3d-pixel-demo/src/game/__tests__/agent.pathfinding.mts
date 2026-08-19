/**
 * Headless verification of the Agent Mode harness against the REAL game modules.
 * No browser: we stub the DOM/WebGL bits the modules touch, then run the
 * observation builder + pathfinder over genuine world data.
 */
const { eldervilleWorldPos, isBlocked, groundAtWorld, interiors, caveMap, caveSolidAt, CAVE_LANDMARKS, CAVE_TILE, FORGE_TILE } =
  await import("../world.ts");

// --- reimplement the two pure helpers exactly as agent.ts defines them, then
// --- assert they agree with the real world data.
type Grid = { w: number; h: number; walk: (tx: number, ty: number) => boolean };
function gridFor(area: string): Grid {
  if (area === "village") {
    return { w: 72, h: 48, walk: (tx, ty) => {
      if (tx<0||ty<0||tx>=72||ty>=48) return false;
      const p = eldervilleWorldPos(tx, ty);
      return !isBlocked(p.x, p.z) && groundAtWorld(p.x, p.z) > 1.5;
    }};
  }
  const map = area === "cave" ? caveMap : (interiors as any)[area]?.map;
  if (!map) return { w: 0, h: 0, walk: () => false };
  const solid = (v: number) => (area === "cave" ? caveSolidAt(v) : [7,8,9,17,18,19].includes(v));
  return { w: map[0].length, h: map.length,
    walk: (tx, ty) => tx>=0&&ty>=0&&tx<map[0].length&&ty<map.length&&!solid(map[ty][tx]) };
}
function findPath(area: string, from:{tx:number;ty:number}, to:{tx:number;ty:number}) {
  const g = gridFor(area);
  if (!g.w||!g.h) return null;
  if (from.tx<0||from.ty<0||from.tx>=g.w||from.ty>=g.h) return null;
  from = {tx: Math.floor(from.tx), ty: Math.floor(from.ty)};
  to = {tx: Math.floor(to.tx), ty: Math.floor(to.ty)};
  const goals = new Set<number>();
  if (g.walk(to.tx,to.ty)) goals.add(to.ty*g.w+to.tx);
  else for (const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]) {
    const nx=to.tx+dx, ny=to.ty+dy; if (g.walk(nx,ny)) goals.add(ny*g.w+nx);
  }
  if (!goals.size) return null;
  const start = from.ty*g.w+from.tx;
  const prev = new Map<number,number>(); prev.set(start,-1);
  const q=[start]; let hit=-1;
  while(q.length){ const c=q.shift()!; if(goals.has(c)){hit=c;break;}
    const cx=c%g.w, cy=Math.floor(c/g.w);
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const nx=cx+dx, ny=cy+dy; if(!g.walk(nx,ny))continue;
      const n=ny*g.w+nx; if(prev.has(n))continue; prev.set(n,c); q.push(n);
    }}
  if(hit===-1)return null;
  const path=[]; let c=hit;
  while(c!==-1){path.push({tx:c%g.w,ty:Math.floor(c/g.w)});c=prev.get(c)!;}
  return path.reverse();
}

let fail = 0;
const ok = (cond: boolean, msg: string) => { console.log((cond?"  PASS  ":"  FAIL  ")+msg); if(!cond)fail++; };

console.log("\n=== village routes the agent must be able to walk (from spawn tile 12,11) ===");
const spawn = {tx:12,ty:11};
const targets: [string,number,number][] = [
  ["Red House door", 12,10], ["Council Hall door",32,10],
  ["Farmer's Homestead door",12,28], ["Weaver's Homestead door",32,28],
  ["Elder Moss",59,35], ["Central Well",58,36], ["Elder Sage",32,12],
  ["Elder Thorn",16,26], ["Bazaar Trader",15,40], ["Forge",FORGE_TILE.tx,FORGE_TILE.ty],
  ["Training dummies",36,4], ["Cave mouth",CAVE_TILE.tx,CAVE_TILE.ty],
  ["Grain sack",30,36], ["Blade-trial spot",36,6],
  ["Dummy 1",34,3],["Dummy 2",36,3],["Dummy 3",38,3],
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
  ["cave",{tx:7,ty:19},{tx:CAVE_LANDMARKS.boss.tx,ty:CAVE_LANDMARKS.boss.ty},"cave spawn -> boss"],
  ["cave",{tx:7,ty:5},{tx:CAVE_LANDMARKS.exitMat.tx,ty:CAVE_LANDMARKS.exitMat.ty},"cave boss -> exit mat"],
] as any[]) {
  const p = findPath(area, from, to);
  ok(!!p, `${label.padEnd(30)} -> ${p ? p.length+" tiles" : "NO PATH"}`);
}

console.log("\n=== adjacency fallback (targets that are solid props) ===");
for (const [name,tx,ty] of [["Central Well",58,36],["Forge",FORGE_TILE.tx,FORGE_TILE.ty],["Dummy 2",36,3]] as any[]) {
  const w = eldervilleWorldPos(tx,ty);
  const solid = isBlocked(w.x,w.z);
  const p = findPath("village", spawn, {tx,ty});
  ok(solid && !!p, `${name} is solid(${solid}) but reachable via adjacency: ${!!p}`);
}
console.log(fail===0 ? "\nALL PATHFINDING CHECKS PASSED" : `\n${fail} FAILURE(S)`);
