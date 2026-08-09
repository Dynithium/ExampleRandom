/**
 * Procedural voxel island. Everything here is deterministic and generated once
 * at module load so the renderer components can just read the data.
 */

export const SIZE = 46; // tiles per side
export const STEP = 0.5; // world height of one terrain "level"
export const WATER_LEVEL = 2; // levels <= WATER_LEVEL are submerged
export const WATER_Y = WATER_LEVEL * STEP + 0.24;
export const HALF = SIZE / 2;

export const idx = (i: number, j: number) => j * SIZE + i;
export const topOf = (level: number) => level * STEP;
/** grid index -> world coordinate (tile centre) */
export const gx = (i: number) => i - HALF + 0.5;
/** world coordinate -> grid index */
export const ix = (x: number) => Math.floor(x + HALF);

// ---------------------------------------------------------------- noise ----
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
  let s = 0;
  let amp = 0.5;
  let f = 1;
  for (let o = 0; o < 4; o++) {
    s += amp * valueNoise(x * f, y * f);
    f *= 2;
    amp *= 0.5;
  }
  return s;
}

// --------------------------------------------------------------- tiles -----
export const KIND = {
  DEEP: 0,
  SILT: 1,
  SHOAL: 2,
  SAND: 3,
  GRASS: 4,
  GRASS_DARK: 5,
  FOREST: 6,
  ROCK: 7,
  DIRT: 8,
  PLAZA: 9,
} as const;

export const KIND_COLORS: Record<number, string> = {
  0: "#2a4a5e",
  1: "#4d6a63",
  2: "#a89768",
  3: "#e3cd8e",
  4: "#79c257",
  5: "#57a749",
  6: "#3d8a45",
  7: "#98a2ab",
  8: "#b98c58",
  9: "#c9c3ae",
};

export const heights = new Uint8Array(SIZE * SIZE);
export const kinds = new Uint8Array(SIZE * SIZE);
export const blocked = new Uint8Array(SIZE * SIZE);
export const shade = new Float32Array(SIZE * SIZE); // per tile brightness jitter

export type Tree = { x: number; z: number; y: number; s: number; hue: number; trunk: number };
export type House = { x: number; z: number; y: number; rot: number; wall: string; roof: string };
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

// 1. base elevation ---------------------------------------------------------
for (let j = 0; j < SIZE; j++) {
  for (let i = 0; i < SIZE; i++) {
    const nx = i / SIZE - 0.5;
    const nz = j / SIZE - 0.5;
    const d = Math.sqrt(nx * nx + nz * nz) * 2;
    let e = fbm(i * 0.085 + 11.3, j * 0.085 + 7.7) * 1.18 - Math.pow(d, 2.15) * 0.98;
    e += valueNoise(i * 0.31, j * 0.31) * 0.05;

    let h: number;
    if (e < 0.1) h = 0;
    else if (e < 0.2) h = 1;
    else if (e < 0.3) h = 2;
    else if (e < 0.37) h = 3;
    else if (e < 0.47) h = 4;
    else if (e < 0.57) h = 5;
    else if (e < 0.67) h = 6;
    else h = 7;

    heights[idx(i, j)] = h;
    kinds[idx(i, j)] = h;
    shade[idx(i, j)] = 0.9 + hash2(i * 3 + 1, j * 7 + 5) * 0.2;
  }
}

// 2. find the flattest, most central patch for the village -------------------
let bestScore = -1e9;
let cx = HALF;
let cz = HALF;
for (let j = 5; j < SIZE - 5; j++) {
  for (let i = 5; i < SIZE - 5; i++) {
    let score = 0;
    const base = heights[idx(i, j)];
    if (base < 4) continue;
    for (let b = -3; b <= 3; b++) {
      for (let a = -3; a <= 3; a++) {
        const h = heights[idx(i + a, j + b)];
        score += h >= 3 ? 1 : -4;
        score -= Math.abs(h - base) * 0.8;
      }
    }
    score -= (Math.abs(i - HALF) + Math.abs(j - HALF)) * 0.35;
    if (score > bestScore) {
      bestScore = score;
      cx = i;
      cz = j;
    }
  }
}

