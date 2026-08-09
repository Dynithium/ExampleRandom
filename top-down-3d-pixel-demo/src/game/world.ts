/**
 * Elderville voxel world — reskinned Pixelmoor engine
 * 48×48 terrain (was 46) with Elderville 48×30 village centered.
 * All Pixelmoor instancing / queries kept 100% compatible.
 */

export const SIZE = 48; // Elderville needs 48 width to fit 1:1 (was 46)
export const STEP = 0.5;
export const WATER_LEVEL = 2;
export const WATER_Y = WATER_LEVEL * STEP + 0.24;
export const HALF = SIZE / 2;

export const idx = (i: number, j: number) => j * SIZE + i;
export const topOf = (level: number) => level * STEP;
export const gx = (i: number) => i - HALF + 0.5;
export const ix = (x: number) => Math.floor(x + HALF);

// ---- noise (kept for variation, but village is hand-placed)
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

// Elderville layout constants (exactly as in game.js buildVillageMap)
export const VILLAGE_W = 48;
export const VILLAGE_H = 30;
export const OZ = Math.floor((SIZE - VILLAGE_H) / 2); // 9
export const OX = 0; // width matches

function villageIdx(tx: number, ty: number) { return idx(OX + tx, OZ + ty); }
function villageGx(tx: number) { return gx(OX + tx); }
function villageGz(ty: number) { return gx(OZ + ty); }
function villageTop(ty: number, tx: number) { return topOf(heights[villageIdx(tx, ty)]); }

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
    // outside: slightly higher forest hills
    const e = fbm(i * 0.12, j * 0.12);
    heights[idx(i, j)] = e > 0.55 ? 6 : 4;
    kinds[idx(i, j)] = e > 0.55 ? KIND.FOREST : KIND.GRASS;
    if (e > 0.65) blocked[idx(i, j)] = 1;
  }
  shade[idx(i, j)] = 0.9 + hash2(i * 3 + 1, j * 7 + 5) * 0.2;
}

