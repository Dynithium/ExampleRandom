import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { rt } from "./state";
import { useElder, caveBossAwakeDialog } from "./eldervilleStory";
import { caveMap, caveSolidAt, CAVE_LANDMARKS, INT_OFF_X as OFF_X, INT_OFF_Z as OFF_Z, INT_Y } from "./world";
import { sfx } from "./audio";
const CAVE_BG = new THREE.Color("#04050a");

const tileW = (tx: number, ty: number) => ({ x: OFF_X + tx + 0.5, z: OFF_Z + ty + 0.5 });
const hash = (x: number, y: number) => {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
};

/** Darkness: near-black sky + short fog so the torch reveals the cave progressively. */
function CaveEnvironment() {
  const { scene } = useThree();
  const bg = useMemo(() => CAVE_BG.clone(), []);
  const fog = useMemo(() => new THREE.Fog(CAVE_BG, 4.5, 24), []);
  useEffect(() => {
    scene.background = bg;
    scene.fog = fog;
    return () => {
      scene.fog = null;
      scene.background = null;
    };
  }, [scene, bg, fog]);
  return (
    <>
      <ambientLight intensity={0.16} color="#40507a" />
      <hemisphereLight args={["#2a3858", "#0a0c14", 0.25]} />
    </>
  );
}

/** The player's torch — a flickering point light carried ahead of them. */
function PlayerTorch() {
  const light = useRef<THREE.PointLight>(null!);
  const flame = useRef<THREE.Group>(null!);
  const t = useRef(0);
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    t.current += dt;
    const p = rt.player.pos;
    const fx = Math.sin(rt.player.yaw) * 0.5;
    const fz = Math.cos(rt.player.yaw) * 0.5;
    if (light.current) {
      light.current.position.set(p.x + fx * 0.6, p.y + 1.05, p.z + fz * 0.6);
      light.current.intensity = 2.5 + Math.sin(t.current * 11) * 0.3 + Math.sin(t.current * 27) * 0.18;
    }
    if (flame.current) {
      flame.current.position.set(p.x + fx, p.y + 0.95, p.z + fz);
      const s = 1 + Math.sin(t.current * 13) * 0.15;
      flame.current.scale.set(s, 1 + Math.sin(t.current * 17) * 0.2, s);
    }
  });
  return (
    <>
      <pointLight ref={light} color="#ff9a3c" intensity={2.5} distance={11} decay={1.4} />
      <group ref={flame}>
        <mesh>
          <boxGeometry args={[0.12, 0.2, 0.12]} />
          <meshBasicMaterial color="#ff9038" toneMapped={false} />
        </mesh>
        <mesh position={[0, 0.08, 0]}>
          <boxGeometry args={[0.07, 0.12, 0.07]} />
          <meshBasicMaterial color="#ffe9a0" toneMapped={false} />
        </mesh>
      </group>
    </>
  );
}

