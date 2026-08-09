import * as THREE from "three";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { wells, forges, markets, watchtowers, gardens, eldervilleWorldPos } from "./world";

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
  const ref = useRef<THREE.Group>(null!);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const flicker = Math.floor(t * 8) % 2 === 0;
    // find fire meshes and toggle emissive? simple: opacity flicker via scale
  });
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

export function EldervilleEastGate() {
  return (
    <group>
      <group position={[elderX(44), 0, elderZ(8)]}>
        <mesh position={[0, 1.0, 0]} castShadow>
          <boxGeometry args={[0.18, 2.0, 0.18]} />
          <meshLambertMaterial color="#684830" />
        </mesh>
      </group>
      <group position={[elderX(44), 0, elderZ(9)]}>
        <mesh position={[0, 1.0, 0]} castShadow>
          <boxGeometry args={[0.18, 2.0, 0.18]} />
          <meshLambertMaterial color="#684830" />
        </mesh>
      </group>
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
    </>
  );
}
