import * as THREE from "three";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { eldervilleWorldPos, villageDoors } from "./world";
import { useElder, villageNPCsData, eldersAtDoorPositions } from "./eldervilleStory";

// Simple voxel NPC mesh
function NpcMesh({ pos, color, name, isElder }: { pos: THREE.Vector3; color: string; name: string; isElder?: boolean }) {
  const g = useRef<THREE.Group>(null!);
  return (
    <group ref={g} position={[pos.x, pos.y, pos.z]}>
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

export function EldervilleNPCs() {
  const currentArea = useElder((s) => s.currentArea);
  const eldersAtDoorReady = useElder((s) => s.eldersAtDoorReady);
  const eldersDoorDialogDone = useElder((s) => s.eldersDoorDialogDone);
  const tinslaireInsideTalked = useElder((s) => s.tinslaireInsideTalked);

  // Village area renders village NPCs
  if (currentArea !== "village") {
    // Interior TinslaireInside when inside home
    if (currentArea === "home" && !tinslaireInsideTalked) {
      // interior local (6,5) -> offset -W/2 etc. For rendering, place at world 0,0 offset
      // Interior room at 0,0 with offX=-7.5 offZ=-5, so tx=6 => x= -7.5+6.5 = -1, tz= -5+5.5=0.5
      // We'll use same offset as InteriorRoom: offX=-7.5 offZ=-5
      const offX = 42.5, offZ = 45;
      const pos = new THREE.Vector3(offX + 6 + 0.5, 2, offZ + 5 + 0.5);
      // lift y to floor
      pos.y = 2;
      return <NpcMesh pos={pos} color="#4a90d9" name="Tinslaire" />;
    }
    // Also if inside home but already talked, still render but he stays?
    if (currentArea === "home" && tinslaireInsideTalked) {
      const offX = 42.5, offZ = 45;
      const pos = new THREE.Vector3(offX + 6 + 0.5, 2, offZ + 5 + 0.5);
      pos.y = 2;
      return <NpcMesh pos={pos} color="#4a90d9" name="Tinslaire" />;
    }
    return null;
  }

  // Village NPCs
  const isDoorVisible = eldersAtDoorReady && !eldersDoorDialogDone;
  // Tinslaire village hidden until elders done
  const showVillageTinslaire = eldersDoorDialogDone;

  return (
    <>
      {/* Door elders (priority) */}
      {isDoorVisible &&
        eldersAtDoorPositions.map((e) => {
          const wp = eldervilleWorldPos(e.tx, e.ty);
          return <NpcMesh key={e.id} pos={new THREE.Vector3(wp.x, wp.y, wp.z)} color={e.color} name={e.name} isElder />;
        })}
      {/* Village NPCs */}
      {villageNPCsData.map((npc) => {
        if (npc.id === "tinslaire" && !showVillageTinslaire) return null;
        const wp = eldervilleWorldPos(npc.tx, npc.ty);
        const isElder = npc.id.includes("elder");
        return <NpcMesh key={npc.id} pos={new THREE.Vector3(wp.x, wp.y, wp.z)} color={npc.color} name={npc.name} isElder={isElder} />;
      })}
    </>
  );
}

// Export helpers for collision
export function getVillageNpcPositions(state: ReturnType<typeof useElder.getState>) {
  const out: { x: number; z: number }[] = [];
  const isDoorVisible = state.eldersAtDoorReady && !state.eldersDoorDialogDone;
  if (isDoorVisible) {
    eldersAtDoorPositions.forEach((e) => {
      const wp = eldervilleWorldPos(e.tx, e.ty);
      out.push({ x: wp.x, z: wp.z });
    });
  }
  villageNPCsData.forEach((npc) => {
    if (npc.id === "tinslaire" && !state.eldersDoorDialogDone) return;
    const wp = eldervilleWorldPos(npc.tx, npc.ty);
    out.push({ x: wp.x, z: wp.z });
  });
  return out;
}