/** Static cavern geometry from the tile map. */
function CaveRoom() {
  const W = caveMap[0].length;
  const H = caveMap.length;
  const floorTiles: { x: number; z: number; shade: number }[] = [];
  const walls: { x: number; z: number; h: number }[] = [];
  const stalagmites: { x: number; z: number; s: number }[] = [];
  const rubble: { x: number; z: number; s: number; r: number }[] = [];
  const moss: { x: number; z: number }[] = [];
  const mats: { x: number; z: number }[] = [];

  for (let ty = 0; ty < H; ty++) {
    for (let tx = 0; tx < W; tx++) {
      const t = caveMap[ty][tx];
      const { x, z } = tileW(tx, ty);
      const r1 = hash(tx, ty);
      if (t === 0 || t === 3 || t === 4 || t === 16) {
        floorTiles.push({ x, z, shade: 0.85 + r1 * 0.3 });
      }
      if (t === 1) walls.push({ x, z, h: 2.6 + r1 * 0.5 });
      if (t === 2) stalagmites.push({ x, z, s: 0.9 + r1 * 0.6 });
      if (t === 3) rubble.push({ x: x + (r1 - 0.5) * 0.3, z: z + (hash(ty, tx) - 0.5) * 0.3, s: 0.1 + r1 * 0.14, r: r1 });
      if (t === 4) moss.push({ x, z });
      if (t === 16) mats.push({ x, z });
    }
  }

  return (
    <group position={[0, INT_Y, 0]}>
      {/* floor slab */}
      <mesh position={[OFF_X + W / 2, -0.05, OFF_Z + H / 2]} receiveShadow>
        <boxGeometry args={[W, 0.1, H]} />
        <meshLambertMaterial color="#232833" />
      </mesh>
      {/* floor tiles with slight shade variation */}
      {floorTiles.map((f, i) => (
        <mesh key={i} position={[f.x, 0.005, f.z]}>
          <boxGeometry args={[0.98, 0.02, 0.98]} />
          <meshLambertMaterial color={new THREE.Color("#2a3140").multiplyScalar(f.shade)} />
        </mesh>
      ))}
      {/* rock walls */}
      {walls.map((w, i) => (
        <group key={i} position={[w.x, 0, w.z]}>
          <mesh position={[0, w.h / 2, 0]}>
            <boxGeometry args={[1, w.h, 1]} />
            <meshLambertMaterial color="#1c2029" />
          </mesh>
          <mesh position={[0, w.h + 0.06, 0]}>
            <boxGeometry args={[1.04, 0.12, 1.04]} />
            <meshLambertMaterial color="#141821" />
          </mesh>
        </group>
      ))}
      {/* stalagmites */}
      {stalagmites.map((s, i) => (
        <mesh key={i} position={[s.x, s.s / 2, s.z]} rotation={[0, hash(i, 7) * Math.PI, 0]}>
          <coneGeometry args={[0.44, s.s, 5]} />
          <meshLambertMaterial color="#252b36" />
        </mesh>
      ))}
      {/* rubble */
      rubble.map((r, i) => (
        <mesh key={i} position={[r.x, r.s / 2, r.z]} rotation={[r.r, r.r * 2, 0]}>
          <boxGeometry args={[r.s * 2, r.s, r.s * 1.6]} />
          <meshLambertMaterial color="#323a48" />
        </mesh>
      ))}
      {/* glow-moss — unlit teal flecks that light the way */}
      {moss.map((m, i) => (
        <group key={i} position={[m.x, 0.07, m.z]}>
          <mesh>
            <boxGeometry args={[0.16, 0.05, 0.16]} />
            <meshBasicMaterial color="#2fd8c8" toneMapped={false} />
          </mesh>
          <mesh position={[0.18, 0.04, 0.1]}>
            <boxGeometry args={[0.09, 0.04, 0.09]} />
            <meshBasicMaterial color="#1f9a90" toneMapped={false} />
          </mesh>
        </group>
      ))}
      {/* exit mat at the cave mouth */}
      {mats.map((m, i) => (
        <mesh key={i} position={[m.x, 0.02, m.z]}>
          <boxGeometry args={[0.95, 0.04, 0.95]} />
          <meshLambertMaterial color="#5a4632" />
        </mesh>
      ))}
    </group>
  );
}

