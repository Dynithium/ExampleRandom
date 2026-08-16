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
  },
  tinslaire: {
    pos: new THREE.Vector3(SPAWN.x, SPAWN.y, SPAWN.z),
    yaw: 0,
    speed: 0,
    moving: false,
    isNight: false,
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
  },
};

export const collected = new Set<number>();

export type UIState = {
  prompt: string | null;
  dialogue: { title: string; text: string } | null;
  pixel: number;
  scanlines: boolean;
  muted: boolean;
  paused: boolean;
  daySpeed: number;
  clock: string;
  started: boolean;
  setPrompt: (p: string | null) => void;
  say: (d: { title: string; text: string } | null) => void;
  setPixel: (p: number) => void;
  toggle: (k: "scanlines" | "muted" | "paused") => void;
  setDaySpeed: (s: number) => void;
  setClock: (c: string) => void;
  start: () => void;
};

export const useUI = create<UIState>((set) => ({
  prompt: null,
  dialogue: null,
  pixel: 4, // upscale factor: dpr = 1 / pixel
  scanlines: true,
  muted: false,
  paused: false,
  daySpeed: 1,
  clock: "06:14",
  started: false,
  setPrompt: (prompt) => set((s) => (s.prompt === prompt ? s : { prompt })),
  say: (dialogue) => set({ dialogue }),
  setPixel: (pixel) => set({ pixel }),
  toggle: (k) => set((s) => ({ [k]: !s[k] }) as never),
  setDaySpeed: (daySpeed) => set({ daySpeed }),
  setClock: (clock) => set((s) => (s.clock === clock ? s : { clock })),
  start: () => set({ started: true }),
}));
