import * as THREE from "three";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { wells, forges, markets, watchtowers, gardens, eldervilleWorldPos, archeryTargets, CAVE_TILE } from "./world";
import { useElder } from "./eldervilleStory";

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
  const rig = useRef<(THREE.Group | null)[]>([]);
  const overlayRefs = useRef<(THREE.Mesh | null)[]>([]);
  const flash = useRef([0, 0, 0]);
  const prevHp = useRef([...dummiesHealth]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    dummiesHealth.forEach((hp, i) => {
      if (hp < prevHp.current[i]) flash.current[i] = 1;
      prevHp.current[i] = hp;
    });
    rig.current.forEach((g, i) => {
      if (!g) return;
      const f = flash.current[i];
      if (f > 0) {
        flash.current[i] = Math.max(0, f - dt * 2.6);
        g.rotation.z = Math.sin(f * 34) * 0.16 * f;
      } else {
        g.rotation.z = 0;
      }
      const overlay = overlayRefs.current[i];
      if (overlay) {
        (overlay.material as THREE.MeshBasicMaterial).opacity = flash.current[i] * 0.75;
      }
    });
  });

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
            {isAlive ? (
              /* Straw Body + head + hp bar, wobbles when struck */
              <group ref={(el) => { rig.current[idx] = el; }}>
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
                {/* hit flash overlay (opacity driven in useFrame) */}
                <mesh ref={(el) => { overlayRefs.current[idx] = el; }} position={[0, 0.85, 0]}>
                  <boxGeometry args={[0.44, 1.1, 0.34]} />
                  <meshBasicMaterial color="#ff5040" transparent opacity={0} toneMapped={false} />
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
              </group>
            ) : (
              /* fallen straw heap once defeated */
              <mesh position={[0, 0.12, 0.18]} rotation={[0.15, 0.4, Math.PI / 2 - 0.15]} castShadow>
                <boxGeometry args={[0.38, 0.5, 0.28]} />
                <meshLambertMaterial color="#b8a45e" />
              </mesh>
            )}
          </group>
        );
      })}
    </>
  );
}

// Wooden archery boards flanking the clearing (bow practice)
export function ArcheryBoards() {
  return (
    <>
      {archeryTargets.map((pos, i) => (
        <group key={i} position={[pos.x, pos.y, pos.z]}>
          <mesh position={[0, 0.9, 0]} castShadow>
            <boxGeometry args={[0.12, 1.8, 0.12]} />
            <meshLambertMaterial color="#684830" />
          </mesh>
          <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.9, 0.9, 0.12]} />
            <meshLambertMaterial color="#e0cb82" />
          </mesh>
          <mesh position={[0, 1.5, 0.08]}>
            <boxGeometry args={[0.55, 0.55, 0.03]} />
            <meshLambertMaterial color="#c04038" />
          </mesh>
          <mesh position={[0, 1.5, 0.1]}>
            <boxGeometry args={[0.25, 0.25, 0.03]} />
            <meshLambertMaterial color="#f0e8c8" />
          </mesh>
        </group>
      ))}
    </>
  );
}

// The Outskirts Cave — dark mouth in a rock mound at the end of the eastern gate road
export function OutskirtsCave() {
  const pos = eldervilleWorldPos(CAVE_TILE.tx, CAVE_TILE.ty);
  return (
    <group position={[pos.x, pos.y, pos.z]}>
      {/* rock mound (opening faces south, toward the road) */}
      <mesh position={[0, 1.2, -0.8]} castShadow receiveShadow>
        <boxGeometry args={[4.4, 2.8, 1.6]} />
        <meshLambertMaterial color="#6e6a5e" />
      </mesh>
      <mesh position={[-1.7, 1.9, -0.8]} castShadow>
        <boxGeometry args={[1.4, 4.2, 1.6]} />
        <meshLambertMaterial color="#7a766a" />
      </mesh>
      <mesh position={[1.7, 1.9, -0.8]} castShadow>
        <boxGeometry args={[1.4, 4.2, 1.6]} />
        <meshLambertMaterial color="#7a766a" />
      </mesh>
      <mesh position={[0, 2.5, -0.8]} castShadow>
        <boxGeometry args={[1.8, 1.6, 1.7]} />
        <meshLambertMaterial color="#65615a" />
      </mesh>
      {/* dark mouth */}
      <mesh position={[0, 0.85, 0.02]}>
        <boxGeometry args={[1.7, 1.7, 0.25]} />
        <meshBasicMaterial color="#05060c" />
      </mesh>
      {/* warning torches */}
      {[-1.4, 1.4].map((x) => (
        <group key={x} position={[x, 0, 0.7]}>
          <mesh position={[0, 0.55, 0]} castShadow>
            <boxGeometry args={[0.1, 1.1, 0.1]} />
            <meshLambertMaterial color="#684830" />
          </mesh>
          <mesh position={[0, 1.18, 0]}>
            <boxGeometry args={[0.18, 0.22, 0.18]} />
            <meshBasicMaterial color="#f89038" toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
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
      <ArcheryBoards />
      <GrainSackProp />
      <OutskirtsCave />
    </>
  );
}
