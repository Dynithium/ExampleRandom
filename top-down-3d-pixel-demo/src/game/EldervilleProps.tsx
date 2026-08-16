import * as THREE from "three";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { wells, forges, markets, watchtowers, gardens, eldervilleWorldPos } from "./world";
import { useElder } from "./eldervilleStory";

function elderX(tx: number) { return eldervilleWorldPos(tx, 0).x; }
function elderZ(ty: number) { return eldervilleWorldPos(0, ty).z; }

export function EldervilleWells() {
  return (
    <>
      {wells.map((w, i) => (
        <group key={i} position={[w.x, w.y, w.z]}>
          {/* base */}
          <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.9, 0.7, 0.9]} />
            <meshLambertMaterial color="#a0a8b0" />
          </mesh>
          <mesh position={[0, 0.7, 0]} castShadow>
            <boxGeometry args={[1.0, 0.08, 1.0]} />
            <meshLambertMaterial color="#c8d0d8" />
          </mesh>
          {/* hole */}
          <mesh position={[0, 0.36, 0]}>
            <boxGeometry args={[0.5, 0.1, 0.5]} />
            <meshLambertMaterial color="#185888" />
          </mesh>
          {/* posts + roof */}
          <mesh position={[-0.35, 0.85, 0]} castShadow>
            <boxGeometry args={[0.08, 0.9, 0.08]} />
            <meshLambertMaterial color="#684830" />
          </mesh>
          <mesh position={[0.35, 0.85, 0]} castShadow>
            <boxGeometry args={[0.08, 0.9, 0.08]} />
            <meshLambertMaterial color="#684830" />
          </mesh>
          <mesh position={[0, 1.25, 0]} castShadow>
            <boxGeometry args={[1.1, 0.12, 0.7]} />
            <meshLambertMaterial color="#c04038" />
          </mesh>
        </group>
      ))}
    </>
  );
}

export function EldervilleForges() {
  return (
    <>
      {forges.map((f, i) => (
        <group key={i} position={[f.x, f.y, f.z]}>
          <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.4, 0.7, 1.0]} />
            <meshLambertMaterial color="#a0a8b0" />
          </mesh>
          {/* fire mouth */}
          <mesh position={[0, 0.35, 0.45]} castShadow>
            <boxGeometry args={[0.6, 0.35, 0.1]} />
            <meshLambertMaterial color="#f87828" emissive="#f87828" emissiveIntensity={0.8} />
          </mesh>
          {/* chimney */}
          <mesh position={[0.5, 1.0, -0.2]} castShadow>
            <boxGeometry args={[0.3, 1.2, 0.3]} />
            <meshLambertMaterial color="#687078" />
          </mesh>
          {/* anvil */}
          <mesh position={[-0.4, 0.18, 0.3]} castShadow>
            <boxGeometry args={[0.4, 0.18, 0.25]} />
            <meshLambertMaterial color="#c8d0d8" />
          </mesh>
        </group>
      ))}
    </>
  );
}

export function EldervilleMarkets() {
  return (
    <>
      {markets.map((m, i) => (
        <group key={i} position={[m.x, m.y, m.z]}>
          <mesh position={[0, 0.6, 0]} castShadow>
            <boxGeometry args={[0.1, 1.2, 0.1]} />
            <meshLambertMaterial color="#684830" />
          </mesh>
          <mesh position={[0.8, 0.6, 0]} castShadow>
            <boxGeometry args={[0.1, 1.2, 0.1]} />
            <meshLambertMaterial color="#684830" />
          </mesh>
          <mesh position={[0.4, 1.2, 0]} castShadow>
            <boxGeometry args={[1.5, 0.15, 0.8]} />
            <meshLambertMaterial color="#c04038" />
          </mesh>
          <mesh position={[0.4, 1.2, 0.25]}>
            <boxGeometry args={[1.3, 0.05, 0.1]} />
            <meshLambertMaterial color="white" />
          </mesh>
          <mesh position={[0.4, 0.4, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.4, 0.45, 0.6]} />
            <meshLambertMaterial color="#906848" />
          </mesh>
        </group>
      ))}
    </>
  );
}

