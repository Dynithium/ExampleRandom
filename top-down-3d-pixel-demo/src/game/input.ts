import { useEffect } from "react";
import { rt, useUI } from "./state";
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
      if (!ui.started) ui.start();
      sfx.unlock();
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
        ].includes(e.code)
      )
        e.preventDefault();

      if (!e.repeat) {
        if (e.code === "KeyQ") rt.cam.targetYaw += Math.PI / 2;
        if (e.code === "KeyR") rt.cam.targetYaw -= Math.PI / 2;
        if (e.code === "KeyE") rt.input.interact = true;
        if (e.code === "Equal" || e.code === "NumpadAdd")
          rt.cam.targetZoom = Math.min(90, rt.cam.targetZoom * 1.25);
        if (e.code === "Minus" || e.code === "NumpadSubtract")
          rt.cam.targetZoom = Math.max(18, rt.cam.targetZoom / 1.25);
      }
      held.add(e.code);
      refresh();
    };
    const up = (e: KeyboardEvent) => {
      held.delete(e.code);
      refresh();
    };
    const blur = () => {
      held.clear();
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