const PLAZA_LEVEL = Math.max(4, heights[idx(cx, cz)]);
for (let b = -3; b <= 3; b++) {
  for (let a = -3; a <= 3; a++) {
    const i = cx + a;
    const j = cz + b;
    heights[idx(i, j)] = PLAZA_LEVEL;
    const ring = Math.max(Math.abs(a), Math.abs(b));
    kinds[idx(i, j)] = ring <= 1 ? KIND.PLAZA : KIND.DIRT;
  }
}
// soften the ring around the plaza so there are no 3-level cliffs
for (let b = -5; b <= 5; b++) {
  for (let a = -5; a <= 5; a++) {
    const i = cx + a;
    const j = cz + b;
    if (i < 1 || j < 1 || i >= SIZE - 1 || j >= SIZE - 1) continue;
    const ring = Math.max(Math.abs(a), Math.abs(b));
    if (ring <= 3) continue;
    const h = heights[idx(i, j)];
    if (h < 3) continue;
    const diff = h - PLAZA_LEVEL;
    if (Math.abs(diff) > 1) heights[idx(i, j)] = PLAZA_LEVEL + Math.sign(diff);
  }
}

// 3. dirt road running from the plaza east to the beach ----------------------
for (let a = 3; a < SIZE; a++) {
  const i = cx + a;
  if (i >= SIZE - 1) break;
  const j = cz + Math.round(Math.sin(a * 0.33) * 2.5);
  const h = heights[idx(i, j)];
  if (h < 3) break;
  const prev = heights[idx(i - 1, j)];
  if (Math.abs(h - prev) > 1) heights[idx(i, j)] = prev + Math.sign(h - prev);
  kinds[idx(i, j)] = KIND.DIRT;
  if (heights[idx(i, j + 1)] >= 3) {
    kinds[idx(i, j + 1)] = KIND.DIRT;
    heights[idx(i, j + 1)] = heights[idx(i, j)];
  }
}

// 4. water is not walkable ---------------------------------------------------
const reserve = (i: number, j: number) => {
  if (i >= 0 && j >= 0 && i < SIZE && j < SIZE) blocked[idx(i, j)] = 1;
};
for (let n = 0; n < SIZE * SIZE; n++) if (heights[n] <= WATER_LEVEL) blocked[n] = 1;

// 5. village buildings -------------------------------------------------------
const WALLS = ["#e6d6b8", "#d9b48f", "#cfd8e6", "#e8c0a6"];
const ROOFS = ["#c1453f", "#7a4bb5", "#2f7fb5", "#d1793a"];
const spots: [number, number, number][] = [
  [-3, -3, Math.PI * 0.25],
  [3, -3, -Math.PI * 0.25],
  [-3, 3, Math.PI * 0.75],
  [4, 2, Math.PI * 1.15],
];
spots.forEach(([a, b, rot], n) => {
  const i = cx + a;
  const j = cz + b;
  if (i < 2 || j < 2 || i >= SIZE - 2 || j >= SIZE - 2) return;
  const h = heights[idx(i, j)];
  if (h <= WATER_LEVEL) return;
  for (let q = 0; q <= 1; q++)
    for (let p = 0; p <= 1; p++) {
      heights[idx(i + p, j + q)] = h;
      kinds[idx(i + p, j + q)] = KIND.DIRT;
      reserve(i + p, j + q);
    }
  houses.push({
    x: gx(i) + 0.5,
    z: gx(j) + 0.5,
    y: topOf(h),
    rot,
    wall: WALLS[n % WALLS.length],
    roof: ROOFS[n % ROOFS.length],
  });
});

// lamp posts around the plaza
[
  [0, -4],
  [-4, 1],
  [4, -1],
  [1, 4],
].forEach(([a, b]) => {
  const i = cx + a;
  const j = cz + b;
  if (heights[idx(i, j)] <= WATER_LEVEL) return;
  reserve(i, j);
  lamps.push({ x: gx(i), z: gx(j), y: topOf(heights[idx(i, j)]) });
});

