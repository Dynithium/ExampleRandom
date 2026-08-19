/**
 * Agent Mode — screen capture for vision-capable models.
 *
 * The WebGL canvas only holds a readable image because App.tsx sets
 * `preserveDrawingBuffer: true`. Even so, the pixels are only guaranteed to be
 * intact immediately after a composite, so captures are taken inside a
 * requestAnimationFrame callback.
 *
 * The HUD is plain DOM on top of the canvas and is NOT part of the WebGL image,
 * so a raw canvas grab loses the dialog box, prompts and objective text. Rather
 * than pull in html2canvas (heavy, and it mis-renders the CRT overlay), the
 * important HUD text is composited onto the screenshot as a caption strip drawn
 * with the 2D canvas API. That keeps the payload one small PNG while still
 * telling a vision model what the player can read on screen.
 */

let gameCanvas: HTMLCanvasElement | null = null;

export function registerGameCanvas(c: HTMLCanvasElement) {
  gameCanvas = c;
}

export function hasCanvas() {
  return !!gameCanvas;
}

/** Longest edge of the transmitted image. Small keeps tokens (and cost) down. */
const MAX_EDGE = 640;

function nextFrame(): Promise<void> {
  return new Promise((r) => requestAnimationFrame(() => r()));
}

export type CaptureOptions = {
  /** Lines of HUD text to burn into the image (dialog, prompt, objective). */
  caption?: string[];
  /** JPEG quality 0..1. JPEG is much smaller than PNG for a 3D scene. */
  quality?: number;
};

/**
 * Grab the current frame as a data URL, with optional HUD caption baked in.
 * Returns null if the canvas is unavailable or the read fails (e.g. context
 * loss), so callers can fall back to a text-only observation.
 */
export async function captureFrame(opts: CaptureOptions = {}): Promise<string | null> {
  const src = gameCanvas;
  if (!src) return null;
  // Wait for a fresh composite so the preserved buffer holds the current frame.
  await nextFrame();
  try {
    if (src.width === 0 || src.height === 0) return null;

    const scale = Math.min(1, MAX_EDGE / Math.max(src.width, src.height));
    const w = Math.max(1, Math.round(src.width * scale));
    const h = Math.max(1, Math.round(src.height * scale));

    const caption = (opts.caption ?? []).filter(Boolean);
    const lineH = 15;
    const pad = caption.length ? 8 : 0;
    const capH = caption.length ? caption.length * lineH + pad * 2 : 0;

    const out = document.createElement("canvas");
    out.width = w;
    out.height = h + capH;
    const ctx = out.getContext("2d");
    if (!ctx) return null;

    // The game is pixel art: keep it crisp when downscaling.
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(src, 0, 0, w, h);

    if (caption.length) {
      ctx.fillStyle = "#0a0e1a";
      ctx.fillRect(0, h, w, capH);
      ctx.strokeStyle = "#2a3f6a";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, h + 0.5);
      ctx.lineTo(w, h + 0.5);
      ctx.stroke();
      ctx.font = "12px ui-monospace, monospace";
      ctx.textBaseline = "top";
      caption.forEach((line, i) => {
        ctx.fillStyle = i === 0 ? "#ffd75e" : "#cfe0ff";
        // hard clip rather than overflow
        let text = line;
        while (text.length > 2 && ctx.measureText(text).width > w - pad * 2) {
          text = text.slice(0, -2);
        }
        ctx.fillText(text, pad, h + pad + i * lineH);
      });
    }

    return out.toDataURL("image/jpeg", opts.quality ?? 0.72);
  } catch {
    return null;
  }
}
