import { useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useElder } from "./eldervilleStory";
import { rt, useUI } from "./state";
import { eldervilleWorldPos, villageDoors, INT_OFF_X, INT_OFF_Z } from "./world";
import { activeTrial } from "./quests";


const intPos = (tx: number, ty: number) => ({ x: INT_OFF_X + tx + 0.5, z: INT_OFF_Z + ty + 0.5 });

/**
 * Where the current objective lives, in world coordinates (null = no marker).
 *
 * This used to re-derive the whole story order in a second long if-chain that
 * had to be kept in sync with EldervillePlayer's gates and the HUD's objective
 * text. It now just asks the quest spine which trial is active and where that
 * trial's current stage points, so the arrow can never disagree with the gates.
 */
function targetFor(s: ReturnType<typeof useElder.getState>): { x: number; z: number } | null {
  // Pre-trial opening beats still live here: they happen before the spine starts.
  if (s.currentArea === "home") {
    if (!s.tinslaireInsideTalked) return intPos(6, 5);
    if (!s.eldersDoorDialogDone) return intPos(7, 8.6); // exit mat
  }
  if (!s.eldersDoorDialogDone) {
    return s.currentArea === "village" ? eldervilleWorldPos(12, 11.5) : null;
  }

  const t = activeTrial(s);
  if (!t) return null;
  const w = t.where(s);
  if (!w) return null;

  // An interior objective is only meaningful while you are standing in it; from
  // outside, the marker should point at that building's door instead.
  if (w.area === "village") return eldervilleWorldPos(w.tx, w.ty);
  if (w.area === s.currentArea) return intPos(w.tx, w.ty);
  const door = villageDoors.find((d) => d.interior === w.area);
  return door ? eldervilleWorldPos(door.tx, door.ty) : null;
}

/**
 * Golden objective marker. Hovers over the objective when it is on screen;
 * when the objective is off screen it becomes an arrow pinned to the screen edge
 * (via ortho-camera unprojection) still pointing the way.
 */
export function ObjectiveMarker() {
  const beacon = useRef<THREE.Group>(null!);
  const edge = useRef<THREE.Group>(null!);
  const t = useRef(0);
  const { camera } = useThree();
  const ndc = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    t.current += dt;
    const s = useElder.getState();
    const target = s.openingBlack || s.memoryActive ? null : targetFor(s);
    const show = !!target && !s.activeDialog && !s.scholarPuzzleOpen && !useUI.getState().pauseMenu;
    const p = rt.player.pos;
    const dist = target ? Math.hypot(target.x - p.x, target.z - p.z) : Infinity;
    const near = dist < 6;

    let beaconOn = false, edgeOn = false;
    if (show && target && !near) {
      ndc.current.set(target.x, 3.7, target.z).project(camera);
      const off = Math.abs(ndc.current.x) > 0.9 || Math.abs(ndc.current.y) > 0.88;
      if (off) {
        // clamp into view at the screen edge; ortho unprojection keeps scale constant
        ndc.current.x = THREE.MathUtils.clamp(ndc.current.x, -0.88, 0.88);
        ndc.current.y = THREE.MathUtils.clamp(ndc.current.y, -0.84, 0.84);
        ndc.current.unproject(camera);
        edgeOn = true;
        if (edge.current) {
          edge.current.position.copy(ndc.current);
          const dir = Math.atan2(target.x - p.x, target.z - p.z);
          edge.current.rotation.y = dir;
        }
      } else {
        beaconOn = true;
        if (beacon.current) {
          const bob = Math.sin(t.current * 3.2) * 0.18;
          beacon.current.position.set(target.x, 3.9 + bob, target.z);
          beacon.current.rotation.y = t.current * 1.8;
        }
      }
    }
    if (beacon.current) beacon.current.visible = beaconOn;
    if (edge.current) edge.current.visible = edgeOn;
  });

  return (
    <>
      {/* hovering beacon over the on-screen objective */}
      <group ref={beacon} visible={false}>
        <mesh rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.28, 0.55, 4]} />
          <meshBasicMaterial color="#ffd75e" toneMapped={false} />
        </mesh>
        <mesh position={[0, 0.42, 0]}>
          <octahedronGeometry args={[0.14, 0]} />
          <meshBasicMaterial color="#fff2b0" toneMapped={false} />
        </mesh>
        <mesh position={[0, -1.65, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.34, 0.5, 16]} />
          <meshBasicMaterial color="#ffd75e" transparent opacity={0.35} toneMapped={false} />
        </mesh>
      </group>
      {/* screen-edge pointer while the objective is off screen */}
      <group ref={edge} visible={false}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.3, 0.6, 3]} />
          <meshBasicMaterial color="#ffd75e" toneMapped={false} />
        </mesh>
        <mesh position={[0, -0.55, 0]}>
          <octahedronGeometry args={[0.16, 0]} />
          <meshBasicMaterial color="#fff2b0" toneMapped={false} />
        </mesh>
      </group>
    </>
  );
}
