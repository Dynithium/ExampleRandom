import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { houses, lamps, rocks, trees, SIZE } from "./world";
import { rt } from "./state";
import { fireflyMat, glowMat, windowMat } from "./mats";

const dummy = new THREE.Object3D();
const col = new THREE.Color();

const LEAF = ["#4fbf5a", "#3da34e", "#68cf63", "#2f8f52", "#8ac94f"];
const AUTUMN = ["#e0913a", "#d4633a", "#e8b74c"];
const TRUNK = ["#7a5233", "#6a4529", "#8a6440"];

/** Trees: trunk + 3 stacked leaf blocks, all instanced. */
export function Trees() {
  const trunkRef = useRef<THREE.InstancedMesh>(null!);
  const leafRef = useRef<THREE.InstancedMesh>(null!);

  useLayoutEffect(() => {
    trees.forEach((t, n) => {
      const h = 0.85 * t.s;
      dummy.position.set(t.x, t.y + h / 2, t.z);
      dummy.scale.set(0.26 * t.s, h, 0.26 * t.s);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      trunkRef.current.setMatrixAt(n, dummy.matrix);
      trunkRef.current.setColorAt(n, col.set(TRUNK[Math.floor(t.trunk * TRUNK.length) % TRUNK.length]));

      const pine = t.hue > 0.62;
      const base = t.hue > 0.9 ? AUTUMN : LEAF;
      const tint = base[Math.floor(t.hue * 97) % base.length];
      const layers: [number, number, number][] = pine
        ? [
            [1.15, 0.6, h + 0.24],
            [0.82, 0.55, h + 0.68],
            [0.46, 0.5, h + 1.04],
          ]
        : [
            [1.25, 0.72, h + 0.3],
            [1.0, 0.55, h + 0.82],
            [0.55, 0.4, h + 1.16],
          ];
      layers.forEach((l, k) => {
        const [w, hh, y] = l;
        dummy.position.set(t.x, t.y + y * t.s, t.z);
        dummy.scale.set(w * t.s, hh * t.s, w * t.s);
        dummy.updateMatrix();
        leafRef.current.setMatrixAt(n * 3 + k, dummy.matrix);
        col.set(tint).multiplyScalar(1 + k * 0.08);
        leafRef.current.setColorAt(n * 3 + k, col);
      });
    });
    trunkRef.current.instanceMatrix.needsUpdate = true;
    leafRef.current.instanceMatrix.needsUpdate = true;
    if (trunkRef.current.instanceColor) trunkRef.current.instanceColor.needsUpdate = true;
    if (leafRef.current.instanceColor) leafRef.current.instanceColor.needsUpdate = true;
  }, []);

  return (
    <>
      <instancedMesh ref={trunkRef} args={[undefined, undefined, Math.max(trees.length, 1)]} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshLambertMaterial />
      </instancedMesh>
      <instancedMesh ref={leafRef} args={[undefined, undefined, Math.max(trees.length * 3, 1)]} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshLambertMaterial />
      </instancedMesh>
    </>
  );
}

export function Rocks() {
  const ref = useRef<THREE.InstancedMesh>(null!);
  useLayoutEffect(() => {
    rocks.forEach((r, n) => {
      dummy.position.set(r.x, r.y + r.s * 0.35, r.z);
      dummy.scale.set(r.s, r.s * 0.7, r.s * 0.9);
      dummy.rotation.set(0, r.s * 9, 0);
      dummy.updateMatrix();
      ref.current.setMatrixAt(n, dummy.matrix);
      ref.current.setColorAt(n, col.set("#9aa4ae").multiplyScalar(0.85 + r.s * 0.3));
    });
    ref.current.instanceMatrix.needsUpdate = true;
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
  }, []);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, Math.max(rocks.length, 1)]} castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshLambertMaterial />
    </instancedMesh>
  );
}

function House({ h }: { h: (typeof houses)[number] }) {
  return (
    <group position={[h.x, h.y, h.z]} rotation-y={h.rot}>
      {/* stone footing */}
      <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 0.2, 2.2]} />
        <meshLambertMaterial color="#9c968a" />
      </mesh>
      {/* walls */}
      <mesh position={[0, 0.95, 0]} castShadow receiveShadow>
        <boxGeometry args={[2, 1.5, 2]} />
        <meshLambertMaterial color={h.wall} />
      </mesh>
      {/* stepped roof */}
      <mesh position={[0, 1.85, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.5, 0.32, 2.5]} />
        <meshLambertMaterial color={h.roof} />
      </mesh>
      <mesh position={[0, 2.15, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.75, 0.3, 1.75]} />
        <meshLambertMaterial color={h.roof} />
      </mesh>
      <mesh position={[0, 2.42, 0]} castShadow receiveShadow>
        <boxGeometry args={[1, 0.28, 1]} />
        <meshLambertMaterial color={h.roof} />
      </mesh>
      {/* chimney */}
      <mesh position={[0.66, 2.45, -0.66]} castShadow>
        <boxGeometry args={[0.32, 0.9, 0.32]} />
        <meshLambertMaterial color="#8d7f74" />
      </mesh>
      {/* door */}
      <mesh position={[0, 0.62, 1.02]} castShadow>
        <boxGeometry args={[0.55, 0.95, 0.08]} />
        <meshLambertMaterial color="#6d4426" />
      </mesh>
      {/* windows share one material so they can light up at night */}
      <mesh position={[-0.62, 1.2, 1.02]} material={windowMat}>
        <boxGeometry args={[0.42, 0.42, 0.08]} />
      </mesh>
      <mesh position={[0.62, 1.2, 1.02]} material={windowMat}>
        <boxGeometry args={[0.42, 0.42, 0.08]} />
      </mesh>
      <mesh position={[1.02, 1.2, 0]} rotation-y={Math.PI / 2} material={windowMat}>
        <boxGeometry args={[0.42, 0.42, 0.08]} />
      </mesh>
    </group>
  );
}

