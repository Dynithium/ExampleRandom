/**
 * Shared tile pathfinding for Elderville, the interiors and the cave.
 *
 * Extracted from agent.ts so that in-world NPCs can use the same BFS the Agent
 * Mode benchmark uses. Greedy "steer toward the target" following dead-ends on
 * this map's concave geometry (most visibly the market stalls at (15,40) and
 * (16,40), which sit right between Tinslaire and the trader during Trial 4), so
 * anything that needs to walk to a moving target should path properly instead.
 */
import {
  isBlocked,
  groundAtWorld,
  eldervilleWorldPos,
  interiors,
  caveMap,
  caveSolidAt,
  SIZE,
} from "./world";


type Grid = { w: number; h: number; walk: (tx: number, ty: number) => boolean };

export function gridFor(area: string): Grid {
  if (area === "village") {
    // The village heightmap is SIZE x SIZE (72x72). This grid
    // used to declare h: 48, which silently amputated the southern strip of the
    // map: tiles the player can physically stand on (ty up to 48) were treated
    // as out of bounds, so findPath returned null and any move_to / NPC follow
    // that started or ended down there failed outright.
    return {
      w: SIZE,
      h: SIZE,
      walk: (tx, ty) => {
        if (tx < 0 || ty < 0 || tx >= SIZE || ty >= SIZE) return false;
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

/**
 * BFS to an exact tile, or — when the target itself is solid (a well, a door
 * prop, an NPC standing on a blocked tile) — to the closest reachable tile
 * beside it. Returning "adjacent is good enough" is what makes `move_to` robust
 * against the agent naming a POI whose tile you can never actually stand on.
 */
export function findPath(area: string, from: { tx: number; ty: number }, to: { tx: number; ty: number }) {
  const g = gridFor(area);
  if (!g.w || !g.h) return null;
  // Guard the grid against fractional/NaN inputs: gridFor().walk indexes
  // map[ty][tx] directly, so a value like 3.5 reads an undefined row and throws.
  from = { tx: Math.floor(from.tx), ty: Math.floor(from.ty) };
  to = { tx: Math.floor(to.tx), ty: Math.floor(to.ty) };
  if (!Number.isFinite(from.tx) || !Number.isFinite(from.ty)) return null;
  if (!Number.isFinite(to.tx) || !Number.isFinite(to.ty)) return null;
  if (from.tx < 0 || from.ty < 0 || from.tx >= g.w || from.ty >= g.h) return null;

  const goals = new Set<number>();
  if (g.walk(to.tx, to.ty)) {
    goals.add(to.ty * g.w + to.tx);
  } else {
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]] as const) {
      const nx = to.tx + dx;
      const ny = to.ty + dy;
      if (g.walk(nx, ny)) goals.add(ny * g.w + nx);
    }
  }
  if (!goals.size) return null;

  const start = from.ty * g.w + from.tx;
  const prev = new Map<number, number>();
  prev.set(start, -1);
  const q = [start];
  let hit = -1;
  while (q.length) {
    const c = q.shift()!;
    if (goals.has(c)) {
      hit = c;
      break;
    }
    const cx = c % g.w;
    const cy = Math.floor(c / g.w);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (!g.walk(nx, ny)) continue;
      const n = ny * g.w + nx;
      if (prev.has(n)) continue;
      prev.set(n, c);
      q.push(n);
    }
  }
  if (hit === -1) return null;
  const path: { tx: number; ty: number }[] = [];
  let c = hit;
  while (c !== -1) {
    path.push({ tx: c % g.w, ty: Math.floor(c / g.w) });
    c = prev.get(c)!;
  }
  path.reverse();
  return path;
}
