import { useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useElder } from "./eldervilleStory";
import { rt, useUI } from "./state";
import { eldervilleWorldPos, INT_OFF_X, INT_OFF_Z } from "./world";

const intPos = (tx: number, ty: number) => ({ x: INT_OFF_X + tx + 0.5, z: INT_OFF_Z + ty + 0.5 });

/** Where the current objective lives, in world coordinates (null = no marker). */
function targetFor(s: ReturnType<typeof useElder.getState>): { x: number; z: number } | null {
  const v = (tx: number, ty: number) => eldervilleWorldPos(tx, ty);
  const i = (tx: number, ty: number) => intPos(tx, ty);

  if (s.currentArea === "home") {
    if (!s.tinslaireInsideTalked) return i(6, 5);
    if (!s.eldersDoorDialogDone) return i(7, 8.6); // exit mat
    if (s.combatTrialState === "completed" && !s.hasSword) return i(9, 3.5); // sword case
    return null;
  }
  if (s.currentArea === "council") {
    if (s.scholarTrialState === "desk_read") return i(7, 1);
    if (s.scholarTrialState === "assigned") return i(6, 4);
    return null;
  }
  if (s.currentArea === "homesteadA") {
    if (s.carryingGrain) return i(6, 5);
    return null;
  }
  if (s.currentArea === "cave") {
    if (s.caveStage === "entered") return i(7, 7); // deeper into the dark
    if (s.caveStage === "boss_awake") return i(7.5, 3.5); // the machine
    if (s.caveStage === "boss_defeated" && !s.carryingBody) return null; // lift where it fell (nearby)
    if (s.carryingBody) return i(7, 20); // entrance mat
    return null;
  }
  if (s.currentArea !== "village") return null;

  if (s.carryingBody) return v(52, 7); // the Forge
  if (!s.eldersDoorDialogDone) return v(12, 11.5);
  if (s.wellTrialState === "not_started" || s.wellTrialState === "assigned" || s.wellTrialState === "inspected") {
    return s.wellTrialState === "assigned" ? v(58, 36) : v(59, 35);
  }
  if (s.scholarTrialState === "not_started") return v(32, 12);
  if (s.scholarTrialState === "assigned" || s.scholarTrialState === "desk_read") return v(32, 10); // council door
  if (s.scholarTrialState === "puzzle_solved") return v(32, 12);
  if (s.widowTrialState === "not_started") return v(16, 26);
  if (s.widowTrialState === "assigned" && !s.carryingGrain) return v(30, 36); // grain sack
  if (s.carryingGrain) return v(12, 28); // homestead A door
  if (s.widowTrialState === "delivered") return v(16, 26);
  if (s.marketTrialState === "not_started" || s.marketTrialState === "overpaid") return v(15, 40);
  if (s.combatTrialState === "not_started") return v(36, 6);
  if (s.combatTrialState === "assigned") return v(36, 4); // dummies
  if (s.combatTrialState === "completed" && !s.hasSword) return v(12, 10); // red house door
  // Village tasks — learning to follow the compass (completing Act I)
  if (s.hasCompass) {
    if (s.keepsakeState === "accepted") return v(31, 35);
    if (s.keepsakeState === "bird_found") return { x: rt.tinslaire.pos.x, z: rt.tinslaire.pos.z };
    if (s.keepsakeState === "returned" && s.droneState !== "completed") return v(64, 14);
    if (s.droneState === "completed" && s.crateState === "not_started") return v(27, 37);
    if (s.crateState === "carrying") return v(16, 40);
    if (s.crateState === "delivered" && !s.watchtowerSceneDone) return v(66, 13);
    if (s.watchtowerSceneDone && !s.gateEpilogueDone) return v(69, 17);
    return null;
  }
  if (s.hasSword) return v(66, 9); // outskirts cave
  return null;
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
