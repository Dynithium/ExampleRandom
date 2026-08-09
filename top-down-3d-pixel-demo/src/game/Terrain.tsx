import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import {
  SIZE,
  KIND,
  KIND_COLORS,
  heights,
  kinds,
  shade,
  idx,
  gx,
  topOf,
  WATER_LEVEL,
  WATER_Y,
  blocked,
} from "./world";

const dummy = new THREE.Object3D();
const color = new THREE.Color();
const waterTint = new THREE.Color("#2f7fa8");

export function Terrain() {
  const ref = useRef<THREE.InstancedMesh>(null!);
  const count = SIZE * SIZE;

  useLayoutEffect(() => {
    const mesh = ref.current;
    for (let j = 0; j < SIZE; j++) {
      for (let i = 0; i < SIZE; i++) {
        const n = idx(i, j);
        const level = heights[n];
        const top = topOf(level);
        const h = top + 3;
        dummy.position.set(gx(i), top - h / 2, gx(j));
        dummy.scale.set(1, h, 1);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        mesh.setMatrixAt(n, dummy.matrix);

        color.set(KIND_COLORS[kinds[n]] ?? "#79c257");
        color.multiplyScalar(shade[n]);
        if (level <= WATER_LEVEL) color.lerp(waterTint, 0.35 + (WATER_LEVEL - level) * 0.16);
        // fake AO: tiles sitting below a taller neighbour get a touch darker
        let tall = 0;
        if (i > 0 && heights[idx(i - 1, j)] > level) tall++;
        if (j > 0 && heights[idx(i, j - 1)] > level) tall++;
        if (i < SIZE - 1 && heights[idx(i + 1, j)] > level) tall++;
        if (j < SIZE - 1 && heights[idx(i, j + 1)] > level) tall++;
        if (tall) color.multiplyScalar(1 - tall * 0.045);
        mesh.setColorAt(n, color);
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, []);

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshLambertMaterial />
    </instancedMesh>
  );
}

/** Little grass tufts / flowers scattered on the meadows. */
export function Foliage() {
  const ref = useRef<THREE.InstancedMesh>(null!);
  const items = useMemo(() => {
    const out: { x: number; z: number; y: number; c: string; s: number }[] = [];
    const palette = ["#8fe06a", "#ffe066", "#ff8fb1", "#c7f5ff", "#6fd18a"];
    let seed = 1337;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
    for (let n = 0; n < 900; n++) {
      const i = Math.floor(rnd() * SIZE);
      const j = Math.floor(rnd() * SIZE);
      const t = idx(i, j);
      const k = kinds[t];
      if (blocked[t]) continue;
      if (k !== KIND.GRASS && k !== KIND.GRASS_DARK && k !== KIND.FOREST) continue;
      out.push({
        x: gx(i) + (rnd() - 0.5) * 0.7,
        z: gx(j) + (rnd() - 0.5) * 0.7,
        y: topOf(heights[t]),
        c: rnd() > 0.7 ? palette[1 + Math.floor(rnd() * 4)] : palette[0],
        s: 0.7 + rnd() * 0.6,
      });
      if (out.length > 320) break;
    }
    return out;
  }, []);

  useLayoutEffect(() => {
    const mesh = ref.current;
    items.forEach((it, n) => {
      dummy.position.set(it.x, it.y + 0.09 * it.s, it.z);
      dummy.scale.set(0.16 * it.s, 0.18 * it.s, 0.16 * it.s);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(n, dummy.matrix);
      mesh.setColorAt(n, color.set(it.c));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [items]);

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, Math.max(items.length, 1)]} castShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshLambertMaterial />
    </instancedMesh>
  );
}

/** Chunky animated pixel water. */
export function Water() {
  const ref = useRef<THREE.Mesh>(null!);
  const texture = useMemo(() => {
    const S = 16;
    const data = new Uint8Array(S * S * 4);
    const a = [46, 132, 176];
    const b = [72, 168, 205];
    const c = [122, 205, 226];
    for (let y = 0; y < S; y++) {
      for (let x = 0; x < S; x++) {
        const w = Math.sin(x * 0.9 + Math.sin(y * 0.6) * 1.6);
        const src = w > 1.15 ? c : w > 0.1 ? b : a;
        const n = (y * S + x) * 4;
        data[n] = src[0];
        data[n + 1] = src[1];
        data[n + 2] = src[2];
        data[n + 3] = 255;
      }
    }
    const tex = new THREE.DataTexture(data, S, S);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set((SIZE + 200) / 2, (SIZE + 200) / 2);
    tex.needsUpdate = true;
    return tex;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    texture.offset.set(Math.floor(t * 3) / 16, Math.floor(t * 1.7) / 16);
    ref.current.position.y = WATER_Y + Math.round(Math.sin(t * 1.4) * 2) * 0.012;
  });

  return (
    <>
      {/* opaque sea floor so the open ocean is not see-through */}
      <mesh rotation-x={-Math.PI / 2} position-y={-0.4}>
        <planeGeometry args={[SIZE + 200, SIZE + 200]} />
        <meshLambertMaterial color="#173d55" />
      </mesh>
      <mesh ref={ref} rotation-x={-Math.PI / 2} position-y={WATER_Y}>
        <planeGeometry args={[SIZE + 200, SIZE + 200]} />
        <meshLambertMaterial map={texture} transparent opacity={0.84} depthWrite={false} />
      </mesh>
    </>
  );
}
