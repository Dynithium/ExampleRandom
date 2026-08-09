import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { groundAtWorld, isBlocked, VILLAGE, gx } from "./world";

export type Npc = {
  pos: THREE.Vector3;
  yaw: number;
  target: THREE.Vector3;
  wait: number;
  phase: number;
  name: string;
  line: string;
  shirt: string;
  hat: string;
  skin: string;
};

const CX = gx(VILLAGE.i);
const CZ = gx(VILLAGE.j);

function make(name: string, line: string, shirt: string, hat: string, skin: string, dx: number, dz: number): Npc {
  const x = CX + dx;
  const z = CZ + dz;
  return {
    pos: new THREE.Vector3(x, groundAtWorld(x, z), z),
    yaw: Math.random() * Math.PI * 2,
    target: new THREE.Vector3(x, 0, z),
    wait: Math.random() * 2,
    phase: Math.random() * 6,
    name,
    line,
    shirt,
    hat,
    skin,
  };
}

export const npcs: Npc[] = [
  make(
    "MAYA THE BAKER",
    "MORNING! EVERY LOAF I BAKE IS A CUBE.\nIT STACKS BEAUTIFULLY, TERRIBLE TO SLICE.",
    "#e8a33d",
    "#f4f1e6",
    "#c98b5e",
    1.6,
    2.2,
  ),
  make(
    "OLD PIXEL PETE",
    "BACK IN MY DAY WE ONLY HAD 16 COLOURS.\nAND WE WERE GRATEFUL FOR TWELVE OF THEM.",
    "#6f7fd6",
    "#3c4a86",
    "#e8c6a0",
    -2.4,
    -1.4,
  ),
  make(
    "SURVEYOR ROSE",
    "I MEASURED THE ISLAND: 46 BY 46 TILES,\nEIGHT ELEVATIONS, ONE VERY GOOD BOAT.",
    "#4fae7c",
    "#d8563f",
    "#8c5a3c",
    3.2,
    -2.6,
  ),
  make(
    "TINY THE FISHER",
    "THE SEA IS 84% TRANSPARENT TODAY.\nGREAT FOR SPOTTING SAND, BAD FOR FISH.",
    "#c96fa8",
    "#5d3f6d",
    "#f0b98d",
    -1.2,
    3.6,
  ),
];

function pickTarget(n: Npc) {
  for (let attempt = 0; attempt < 14; attempt++) {
    const a = Math.random() * Math.PI * 2;
    const r = 2 + Math.random() * 7;
    const x = CX + Math.cos(a) * r;
    const z = CZ + Math.sin(a) * r;
    if (isBlocked(x, z)) continue;
    if (Math.abs(groundAtWorld(x, z) - n.pos.y) > 1.1) continue;
    n.target.set(x, 0, z);
    return;
  }
  n.target.set(CX, 0, CZ);
}

function Villager({ n }: { n: Npc }) {
  const g = useRef<THREE.Group>(null!);
  const legL = useRef<THREE.Group>(null!);
  const legR = useRef<THREE.Group>(null!);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    let moving = false;
    if (n.wait > 0) {
      n.wait -= dt;
    } else {
      const dx = n.target.x - n.pos.x;
      const dz = n.target.z - n.pos.z;
      const d = Math.hypot(dx, dz);
      if (d < 0.3) {
        n.wait = 1.5 + Math.random() * 4;
        pickTarget(n);
      } else {
        const sp = 1.5;
        const nx = n.pos.x + (dx / d) * sp * dt;
        const nz = n.pos.z + (dz / d) * sp * dt;
        if (isBlocked(nx, nz) || Math.abs(groundAtWorld(nx, nz) - n.pos.y) > 0.6) {
          pickTarget(n);
          n.wait = 0.3;
        } else {
          n.pos.x = nx;
          n.pos.z = nz;
          moving = true;
          const ty = Math.atan2(dx, dz);
          let diff = ty - n.yaw;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          n.yaw += diff * (1 - Math.exp(-dt * 8));
        }
      }
    }
    n.phase += dt * (moving ? 9 : 1.8);
    const gy = groundAtWorld(n.pos.x, n.pos.z);
    n.pos.y += (gy - n.pos.y) * (1 - Math.exp(-dt * 12));
    const swing = moving ? Math.sin(n.phase) * 0.55 : 0;
    legL.current.rotation.x = swing;
    legR.current.rotation.x = -swing;
    g.current.position.set(
      n.pos.x,
      n.pos.y + (moving ? Math.abs(Math.sin(n.phase)) * 0.045 : Math.sin(n.phase) * 0.012),
      n.pos.z,
    );
    g.current.rotation.y = n.yaw;
  });

  return (
    <group ref={g}>
      <group ref={legL} position={[0.11, 0.32, 0]}>
        <mesh position={[0, -0.16, 0]} castShadow>
          <boxGeometry args={[0.16, 0.34, 0.16]} />
          <meshLambertMaterial color="#3b3550" />
        </mesh>
      </group>
      <group ref={legR} position={[-0.11, 0.32, 0]}>
        <mesh position={[0, -0.16, 0]} castShadow>
          <boxGeometry args={[0.16, 0.34, 0.16]} />
          <meshLambertMaterial color="#3b3550" />
        </mesh>
      </group>
      <mesh position={[0, 0.54, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.46, 0.44, 0.28]} />
        <meshLambertMaterial color={n.shirt} />
      </mesh>
      <mesh position={[0.3, 0.56, 0]} castShadow>
        <boxGeometry args={[0.13, 0.34, 0.15]} />
        <meshLambertMaterial color={n.shirt} />
      </mesh>
      <mesh position={[-0.3, 0.56, 0]} castShadow>
        <boxGeometry args={[0.13, 0.34, 0.15]} />
        <meshLambertMaterial color={n.shirt} />
      </mesh>
      <mesh position={[0, 0.95, 0]} castShadow>
        <boxGeometry args={[0.4, 0.38, 0.38]} />
        <meshLambertMaterial color={n.skin} />
      </mesh>
      <mesh position={[0.09, 0.99, 0.2]}>
        <boxGeometry args={[0.06, 0.08, 0.02]} />
        <meshLambertMaterial color="#241a14" />
      </mesh>
      <mesh position={[-0.09, 0.99, 0.2]}>
        <boxGeometry args={[0.06, 0.08, 0.02]} />
        <meshLambertMaterial color="#241a14" />
      </mesh>
      <mesh position={[0, 1.19, 0]} castShadow>
        <boxGeometry args={[0.44, 0.13, 0.42]} />
        <meshLambertMaterial color={n.hat} />
      </mesh>
    </group>
  );
}

export function Villagers() {
  return (
    <>
      {npcs.map((n, i) => (
        <Villager key={i} n={n} />
      ))}
    </>
  );
}
