import { useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { Scene } from "./game/Scene";
import { HUD } from "./components/HUD";
import { EldervilleHUD } from "./components/EldervilleHUD";
import { useKeyboard } from "./game/input";
import { rt, useUI } from "./game/state";

export default function App() {
  useKeyboard();
  const pixel = useUI((s) => s.pixel);
  const scanlines = useUI((s) => s.scanlines);

  useEffect(() => {
    const z = Math.min(48, Math.max(16, Math.max(window.innerWidth / 38, window.innerHeight / 34)));
    rt.cam.zoom = z;
    rt.cam.targetZoom = z;
  }, []);

  return (
    <div
      className={
        "relative h-[100dvh] w-screen overflow-hidden bg-[#070a14] " + (scanlines ? "crt" : "")
      }
      onWheel={(e) => {
        const next = rt.cam.targetZoom * (1 - e.deltaY * 0.0012);
        rt.cam.targetZoom = Math.min(96, Math.max(18, next));
      }}
    >
      <Canvas
        shadows="basic"
        flat
        dpr={1 / pixel}
        orthographic
        camera={{ position: [32, 34, 32], zoom: 40, near: -120, far: 420 }}
        gl={{
          antialias: false,
          powerPreference: "high-performance",
          stencil: false,
        }}
      >
        <Scene />
      </Canvas>
      <HUD />
      <EldervilleHUD />
    </div>
  );
}
