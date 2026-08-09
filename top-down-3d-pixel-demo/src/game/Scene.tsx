import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { Foliage, Terrain, Water } from "./Terrain";
import { Boat, Coins, Fireflies, Rocks, Trees, Village } from "./Props";
import { Player } from "./Player";
import { Villagers } from "./NPCs";
import { rt, useUI } from "./state";
import { fireflyMat, glowMat, starMat, windowMat } from "./mats";
import { SIZE } from "./world";

const DAY_SKY = new THREE.Color("#8fd6f2");
const DUSK_SKY = new THREE.Color("#f09a5c");
const NIGHT_SKY = new THREE.Color("#0c1230");
const DAY_SUN = new THREE.Color("#fff5da");
const DUSK_SUN = new THREE.Color("#ff9950");
const MOON_COL = new THREE.Color("#93a9ff");
const GLOW_OFF = new THREE.Color("#3a3524");
const GLOW_ON = new THREE.Color("#ffdc93");
const WHITE = new THREE.Color("#ffffff");

const smoothstep = (a: number, b: number, x: number) => {
  const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

const dummy = new THREE.Object3D();
const tmp = new THREE.Color();

function Environment() {
  const { scene } = useThree();
  const sun = useRef<THREE.DirectionalLight>(null!);
  const hemi = useRef<THREE.HemisphereLight>(null!);
  const sunDisc = useRef<THREE.Mesh>(null!);
  const moonDisc = useRef<THREE.Mesh>(null!);
  const target = useMemo(() => new THREE.Object3D(), []);
  const bg = useMemo(() => new THREE.Color("#8fd6f2"), []);
  const fog = useMemo(() => new THREE.Fog(bg, 58, 155), [bg]);
  const clockAcc = useRef(0);

  useEffect(() => {
    scene.background = bg;
    scene.fog = fog;
    return () => {
      scene.fog = null;
      scene.background = null;
    };
  }, [scene, bg, fog]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const ui = useUI.getState();
    if (!ui.paused) rt.env.time = (rt.env.time + dt * 0.0085 * ui.daySpeed) % 1;

    const t = rt.env.time;
    const ang = (t - 0.25) * Math.PI * 2;
    const elev = Math.sin(ang);
    const dayF = smoothstep(-0.06, 0.26, elev);
    const dusk = THREE.MathUtils.clamp(1 - Math.abs(elev) / 0.3, 0, 1);
    rt.env.night = 1 - dayF;

    // sun / moon direction
    rt.env.sun.set(Math.cos(ang), elev, 0.42).normalize();
    const dir = rt.env.sun;
    const up = elev > 0;
    const lx = (up ? dir.x : -dir.x) * 34;
    const ly = Math.abs(dir.y) * 34 + 8;
    const lz = (up ? dir.z : -dir.z) * 34;

    const p = rt.player.pos;
    sun.current.position.set(p.x + lx, p.y + ly, p.z + lz);
    target.position.copy(p);
    target.updateMatrixWorld();
    sun.current.intensity = 2.7 * dayF + 0.5 * (1 - dayF);
    // keep the shadow frustum matching whatever the camera can currently see
    const half = THREE.MathUtils.clamp(880 / rt.cam.zoom, 18, 52);
    const sc = sun.current.shadow.camera;
    if (Math.abs(sc.right - half) > 0.75) {
      sc.left = -half;
      sc.right = half;
      sc.top = half;
      sc.bottom = -half;
      sc.updateProjectionMatrix();
    }
    tmp.copy(DAY_SUN).lerp(DUSK_SUN, dusk);
    sun.current.color.copy(tmp).lerp(MOON_COL, 1 - dayF);

    // sky + fog
    bg.copy(NIGHT_SKY).lerp(DAY_SKY, dayF);
    bg.lerp(DUSK_SKY, dusk * 0.55);
    fog.color.copy(bg);
    rt.env.sky.copy(bg);

    hemi.current.intensity = 0.5 + dayF * 0.85;
    hemi.current.color.copy(bg).lerp(WHITE, 0.25);

    // props that react to darkness
    windowMat.emissiveIntensity = Math.pow(rt.env.night, 0.7);
    glowMat.color.copy(GLOW_OFF).lerp(GLOW_ON, rt.env.night);
    starMat.opacity = Math.max(0, rt.env.night * 0.95 - dusk * 0.4);
    fireflyMat.needsUpdate = false;

    // celestial bodies drift with the player so they never leave the view
    sunDisc.current.position.set(p.x + dir.x * 78, p.y + dir.y * 78 + 6, p.z + dir.z * 78);
    sunDisc.current.visible = elev > -0.15;
    moonDisc.current.position.set(p.x - dir.x * 78, p.y - dir.y * 78 + 6, p.z - dir.z * 78);
    moonDisc.current.visible = elev < 0.15;


    // HUD clock (rounded so React doesn't rerender every frame)
    clockAcc.current += dt;
    if (clockAcc.current > 0.25) {
      clockAcc.current = 0;
      const mins = Math.floor(t * 24 * 60);
      const hh = Math.floor(mins / 60);
      const mm = Math.floor((mins % 60) / 10) * 10;
      ui.setClock(`${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`);
    }
  }, -2);

  return (
    <>
      <hemisphereLight ref={hemi} args={["#bfe6ff", "#4a5a33", 1]} />
      <ambientLight intensity={0.18} />
      <directionalLight
        ref={sun}
        castShadow
        intensity={2.5}
        target={target}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1}
        shadow-camera-far={90}
        shadow-camera-left={-22}
        shadow-camera-right={22}
        shadow-camera-top={22}
        shadow-camera-bottom={-22}
        shadow-bias={-0.0006}
        shadow-normalBias={0.03}
      />
      <primitive object={target} />
      <mesh ref={sunDisc}>
        <boxGeometry args={[4, 4, 4]} />
        <meshBasicMaterial color="#fff2b0" toneMapped={false} fog={false} />
      </mesh>
      <mesh ref={moonDisc} rotation={[0.4, 0.4, 0]}>
        <boxGeometry args={[3, 3, 3]} />
        <meshBasicMaterial color="#e8eeff" toneMapped={false} fog={false} />
      </mesh>
      <Stars />
    </>
  );
}

