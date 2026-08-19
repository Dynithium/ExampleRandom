import * as THREE from "three";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { eldervilleWorldPos, eldervilleTileAt, groundAtWorld, INT_OFF_X, INT_OFF_Z } from "./world";
import { findPath } from "./pathfinding";
import {
  useElder,
  villageNPCsData,
  eldersAtDoorPositions,
} from "./eldervilleStory";
import { rt, useUI } from "./state";
import { isActive } from "./quests";

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
  const followPath = useRef<{ tx: number; ty: number }[] | null>(null);
  const lastGoal = useRef({ tx: -1, ty: -1 });
  const repathTimer = useRef(0);
  const phase = useRef(0);
  const pos = useRef(new THREE.Vector3(eldervilleWorldPos(12, 13).x, 2, eldervilleWorldPos(12, 13).z));
  const yaw = useRef(0);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const elder = useElder.getState();
    const isNight = rt.env.night > 0.45;
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
    } else if (elder.marketTrialState === "overpaid") {
      // Trial 4: Tinslaire tags along while the extra silver is in your pouch,
      // so the temptation beat can't be missed by him wandering off on his
      // waypoint loop. He trails a couple of paces behind rather than standing
      // on top of you (the player has collision against him).
      //
      // This follows a real BFS path rather than steering straight at the
      // player: the market stalls at (15,40)/(16,40) sit directly between him
      // and the trader during this exact trial, and naive steering grinds into
      // their side instead of walking around.
      const px = rt.player.pos.x, pz = rt.player.pos.z;
      const goalDist = Math.hypot(px - pos.current.x, pz - pos.current.z);

      if (goalDist > 1.9) {
        // Recompute the route a few times a second, and whenever the player has
        // moved a tile away from what we last pathed to. BFS on a 72x48 grid is
        // cheap, but not something to run every frame for a background NPC.
        repathTimer.current -= dt;
        const { tx: goalTx, ty: goalTy } = eldervilleTileAt(px, pz);
        const stale =
          !followPath.current ||
          goalTx !== lastGoal.current.tx ||
          goalTy !== lastGoal.current.ty;
        if (repathTimer.current <= 0 || stale) {
          repathTimer.current = 0.35;
          lastGoal.current = { tx: goalTx, ty: goalTy };
          const { tx: fromTx, ty: fromTy } = eldervilleTileAt(pos.current.x, pos.current.z);
          const path = findPath("village", { tx: fromTx, ty: fromTy }, { tx: goalTx, ty: goalTy });
          // Drop the first node: it's the tile he is already standing on.
          followPath.current = path && path.length > 1 ? path.slice(1) : null;
        }

        const step = followPath.current?.[0];
        if (step) {
          const wp = eldervilleWorldPos(step.tx, step.ty);
          const sdx = wp.x - pos.current.x;
          const sdz = wp.z - pos.current.z;
          const sdist = Math.hypot(sdx, sdz);
          if (sdist < 0.25) {
            followPath.current!.shift();
          } else {
            moving = true;
            const speed = 2.2; // a touch faster than the player's walk so he keeps up
            pos.current.x += (sdx / sdist) * speed * dt;
            pos.current.z += (sdz / sdist) * speed * dt;
          }
        }
      } else {
        followPath.current = null;
      }

      // Always face the player, whether closing the gap or waiting beside you.
      const targetYaw = Math.atan2(px - pos.current.x, pz - pos.current.z);
      let diff = targetYaw - yaw.current;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      yaw.current += diff * (1 - Math.exp(-dt * 9));
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
  // Thorn relocates for the muster ONLY once trial 9 is actually the live one.
  // Keying off musterTrialState alone would be wrong: it reads "not_started"
  // from the first frame of the game, which would have parked him in the plaza
  // during trials 3 and 5 where he is also the giver.
  // Select the derived boolean, not the whole store: subscribing to `s` itself
  // re-rendered every NPC in the village on any store write at all (dialog
  // open/close, each brazier, every point of scrap damage).
  const musterActive = useElder((s) => isActive(s, "muster"));
  const eldersAtDoorReady = useElder((s) => s.eldersAtDoorReady);
  const eldersDoorDialogDone = useElder((s) => s.eldersDoorDialogDone);
  // the clock ticks every few seconds of play, keeping the render-time night check fresh
  useUI((s) => s.clock);
  const isNight = rt.env.night > 0.45;

  // Inside home interior:
  if (currentArea === "home") {
    const offX = INT_OFF_X, offZ = INT_OFF_Z;
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

  // Inside Farmer's Homestead (homesteadA) — Widow Oren.
  // She stands at (6,6), the open floor in front of her table; (6,5) is the table itself.
  if (currentArea === "homesteadA") {
    const offX = INT_OFF_X, offZ = INT_OFF_Z;
    const pos = new THREE.Vector3(offX + 6 + 0.5, 2, offZ + 6 + 0.5);
    return <NpcMesh pos={pos} color="#a87860" name="Widow Oren" yaw={Math.PI} />;
  }

  // Inside the Orchard Keeper's hut — the giver of Trial 7.
  if (currentArea === "orchardHut") {
    const offX = INT_OFF_X, offZ = INT_OFF_Z;
    const pos = new THREE.Vector3(offX + 6 + 0.5, 2, offZ + 6 + 0.5);
    return <NpcMesh pos={pos} color="#7a8a50" name="Orchard Keeper" yaw={Math.PI} />;
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

      {/* Village elders. Thorn walks to Founders' Plaza to run the muster
          (Trial 9) and stays there for it — the drill is staged in the plaza,
          so leaving him on the homestead path would make the objective marker
          point at an empty square. */}
      {villageNPCsData
        .filter((npc) => npc.id !== "tinslaire")
        .map((npc) => {
          const atMuster = npc.id === "elderThorn" && musterActive;
          const wp = atMuster ? eldervilleWorldPos(44, 12) : eldervilleWorldPos(npc.tx, npc.ty);
          const isElder = npc.id.includes("elder");
          return <NpcMesh key={npc.id} pos={new THREE.Vector3(wp.x, wp.y, wp.z)} color={npc.color} name={npc.name} isElder={isElder} />;
        })}

      {/* Tinslaire in village: only after door dialog is done AND during daytime */}
      {eldersDoorDialogDone && !isNight && <TinslaireVillage />}
    </>
  );
}
