import { useUI } from "./state";

let ctx: AudioContext | null = null;
let suitHumGain: GainNode | null = null;
let suitHumOsc: OscillatorNode | null = null;

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
  g.gain.linearRampToValueAtTime(gain, t + 0.008);
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
  talk(character?: string) {
    const baseFreq = character === "Father" ? 220 : character?.includes("Elder") ? 300 : character === "Tinslaire" ? 580 : character === "Widow Oren" ? 380 : 440;
    blip(baseFreq + Math.random() * 30, 0.05, "triangle", 0.035);
    blip(baseFreq * 1.3 + Math.random() * 40, 0.06, "sine", 0.025, 0.035);
  },
  step() {
    blip(90 + Math.random() * 35, 0.045, "triangle", 0.02);
  },
  ui() {
    blip(380, 0.04, "square", 0.025);
  },
  slash() {
    blip(480, 0.08, "sawtooth", 0.06);
    blip(260, 0.12, "triangle", 0.07, 0.02);
    blip(120, 0.15, "sine", 0.05, 0.05);
  },
  hit() {
    blip(180, 0.1, "sawtooth", 0.08);
    blip(95, 0.15, "triangle", 0.09, 0.02);
  },
  block() {
    blip(880, 0.06, "square", 0.07);
    blip(1175, 0.08, "triangle", 0.06, 0.02);
    blip(440, 0.15, "sine", 0.05, 0.05);
  },
  dodge() {
    blip(320, 0.09, "sine", 0.05);
    blip(160, 0.12, "triangle", 0.04, 0.03);
  },
  bowShoot() {
    blip(640, 0.06, "triangle", 0.06);
    blip(320, 0.12, "sawtooth", 0.05, 0.03);
  },
  door() {
    blip(220, 0.09, "sine", 0.04);
    blip(330, 0.12, "triangle", 0.04, 0.06);
  },
  machineRumble() {
    blip(55, 0.55, "sawtooth", 0.08);
    blip(73, 0.45, "sawtooth", 0.07, 0.08);
    blip(45, 0.75, "triangle", 0.09, 0.15);
    blip(98, 0.35, "sawtooth", 0.06, 0.25);
  },
  puzzleClick() {
    blip(820, 0.035, "square", 0.035);
  },
  puzzleError() {
    blip(180, 0.14, "sawtooth", 0.06);
    blip(130, 0.18, "sawtooth", 0.06, 0.09);
  },
  puzzleUnlock() {
    blip(440, 0.08, "triangle", 0.06);
    blip(554, 0.08, "triangle", 0.06, 0.08);
    blip(659, 0.08, "triangle", 0.06, 0.16);
    blip(880, 0.25, "triangle", 0.07, 0.24);
  },
  questComplete() {
    blip(523, 0.1, "triangle", 0.06);
    blip(659, 0.1, "triangle", 0.06, 0.08);
    blip(784, 0.1, "triangle", 0.06, 0.16);
    blip(1046, 0.28, "triangle", 0.07, 0.24);
  },
  onMuteChange(muted: boolean) {
    if (muted) this.stopSuitHum();
    else this.startSuitHum();
  },
  startSuitHum() {
    if (useUI.getState().muted) return;
    const a = ac();
    if (!a || suitHumOsc) return;
    try {
      suitHumOsc = a.createOscillator();
      suitHumGain = a.createGain();
      suitHumOsc.type = "sine";
      suitHumOsc.frequency.setValueAtTime(55, a.currentTime); // low 55Hz life suit hum
      suitHumGain.gain.setValueAtTime(0.008, a.currentTime);
      suitHumOsc.connect(suitHumGain).connect(a.destination);
      suitHumOsc.start();
    } catch {
      // audio context not yet unlocked
    }
  },
  stopSuitHum() {
    if (suitHumOsc) {
      try {
        suitHumOsc.stop();
        suitHumOsc.disconnect();
      } catch {}
      suitHumOsc = null;
      suitHumGain = null;
    }
  },
  unlock() {
    ac();
  },
};
