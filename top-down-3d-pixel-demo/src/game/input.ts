import { useEffect } from "react";
import { rt, useUI } from "./state";
import { useElder } from "./eldervilleStory";
import { sfx } from "./audio";

const held = new Set<string>();

function refresh() {
  let x = 0;
  let y = 0;
  if (held.has("KeyW") || held.has("ArrowUp")) y += 1;
  if (held.has("KeyS") || held.has("ArrowDown")) y -= 1;
  if (held.has("KeyA") || held.has("ArrowLeft")) x -= 1;
  if (held.has("KeyD") || held.has("ArrowRight")) x += 1;
  rt.input.x = x;
  rt.input.y = y;
}

export function useKeyboard() {
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const ui = useUI.getState();
      sfx.unlock();
      if (!ui.started) return; // Do not intercept when on Title Screen

      if (
        [
          "KeyW",
          "KeyA",
          "KeyS",
          "KeyD",
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
          "Space",
          "KeyR",
          "KeyJ",
          "KeyK",
        ].includes(e.code)
      )
        e.preventDefault();

      if (!e.repeat) {
        if (e.code === "KeyQ" || e.code === "KeyZ") rt.cam.targetYaw += Math.PI / 2;
        if (e.code === "KeyC") rt.cam.targetYaw -= Math.PI / 2;
        if (e.code === "KeyE") rt.input.interact = true;
        if (e.code === "KeyP" || e.code === "Escape") {
          // Don't open the pause menu on top of a blocking modal. The pause menu
          // renders at z-50 — the same layer as the scholar puzzle and above the
          // dialog box — so it covered them while they still owned the input.
          // Worst case was a hard save-corrupting soft-lock: pause during the
          // opening memory, SAVE, and the save records openingBlack/memoryActive
          // with activeDialog dropped on load, leaving a permanently black screen
          // that only "E" (handled solely by the memory path) could ever clear.
          const s = useElder.getState();
          const blocked =
            s.openingBlack || s.memoryActive || !!s.activeDialog || s.scholarPuzzleOpen;
          if (!blocked) {
            ui.toggle("pauseMenu");
            sfx.ui();
          }
        }
        if (e.code === "Equal" || e.code === "NumpadAdd")
          rt.cam.targetZoom = Math.min(96, rt.cam.targetZoom * 1.25);
        if (e.code === "Minus" || e.code === "NumpadSubtract")
          rt.cam.targetZoom = Math.max(18, rt.cam.targetZoom / 1.25);
      }
      held.add(e.code);
      if (e.code === "ShiftLeft" || e.code === "ShiftRight") rt.input.shift = true;
      refresh();
    };
    const up = (e: KeyboardEvent) => {
      held.delete(e.code);
      if (e.code === "ShiftLeft" || e.code === "ShiftRight") rt.input.shift = false;
      refresh();
    };
    const blur = () => {
      held.clear();
      rt.input.shift = false;
      refresh();
    };
    window.addEventListener("keydown", down, { passive: false });
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, []);
}

/** used by the on-screen d-pad */
export function setTouchAxis(x: number, y: number) {
  rt.input.touchX = x;
  rt.input.touchY = y;
}
export function pressInteract() {
  rt.input.interact = true;
}
