import * as THREE from "three";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { eldervilleWorldPos, groundAtWorld } from "./world";
import {
  useElder,
  villageNPCsData,
  eldersAtDoorPositions,
} from "./eldervilleStory";
import { rt, useUI } from "./state";

// Simple voxel NPC mesh
function NpcMesh({ pos, color, name, isElder, yaw = 0 }: { pos: THREE.Vector3; color: string; name: string; isElder?: boolean; yaw?: number }) {
  const g = useRef<THREE.Group>(null!);
  return (
    <group ref={g} position={[pos.x, pos.y, pos.z]} rotation-y={yaw}>
      {/* shadow */}
      <mesh position={[0, 0.02, 0]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[0.6, 0.6]} />
        <meshBasicMaterial color="#183010" transparent opacity={0.35} />
      </mesh>
      {/* robe/body */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[0.46, 0.5, 0.3]} />
        <meshLambertMaterial color={color} />
      </mesh>
      {/* collar for elder */}
      {isElder && (
        <mesh position={[0, 0.75, 0]}>
          <boxGeometry args={[0.5, 0.08, 0.32]} />
          <meshLambertMaterial color="#c0c0c0" />
        </mesh>
      )}
      {/* head */}
      <mesh position={[0, 0.92, 0]} castShadow>
        <boxGeometry args={[0.38, 0.36, 0.38]} />
        <meshLambertMaterial color={isElder ? "#e8c6a0" : "#f0c090"} />
      </mesh>
      {/* hair / elder gray */}
      <mesh position={[0, 1.12, 0]} castShadow>
        <boxGeometry args={[0.4, 0.1, 0.4]} />
        <meshLambertMaterial color={isElder ? "#c0c0c0" : "#503828"} />
      </mesh>
      {/* eyes */}
      <mesh position={[0.08, 0.95, 0.2]}>
        <boxGeometry args={[0.06, 0.07, 0.02]} />
        <meshLambertMaterial color="#241a14" />
      </mesh>
      <mesh position={[-0.08, 0.95, 0.2]}>
        <boxGeometry args={[0.06, 0.07, 0.02]} />
        <meshLambertMaterial color="#241a14" />
      </mesh>
      {/* beard for elder */}
      {isElder && (
        <mesh position={[0, 0.82, 0.19]}>
          <boxGeometry args={[0.22, 0.12, 0.05]} />
          <meshLambertMaterial color="#c0c0c0" />
        </mesh>
      )}
      {/* name tag */}
      <group position={[0, 1.45, 0]}>
        <mesh>
          <planeGeometry args={[name.length * 0.09 + 0.2, 0.18]} />
          <meshBasicMaterial color="#203868" />
        </mesh>
        <mesh position={[0, 0, 0.01]}>
          <planeGeometry args={[name.length * 0.09 + 0.16, 0.14]} />
          <meshBasicMaterial color="#f0e8c8" />
        </mesh>
      </group>
    </group>
  );
}

// Waypoints connecting the dirt paths of Elderville for Tinslaire's daytime wander
const WAYPOINTS_TILES: [number, number][] = [
  [12, 13], // Red House path
  [6, 16],  // West road
  [20, 16], // Residential junction
  [36, 16], // Council Hall avenue
  [52, 16], // Artisan / Forge road
  [52, 32], // South turn toward Well
  [58, 36], // Central Well outskirts
  [52, 32], // Back to South Highway
  [36, 32], // Near Grand Gardens
  [20, 32], // West Highway
  [14, 40], // Southern Marketplace & Bazaar
  [6, 32],  // West Road South
  [6, 16],  // West Road North
  [12, 13], // Back to Red House
];

