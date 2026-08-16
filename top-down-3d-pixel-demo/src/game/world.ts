/**
 * Elderville voxel world — Expansive 72x72 map
 * Sprawling settlement with distinct districts and distant outskirts.
 */

export const SIZE = 72;
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
export type Sign = { x: number; z: number; y: number; title: string; text: string };
export type Coin = { x: number; z: number; y: number };
export type Rock = { x: number; z: number; y: number; s: number };

export const trees: Tree[] = [];
export const houses: House[] = [];
export const lamps: Lamp[] = [];
export const signs: Sign[] = [];
export const coins: Coin[] = [];
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
export const VILLAGE_W = 72;
export const VILLAGE_H = 50;
export const OZ = Math.floor((SIZE - VILLAGE_H) / 2); // 11
export const OX = 0;

export function villageIdx(tx: number, ty: number) { return idx(OX + tx, OZ + ty); }
export function villageGx(tx: number) { return gx(OX + tx); }
export function villageGz(ty: number) { return gx(OZ + ty); }
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

// 3. Eastern forest wall x=68..70 with gate gap 16..18
for (let y = 2; y < VILLAGE_H - 1; y++) for (let x = 68; x <= 70; x++) {
  const isGate = (y >= 16 && y <= 18);
  const i = OX + x, j = OZ + y;
  if (isGate) { heights[idx(i, j)] = 4; kinds[idx(i, j)] = KIND.DIRT; blocked[idx(i, j)] = 0; }
  else { heights[idx(i, j)] = 6; kinds[idx(i, j)] = KIND.FOREST; blocked[idx(i, j)] = 1; }
}

// 4. Main Road Network
// East-West Main Avenue & South Highway
for (let x = 4; x <= 68; x++) {
  setTile(x, 16, KIND.DIRT);
  setTile(x, 32, KIND.DIRT);
}
// North-South Arteries
for (let y = 4; y <= 46; y++) {
  setTile(6, y, KIND.DIRT);
  setTile(20, y, KIND.DIRT);
  setTile(36, y, KIND.DIRT);
  setTile(52, y, KIND.DIRT);
}
// Outskirts paths & connectors
for (let y = 10; y <= 16; y++) setTile(12, y, KIND.DIRT); // Red house path
for (let y = 10; y <= 16; y++) setTile(32, y, KIND.DIRT); // Blue house path
for (let y = 28; y <= 32; y++) setTile(12, y, KIND.DIRT); // Homestead A path
for (let y = 28; y <= 32; y++) setTile(32, y, KIND.DIRT); // Homestead B path
for (let y = 8; y <= 16; y++) setTile(52, y, KIND.DIRT);  // Forge path
for (let y = 28; y <= 42; y++) setTile(58, y, KIND.DIRT); // Central Well path
for (let x = 52; x <= 58; x++) setTile(x, 32, KIND.DIRT); // Well connector
for (let y = 12; y <= 20; y++) setTile(66, y, KIND.DIRT); // Eastern Gate road

// 5. Districts (Forge, Grand Gardens, Central Well, Market, Pond, Watchtower)
rectKind(50, 6, 5, 3, KIND.DIRT); // Forge & Workshops
rectKind(26, 34, 14, 8, KIND.GRASS_DARK); // Grand Gardens crop terraces
setTile(58, 36, KIND.DIRT); // Central Well tile
rectKind(12, 38, 8, 4, KIND.DIRT); // Southern Marketplace & Bazaar
rectKind(46, 38, 6, 6, KIND.SHOAL, 2); // Village Pond
for (let y = 38; y < 44; y++) for (let x = 46; x < 52; x++) blocked[villageIdx(x, y)] = 1; // pond water blocked

// 6. Water level non-walkable
for (let n = 0; n < SIZE * SIZE; n++) if (heights[n] <= WATER_LEVEL) blocked[n] = 1;

// 7. Houses (5x5 footprints, centered on cx, cz)
const houseDefs: { tx: number; ty: number; wall: string; roof: string; id: string }[] = [
  { tx: 30, ty: 6, wall: "#6890c0", roof: "#4068a8", id: "council" }, // Blue House (Council)
  { tx: 10, ty: 6, wall: "#d07060", roof: "#c04038", id: "home" },    // Red House (Home)
  { tx: 10, ty: 24, wall: "#d0b078", roof: "#508028", id: "homesteadA" }, // Farmer's Homestead
  { tx: 30, ty: 24, wall: "#d0b078", roof: "#508028", id: "homesteadB" }, // Weaver's Homestead
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
  houses.push({
    x: gx(i), z: gx(j), y: topOf(4), rot: 0, wall: h.wall, roof: h.roof, id: h.id,
  });
});

// Clear blocked at doors & landing tiles
for (const [tx, ty] of [[32, 10], [12, 10], [12, 28], [32, 28]] as [number, number][]) {
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
watchtowers.push({ x: villageGx(66), z: villageGz(12), y: topOf(4) });

// Lamps along avenues
[[6, 16], [20, 16], [36, 16], [52, 16], [6, 32], [20, 32], [36, 32], [52, 32], [58, 36]].forEach(([tx, ty]) => {
  const i = OX + tx, j = OZ + ty;
  lamps.push({ x: gx(i), z: gx(j), y: topOf(heights[idx(i, j)]) });
});

// Trees
for (let j = 1; j < SIZE - 1; j++) for (let i = 1; i < SIZE - 1; i++) {
  const n = idx(i, j);
  if (blocked[n]) continue;
  const k = kinds[n];
  const r = hash2(i * 13 + 3, j * 29 + 17);
  if ((k === KIND.GRASS || k === KIND.GRASS_DARK) && r < 0.025 && !(i >= OX && i < OX + VILLAGE_W && j >= OZ && j < OZ + VILLAGE_H && k === KIND.DIRT)) {
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

// Rocks
for (let j = 1; j < SIZE - 1; j++) for (let i = 1; i < SIZE - 1; i++) {
  const n = idx(i, j);
  if (blocked[n]) continue;
  if (kinds[n] === KIND.ROCK && hash2(i, j) > 0.94) {
    rocks.push({ x: gx(i), z: gx(j), y: topOf(heights[n]), s: 0.3 + hash2(i, j) * 0.35 });
  }
}

export const TOTAL_COINS = 0;
// Spawn at Red House door outside (12, 11) world
export const SPAWN = { x: villageGx(12), z: villageGz(11), y: topOf(4) };
export const VILLAGE = { i: OX + 36, j: OZ + 25 };

// Door definitions for transition
export const villageDoors = [
  { tx: 32, ty: 10, interior: "council", x: villageGx(32), z: villageGz(10) },
  { tx: 12, ty: 10, interior: "home", x: villageGx(12), z: villageGz(10) },
  { tx: 12, ty: 28, interior: "homesteadA", x: villageGx(12), z: villageGz(28) },
  { tx: 32, ty: 28, interior: "homesteadB", x: villageGx(32), z: villageGz(28) },
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
      [7, 6, 6, 17, 17, 17, 17, 17, 17, 17, 17, 17, 6, 6, 7],
      [7, 6, 6, 17, 17, 17, 17, 17, 17, 17, 17, 17, 6, 6, 7],
      [7, 6, 6, 17, 17, 17, 17, 17, 17, 17, 17, 17, 6, 6, 7],
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
