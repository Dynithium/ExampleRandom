import { useUI } from "./state";

let ctx: AudioContext | null = null;

function ac() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const C = window.AudioContext || (window as never as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!C) return null;
    ctx = new C();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function blip(freq: number, dur: number, type: OscillatorType, gain = 0.05, delay = 0) {
  if (useUI.getState().muted) return;
  const a = ac();
  if (!a) return;
  const t = a.currentTime + delay;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(a.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

export const sfx = {
  coin() {
    blip(988, 0.08, "square", 0.05);
    blip(1319, 0.14, "square", 0.045, 0.07);
  },
  talk() {
    blip(440, 0.06, "square", 0.035);
    blip(660, 0.08, "square", 0.03, 0.05);
  },
  step() {
    blip(120 + Math.random() * 40, 0.05, "triangle", 0.025);
  },
  ui() {
    blip(320, 0.05, "square", 0.03);
  },
  unlock() {
    ac();
  },
};
