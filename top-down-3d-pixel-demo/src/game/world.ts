/**
 * Elderville voxel world — Expansive 96x96 map
 * Sprawling settlement with distinct districts and distant outskirts.
 */

export const SIZE = 96;
export const STEP = 0.5;
export const WATER_LEVEL = 2;
export const WATER_Y = WATER_LEVEL * STEP + 0.24;
export const HALF = SIZE / 2; // 36

export const idx = (i: number, j: number) => j * SIZE + i;
export const topOf = (level: number) => level * STEP;
export const gx = (i: number) => i - HALF + 0.5;
export const ix = (x: number) => Math.floor(x + HALF);

// ---- noise
function hash2(x: number, y: number) {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
const fade = (t: number) => t * t * (3 - 2 * t);
function valueNoise(x: number, y: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const a = hash2(xi, yi);
  const b = hash2(xi + 1, yi);
  const c = hash2(xi, yi + 1);
  const d = hash2(xi + 1, yi + 1);
  const u = fade(xf);
  const v = fade(yf);
  return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v;
}
function fbm(x: number, y: number) {
  let s = 0, amp = 0.5, f = 1;
  for (let o = 0; o < 4; o++) { s += amp * valueNoise(x * f, y * f); f *= 2; amp *= 0.5; }
  return s;
}

export const KIND = {
  DEEP: 0, SILT: 1, SHOAL: 2, SAND: 3, GRASS: 4, GRASS_DARK: 5, FOREST: 6, ROCK: 7, DIRT: 8, PLAZA: 9,
} as const;
export const KIND_COLORS: Record<number, string> = {
  0: "#2a4a5e", 1: "#4d6a63", 2: "#a89768", 3: "#e3cd8e", 4: "#79c257", 5: "#57a749", 6: "#3d8a45", 7: "#98a2ab", 8: "#b98c58", 9: "#c9c3ae",
};

export const heights = new Uint8Array(SIZE * SIZE);
export const kinds = new Uint8Array(SIZE * SIZE);
export const blocked = new Uint8Array(SIZE * SIZE);
export const shade = new Float32Array(SIZE * SIZE);

export type Tree = { x: number; z: number; y: number; s: number; hue: number; trunk: number };
export type House = { x: number; z: number; y: number; rot: number; wall: string; roof: string; id: string };
export type Lamp = { x: number; z: number; y: number };
export type Rock = { x: number; z: number; y: number; s: number };

export const trees: Tree[] = [];
export const houses: House[] = [];
export const lamps: Lamp[] = [];
export const rocks: Rock[] = [];

// Elderville-specific props
export type Well = { x: number; z: number; y: number };
export type Forge = { x: number; z: number; y: number };
export type Market = { x: number; z: number; y: number };
export type Garden = { x: number; z: number; y: number };
export type Watchtower = { x: number; z: number; y: number };
export const wells: Well[] = [];
export const forges: Forge[] = [];
export const markets: Market[] = [];
export const gardens: Garden[] = [];
export const watchtowers: Watchtower[] = [];

// Elderville layout constants
export const VILLAGE_W = 96;
export const VILLAGE_H = 74;
export const OZ = Math.floor((SIZE - VILLAGE_H) / 2); // 11
export const OX = 0;

export function villageIdx(tx: number, ty: number) { return idx(OX + tx, OZ + ty); }
export function villageGx(tx: number) { return gx(OX + tx); }
export function villageGz(ty: number) { return gx(OZ + ty); }

/**
 * Inverse of eldervilleWorldPos: world coordinates back to village tile.
 *
 * Callers used to hardcode `Math.round(x + 35.5)` / `Math.round(z + 35.5 - 11)`,
 * which silently bakes in SIZE=72 (HALF=36) and OZ=11. Resizing the map made
 * every one of those call sites wrong in a way nothing catches at compile time,
 * so derive it from the same constants villageGx/villageGz use instead.
 */
export function eldervilleTileAt(x: number, z: number) {
  return { tx: Math.round(x + HALF - 0.5 - OX), ty: Math.round(z + HALF - 0.5 - OZ) };
}
export function villageTop(ty: number, tx: number) { return topOf(heights[villageIdx(tx, ty)]); }

// helpers
const reserve = (i: number, j: number) => { if (i >= 0 && j >= 0 && i < SIZE && j < SIZE) blocked[idx(i, j)] = 1; };
function rectKind(tx: number, ty: number, w: number, h: number, kind: number, level = 4) {
  for (let y = ty; y < ty + h; y++) for (let x = tx; x < tx + w; x++) {
    const i = OX + x, j = OZ + y;
    if (i < 0 || j < 0 || i >= SIZE || j >= SIZE) continue;
    heights[idx(i, j)] = level;
    kinds[idx(i, j)] = kind;
  }
}
function setTile(tx: number, ty: number, kind: number, level = 4) {
  const i = OX + tx, j = OZ + ty;
  if (i < 0 || j < 0 || i >= SIZE || j >= SIZE) return;
  heights[idx(i, j)] = level;
  kinds[idx(i, j)] = kind;
}

// 1. base: flat grass village + border forest hills
for (let j = 0; j < SIZE; j++) for (let i = 0; i < SIZE; i++) {
  const insideVillage = i >= OX && i < OX + VILLAGE_W && j >= OZ && j < OZ + VILLAGE_H;
  if (insideVillage) {
    heights[idx(i, j)] = 4;
    kinds[idx(i, j)] = KIND.GRASS;
  } else {
    const e = fbm(i * 0.1, j * 0.1);
    heights[idx(i, j)] = e > 0.5 ? 6 : 4;
    kinds[idx(i, j)] = e > 0.5 ? KIND.FOREST : KIND.GRASS;
    if (e > 0.6) blocked[idx(i, j)] = 1;
  }
  shade[idx(i, j)] = 0.9 + hash2(i * 3 + 1, j * 7 + 5) * 0.2;
}

// 2. border trees
for (let x = 0; x < VILLAGE_W; x++) {
  for (const ty of [0, VILLAGE_H - 1]) {
    const i = OX + x, j = OZ + ty;
    heights[idx(i, j)] = 6; kinds[idx(i, j)] = KIND.FOREST; blocked[idx(i, j)] = 1;
  }
}
for (let y = 0; y < VILLAGE_H; y++) {
  for (const tx of [0, VILLAGE_W - 1]) {
    const i = OX + tx, j = OZ + y;
    heights[idx(i, j)] = 6; kinds[idx(i, j)] = KIND.FOREST; blocked[idx(i, j)] = 1;
  }
}

// 3. Eastern forest wall x=92..94 with gate gap 22..24
for (let y = 2; y < VILLAGE_H - 1; y++) for (let x = 92; x <= 94; x++) {
  const isGate = (y >= 22 && y <= 24);
  const i = OX + x, j = OZ + y;
  if (isGate) { heights[idx(i, j)] = 4; kinds[idx(i, j)] = KIND.DIRT; blocked[idx(i, j)] = 0; }
  else { heights[idx(i, j)] = 6; kinds[idx(i, j)] = KIND.FOREST; blocked[idx(i, j)] = 1; }
}

// 4. Main Road Network
// East-West avenues
for (let x = 4; x <= 92; x++) {
  setTile(x, 16, KIND.DIRT);   // Main Avenue
  setTile(x, 32, KIND.DIRT);   // South Highway
  setTile(x, 52, KIND.DIRT);   // Lower Ring (new southern districts)
}
// North-South arteries
for (let y = 4; y <= 70; y++) {
  setTile(6, y, KIND.DIRT);
  setTile(20, y, KIND.DIRT);
  setTile(36, y, KIND.DIRT);
  setTile(52, y, KIND.DIRT);
  setTile(72, y, KIND.DIRT);   // Eastern artery
}
// Outskirts paths & connectors
for (let y = 10; y <= 16; y++) setTile(12, y, KIND.DIRT); // Red house path
for (let y = 10; y <= 16; y++) setTile(32, y, KIND.DIRT); // Blue house path
for (let y = 28; y <= 32; y++) setTile(12, y, KIND.DIRT); // Homestead A path
for (let y = 28; y <= 32; y++) setTile(32, y, KIND.DIRT); // Homestead B path
for (let y = 8; y <= 16; y++) setTile(52, y, KIND.DIRT);  // Forge path
for (let y = 28; y <= 42; y++) setTile(58, y, KIND.DIRT); // Central Well path
for (let x = 52; x <= 58; x++) setTile(x, 32, KIND.DIRT); // Well connector
for (let y = 12; y <= 26; y++) setTile(90, y, KIND.DIRT); // Eastern Gate road
for (let x = 72; x <= 92; x++) setTile(x, 24, KIND.DIRT); // gate approach

// New district connectors
for (let x = 20; x <= 36; x++) setTile(x, 62, KIND.DIRT); // Granary row
for (let y = 52; y <= 62; y++) setTile(28, y, KIND.DIRT); // Granary path
for (let x = 52; x <= 72; x++) setTile(x, 62, KIND.DIRT); // Quarry road
for (let y = 52; y <= 66; y++) setTile(64, y, KIND.DIRT); // Quarry descent
for (let x = 6; x <= 20; x++) setTile(x, 44, KIND.DIRT);  // Orchard lane
for (let y = 32; y <= 44; y++) setTile(10, y, KIND.DIRT); // Orchard path
for (let x = 36; x <= 52; x++) setTile(x, 44, KIND.DIRT); // Aqueduct service road
for (let y = 16; y <= 24; y++) setTile(44, y, KIND.DIRT); // Plaza approach

// 5. Districts
rectKind(50, 6, 5, 3, KIND.DIRT); // Forge & Workshops
rectKind(26, 34, 14, 8, KIND.GRASS_DARK); // Grand Gardens crop terraces
setTile(58, 36, KIND.DIRT); // Central Well tile
rectKind(12, 38, 8, 4, KIND.DIRT); // Southern Marketplace & Bazaar
rectKind(46, 38, 6, 6, KIND.SHOAL, 2); // Village Pond
for (let y = 38; y < 44; y++) for (let x = 46; x < 52; x++) blocked[villageIdx(x, y)] = 1; // pond water blocked

// --- New districts for the expanded settlement ---

// Founders' Plaza — the paved civic square north-east of the Blue House.
// Trial 5 (the Watch) and Trial 9 (the Muster) both stage here.
rectKind(40, 8, 10, 8, KIND.PLAZA);

// The Aqueduct — a raised stone channel carrying water from the hills to the
// well. Trial 6's sluice-gate puzzle runs along it.
for (let x = 38; x <= 58; x++) { setTile(x, 46, KIND.ROCK, 5); blocked[villageIdx(x, 46)] = 1; }
for (const [gx0, gy0] of [[42, 46], [48, 46], [54, 46]] as [number, number][]) {
  setTile(gx0, gy0, KIND.ROCK, 5); // sluice gates (interactable, stay solid)
}
rectKind(38, 47, 21, 2, KIND.SHOAL, 3); // the channel basin below

// The Orchard — old fruit terraces on the western slope. Trial 7 (the Blight).
rectKind(6, 36, 14, 8, KIND.GRASS_DARK);

// The Granary — squat stone silos south of the gardens. Trial 8 (the Tally).
rectKind(22, 56, 12, 6, KIND.DIRT);

// The Quarry — a worked stone pit east of the granary. Trial 10 (the Scrap)
// and the ambush that follows stage here.
//
// The floor stays at the normal walkable level (4) and the *rim* is raised
// instead: the pathfinder treats ground at or below topOf(3)=1.5 as unwalkable,
// so an actually-sunken floor would have quietly cut the whole district off
// from the map. Raised rims read as a pit from the top-down camera anyway.
for (let y = 56; y <= 68; y++) for (let x = 56; x <= 72; x++) {
  const rim = Math.abs(x - 64) >= 7 || Math.abs(y - 62) >= 5;
  if (rim) { setTile(x, y, KIND.ROCK, 6); blocked[villageIdx(x, y)] = 1; }
  else setTile(x, y, KIND.SILT, 4);
}
// cut a ramp in from the quarry road so the pit is enterable
for (let x = 62; x <= 66; x++) { setTile(x, 56, KIND.DIRT); blocked[villageIdx(x, 56)] = 0; }
for (let y = 52; y <= 57; y++) { setTile(64, y, KIND.DIRT); blocked[villageIdx(64, y)] = 0; }
// scattered spoil heaps inside the pit (cover during the ambush)
for (const [bx, by] of [[59, 59], [69, 59], [59, 65], [69, 65], [64, 66]] as [number, number][]) {
  blocked[villageIdx(bx, by)] = 1;
}

// The North Watch — a rampart and second watchtower guarding the north road.
for (let x = 30; x <= 44; x++) { setTile(x, 2, KIND.ROCK, 6); blocked[villageIdx(x, 2)] = 1; }

// 6. Water level non-walkable
for (let n = 0; n < SIZE * SIZE; n++) if (heights[n] <= WATER_LEVEL) blocked[n] = 1;

// 7. Houses (5x5 footprints, centered on cx, cz)
const houseDefs: { tx: number; ty: number; wall: string; roof: string; id: string }[] = [
  { tx: 30, ty: 6, wall: "#6890c0", roof: "#4068a8", id: "council" }, // Blue House (Council)
  { tx: 10, ty: 6, wall: "#d07060", roof: "#c04038", id: "home" },    // Red House (Home)
  { tx: 10, ty: 24, wall: "#d0b078", roof: "#508028", id: "homesteadA" }, // Farmer's Homestead
  { tx: 30, ty: 24, wall: "#d0b078", roof: "#508028", id: "homesteadB" }, // Weaver's Homestead
  { tx: 24, ty: 56, wall: "#b8a888", roof: "#787060", id: "granary" },   // The Granary (Trial 8)
  { tx: 8, ty: 38, wall: "#c8b090", roof: "#4a7830", id: "orchardHut" }, // Orchard Keeper's hut (Trial 7)
  { tx: 42, ty: 10, wall: "#a8b0c0", roof: "#606878", id: "watchhouse" },// Plaza Watchhouse (Trial 5)
];

houseDefs.forEach((h) => {
  const cx = h.tx + 2, cz = h.ty + 2;
  const i = OX + cx, j = OZ + cz;
  for (let q = 0; q <= 1; q++) for (let p = 0; p <= 1; p++) reserve(i + p, j + q);
  for (let y = h.ty; y < h.ty + 5; y++) for (let x = h.tx; x < h.tx + 5; x++) {
    const ii = OX + x, jj = OZ + y;
    heights[idx(ii, jj)] = 4;
    kinds[idx(ii, jj)] = KIND.DIRT;
  }
  // The 2x2 reserved block above spans the tile *boundary* (tiles i..i+1, i.e.
  // world gx(i)-0.5 .. gx(i)+1.5) while the house mesh is centred on the tile
  // *centre* gx(i) with walls at +/-1.0. That half-tile mismatch left the north
  // and west faces of every house walkable — you could walk through the wall and
  // stand inside the building, and the roof visibly overhung the blocked area on
  // the other two sides. Centre the mesh on the reserved block so the 2x2 wall
  // box and the 2x2 of solid tiles coincide exactly.
  houses.push({
    x: gx(i) + 0.5, z: gx(j) + 0.5, y: topOf(4), rot: 0, wall: h.wall, roof: h.roof, id: h.id,
  });
});

// Clear blocked at doors & landing tiles
for (const [tx, ty] of [[32, 10], [12, 10], [12, 28], [32, 28], [26, 60], [10, 42], [44, 14]] as [number, number][]) {
  blocked[villageIdx(tx, ty)] = 0;
  kinds[villageIdx(tx, ty)] = KIND.DIRT;
  heights[villageIdx(tx, ty)] = 4;
  if (ty + 1 < VILLAGE_H) {
    blocked[villageIdx(tx, ty + 1)] = 0;
    kinds[villageIdx(tx, ty + 1)] = KIND.DIRT;
    heights[villageIdx(tx, ty + 1)] = 4;
  }
}

// 8. District Props
forges.push({ x: villageGx(52), z: villageGz(7), y: topOf(4) });
for (let dy = 0; dy < 8; dy += 2) for (let dx = 0; dx < 14; dx += 2) {
  gardens.push({
    x: villageGx(26 + dx) + (Math.random() - 0.5) * 0.2,
    z: villageGz(34 + dy) + (Math.random() - 0.5) * 0.2,
    y: topOf(4),
  });
}
wells.push({ x: villageGx(58), z: villageGz(36), y: topOf(4) }); // Central Well (far South-East)
markets.push({ x: villageGx(15), z: villageGz(40), y: topOf(4) });
watchtowers.push({ x: villageGx(90), z: villageGz(12), y: topOf(4) });   // Eastern Gate tower
watchtowers.push({ x: villageGx(36), z: villageGz(4), y: topOf(4) });    // North Watch tower (Trial 5)
markets.push({ x: villageGx(44), z: villageGz(12), y: topOf(4) });       // Plaza stalls
wells.push({ x: villageGx(44), z: villageGz(48), y: topOf(4) });         // Aqueduct cistern (Trial 6)
forges.push({ x: villageGx(64), z: villageGz(62), y: topOf(3) });        // Quarry smelter (Trial 10)
for (let dy = 0; dy < 8; dy += 2) for (let dx = 0; dx < 14; dx += 2) {
  gardens.push({ x: villageGx(6 + dx), z: villageGz(36 + dy), y: topOf(4) }); // Orchard rows
}

// Outskirts Cave clearing — flattened dirt pad at the north end of the eastern gate road
for (let y = 7; y <= 13; y++) for (let x = 87; x <= 91; x++) {
  setTile(x, y, KIND.DIRT);
  blocked[villageIdx(x, y)] = 0;
}

// Lamps along avenues. (57,36) sits beside the Central Well rather than inside it —
// the well occupies (58,36) and a lamp post on the same tile speared through its roof.
const LAMP_TILES: [number, number][] = [
  [6, 16], [20, 16], [36, 16], [52, 16], [72, 16],
  [6, 32], [20, 32], [36, 32], [52, 32], [72, 32],
  [57, 36],
  [20, 52], [36, 52], [52, 52], [72, 52],
  [41, 9], [49, 9], [41, 15], [49, 15],   // Founders' Plaza corners
  [28, 57], [34, 62],                      // Granary yard
  [58, 62], [70, 62],                      // Quarry rim
  [10, 44],                                // Orchard lane
];
LAMP_TILES.forEach(([tx, ty]) => {
  const i = OX + tx, j = OZ + ty;
  lamps.push({ x: gx(i), z: gx(j), y: topOf(heights[idx(i, j)]) });
});

// Bypass tiles beside the watchtower so the gate road keeps flowing around its post
setTile(65, 12, KIND.DIRT);
setTile(67, 12, KIND.DIRT);

// Solid props — every structure gets a hitbox (runs before trees so nothing double-spawns):
// lamps, the Central Well, the Forge, market stalls, the watchtower, training dummies,
// archery boards, the grain sack, and the cave mouth's rock mound.
const SOLID_PROPS: [number, number][] = [
  ...LAMP_TILES,
  [58, 36],       // Central Well
  [51, 7], [52, 7],  // Forge & chimney
  [15, 40], [16, 40], // Bazaar stall & counter
  [90, 12],       // Eastern Gate watchtower
  [36, 4],        // North Watch tower
  [34, 6], [36, 6], [38, 6], // training dummies (moved clear of the north rampart)
  [33, 4], [39, 4], // archery boards
  [30, 36],       // grain sack
  [88, 8], [89, 8], [90, 8], [91, 8], // cave mouth rock mound
  [44, 12],       // Plaza stalls
  [44, 48],       // Aqueduct cistern head
  [64, 62],       // Quarry smelter
  [26, 57], [30, 57], // granary silos
];
for (const [tx, ty] of SOLID_PROPS) reserve(OX + tx, OZ + ty);

// Trees — sparse scatter on the meadows (never on reserved props or paths)
for (let j = 1; j < SIZE - 1; j++) for (let i = 1; i < SIZE - 1; i++) {
  const n = idx(i, j);
  if (blocked[n]) continue;
  const k = kinds[n];
  const r = hash2(i * 13 + 3, j * 29 + 17);
  if ((k === KIND.GRASS || k === KIND.GRASS_DARK) && r < 0.025) {
    trees.push({
      x: gx(i) + (hash2(i, j) - 0.5) * 0.4,
      z: gx(j) + (hash2(j, i) - 0.5) * 0.4,
      y: topOf(heights[n]),
      s: 0.82 + hash2(i + 5, j + 9) * 0.5,
      hue: hash2(i + 21, j + 3),
      trunk: hash2(i + 77, j + 41),
    });
    blocked[n] = 1;
  }
}

// Rocks — mossy boulders scattered through the walkable outskirts woodland.
// (KIND.ROCK is never painted onto the map, so the original `kinds[n] === KIND.ROCK`
// test could never match and the rock mesh always rendered zero instances.)
for (let j = 1; j < SIZE - 1; j++) for (let i = 1; i < SIZE - 1; i++) {
  const n = idx(i, j);
  if (blocked[n]) continue;
  if (kinds[n] !== KIND.FOREST) continue;
  if (hash2(i * 31 + 7, j * 17 + 11) < 0.94) continue;
  rocks.push({ x: gx(i), z: gx(j), y: topOf(heights[n]), s: 0.34 + hash2(i, j) * 0.34 });
  blocked[n] = 1; // every prop gets a hitbox
}

// Spawn at Red House door outside (12, 11) world
export const SPAWN = { x: villageGx(12), z: villageGz(11), y: topOf(4) };

// Door definitions for transition
export const villageDoors = [
  { tx: 32, ty: 10, interior: "council", x: villageGx(32), z: villageGz(10) },
  { tx: 12, ty: 10, interior: "home", x: villageGx(12), z: villageGz(10) },
  { tx: 12, ty: 28, interior: "homesteadA", x: villageGx(12), z: villageGz(28) },
  { tx: 32, ty: 28, interior: "homesteadB", x: villageGx(32), z: villageGz(28) },
  { tx: 26, ty: 60, interior: "granary", x: villageGx(26), z: villageGz(60) },
  { tx: 10, ty: 42, interior: "orchardHut", x: villageGx(10), z: villageGz(42) },
  { tx: 44, ty: 14, interior: "watchhouse", x: villageGx(44), z: villageGz(14) },
];

// Interiors (virtual 15x10)
export const interiors: Record<string, { name: string; map: number[][]; outside: [number, number] }> = {
  home: {
    name: "Your Home",
    map: [
      [7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7],
      [7, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 7],
      [7, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 7],
      [7, 6, 6, 8, 6, 8, 6, 6, 6, 9, 6, 6, 6, 6, 7],
      [7, 6, 6, 6, 6, 6, 6, 6, 6, 9, 6, 6, 6, 6, 7],
      [7, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 7],
      [7, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 7],
      [7, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 7],
      [7, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 7],
      [7, 7, 7, 7, 7, 7, 7, 16, 7, 7, 7, 7, 7, 7, 7],
    ],
    outside: [12, 10],
  },
  council: {
    name: "Council Hall",
    map: [
      [7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7],
      [7, 6, 6, 19, 19, 19, 19, 19, 19, 19, 19, 19, 6, 6, 7],
      [7, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 7],
      [7, 6, 18, 6, 6, 6, 6, 6, 6, 6, 6, 6, 18, 6, 7],
      [7, 6, 6, 17, 17, 17, 17, 6, 17, 17, 17, 17, 6, 6, 7],
      [7, 6, 6, 17, 17, 17, 17, 6, 17, 17, 17, 17, 6, 6, 7],
      [7, 6, 6, 17, 17, 17, 17, 6, 17, 17, 17, 17, 6, 6, 7],
      [7, 6, 18, 6, 6, 6, 6, 6, 6, 6, 6, 6, 18, 6, 7],
      [7, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 7],
      [7, 7, 7, 7, 7, 7, 7, 16, 7, 7, 7, 7, 7, 7, 7],
    ],
    outside: [32, 10],
  },
  homesteadA: {
    name: "Farmer's Homestead",
    map: [
      [7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7],
      [7, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 7],
      [7, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 7],
      [7, 6, 6, 8, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 7],
      [7, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 7],
      [7, 6, 6, 6, 6, 18, 17, 17, 18, 6, 6, 6, 6, 6, 7],
      [7, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 7],
      [7, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 7],
      [7, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 7],
      [7, 7, 7, 7, 7, 7, 7, 16, 7, 7, 7, 7, 7, 7, 7],
    ],
    outside: [12, 28],
  },
  homesteadB: {
    name: "Weaver's Homestead",
    map: [
      [7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7],
      [7, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 7],
      [7, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 7],
      [7, 6, 6, 6, 6, 6, 6, 6, 6, 6, 8, 6, 6, 6, 7],
      [7, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 7],
      [7, 6, 6, 6, 6, 6, 18, 17, 17, 18, 6, 6, 6, 6, 7],
      [7, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 7],
      [7, 6, 6, 19, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 7],
      [7, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 7],
      [7, 7, 7, 7, 7, 7, 7, 16, 7, 7, 7, 7, 7, 7, 7],
    ],
    outside: [32, 28],
  },
  granary: {
    name: "The Granary",
    map: [
      [7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7],
      [7, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 7],
      [7, 6, 17, 17, 6, 6, 6, 6, 6, 6, 17, 17, 17, 6, 7],
      [7, 6, 17, 17, 6, 6, 18, 6, 6, 6, 17, 17, 17, 6, 7],
      [7, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 7],
      [7, 6, 6, 19, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 7],
      [7, 6, 17, 17, 17, 6, 6, 6, 6, 17, 17, 6, 6, 6, 7],
      [7, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 7],
      [7, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 7],
      [7, 7, 7, 7, 7, 7, 7, 16, 7, 7, 7, 7, 7, 7, 7],
    ],
    outside: [26, 60],
  },
  orchardHut: {
    name: "Orchard Keeper's Hut",
    map: [
      [7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7],
      [7, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 7],
      [7, 6, 8, 6, 6, 6, 6, 6, 6, 6, 6, 19, 6, 6, 7],
      [7, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 7],
      [7, 6, 6, 6, 18, 17, 17, 18, 6, 6, 6, 6, 6, 6, 7],
      [7, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 7],
      [7, 6, 6, 6, 6, 6, 6, 6, 6, 6, 17, 17, 6, 6, 7],
      [7, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 7],
      [7, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 7],
      [7, 7, 7, 7, 7, 7, 7, 16, 7, 7, 7, 7, 7, 7, 7],
    ],
    outside: [10, 42],
  },
  watchhouse: {
    name: "Plaza Watchhouse",
    map: [
      [7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7],
      [7, 6, 6, 19, 19, 19, 6, 6, 6, 19, 19, 19, 6, 6, 7],
      [7, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 7],
      [7, 6, 18, 6, 6, 6, 6, 6, 6, 6, 6, 6, 18, 6, 7],
      [7, 6, 6, 6, 17, 17, 17, 17, 17, 6, 6, 6, 6, 6, 7],
      [7, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 7],
      [7, 6, 8, 6, 6, 6, 6, 6, 6, 6, 6, 6, 8, 6, 7],
      [7, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 7],
      [7, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 7],
      [7, 7, 7, 7, 7, 7, 7, 16, 7, 7, 7, 7, 7, 7, 7],
    ],
    outside: [44, 14],
  },
};

// queries
export function levelAtWorld(x: number, z: number) {
  const i = ix(x), j = ix(z);
  if (i < 0 || j < 0 || i >= SIZE || j >= SIZE) return -1;
  return heights[idx(i, j)];
}
export function groundAtWorld(x: number, z: number) {
  const l = levelAtWorld(x, z);
  return l < 0 ? topOf(WATER_LEVEL) : topOf(l);
}
export function isBlocked(x: number, z: number) {
  const i = ix(x), j = ix(z);
  if (i < 0 || j < 0 || i >= SIZE || j >= SIZE) return true;
  return blocked[idx(i, j)] === 1;
}
export function kindAtWorld(x: number, z: number) {
  const i = ix(x), j = ix(z);
  if (i < 0 || j < 0 || i >= SIZE || j >= SIZE) return -1;
  return kinds[idx(i, j)];
}

export function eldervilleWorldPos(tx: number, ty: number) {
  return { x: villageGx(tx), z: villageGz(ty), y: topOf(4) };
}

/** Wooden archery boards flanking the training clearing (bow practice, Trial of Steel) */
export const archeryTargets = [eldervilleWorldPos(33, 4), eldervilleWorldPos(39, 4)];

/** The Outskirts Cave mouth at the north end of the eastern gate road */
export const CAVE_TILE = { tx: 90, ty: 8 };

/** The Forge anvil in the Artisan District — where the machine body must be delivered */
export const FORGE_TILE = { tx: 52, ty: 7 };

/**
 * The Outskirts Cave interior (Act 1 finale). Same virtual offset as other
 * interiors (72.5, 75) — only one area renders at a time.
 * Legend: W=wall S=stalagmite(solid) r=rubble m=glow-moss .=floor X=exit mat
 */
const CAVE_ROWS = [
  "WWWWWWWWWWWWWWWW",
  "WWW..rr......r.W",
  "WW..S.......S..W",
  "WW.............W",
  "WW..m........m.W",
  "WWW...........WW",
  "WWWWW......WWWWW",
  "WWWWW..WW..WWWWW",
  "WWWW...WW...WWWW",
  "WWW....WW....WWW",
  "WW.....WW.....WW",
  "WW..S..WW..S..WW",
  "WWWW..WWWW..WWWW",
  "WWWWW..WW..WWWWW",
  "WWWW...WW...WWWW",
  "WWW....WW....WWW",
  "WWm....WW....mWW",
  "WW.....WW.....WW",
  "WWW....WW....WWW",
  "WWWW........WWWW",
  "WWWWW......WWWWW",
  "WWWWW..X...WWWWW",
];

const CAVE_LEGEND: Record<string, number> = { W: 1, S: 2, r: 3, m: 4, ".": 0, X: 16 };

/** Tile grid of the cave (0 floor · 1 wall · 2 stalagmite · 3 rubble · 4 glow-moss · 16 exit mat) */
export const caveMap: number[][] = CAVE_ROWS.map((row) => [...row].map((ch) => CAVE_LEGEND[ch] ?? 0));

/** Cave landmarks in interior-tile coordinates */
export const CAVE_LANDMARKS = {
  /** spawn just north of the entrance mat */
  spawn: { tx: 7, ty: 19 },
  /** the exit mat at the cave mouth — matches the 'X' tile in CAVE_ROWS (row 21) */
  exitMat: { tx: 7, ty: 21 },
  /** the Cave Machine's dormant anchor in the north chamber */
  boss: { tx: 7.5, ty: 3.5 },
};

export function caveSolidAt(mapTile: number) {
  return mapTile === 1 || mapTile === 2;
}