// signposts with a bit of flavour text
const signData = [
  { a: 1, b: -1, title: "TOWN SIGN", text: "WELCOME TO PIXELMOOR. POP. 4 HOUSES,\n1 VERY OPINIONATED SEAGULL." },
  { a: -2, b: 2, title: "NOTICE", text: "EVERY BLOCK YOU SEE IS REAL 3D GEOMETRY,\nRENDERED TINY THEN BLOWN UP. NO SPRITES!" },
  { a: 5, b: 1, title: "ROAD SIGN", text: "EAST: THE BEACH. FOLLOW THE DIRT.\nMIND THE CRABS (NOT IMPLEMENTED)." },
];
signData.forEach(({ a, b, title, text }) => {
  const i = cx + a;
  const j = cz + b;
  if (heights[idx(i, j)] <= WATER_LEVEL) return;
  reserve(i, j);
  signs.push({ x: gx(i), z: gx(j), y: topOf(heights[idx(i, j)]), title, text });
});

// 6. trees, rocks, flowers ---------------------------------------------------
for (let j = 1; j < SIZE - 1; j++) {
  for (let i = 1; i < SIZE - 1; i++) {
    const n = idx(i, j);
    if (blocked[n]) continue;
    const k = kinds[n];
    const h = heights[n];
    const r = hash2(i * 13 + 3, j * 29 + 17);
    const clumping = fbm(i * 0.18 + 40, j * 0.18 + 90);
    if ((k === KIND.GRASS || k === KIND.GRASS_DARK || k === KIND.FOREST) && r < clumping * 0.34) {
      trees.push({
        x: gx(i) + (hash2(i, j) - 0.5) * 0.3,
        z: gx(j) + (hash2(j, i) - 0.5) * 0.3,
        y: topOf(h),
        s: 0.82 + hash2(i + 5, j + 9) * 0.5,
        hue: hash2(i + 21, j + 3),
        trunk: hash2(i + 77, j + 41),
      });
      blocked[n] = 1;
    } else if ((k === KIND.ROCK || k === KIND.SAND) && r > 0.94) {
      rocks.push({ x: gx(i), z: gx(j), y: topOf(h), s: 0.3 + hash2(i, j) * 0.35 });
    }
  }
}

// 7. collectible coins -------------------------------------------------------
{
  let placed = 0;
  for (let attempt = 0; attempt < 4000 && placed < 18; attempt++) {
    const i = 2 + Math.floor(hash2(attempt * 31 + 7, attempt * 17 + 3) * (SIZE - 4));
    const j = 2 + Math.floor(hash2(attempt * 13 + 91, attempt * 57 + 5) * (SIZE - 4));
    const n = idx(i, j);
    if (blocked[n]) continue;
    const dist = Math.hypot(i - cx, j - cz);
    if (dist < 3 || dist > 17) continue;
    if (coins.some((c) => Math.hypot(c.x - gx(i), c.z - gx(j)) < 3)) continue;
    coins.push({ x: gx(i), z: gx(j), y: topOf(heights[n]) });
    placed++;
  }
}

export const TOTAL_COINS = coins.length;
export const SPAWN = { x: gx(cx), z: gx(cz), y: topOf(PLAZA_LEVEL) };
export const VILLAGE = { i: cx, j: cz };

// ------------------------------------------------------------- queries -----
export function levelAtWorld(x: number, z: number) {
  const i = ix(x);
  const j = ix(z);
  if (i < 0 || j < 0 || i >= SIZE || j >= SIZE) return -1;
  return heights[idx(i, j)];
}
export function groundAtWorld(x: number, z: number) {
  const l = levelAtWorld(x, z);
  return l < 0 ? topOf(WATER_LEVEL) : topOf(l);
}
export function isBlocked(x: number, z: number) {
  const i = ix(x);
  const j = ix(z);
  if (i < 0 || j < 0 || i >= SIZE || j >= SIZE) return true;
  return blocked[idx(i, j)] === 1;
}