function TinslaireVillage() {
  const g = useRef<THREE.Group>(null!);
  const legL = useRef<THREE.Group>(null!);
  const legR = useRef<THREE.Group>(null!);
  const armL = useRef<THREE.Group>(null!);
  const armR = useRef<THREE.Group>(null!);

  const wpIdx = useRef(0);
  const waitTimer = useRef(1.0);
  const phase = useRef(0);
  const pos = useRef(new THREE.Vector3(eldervilleWorldPos(12, 13).x, 2, eldervilleWorldPos(12, 13).z));
  const yaw = useRef(0);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const elder = useElder.getState();
    const isNight = rt.env.night > 0.45;
    rt.tinslaire.isNight = isNight;
    // gone home at night — hide the mesh too, or he reads as a ghost you walk through
    if (g.current) g.current.visible = !isNight;
    if (isNight) return;

    const isTalking = !!elder.activeDialog && elder.dialogSourceId === "tinslaireVillage";
    let moving = false;

    if (isTalking) {
      // face player while talking
      const dx = rt.player.pos.x - pos.current.x;
      const dz = rt.player.pos.z - pos.current.z;
      const targetYaw = Math.atan2(dx, dz);
      let diff = targetYaw - yaw.current;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      yaw.current += diff * (1 - Math.exp(-dt * 10));
    } else {
      if (waitTimer.current > 0) {
        waitTimer.current -= dt;
      } else {
        const targetTile = WAYPOINTS_TILES[wpIdx.current];
        const targetWp = eldervilleWorldPos(targetTile[0], targetTile[1]);
        const dx = targetWp.x - pos.current.x;
        const dz = targetWp.z - pos.current.z;
        const dist = Math.hypot(dx, dz);

        if (dist < 0.3) {
          // reached waypoint, pause to look around
          waitTimer.current = 2.5 + Math.random() * 2.5;
          wpIdx.current = (wpIdx.current + 1) % WAYPOINTS_TILES.length;
        } else {
          moving = true;
          const speed = 1.6;
          pos.current.x += (dx / dist) * speed * dt;
          pos.current.z += (dz / dist) * speed * dt;
          const targetYaw = Math.atan2(dx, dz);
          let diff = targetYaw - yaw.current;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          yaw.current += diff * (1 - Math.exp(-dt * 9));
        }
      }
    }

    phase.current += dt * (moving ? 9 : 2);
    const gy = groundAtWorld(pos.current.x, pos.current.z);
    pos.current.y += (gy - pos.current.y) * (1 - Math.exp(-dt * 12));

    // write to rt so EldervillePlayer can read it for interaction/collision
    rt.tinslaire.pos.copy(pos.current);
    rt.tinslaire.yaw = yaw.current;
    rt.tinslaire.moving = moving;

    // animations
    const swing = moving ? Math.sin(phase.current) * 0.55 : 0;
    if (legL.current) legL.current.rotation.x = swing;
    if (legR.current) legR.current.rotation.x = -swing;
    if (armL.current) armL.current.rotation.x = -swing * 0.7;
    if (armR.current) armR.current.rotation.x = swing * 0.7;

    const bob = moving ? Math.abs(Math.sin(phase.current)) * 0.04 : Math.sin(phase.current * 0.8) * 0.01;
    if (g.current) {
      g.current.position.set(pos.current.x, pos.current.y + bob, pos.current.z);
      g.current.rotation.y = yaw.current;
    }
  });

  return (
    <group ref={g} position={[pos.current.x, pos.current.y, pos.current.z]}>
      {/* shadow */}
      <mesh position={[0, 0.02, 0]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[0.6, 0.6]} />
        <meshBasicMaterial color="#183010" transparent opacity={0.35} />
      </mesh>
      {/* legs */}
      <group ref={legL} position={[0.1, 0.28, 0]}>
        <mesh position={[0, -0.14, 0]} castShadow>
          <boxGeometry args={[0.15, 0.3, 0.15]} />
          <meshLambertMaterial color="#2f3d6b" />
        </mesh>
        <mesh position={[0, -0.3, 0.02]} castShadow>
          <boxGeometry args={[0.16, 0.08, 0.2]} />
          <meshLambertMaterial color="#33281f" />
        </mesh>
      </group>
      <group ref={legR} position={[-0.1, 0.28, 0]}>
        <mesh position={[0, -0.14, 0]} castShadow>
          <boxGeometry args={[0.15, 0.3, 0.15]} />
          <meshLambertMaterial color="#2f3d6b" />
        </mesh>
        <mesh position={[0, -0.3, 0.02]} castShadow>
          <boxGeometry args={[0.16, 0.08, 0.2]} />
          <meshLambertMaterial color="#33281f" />
        </mesh>
      </group>
      {/* robe/body */}
      <mesh position={[0, 0.52, 0]} castShadow>
        <boxGeometry args={[0.42, 0.44, 0.26]} />
        <meshLambertMaterial color="#4a90d9" />
      </mesh>
      {/* arms */}
      <group ref={armL} position={[0.26, 0.52, 0]}>
        <mesh position={[0, -0.12, 0]} castShadow>
          <boxGeometry args={[0.11, 0.26, 0.11]} />
          <meshLambertMaterial color="#3a78b9" />
        </mesh>
        <mesh position={[0, -0.26, 0]} castShadow>
          <boxGeometry args={[0.11, 0.09, 0.11]} />
          <meshLambertMaterial color="#f0c090" />
        </mesh>
      </group>
      <group ref={armR} position={[-0.26, 0.52, 0]}>
        <mesh position={[0, -0.12, 0]} castShadow>
          <boxGeometry args={[0.11, 0.26, 0.11]} />
          <meshLambertMaterial color="#3a78b9" />
        </mesh>
        <mesh position={[0, -0.26, 0]} castShadow>
          <boxGeometry args={[0.11, 0.09, 0.11]} />
          <meshLambertMaterial color="#f0c090" />
        </mesh>
      </group>
      {/* head */}
      <mesh position={[0, 0.88, 0]} castShadow>
        <boxGeometry args={[0.36, 0.34, 0.36]} />
        <meshLambertMaterial color="#f0c090" />
      </mesh>
      {/* hair */}
      <mesh position={[0, 1.06, 0]} castShadow>
        <boxGeometry args={[0.38, 0.1, 0.38]} />
        <meshLambertMaterial color="#503828" />
      </mesh>
      {/* eyes */}
      <mesh position={[0.08, 0.9, 0.19]}>
        <boxGeometry args={[0.05, 0.06, 0.02]} />
        <meshLambertMaterial color="#241a14" />
      </mesh>
      <mesh position={[-0.08, 0.9, 0.19]}>
        <boxGeometry args={[0.05, 0.06, 0.02]} />
        <meshLambertMaterial color="#241a14" />
      </mesh>
      {/* name tag */}
      <group position={[0, 1.35, 0]}>
        <mesh>
          <planeGeometry args={[0.95, 0.18]} />
          <meshBasicMaterial color="#203868" />
        </mesh>
        <mesh position={[0, 0, 0.01]}>
          <planeGeometry args={[0.91, 0.14]} />
          <meshBasicMaterial color="#f0e8c8" />
        </mesh>
      </group>
    </group>
  );
}