function Lamp({ l }: { l: (typeof lamps)[number] }) {
  const light = useRef<THREE.PointLight>(null!);
  useFrame(() => {
    const flicker = 0.9 + Math.sin(performance.now() * 0.008 + l.x) * 0.1;
    light.current.intensity = rt.env.night * 9 * flicker;
  });
  return (
    <group position={[l.x, l.y, l.z]}>
      <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.36, 0.2, 0.36]} />
        <meshLambertMaterial color="#6d6a63" />
      </mesh>
      <mesh position={[0, 1.05, 0]} castShadow>
        <boxGeometry args={[0.16, 1.8, 0.16]} />
        <meshLambertMaterial color="#4a4740" />
      </mesh>
      <mesh position={[0, 2.05, 0]} material={glowMat}>
        <boxGeometry args={[0.34, 0.36, 0.34]} />
      </mesh>
      <mesh position={[0, 2.3, 0]} castShadow>
        <boxGeometry args={[0.42, 0.14, 0.42]} />
        <meshLambertMaterial color="#4a4740" />
      </mesh>
      <pointLight ref={light} position={[0, 2.05, 0]} color="#ffc46b" distance={9} decay={1.4} intensity={0} />
    </group>
  );
}

/** Night-time fireflies drifting over the meadows. */
export function Fireflies() {
  const ref = useRef<THREE.InstancedMesh>(null!);
  const N = 80;
  const seeds = useMemo(
    () =>
      Array.from({ length: N }, (_, n) => ({
        x: (Math.sin(n * 12.9898) * 43758.5453) % 1,
        z: (Math.sin(n * 78.233) * 12345.6789) % 1,
        p: n * 0.7,
        s: 0.5 + ((n * 37) % 10) / 12,
      })),
    [],
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    fireflyMat.opacity = rt.env.night * 0.95;
    if (fireflyMat.opacity < 0.02) {
      ref.current.visible = false;
      return;
    }
    ref.current.visible = true;
    const px = rt.player.pos.x;
    const pz = rt.player.pos.z;
    seeds.forEach((s, n) => {
      const r = 4 + ((n * 7) % 12);
      const a = t * (0.18 + s.s * 0.12) + s.p;
      dummy.position.set(
        px + Math.cos(a) * r + s.x * 6,
        rt.player.pos.y + 0.8 + Math.sin(t * 1.7 + s.p) * 0.5 + (n % 5) * 0.2,
        pz + Math.sin(a * 1.3) * r + s.z * 6,
      );
      const blink = 0.6 + Math.sin(t * 6 + n) * 0.4;
      const sc = 0.09 * s.s * (0.6 + blink * 0.7);
      dummy.scale.setScalar(Math.max(sc, 0.02));
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      ref.current.setMatrixAt(n, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, N]} material={fireflyMat} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
    </instancedMesh>
  );
}

/** Simple boat bobbing on the water, just for scenery. */
export function Boat() {
  const ref = useRef<THREE.Group>(null!);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    ref.current.position.y = 1.28 + Math.sin(t * 1.1) * 0.06;
    ref.current.rotation.z = Math.sin(t * 0.9) * 0.05;
    ref.current.rotation.x = Math.cos(t * 0.7) * 0.04;
  });
  return (
    <group ref={ref} position={[SIZE / 2 - 3.5, 1.28, -2]} rotation-y={0.6}>
      <mesh castShadow>
        <boxGeometry args={[1.1, 0.35, 2.2]} />
        <meshLambertMaterial color="#8a5a34" />
      </mesh>
      <mesh position={[0, 0.28, 0]} castShadow>
        <boxGeometry args={[0.85, 0.22, 1.9]} />
        <meshLambertMaterial color="#5f3d23" />
      </mesh>
      <mesh position={[0, 1.05, -0.1]} castShadow>
        <boxGeometry args={[0.1, 1.4, 0.1]} />
        <meshLambertMaterial color="#3f2a18" />
      </mesh>
      <mesh position={[0.02, 1.1, 0.35]} castShadow>
        <boxGeometry args={[0.06, 0.95, 0.85]} />
        <meshLambertMaterial color="#e6e2d3" />
      </mesh>
    </group>
  );
}

export function Village() {
  return (
    <>
      {houses.map((h, n) => (
        <House key={n} h={h} />
      ))}
      {lamps.map((l, n) => (
        <Lamp key={n} l={l} />
      ))}
    </>
  );
}