function Stars() {
  const ref = useRef<THREE.Group>(null!);
  const mesh = useRef<THREE.InstancedMesh>(null!);
  useFrame(() => {
    const p = rt.player.pos;
    ref.current.position.set(p.x, 0, p.z);
    ref.current.visible = starMat.opacity > 0.02;
  });
  const N = 160;
  useLayoutEffect(() => {
    let seed = 99;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
    for (let n = 0; n < N; n++) {
      const a = rnd() * Math.PI * 2;
      const y = 0.18 + rnd() * 0.8;
      const r = Math.sqrt(1 - y * y);
      const R = 120;
      dummy.position.set(Math.cos(a) * r * R, y * R + 10, Math.sin(a) * r * R);
      dummy.scale.setScalar(0.5 + rnd() * 1.3);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(n, dummy.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
  }, []);
  return (
    <group ref={ref}>
      <instancedMesh ref={mesh} args={[undefined, undefined, N]} material={starMat} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
      </instancedMesh>
    </group>
  );
}

/** Slow drifting voxel clouds high above the island. */
function Clouds() {
  const ref = useRef<THREE.InstancedMesh>(null!);
  const blobs = useMemo(() => {
    let seed = 7;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
    const out: { x: number; y: number; z: number; sx: number; sy: number; sz: number }[] = [];
    for (let c = 0; c < 9; c++) {
      const cxp = (rnd() - 0.5) * (SIZE + 30);
      const cz = (rnd() - 0.5) * (SIZE + 30);
      const cy = 15 + rnd() * 7;
      const parts = 4 + Math.floor(rnd() * 4);
      for (let n = 0; n < parts; n++) {
        out.push({
          x: cxp + (rnd() - 0.5) * 7,
          y: cy + (rnd() - 0.5) * 1.2,
          z: cz + (rnd() - 0.5) * 5,
          sx: 3 + rnd() * 4,
          sy: 1 + rnd() * 1.2,
          sz: 2.5 + rnd() * 3,
        });
      }
    }
    return out;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const drift = (t * 0.35) % (SIZE + 60);
    blobs.forEach((b, n) => {
      let x = b.x + drift;
      const span = SIZE + 60;
      if (x > span / 2) x -= span;
      dummy.position.set(x, b.y, b.z);
      dummy.scale.set(b.sx, b.sy, b.sz);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      ref.current.setMatrixAt(n, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
    const m = ref.current.material as THREE.MeshLambertMaterial;
    m.opacity = 0.55 + (1 - rt.env.night) * 0.4;
    m.color.copy(rt.env.sky).lerp(WHITE, 0.55 + (1 - rt.env.night) * 0.35);
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, blobs.length]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshLambertMaterial transparent opacity={0.9} />
    </instancedMesh>
  );
}

export function Scene() {
  return (
    <>
      <Environment />
      <Clouds />
      <Terrain />
      <Foliage />
      <Water />
      <Trees />
      <Rocks />
      <Village />
      <Villagers />
      <Coins />
      <Boat />
      <Fireflies />
      <Player />
    </>
  );
}