/** The rusted first machine. Dormant until you come too close — then it hunts. */
function CaveMachine() {
  const caveStage = useElder((s) => s.caveStage);
  const bossHp = useElder((s) => s.bossHp);

  const g = useRef<THREE.Group>(null!);
  const eyeBig = useRef<THREE.Mesh>(null!);
  const eyeSmall = useRef<THREE.Mesh>(null!);
  const eyeGlow = useRef<THREE.Mesh>(null!);
  const flashOverlay = useRef<THREE.Mesh>(null!);
  const legL = useRef<THREE.Mesh>(null!);
  const legR = useRef<THREE.Mesh>(null!);

  const pos = useRef(new THREE.Vector3(tileW(CAVE_LANDMARKS.boss.tx, CAVE_LANDMARKS.boss.ty).x, INT_Y, tileW(CAVE_LANDMARKS.boss.tx, CAVE_LANDMARKS.boss.ty).z));
  const yaw = useRef(0);
  const flash = useRef(0);
  const prevHp = useRef(bossHp);
  const surgeCd = useRef(2.2);
  const surgeT = useRef(0);
  const surgeDir = useRef(new THREE.Vector3());
  const t = useRef(0);
  const fallen = useRef(0);

  const solidAt = (x: number, z: number) => {
    const tx = Math.floor(x - OFF_X);
    const ty = Math.floor(z - OFF_Z);
    if (tx < 0 || ty < 0 || ty >= caveMap.length || tx >= caveMap[0].length) return true;
    return caveSolidAt(caveMap[ty][tx]);
  };
  const canBe = (x: number, z: number) =>
    !solidAt(x + 0.45, z) && !solidAt(x - 0.45, z) && !solidAt(x, z + 0.45) && !solidAt(x, z - 0.45);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    t.current += dt;
    const elder = useElder.getState();
    const p = rt.player.pos;
    const stage = elder.caveStage;

    if (bossHp < prevHp.current) flash.current = 1;
    prevHp.current = bossHp;

    // wake trigger — something stirs as you close in
    if (stage === "entered") {
      const d = Math.hypot(p.x - pos.current.x, p.z - pos.current.z);
      if (d < 5.5) {
        elder.setCaveStage("boss_awake");
        sfx.machineRumble();
        useElder.getState().showDialog(caveBossAwakeDialog, "bossAwake");
      }
    }

    if (stage === "boss_awake" && !elder.activeDialog) {
      const dx = p.x - pos.current.x;
      const dz = p.z - pos.current.z;
      const dist = Math.hypot(dx, dz);

      // surge: a telegraphed lunge toward where the player stands
      surgeCd.current -= dt;
      if (surgeT.current <= 0 && surgeCd.current <= 0 && dist > 1.6 && dist < 7) {
        surgeT.current = 0.5;
        surgeDir.current.set(dx / (dist || 1), 0, dz / (dist || 1));
        surgeCd.current = 2.6 + hash(t.current, 3) * 1.2;
        sfx.machineRumble();
      }
      let speed = 2.9;
      let dirX = dx / (dist || 1), dirZ = dz / (dist || 1);
      if (surgeT.current > 0) {
        surgeT.current -= dt;
        speed = 6.8;
        dirX = surgeDir.current.x;
        dirZ = surgeDir.current.z;
      }
      const nx = pos.current.x + dirX * speed * dt;
      const nz = pos.current.z + dirZ * speed * dt;
      if (canBe(nx, pos.current.z)) pos.current.x = nx;
      if (canBe(pos.current.x, nz)) pos.current.z = nz;
      yaw.current = Math.atan2(dirX, dirZ);

    // publish live position for sword/arrow hit checks
    rt.boss.pos.copy(pos.current);
    rt.boss.yaw = yaw.current;

      // touch damage — dodging, guarding, or i-frames protect (handled in hurt())
      if (dist < 1.05) {
        elder.hurt(12);
        // knock the player back a step
        const kx = p.x + (dx / (dist || 1)) * -1.1;
        const kz = p.z + (dz / (dist || 1)) * -1.1;
        if (canBe(kx, p.z)) p.x = kx;
        if (canBe(p.x, kz)) p.z = kz;
      }
    }

    // pose + animation
    if (g.current) {
      if (stage === "boss_defeated" || stage === "delivered") {
        fallen.current = Math.min(1, fallen.current + dt * 1.6);
        const f = fallen.current;
        g.current.position.set(pos.current.x, INT_Y - 0.55 * f + Math.sin(t.current * 2) * 0.01, pos.current.z);
        g.current.rotation.z = 1.15 * f;
        g.current.rotation.y = yaw.current;
      } else if (stage === "boss_awake") {
        const agitated = flash.current > 0 || surgeT.current > 0;
        g.current.position.set(
          pos.current.x + Math.sin(t.current * (agitated ? 31 : 9)) * (agitated ? 0.05 : 0.02),
          INT_Y + Math.abs(Math.sin(t.current * 6)) * 0.07,
          pos.current.z + Math.cos(t.current * (agitated ? 27 : 8)) * (agitated ? 0.05 : 0.02),
        );
        g.current.rotation.y = yaw.current;
        g.current.rotation.z = Math.sin(t.current * 5) * 0.03;
        if (legL.current) legL.current.rotation.x = Math.sin(t.current * 9) * 0.5;
        if (legR.current) legR.current.rotation.x = -Math.sin(t.current * 9) * 0.5;
      } else {
        // dormant — barely a shape in the dark
        g.current.position.set(pos.current.x, INT_Y + Math.sin(t.current * 1.2) * 0.015, pos.current.z);
        g.current.rotation.z = 0;
      }
    }

    // eyes: dormant ember -> wide awake -> defeated faint tick
    const awake = stage === "boss_awake";
    const done = stage === "boss_defeated" || stage === "delivered";
    if (eyeBig.current) {
      const m = eyeBig.current.material as THREE.MeshBasicMaterial;
      const pulse = done ? 0.18 + Math.sin(t.current * 2.4) * 0.08 : awake ? 1 : 0.3 + Math.sin(t.current * 0.8) * 0.12;
      m.color.setRGB(done ? 0.55 : 1, done ? 0.06 : 0.12, done ? 0.06 : 0.16).multiplyScalar(pulse);
      const s = awake ? 1 + Math.sin(t.current * 6) * 0.08 : 1;
      eyeBig.current.scale.setScalar(s);
    }
    if (eyeSmall.current) {
      (eyeSmall.current.material as THREE.MeshBasicMaterial).color.setScalar(done ? 0.25 : awake ? 1 : 0.3);
    }
    if (eyeGlow.current) {
      (eyeGlow.current.material as THREE.MeshBasicMaterial).opacity = awake ? 0.35 + Math.sin(t.current * 6) * 0.12 : 0;
    }

    // hit flash decay
    if (flash.current > 0) flash.current = Math.max(0, flash.current - dt * 3);
    if (flashOverlay.current) {
      (flashOverlay.current.material as THREE.MeshBasicMaterial).opacity = flash.current * 0.8;
    }
  });

  const hpFrac = Math.max(0, bossHp) / 40;

  return (
    <group ref={g}>
      {/* rusted chassis */}
      <mesh position={[0, 0.95, 0]} castShadow>
        <boxGeometry args={[1.15, 0.85, 1.35]} />
        <meshLambertMaterial color="#7a4f34" />
      </mesh>
      <mesh position={[0.3, 0.9, 0.69]}>
        <boxGeometry args={[0.5, 0.4, 0.04]} />
        <meshLambertMaterial color="#8f6446" />
      </mesh>
      <mesh position={[-0.32, 1.1, -0.2]} rotation={[0.3, 0.4, 0]}>
        <boxGeometry args={[0.55, 0.28, 0.5]} />
        <meshLambertMaterial color="#5f4028" />
      </mesh>
      {/* shoulder rivets */}
      {[-0.5, 0.5].map((x) => (
        <mesh key={x} position={[x, 1.25, 0.3]}>
          <boxGeometry args={[0.16, 0.16, 0.16]} />
          <meshLambertMaterial color="#4a3020" />
        </mesh>
      ))}
      {/* the great red eye + its small companion */}
      <mesh ref={eyeBig} position={[0, 1.05, 0.71]}>
        <boxGeometry args={[0.26, 0.22, 0.06]} />
        <meshBasicMaterial color="#ff1a20" toneMapped={false} />
      </mesh>
      <mesh ref={eyeSmall} position={[0.3, 1.13, 0.71]}>
        <boxGeometry args={[0.1, 0.1, 0.05]} />
        <meshBasicMaterial color="#ff4a30" toneMapped={false} />
      </mesh>
      <mesh ref={eyeGlow} position={[0, 1.05, 0.75]}>
        <boxGeometry args={[0.44, 0.36, 0.03]} />
        <meshBasicMaterial color="#ff2030" transparent opacity={0} toneMapped={false} />
      </mesh>
      {/* antenna with blinking tip */}
      <mesh position={[-0.4, 1.6, -0.3]} rotation={[0.25, 0, 0.2]}>
        <boxGeometry args={[0.04, 0.5, 0.04]} />
        <meshLambertMaterial color="#4a3020" />
      </mesh>
      <mesh position={[-0.34, 1.86, -0.24]}>
        <boxGeometry args={[0.08, 0.08, 0.08]} />
        <meshBasicMaterial color="#ffd75e" toneMapped={false} />
      </mesh>
      {/* stubby shuffling legs */}
      <mesh ref={legL} position={[0.3, 0.28, 0]}>
        <boxGeometry args={[0.22, 0.55, 0.5]} />
        <meshLambertMaterial color="#54371f" />
      </mesh>
      <mesh ref={legR} position={[-0.3, 0.28, 0]}>
        <boxGeometry args={[0.22, 0.55, 0.5]} />
        <meshLambertMaterial color="#54371f" />
      </mesh>
      {/* hit flash overlay */}
      <mesh ref={flashOverlay} position={[0, 0.95, 0]}>
        <boxGeometry args={[1.25, 0.95, 1.45]} />
        <meshBasicMaterial color="#ff5040" transparent opacity={0} toneMapped={false} />
      </mesh>
      {/* hp bar */}
      {caveStage === "boss_awake" && (
        <group position={[0, 1.75, 0]}>
          <mesh>
            <planeGeometry args={[1.2, 0.12]} />
            <meshBasicMaterial color="#181818" />
          </mesh>
          <mesh position={[-0.58 + (hpFrac * 1.16) / 2, 0, 0.01]}>
            <planeGeometry args={[Math.max(0.001, hpFrac * 1.16), 0.08]} />
            <meshBasicMaterial color="#e02828" toneMapped={false} />
          </mesh>
        </group>
      )}
    </group>
  );
}

export function CaveScene() {
  return (
    <>
      <CaveEnvironment />
      <CaveRoom />
      <PlayerTorch />
      <CaveMachine />
    </>
  );
}