export function EldervilleWatchtowers() {
  return (
    <>
      {watchtowers.map((w, i) => (
        <group key={i} position={[w.x, w.y, w.z]}>
          <mesh position={[0, 0.9, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.9, 1.8, 0.9]} />
            <meshLambertMaterial color="#d0b078" />
          </mesh>
          <mesh position={[0, 1.0, 0.45]}>
            <boxGeometry args={[0.2, 0.3, 0.05]} />
            <meshLambertMaterial color="#f8e060" />
          </mesh>
          <mesh position={[0, 1.9, 0]} castShadow>
            <boxGeometry args={[1.0, 0.12, 1.0]} />
            <meshLambertMaterial color="#684830" />
          </mesh>
          <mesh position={[0, 2.1, 0]} castShadow>
            <boxGeometry args={[0.8, 0.4, 0.8]} />
            <meshLambertMaterial color="#906848" />
          </mesh>
        </group>
      ))}
    </>
  );
}

export function EldervilleGardens() {
  return (
    <>
      {gardens.map((g, i) => (
        <group key={i} position={[g.x, g.y + 0.06, g.z]}>
          <mesh castShadow>
            <boxGeometry args={[0.22, 0.22, 0.22]} />
            <meshLambertMaterial color="#48a028" />
          </mesh>
          <mesh position={[0, 0.14, 0]}>
            <boxGeometry args={[0.12, 0.12, 0.12]} />
            <meshLambertMaterial color="#68c040" />
          </mesh>
        </group>
      ))}
    </>
  );
}

// Training Clearing Dummies behind Blue House at [34, 3], [36, 3], [38, 3]
export function TrainingDummies() {
  const dummiesHealth = useElder((s) => s.dummiesHealth);
  const coords = [
    eldervilleWorldPos(34, 3),
    eldervilleWorldPos(36, 3),
    eldervilleWorldPos(38, 3),
  ];

  return (
    <>
      {coords.map((pos, idx) => {
        const hp = dummiesHealth[idx];
        const isAlive = hp > 0;
        return (
          <group key={idx} position={[pos.x, pos.y, pos.z]}>
            {/* Wooden Base Post */}
            <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
              <boxGeometry args={[0.12, 1.0, 0.12]} />
              <meshLambertMaterial color="#684830" />
            </mesh>
            {/* Cross Arms */}
            <mesh position={[0, 0.75, 0]} castShadow>
              <boxGeometry args={[0.7, 0.1, 0.1]} />
              <meshLambertMaterial color="#684830" />
            </mesh>
            {/* Straw Body */}
            {isAlive && (
              <>
                <mesh position={[0, 0.7, 0]} castShadow>
                  <boxGeometry args={[0.38, 0.55, 0.25]} />
                  <meshLambertMaterial color="#d4be72" />
                </mesh>
                {/* Target Patch */}
                <mesh position={[0, 0.7, 0.13]}>
                  <boxGeometry args={[0.2, 0.2, 0.02]} />
                  <meshLambertMaterial color="#c04038" />
                </mesh>
                {/* Straw Head */}
                <mesh position={[0, 1.1, 0]} castShadow>
                  <boxGeometry args={[0.28, 0.28, 0.28]} />
                  <meshLambertMaterial color="#e0cb82" />
                </mesh>
                {/* Mini Health Bar */}
                <group position={[0, 1.4, 0]}>
                  <mesh position={[0, 0, 0]}>
                    <planeGeometry args={[0.6, 0.08]} />
                    <meshBasicMaterial color="#181818" />
                  </mesh>
                  <mesh position={[-0.3 + (hp / 60) * 0.3, 0, 0.01]}>
                    <planeGeometry args={[(hp / 60) * 0.58, 0.06]} />
                    <meshBasicMaterial color="#48a028" />
                  </mesh>
                </group>
              </>
            )}
          </group>
        );
      })}
    </>
  );
}

// Grain sack on the crop terrace at [30, 36] for Trial 3
export function GrainSackProp() {
  const widowTrialState = useElder((s) => s.widowTrialState);
  const carryingGrain = useElder((s) => s.carryingGrain);
  if (carryingGrain || widowTrialState === "delivered" || widowTrialState === "completed") return null;

  const pos = eldervilleWorldPos(30, 36);
  return (
    <group position={[pos.x, pos.y + 0.15, pos.z]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.55, 0.35, 0.45]} />
        <meshLambertMaterial color="#e8c878" />
      </mesh>
      <mesh position={[0, 0.18, 0]}>
        <boxGeometry args={[0.25, 0.1, 0.25]} />
        <meshLambertMaterial color="#d4b462" />
      </mesh>
    </group>
  );
}

export function EldervilleProps() {
  return (
    <>
      <EldervilleWells />
      <EldervilleForges />
      <EldervilleMarkets />
      <EldervilleWatchtowers />
      <EldervilleGardens />
      <TrainingDummies />
      <GrainSackProp />
    </>
  );
}
