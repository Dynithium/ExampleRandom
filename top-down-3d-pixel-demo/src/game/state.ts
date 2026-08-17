import * as THREE from "three";
import { create } from "zustand";
import { SPAWN } from "./world";

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
    /** live Cave Machine position, maintained by the boss component */
    pos: new THREE.Vector3(80, 2, 80.5),
    yaw: 0,
  },
  agent: {
    /** active autopilot route (world-space waypoints), consumed by the player frame */
    path: null as { x: number; z: number }[] | null,
    pathIdx: 0,
    /** when set, the player turns in place toward this world point */
    faceTarget: null as { x: number; z: number } | null,
    /** world-space dodge vector for one roll (agent combat) */
    dodgeWorld: null as { x: number; z: number } | null,
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

const UI_KEY = "minslaire_ui";

function loadUi(): Partial<Pick<UIState, "pixel" | "scanlines" | "muted" | "daySpeed">> {
  try {
    return JSON.parse(localStorage.getItem(UI_KEY) || "{}");
  } catch {
    return {};
  }
}

function persistUi() {
  try {
    const { pixel, scanlines, muted, daySpeed } = useUI.getState();
    localStorage.setItem(UI_KEY, JSON.stringify({ pixel, scanlines, muted, daySpeed }));
  } catch {
    /* private mode */
  }
}

const savedUi = loadUi();

export const useUI = create<UIState>((set) => ({
  prompt: null,
  pixel: savedUi.pixel ?? 4, // upscale factor: dpr = 1 / pixel
  scanlines: savedUi.scanlines ?? true,
  muted: savedUi.muted ?? false,
  paused: false,
  daySpeed: savedUi.daySpeed ?? 1,
  clock: "06:14",
  started: false,
  pauseMenu: false,
  setPrompt: (prompt) => set((s) => (s.prompt === prompt ? s : { prompt })),
  setPixel: (pixel) => {
    set({ pixel });
    persistUi();
  },
  toggle: (k) => {
    set((s) => ({ [k]: !s[k] }) as never);
    if (k === "scanlines" || k === "muted") persistUi();
  },
  setDaySpeed: (daySpeed) => {
    set({ daySpeed });
    persistUi();
  },
  setClock: (clock) => set((s) => (s.clock === clock ? s : { clock })),
  setPauseMenu: (pauseMenu) => set({ pauseMenu }),
  start: () => set({ started: true }),
}));
