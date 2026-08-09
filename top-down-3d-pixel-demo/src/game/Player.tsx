import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { groundAtWorld, houses, isBlocked, signs } from "./world";
import { npcs } from "./NPCs";
import { rt, useUI } from "./state";
import { sfx } from "./audio";

const SPEED = 4.6;
const RADIUS = 0.3;
const offsets: [number, number][] = [
  [RADIUS, 0],
  [-RADIUS, 0],
  [0, RADIUS],
  [0, -RADIUS],
  [RADIUS * 0.7, RADIUS * 0.7],
  [-RADIUS * 0.7, RADIUS * 0.7],
  [RADIUS * 0.7, -RADIUS * 0.7],
  [-RADIUS * 0.7, -RADIUS * 0.7],
];

function canWalk(x: number, z: number, currentTop: number) {
  for (const [dx, dz] of offsets) {
    if (isBlocked(x + dx, z + dz)) return false;
    if (groundAtWorld(x + dx, z + dz) - currentTop > 0.55) return false;
  }
  return true;
}

const HOUSE_LINES = [
  "A COSY LITTLE BOX HOUSE. SOMEONE IS\nCOOKING SOMETHING VOXEL-SHAPED.",
  "THE ROOF IS MADE OF THREE STACKED CUBES.\nARCHITECTURE HAS PEAKED.",
  "KNOCK KNOCK. NOBODY HOME —\nTHEY ARE ALL OUT COLLECTING COINS.",
  "SMOKE CURLS FROM THE CHIMNEY.\n(IMAGINE THE SMOKE, WE RAN OUT OF CUBES.)",
];

const camTarget = new THREE.Vector3();
const desired = new THREE.Vector3();
const fwd = new THREE.Vector3();
const right = new THREE.Vector3();