// 2. border trees (game.js m[0][x]=1 etc) — make outer ring blocked forest
for (let x = 0; x < VILLAGE_W; x++) {
  // top row y=0 and bottom y=H-1 inside village become forest blocked
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

// 3. Eastern forest wall x=44..46 with gate gap 8..9
for (let y = 2; y < VILLAGE_H - 1; y++) for (let x = 44; x <= 46; x++) {
  const isGate = (y >= 8 && y <= 9);
  const i = OX + x, j = OZ + y;
  if (isGate) { heights[idx(i, j)] = 4; kinds[idx(i, j)] = KIND.DIRT; blocked[idx(i, j)] = 0; }
  else { heights[idx(i, j)] = 6; kinds[idx(i, j)] = KIND.FOREST; blocked[idx(i, j)] = 1; }
}

// 4. Roads (game.js: rows 13,25 cols 2,18,21)
for (let x = 2; x <= 44; x++) { setTile(x, 13, KIND.DIRT); setTile(x, 25, KIND.DIRT); }
for (let y = 1; y <= 28; y++) setTile(2, y, KIND.DIRT);
for (let y = 3; y <= 25; y++) setTile(18, y, KIND.DIRT);
for (let y = 4; y <= 23; y++) setTile(21, y, KIND.DIRT);
for (let y = 8; y <= 13; y++) setTile(44, y, KIND.DIRT);

// 5. District tiles (forge, gardens, well, market, pond, watchtower)
rectKind(22, 4, 3, 2, KIND.DIRT); // Forge
rectKind(22, 18, 5, 6, KIND.GRASS_DARK); // Grand Gardens
setTile(24, 16, KIND.DIRT); // Well tile (prop on top)
rectKind(22, 26, 5, 2, KIND.DIRT); // Market
rectKind(40, 26, 3, 3, KIND.SHOAL, 2); // Pond (lower)
for (let y = 26; y < 29; y++) for (let x = 40; x < 43; x++) blocked[villageIdx(x, y)] = 1; // pond blocked (water)

// scattered trees from game.js
for (const [tx, ty] of [[21,2],[4,26],[15,26],[20,28]] as [number,number][]) {
  const i = OX + tx, j = OZ + ty;
  heights[idx(i,j)] = 4; kinds[idx(i,j)] = KIND.FOREST; blocked[idx(i,j)] = 1;
}

// 6. Water not walkable (but keep pond as water)
for (let n = 0; n < SIZE*SIZE; n++) if (heights[n] <= WATER_LEVEL) blocked[n] = 1;
// undo pond blocking for visuals but keep as not walkable (already blocked)

// 7. Houses — 5×5 footprints but props occupy 2×2 at centre; reserve 2×2
const houseDefs: { tx:number, ty:number, wall:string, roof:string, id:string }[] = [
  { tx: 6, ty: 3, wall: "#6890c0", roof: "#4068a8", id: "council" }, // Blue House
  { tx: 28, ty: 3, wall: "#d07060", roof: "#c04038", id: "home" }, // Red House
  { tx: 6, ty: 16, wall: "#d0b078", roof: "#508028", id: "homesteadA" },
  { tx: 28, ty: 16, wall: "#d0b078", roof: "#508028", id: "homesteadB" },
];
houseDefs.forEach(h => {
  const cx = h.tx + 2, cz = h.ty + 2; // centre of 5×5
  const i = OX + cx, j = OZ + cz;
  // reserve 2×2 footprint for collision (house blocks movement)
  for (let q=0;q<=1;q++) for(let p=0;p<=1;p++) reserve(i+p, j+q);
  // flatten tiles under house
  for (let y = h.ty; y < h.ty+5; y++) for (let x = h.tx; x < h.tx+5; x++) {
    const ii = OX + x, jj = OZ + y;
    heights[idx(ii,jj)] = 4; kinds[idx(ii,jj)] = KIND.DIRT;
  }
  houses.push({
    x: gx(i) + 0.5, z: gx(j) + 0.5, y: topOf(4), rot: 0, wall: h.wall, roof: h.roof, id: h.id,
  });
});

// keep door tiles walkable (clear blocked at doors)
for (const [tx,ty] of [[8,7],[30,7],[8,20],[30,20]] as [number,number][]) {
  blocked[villageIdx(tx,ty)] = 0;
  kinds[villageIdx(tx,ty)] = KIND.DIRT;
}

// 8. District props placed at tile centres
forges.push({ x: villageGx(23), z: villageGz(5), y: topOf(4) });
for (let dy=0; dy<6; dy++) for (let dx=0; dx<5; dx++) gardens.push({ x: villageGx(22+dx)+ (Math.random()-0.5)*0.2, z: villageGz(18+dy)+(Math.random()-0.5)*0.2, y: topOf(4)});
wells.push({ x: villageGx(24), z: villageGz(16), y: topOf(4) });
markets.push({ x: villageGx(24), z: villageGz(27), y: topOf(4) });
watchtowers.push({ x: villageGx(44), z: villageGz(6), y: topOf(4) });

// 9. Interiors are virtual (not in world grid) — keep old lamps/signs minimal
// Add a couple of lamp posts for night vibe at roads
[[8,13],[30,13],[24,25]] .forEach(([tx,ty])=>{
  const i=OX+tx,j=OZ+ty;
  lamps.push({ x: gx(i), z: gx(j), y: topOf(heights[idx(i,j)]) });
});

// 10. Trees — mostly outside village, plus a few inside as per scattered
for (let j=1;j<SIZE-1;j++) for(let i=1;i<SIZE-1;i++){
  const n=idx(i,j); if(blocked[n]) continue;
  const k=kinds[n]; const r=hash2(i*13+3,j*29+17);
  if ((k===KIND.GRASS||k===KIND.GRASS_DARK) && r<0.02 && !(i>=OX&&i<OX+VILLAGE_W&&j>=OZ&&j<OZ+VILLAGE_H && (k===KIND.DIRT))) {
    // very sparse inside village — keep it open
    if (i>=OX && i<OX+VILLAGE_W && j>=OZ && j<OZ+VILLAGE_H && Math.random()>0.3) continue;
    trees.push({ x: gx(i)+(hash2(i,j)-0.5)*0.4, z: gx(j)+(hash2(j,i)-0.5)*0.4, y: topOf(heights[n]), s: 0.82+hash2(i+5,j+9)*0.5, hue: hash2(i+21,j+3), trunk: hash2(i+77,j+41)});
    blocked[n]=1;
  }
}

// Remaining rocks sparse
for(let j=1;j<SIZE-1;j++) for(let i=1;i<SIZE-1;i++){
  const n=idx(i,j); if(blocked[n]) continue;
  if(kinds[n]===KIND.ROCK && hash2(i,j)>0.94) rocks.push({ x:gx(i), z:gx(j), y:topOf(heights[n]), s:0.3+hash2(i,j)*0.35});
}

export const TOTAL_COINS = 0;
// Spawn at Red House door outside (30,7) world
export const SPAWN = { x: villageGx(30), z: villageGz(8), y: topOf(4) };
// Village centre for NPC wandering
export const VILLAGE = { i: OX + 24, j: OZ + 15 };

// Door definitions for transition (mirror game.js villageDoors)
export const villageDoors = [
  { tx: 8, ty: 7, interior: 'council', x: villageGx(8), z: villageGz(7) },
  { tx: 30, ty: 7, interior: 'home', x: villageGx(30), z: villageGz(7) },
  { tx: 8, ty: 20, interior: 'homesteadA', x: villageGx(8), z: villageGz(20) },
  { tx: 30, ty: 20, interior: 'homesteadB', x: villageGx(30), z: villageGz(20) },
];

// Interiors — virtual 15×10 (kept as data, not world tiles)
export const interiors: Record<string, { name:string, map:number[][], outside:[number,number] }>={
  home: { name:"Your Home", map:[
    [7,7,7,7,7,7,7,7,7,7,7,7,7,7,7],
    [7,6,6,6,6,6,6,6,6,6,6,6,6,6,7],
    [7,6,6,6,6,6,6,6,6,6,6,6,6,6,7],
    [7,6,6,8,6,8,6,6,6,9,6,6,6,6,7],
    [7,6,6,6,6,6,6,6,6,9,6,6,6,6,7],
    [7,6,6,6,6,6,6,6,6,6,6,6,6,6,7],
    [7,6,6,6,6,6,6,6,6,6,6,6,6,6,7],
    [7,6,6,6,6,6,6,6,6,6,6,6,6,6,7],
    [7,6,6,6,6,6,6,6,6,6,6,6,6,6,7],
    [7,7,7,7,7,7,7,16,7,7,7,7,7,7,7],
  ], outside:[30,7]},
  council: { name:"Council Hall", map:[
    [7,7,7,7,7,7,7,7,7,7,7,7,7,7,7],
    [7,6,6,19,19,19,19,19,19,19,19,19,6,6,7],
    [7,6,6,6,6,6,6,6,6,6,6,6,6,6,7],
    [7,6,18,6,6,6,6,6,6,6,6,6,18,6,7],
    [7,6,6,17,17,17,17,17,17,17,17,17,6,6,7],
    [7,6,6,17,17,17,17,17,17,17,17,17,6,6,7],
    [7,6,6,17,17,17,17,17,17,17,17,17,6,6,7],
    [7,6,18,6,6,6,6,6,6,6,6,6,18,6,7],
    [7,6,6,6,6,6,6,6,6,6,6,6,6,6,7],
    [7,7,7,7,7,7,7,16,7,7,7,7,7,7,7],
  ], outside:[8,7]},
  homesteadA: { name:"Farmer's Homestead", map:[
    [7,7,7,7,7,7,7,7,7,7,7,7,7,7,7],
    [7,6,6,6,6,6,6,6,6,6,6,6,6,6,7],
    [7,6,6,6,6,6,6,6,6,6,6,6,6,6,7],
    [7,6,6,8,6,6,6,6,6,6,6,6,6,6,7],
    [7,6,6,6,6,6,6,6,6,6,6,6,6,6,7],
    [7,6,6,6,6,18,17,17,18,6,6,6,6,6,7],
    [7,6,6,6,6,6,6,6,6,6,6,6,6,6,7],
    [7,6,6,6,6,6,6,6,6,6,6,6,6,6,7],
    [7,6,6,6,6,6,6,6,6,6,6,6,6,6,7],
    [7,7,7,7,7,7,7,16,7,7,7,7,7,7,7],
  ], outside:[8,20]},
  homesteadB: { name:"Weaver's Homestead", map:[
    [7,7,7,7,7,7,7,7,7,7,7,7,7,7,7],
    [7,6,6,6,6,6,6,6,6,6,6,6,6,6,7],
    [7,6,6,6,6,6,6,6,6,6,6,6,6,6,7],
    [7,6,6,6,6,6,6,6,6,6,8,6,6,6,7],
    [7,6,6,6,6,6,6,6,6,6,6,6,6,6,7],
    [7,6,6,6,6,6,18,17,17,18,6,6,6,6,7],
    [7,6,6,6,6,6,6,6,6,6,6,6,6,6,7],
    [7,6,6,19,6,6,6,6,6,6,6,6,6,6,7],
    [7,6,6,6,6,6,6,6,6,6,6,6,6,6,7],
    [7,7,7,7,7,7,7,16,7,7,7,7,7,7,7],
  ], outside:[30,20]},
};

// queries (unchanged API)
export function levelAtWorld(x:number,z:number){ const i=ix(x),j=ix(z); if(i<0||j<0||i>=SIZE||j>=SIZE) return -1; return heights[idx(i,j)]; }
export function groundAtWorld(x:number,z:number){ const l=levelAtWorld(x,z); return l<0? topOf(WATER_LEVEL): topOf(l); }
export function isBlocked(x:number,z:number){ const i=ix(x),j=ix(z); if(i<0||j<0||i>=SIZE||j>=SIZE) return true; return blocked[idx(i,j)]===1; }
export function kindAtWorld(x:number,z:number){ const i=ix(x),j=ix(z); if(i<0||j<0||i>=SIZE||j>=SIZE) return -1; return kinds[idx(i,j)]; }

// helper to get world pos of Elderville tile
export function eldervilleWorldPos(tx:number, ty:number){ return { x: villageGx(tx), z: villageGz(ty), y: topOf(4)}; }