export function EldervilleNPCs() {
  const currentArea = useElder((s) => s.currentArea);
  const eldersAtDoorReady = useElder((s) => s.eldersAtDoorReady);
  const eldersDoorDialogDone = useElder((s) => s.eldersDoorDialogDone);
  // the clock ticks every few seconds of play, keeping the render-time night check fresh
  useUI((s) => s.clock);
  const isNight = rt.env.night > 0.45;

  // Inside home interior:
  if (currentArea === "home") {
    const offX = 72.5, offZ = 75;
    // 1. Before talking to door elders: Tinslaire is at (6, 5) waiting
    if (!eldersDoorDialogDone) {
      const pos = new THREE.Vector3(offX + 6 + 0.5, 2, offZ + 5 + 0.5);
      return <NpcMesh pos={pos} color="#4a90d9" name="Tinslaire" yaw={Math.PI} />;
    }
    // 2. After talking to door elders, at NIGHT: Tinslaire rests near his bed at (4, 4)
    if (eldersDoorDialogDone && isNight) {
      const pos = new THREE.Vector3(offX + 4 + 0.5, 2, offZ + 4 + 0.5);
      return <NpcMesh pos={pos} color="#4a90d9" name="Tinslaire" yaw={0} />;
    }
    // 3. After talking to door elders, during DAY: Tinslaire is NOT inside (0 inside)
    return null;
  }

  // Inside Farmer's Homestead (homesteadA) — Widow Oren
  if (currentArea === "homesteadA") {
    const offX = 72.5, offZ = 75;
    const pos = new THREE.Vector3(offX + 6 + 0.5, 2, offZ + 5 + 0.5);
    return <NpcMesh pos={pos} color="#a87860" name="Widow Oren" yaw={Math.PI} />;
  }

  // Other interiors: no Tinslaire
  if (currentArea !== "village") {
    return null;
  }

  // In village area:
  const isDoorVisible = eldersAtDoorReady && !eldersDoorDialogDone;

  return (
    <>
      {/* Door elders (priority before door dialog is done) */}
      {isDoorVisible &&
        eldersAtDoorPositions.map((e) => {
          const wp = eldervilleWorldPos(e.tx, e.ty);
          return <NpcMesh key={e.id} pos={new THREE.Vector3(wp.x, wp.y, wp.z)} color={e.color} name={e.name} isElder />;
        })}

      {/* Village Elders (Marcus, Sarah) */}
      {villageNPCsData
        .filter((npc) => npc.id !== "tinslaire")
        .map((npc) => {
          const wp = eldervilleWorldPos(npc.tx, npc.ty);
          const isElder = npc.id.includes("elder");
          return <NpcMesh key={npc.id} pos={new THREE.Vector3(wp.x, wp.y, wp.z)} color={npc.color} name={npc.name} isElder={isElder} />;
        })}

      {/* Tinslaire in village: only after door dialog is done AND during daytime */}
      {eldersDoorDialogDone && !isNight && <TinslaireVillage />}
    </>
  );
}