export function Player() {
  const group = useRef<THREE.Group>(null!);
  const legL = useRef<THREE.Group>(null!);
  const legR = useRef<THREE.Group>(null!);
  const armL = useRef<THREE.Group>(null!);
  const armR = useRef<THREE.Group>(null!);
  const phase = useRef(0);
  const stepTimer = useRef(0);
  const init = useRef(false);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const p = rt.player;
    const ui = useUI.getState();

    // ---- input (keyboard + on-screen stick) -------------------------------
    let ix = THREE.MathUtils.clamp(rt.input.x + rt.input.touchX, -1, 1);
    let iy = THREE.MathUtils.clamp(rt.input.y + rt.input.touchY, -1, 1);
    const mag = Math.hypot(ix, iy);
    if (mag > 1) {
      ix /= mag;
      iy /= mag;
    }

    // ---- camera relative movement -----------------------------------------
    rt.cam.yaw += (rt.cam.targetYaw - rt.cam.yaw) * (1 - Math.exp(-dt * 9));
    rt.cam.zoom += (rt.cam.targetZoom - rt.cam.zoom) * (1 - Math.exp(-dt * 8));
    const yaw = rt.cam.yaw;
    fwd.set(-Math.sin(yaw), 0, -Math.cos(yaw));
    right.set(Math.cos(yaw), 0, -Math.sin(yaw));

    const mx = right.x * ix + fwd.x * iy;
    const mz = right.z * ix + fwd.z * iy;
    const moving = Math.hypot(mx, mz) > 0.05;
    p.moving = moving;
    p.speed += ((moving ? 1 : 0) - p.speed) * (1 - Math.exp(-dt * 16));

    const currentTop = groundAtWorld(p.pos.x, p.pos.z);
    if (moving) {
      const nx = p.pos.x + mx * SPEED * dt;
      const nz = p.pos.z + mz * SPEED * dt;
      if (canWalk(nx, p.pos.z, currentTop)) p.pos.x = nx;
      if (canWalk(p.pos.x, nz, currentTop)) p.pos.z = nz;
      const targetYaw = Math.atan2(mx, mz);
      let d = targetYaw - p.yaw;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      p.yaw += d * (1 - Math.exp(-dt * 14));
      phase.current += dt * 11;
      stepTimer.current -= dt;
      if (stepTimer.current <= 0) {
        stepTimer.current = 0.32;
        sfx.step();
      }
    } else {
      phase.current += dt * 2.4;
    }

    const groundY = groundAtWorld(p.pos.x, p.pos.z);
    p.pos.y += (groundY - p.pos.y) * (1 - Math.exp(-dt * 15));

    // ---- character rig -----------------------------------------------------
    const swing = Math.sin(phase.current) * 0.62 * p.speed;
    legL.current.rotation.x = swing;
    legR.current.rotation.x = -swing;
    armL.current.rotation.x = -swing * 0.85;
    armR.current.rotation.x = swing * 0.85;
    const bob = Math.abs(Math.sin(phase.current)) * 0.05 * p.speed;
    const idle = (1 - p.speed) * Math.sin(phase.current * 0.9) * 0.015;
    group.current.position.set(p.pos.x, p.pos.y + bob + idle, p.pos.z);
    group.current.rotation.y = p.yaw;

    // ---- camera ------------------------------------------------------------
    const pitch = 0.62;
    const dist = 46;
    desired.set(
      p.pos.x + Math.sin(yaw) * Math.cos(pitch) * dist,
      p.pos.y + Math.sin(pitch) * dist,
      p.pos.z + Math.cos(yaw) * Math.cos(pitch) * dist,
    );
    if (!init.current) {
      init.current = true;
      camTarget.copy(p.pos);
      state.camera.position.copy(desired);
    }
    camTarget.lerp(p.pos, 1 - Math.exp(-dt * 7));
    state.camera.position.lerp(desired, 1 - Math.exp(-dt * 7));
    state.camera.lookAt(camTarget.x, camTarget.y + 0.9, camTarget.z);
    const cam = state.camera as THREE.OrthographicCamera;
    if (Math.abs(cam.zoom - rt.cam.zoom) > 0.01) {
      cam.zoom = rt.cam.zoom;
      cam.updateProjectionMatrix();
    }

    // ---- interactions ------------------------------------------------------
    let best: { label: string; title: string; text: string } | null = null;
    let bestDist = 2.6;
    signs.forEach((s) => {
      const d = Math.hypot(s.x - p.pos.x, s.z - p.pos.z);
      if (d < bestDist) {
        bestDist = d;
        best = { label: "READ SIGN", title: s.title, text: s.text };
      }
    });
    npcs.forEach((n) => {
      const d = Math.hypot(n.pos.x - p.pos.x, n.pos.z - p.pos.z);
      if (d < bestDist) {
        bestDist = d;
        best = { label: "TALK", title: n.name, text: n.line };
      }
    });
    houses.forEach((h, n) => {
      const d = Math.hypot(h.x - p.pos.x, h.z - p.pos.z);
      if (d < bestDist + 0.4) {
        bestDist = d;
        best = { label: "KNOCK ON DOOR", title: "HOUSE " + (n + 1), text: HOUSE_LINES[n % HOUSE_LINES.length] };
      }
    });
    const chosen = best as { label: string; title: string; text: string } | null;
    ui.setPrompt(chosen ? chosen.label : null);
    if (rt.input.interact) {
      rt.input.interact = false;
      if (ui.dialogue) {
        ui.say(null);
        sfx.ui();
      } else if (chosen) {
        ui.say({ title: chosen.title, text: chosen.text });
        sfx.talk();
      }
    }
    if (ui.dialogue && !chosen) ui.say(null);
  });

  return (
    <group ref={group}>
      {/* legs */}
      <group ref={legL} position={[0.13, 0.36, 0]}>
        <mesh position={[0, -0.18, 0]} castShadow>
          <boxGeometry args={[0.18, 0.38, 0.18]} />
          <meshLambertMaterial color="#2f3d6b" />
        </mesh>
        <mesh position={[0, -0.38, 0.03]} castShadow>
          <boxGeometry args={[0.2, 0.1, 0.24]} />
          <meshLambertMaterial color="#33281f" />
        </mesh>
      </group>
      <group ref={legR} position={[-0.13, 0.36, 0]}>
        <mesh position={[0, -0.18, 0]} castShadow>
          <boxGeometry args={[0.18, 0.38, 0.18]} />
          <meshLambertMaterial color="#2f3d6b" />
        </mesh>
        <mesh position={[0, -0.38, 0.03]} castShadow>
          <boxGeometry args={[0.2, 0.1, 0.24]} />
          <meshLambertMaterial color="#33281f" />
        </mesh>
      </group>
      {/* torso */}
      <mesh position={[0, 0.58, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 0.46, 0.3]} />
        <meshLambertMaterial color="#e2544f" />
      </mesh>
      <mesh position={[0, 0.78, 0]} castShadow>
        <boxGeometry args={[0.54, 0.1, 0.34]} />
        <meshLambertMaterial color="#f4e7c9" />
      </mesh>
      {/* arms */}
      <group ref={armL} position={[0.32, 0.76, 0]}>
        <mesh position={[0, -0.17, 0]} castShadow>
          <boxGeometry args={[0.14, 0.36, 0.16]} />
          <meshLambertMaterial color="#c9433f" />
        </mesh>
        <mesh position={[0, -0.38, 0]} castShadow>
          <boxGeometry args={[0.15, 0.12, 0.17]} />
          <meshLambertMaterial color="#f0b98d" />
        </mesh>
      </group>
      <group ref={armR} position={[-0.32, 0.76, 0]}>
        <mesh position={[0, -0.17, 0]} castShadow>
          <boxGeometry args={[0.14, 0.36, 0.16]} />
          <meshLambertMaterial color="#c9433f" />
        </mesh>
        <mesh position={[0, -0.38, 0]} castShadow>
          <boxGeometry args={[0.15, 0.12, 0.17]} />
          <meshLambertMaterial color="#f0b98d" />
        </mesh>
      </group>
      {/* head */}
      <mesh position={[0, 1.02, 0]} castShadow>
        <boxGeometry args={[0.42, 0.4, 0.4]} />
        <meshLambertMaterial color="#f0b98d" />
      </mesh>
      <mesh position={[0.1, 1.06, 0.21]}>
        <boxGeometry args={[0.07, 0.09, 0.02]} />
        <meshLambertMaterial color="#241a14" />
      </mesh>
      <mesh position={[-0.1, 1.06, 0.21]}>
        <boxGeometry args={[0.07, 0.09, 0.02]} />
        <meshLambertMaterial color="#241a14" />
      </mesh>
      {/* cap */}
      <mesh position={[0, 1.27, 0]} castShadow>
        <boxGeometry args={[0.46, 0.14, 0.44]} />
        <meshLambertMaterial color="#3f8f57" />
      </mesh>
      <mesh position={[0, 1.19, 0.28]} castShadow>
        <boxGeometry args={[0.44, 0.06, 0.16]} />
        <meshLambertMaterial color="#2f6b41" />
      </mesh>
      <mesh position={[0, 1.36, 0]} castShadow>
        <boxGeometry args={[0.12, 0.08, 0.12]} />
        <meshLambertMaterial color="#ffd75e" />
      </mesh>
    </group>
  );
}
