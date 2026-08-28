import * as THREE from "three";
import { create } from "zustand";
import { SPAWN, CAVE_LANDMARKS, INT_OFF_X, INT_OFF_Z, INT_Y } from "./world";

/** Mutable, non-reactive runtime state (mutated every frame, read by anything). */
export const rt = {
  player: {
    pos: new THREE.Vector3(SPAWN.x, SPAWN.y, SPAWN.z),
    yaw: Math.PI * 0.75,
    speed: 0,
    moving: false,
    blocking: false,
    dodgeIframes: 0,
    invuln: 0,
  },
  tinslaire: {
    /** live village position, maintained by the wandering NPC component */
    pos: new THREE.Vector3(SPAWN.x, SPAWN.y, SPAWN.z),
    yaw: 0,
  },
  boss: {
    /** live Cave Machine position, maintained by the boss component;
        initialized to its dormant anchor in the Outskirts Cave */
    pos: new THREE.Vector3(
      INT_OFF_X + CAVE_LANDMARKS.boss.tx + 0.5,
      INT_Y,
      INT_OFF_Z + CAVE_LANDMARKS.boss.ty + 0.5,
    ),
    yaw: 0,
  },
  agent: {
    /** active autopilot route (world-space waypoints), consumed by the player frame */
    path: null as { x: number; z: number }[] | null,
    pathIdx: 0,
    /** when set, the player turns in place toward this world point */
    faceTarget: null as { x: number; z: number } | null,
  },
  cam: {
    yaw: Math.PI * 0.25,
    targetYaw: Math.PI * 0.25,
    zoom: 40,
    targetZoom: 40,
  },
  env: {
    time: 0.26, // 0..1 -> one full day
    night: 0, // 0 day .. 1 night
    sun: new THREE.Vector3(),
    sky: new THREE.Color("#8fd0e8"),
  },
  input: {
    x: 0,
    y: 0,
    touchX: 0,
    touchY: 0,
    interact: false,
    shift: false,
  },
};

export type UIState = {
  prompt: string | null;
  pixel: number;
  scanlines: boolean;
  muted: boolean;
  paused: boolean;
  daySpeed: number;
  clock: string;
  started: boolean;
  pauseMenu: boolean;
  setPrompt: (p: string | null) => void;
  setPixel: (p: number) => void;
  toggle: (k: "scanlines" | "muted" | "paused" | "pauseMenu") => void;
  setDaySpeed: (s: number) => void;
  setClock: (c: string) => void;
  setPauseMenu: (open: boolean) => void;
  start: () => void;
};

// UI preferences persist across sessions independently of save games
const PREFS_KEY = "minslaire_ui_prefs";
type UIPrefs = { pixel?: number; scanlines?: boolean; muted?: boolean; daySpeed?: number };
function loadPrefs(): UIPrefs {
  try {
    return JSON.parse(localStorage.getItem(PREFS_KEY) || "{}") as UIPrefs;
  } catch {
    return {};
  }
}
const prefs = loadPrefs();

export const useUI = create<UIState>((set) => ({
  prompt: null,
  pixel: prefs.pixel ?? 4, // upscale factor: dpr = 1 / pixel
  scanlines: prefs.scanlines ?? true,
  muted: prefs.muted ?? false,
  paused: false,
  daySpeed: prefs.daySpeed ?? 1,
  clock: "06:14",
  started: false,
  pauseMenu: false,
  setPrompt: (prompt) => set((s) => (s.prompt === prompt ? s : { prompt })),
  setPixel: (pixel) => set({ pixel }),
  toggle: (k) => set((s) => ({ [k]: !s[k] }) as never),
  setDaySpeed: (daySpeed) => set({ daySpeed }),
  setClock: (clock) => set((s) => (s.clock === clock ? s : { clock })),
  setPauseMenu: (pauseMenu) => set({ pauseMenu }),
  start: () => set({ started: true }),
}));

// write display/audio prefs whenever one of them changes
useUI.subscribe((s, prev) => {
  if (
    s.pixel !== prev.pixel ||
    s.scanlines !== prev.scanlines ||
    s.muted !== prev.muted ||
    s.daySpeed !== prev.daySpeed
  ) {
    try {
      localStorage.setItem(
        PREFS_KEY,
        JSON.stringify({ pixel: s.pixel, scanlines: s.scanlines, muted: s.muted, daySpeed: s.daySpeed }),
      );
    } catch {}
  }
});
