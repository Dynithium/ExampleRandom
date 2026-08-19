import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { groundAtWorld, isBlocked, interiors, eldervilleWorldPos, villageDoors, archeryTargets, CAVE_TILE, FORGE_TILE, caveMap, caveSolidAt, CAVE_LANDMARKS } from "./world";
import { rt, useUI } from "./state";
import {
  useElder,
  eldersAtDoorPositions,
  tinslaireInsideDialog,
  tinslaireInsideRepeat,
  tinslaireVillageDialog,
  tinslaireVillageRepeat,
  tinslaireNightDialog,
  tinslaireNightRepeat,
  tinslaireTemptationDialog,
  tinslaireHonestyWitnessDialog,
  elderMossDoorDialog,
  elderMossDoorRepeat,
  elderMossWellIntroDialog,
  elderMossWellAssignedRepeat,
  wellInspectDialog,
  elderMossWellReportDialog,
  elderMossWellCompletedRepeat,
  elderSageStudyIntroDialog,
  elderSageStudyAssignedRepeat,
  scholarDeskClueDialog,
  elderSageStudyDeliverDialog,
  elderSageStudyCompletedRepeat,
  elderThornIntroDialog,
  elderThornAssignedRepeat,
  gardenGrainPickupDialog,
  widowOrenDeliverDialog,
  widowOrenBlessedDialog,
  elderThornCompleteDialog,
  elderThornCompletedRepeat,
  traderIntroDialog,
  traderHonestyReturnDialog,
  traderCompletedRepeat,
  councilCombatTrialDialog,
  outskirtsCaveEnterDialog,
  caveBodyLiftDialog,
  forgeDeliverDialog,
  swordCaseDialog,
} from "./eldervilleStory";
import { sfx } from "./audio";

const SPEED = 6.5;
const RADIUS = 0.3;
const offsets: [number, number][] = [
  [RADIUS, 0], [-RADIUS, 0], [0, RADIUS], [0, -RADIUS],
  [RADIUS*0.7,RADIUS*0.7], [-RADIUS*0.7,RADIUS*0.7], [RADIUS*0.7,-RADIUS*0.7], [-RADIUS*0.7,-RADIUS*0.7],
];

function canWalkWorld(x: number, z: number, currentTop: number) {
  for (const [dx, dz] of offsets) {
    if (isBlocked(x + dx, z + dz)) return false;
    if (groundAtWorld(x + dx, z + dz) - currentTop > 0.55) return false;
  }
  return true;
}

function isInteriorSolidAt(map: number[][], wx: number, wz: number, offX: number, offZ: number) {
  const tx = Math.floor(wx - offX);
  const tz = Math.floor(wz - offZ);
  if (tx < 0 || tz < 0 || tx >= map[0].length || tz >= map.length) return true;
  const t = map[tz][tx];
  return t === 7 || t === 8 || t === 9 || t === 17 || t === 18 || t === 19;
}

const caveSolidAtWorld = (x: number, z: number) => {
  const tx = Math.floor(x - INT_OFF_X), ty = Math.floor(z - INT_OFF_Z);
  if (tx < 0 || ty < 0 || ty >= caveMap.length || tx >= caveMap[0].length) return true;
  return caveSolidAt(caveMap[ty][tx]);
};

const INT_OFF_X = 72.5, INT_OFF_Z = 75, INT_Y = 2;
function npcBlockedWorld(x: number, z: number) {
  const s = useElder.getState();
  const isNight = rt.env.night > 0.45;
  if (s.currentArea === "village") {
    const isDoorVisible = s.eldersAtDoorReady && !s.eldersDoorDialogDone;
    const positions: {x:number,z:number}[] = [];
    if (isDoorVisible) {
      eldersAtDoorPositions.forEach(e=>{ const p=eldervilleWorldPos(e.tx,e.ty); positions.push({x:p.x,z:p.z}); });
    } else {
      // Moss at Central Well
      const mp = eldervilleWorldPos(59, 35);
      positions.push({ x: mp.x, z: mp.z });
      // Sage at Council
      const sp = eldervilleWorldPos(32, 12);
      positions.push({ x: sp.x, z: sp.z });
      // Thorn at Homestead
      const tp = eldervilleWorldPos(16, 26);
      positions.push({ x: tp.x, z: tp.z });
      // Trader at Market
      const trp = eldervilleWorldPos(15, 40);
      positions.push({ x: trp.x, z: trp.z });
    }
    // Tinslaire in village during daytime
    if (s.eldersDoorDialogDone && !isNight) {
      positions.push({ x: rt.tinslaire.pos.x, z: rt.tinslaire.pos.z });
    }
    for(const np of positions) if(Math.hypot(np.x - x, np.z - z) < 0.75) return true;
  } else if (s.currentArea==="home") {
    const offX=INT_OFF_X, offZ=INT_OFF_Z;
    if (!s.eldersDoorDialogDone) {
      const nx = offX + 6 + 0.5, nz = offZ + 5 + 0.5;
      if(Math.hypot(nx - x, nz - z) < 0.7) return true;
    } else if (isNight) {
      const nx = offX + 4 + 0.5, nz = offZ + 4 + 0.5;
      if(Math.hypot(nx - x, nz - z) < 0.7) return true;
    }
  } else if (s.currentArea==="homesteadA") {
    const offX=INT_OFF_X, offZ=INT_OFF_Z;
    const nx = offX + 6 + 0.5, nz = offZ + 6 + 0.5;
    if(Math.hypot(nx - x, nz - z) < 0.7) return true;
  } else if (s.currentArea === "cave") {
    // The Cave Machine had no body at all: you could stand inside the boss (and
    // walk straight through the wreck afterwards), which also made its melee
    // trivially avoidable by simply occupying the same tile. Kept smaller than
    // the 2.0 "Lift the Machine Body" interact radius so the pickup stays usable.
    if (s.caveStage === "boss_awake" || s.caveStage === "boss_defeated") {
      const b = rt.boss.pos;
      const R = 0.85;
      // Only block movement *into* the machine. The boss chases and can end up
      // overlapping the player (or the wreck can settle on top of them); if we
      // blocked unconditionally, every direction would fail and the player would
      // be stuck inside it forever. If already inside, let them walk out.
      const insideNow = Math.hypot(b.x - rt.player.pos.x, b.z - rt.player.pos.z) < R;
      if (!insideNow && Math.hypot(b.x - x, b.z - z) < R) return true;
    }
  }
  return false;
}

const camTarget = new THREE.Vector3();
const desired = new THREE.Vector3();
const fwd = new THREE.Vector3();
const right = new THREE.Vector3();

// ---- Bow projectiles (K) ----
type Arrow = { x: number; y: number; z: number; dx: number; dz: number; life: number };
const arrows: Arrow[] = [];
const ARROW_SPEED = 15;
const ARROW_DMG = 12;
const ARROW_POOL = 6;

function spawnArrow() {
  if (arrows.length >= ARROW_POOL) return;
  const p = rt.player;
  const dx = Math.sin(p.yaw), dz = Math.cos(p.yaw);
  arrows.push({ x: p.pos.x + dx * 0.5, y: p.pos.y + 0.78, z: p.pos.z + dz * 0.5, dx, dz, life: 1.3 });
}

function stepArrows(dt: number) {
  const elder = useElder.getState();
  const dummyCoords = [eldervilleWorldPos(34, 3), eldervilleWorldPos(36, 3), eldervilleWorldPos(38, 3)];
  for (let i = arrows.length - 1; i >= 0; i--) {
    const a = arrows[i];
    a.x += a.dx * ARROW_SPEED * dt;
    a.z += a.dz * ARROW_SPEED * dt;
    a.life -= dt;
    let dead = a.life <= 0;
    // Arrows used to test only the boss/dummies/archery targets, so they flew
    // straight through cave walls, houses and hillsides — you could stand outside
    // the cave and shoot the machine, or kill the training dummies from across a
    // building. Stop them on solid geometry.
    if (!dead) {
      if (elder.currentArea === "cave") {
        if (caveSolidAtWorld(a.x, a.z)) dead = true;
      } else if (elder.currentArea === "village") {
        if (isBlocked(a.x, a.z)) dead = true;
      } else {
        const interior = elder.currentInterior ? interiors[elder.currentInterior] : null;
        if (interior && isInteriorSolidAt(interior.map, a.x, a.z, INT_OFF_X, INT_OFF_Z)) dead = true;
      }
      if (dead) sfx.block();
    }
    if (elder.currentArea === "cave") {
      const b = rt.boss.pos;
      if (elder.caveStage === "boss_awake" && Math.hypot(b.x - a.x, b.z - a.z) < 0.85) {
        elder.damageBoss(ARROW_DMG);
        sfx.hit();
        dead = true;
      }
    } else if (elder.currentArea === "village") {
      dummyCoords.forEach((c, idx) => {
        if (!dead && Math.hypot(c.x - a.x, c.z - a.z) < 0.55 && elder.dummiesHealth[idx] > 0) {
          const wasAssigned = elder.combatTrialState === "assigned";
          elder.damageDummy(idx, ARROW_DMG);
          sfx.hit();
          if (wasAssigned && useElder.getState().combatTrialState === "completed") {
            sfx.questComplete();
          }
          dead = true;
        }
      });
      if (!dead) {
        for (const t of archeryTargets) {
          if (Math.hypot(t.x - a.x, t.z - a.z) < 0.6) { sfx.block(); dead = true; break; }
        }
      }
    }
    if (dead) arrows.splice(i, 1);
  }
}

function Arrows() {
  const refs = useRef<(THREE.Group | null)[]>([]);
  useFrame((_, delta) => {
    stepArrows(Math.min(delta, 0.05));
    refs.current.forEach((g, i) => {
      if (!g) return;
      const a = arrows[i];
      g.visible = !!a;
      if (a) {
        g.position.set(a.x, a.y, a.z);
        g.rotation.y = Math.atan2(a.dx, a.dz);
      }
    });
  });
  return (
    <>
      {Array.from({ length: ARROW_POOL }, (_, i) => (
        <group key={i} ref={(el) => { refs.current[i] = el; }} visible={false}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <boxGeometry args={[0.035, 0.55, 0.035]} />
            <meshBasicMaterial color="#e8e0c8" toneMapped={false} />
          </mesh>
          <mesh position={[0, 0, 0.32]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.045, 0.12, 4]} />
            <meshBasicMaterial color="#c8d0d8" toneMapped={false} />
          </mesh>
        </group>
      ))}
    </>
  );
}

export function EldervillePlayer() {
  const group = useRef<THREE.Group>(null!);
  const carryingBody = useElder((s) => s.carryingBody);
  const legL = useRef<THREE.Group>(null!);
  const legR = useRef<THREE.Group>(null!);
  const armL = useRef<THREE.Group>(null!);
  const armR = useRef<THREE.Group>(null!);
  const swordRef = useRef<THREE.Group>(null!);
  const phase = useRef(0);
  const stepTimer = useRef(0);
  const attackTimer = useRef(0);
  const blockTimer = useRef(0);
  const bowTimer = useRef(0);
  const dodgeTimer = useRef(0);
  const dodgeDir = useRef(new THREE.Vector3(0, 0, 1));
  const blockHeld = useRef(false);
  const prevShift = useRef(false);
  const stAcc = useRef(useElder.getState().st);
  const stWritten = useRef(Math.round(useElder.getState().st));
  const swingArc = useRef<THREE.Group>(null!);
  const init = useRef(false);
  const prevArea = useRef<string>(useElder.getState().currentArea);

  useEffect(() => {
    sfx.startSuitHum();
    return () => sfx.stopSuitHum();
  }, []);

  // Keyboard attack / combat listeners
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const elder = useElder.getState();
      const ui = useUI.getState();
      if (elder.openingBlack || elder.memoryActive || !!elder.activeDialog || ui.pauseMenu) return;
      if (elder.carryingBody) return; // hands are full with the chassis

      // Sword Attack (Space or J) — hits what you are facing
      if (e.code === "Space" || e.code === "KeyJ") {
        if (attackTimer.current <= 0) {
          attackTimer.current = 0.35;
          sfx.slash();
          const p = rt.player;
          const facingX = Math.sin(p.yaw), facingZ = Math.cos(p.yaw);

          // The Cave Machine (Outskirts Cave)
          if (elder.currentArea === "cave" && elder.caveStage === "boss_awake") {
            const b = rt.boss.pos;
            const dist = Math.hypot(b.x - p.pos.x, b.z - p.pos.z);
            if (dist < 2.0) {
              const dot = ((b.x - p.pos.x) * facingX + (b.z - p.pos.z) * facingZ) / (dist || 1);
              if (dot > 0.3) {
                elder.damageBoss(20);
                sfx.hit();
                return;
              }
            }
          }

          // Training dummies behind Blue House
          const dummyCoords = [
            eldervilleWorldPos(34, 3),
            eldervilleWorldPos(36, 3),
            eldervilleWorldPos(38, 3),
          ];
          dummyCoords.forEach((dPos, idx) => {
            const dist = Math.hypot(dPos.x - p.pos.x, dPos.z - p.pos.z);
            if (dist < 1.8 && elder.dummiesHealth[idx] > 0) {
              const dot = ((dPos.x - p.pos.x) * facingX + (dPos.z - p.pos.z) * facingZ) / (dist || 1);
              if (dot > 0.34) {
                const wasAssigned = elder.combatTrialState === "assigned";
                elder.damageDummy(idx, 20);
                sfx.hit();
                // read the post-hit store: the fanfare belongs to the trial actually completing
                if (wasAssigned && useElder.getState().combatTrialState === "completed") {
                  sfx.questComplete();
                }
              }
            }
          });
        }
      }

      // Shield Block (hold R)
      if (e.code === "KeyR" && !e.repeat && !blockHeld.current) {
        blockHeld.current = true;
        sfx.block();
      }

      // Bow Shoot (K) — real arrow projectile
      if (e.code === "KeyK" && !e.repeat && bowTimer.current <= 0) {
        bowTimer.current = 0.55;
        sfx.bowShoot();
        spawnArrow();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "KeyR") blockHeld.current = false;
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const p = rt.player;
    const ui = useUI.getState();
    const elder = useElder.getState();

    if (prevArea.current !== elder.currentArea) {
      prevArea.current = elder.currentArea;
      init.current = false;
    }

    if (attackTimer.current > 0) attackTimer.current -= dt;
    if (blockTimer.current > 0) blockTimer.current -= dt;
    if (bowTimer.current > 0) bowTimer.current -= dt;

    const blockedByStory = elder.openingBlack || elder.memoryActive || !!elder.activeDialog || ui.pauseMenu;
    let ix = 0, iy = 0;
    if (!blockedByStory) {
      ix = THREE.MathUtils.clamp(rt.input.x + rt.input.touchX, -1, 1);
      iy = THREE.MathUtils.clamp(rt.input.y + rt.input.touchY, -1, 1);
      const mag = Math.hypot(ix, iy);
      if (mag > 1) { ix/=mag; iy/=mag; }
    }

    rt.cam.yaw += (rt.cam.targetYaw - rt.cam.yaw) * (1 - Math.exp(-dt * 9));
    rt.cam.zoom += (rt.cam.targetZoom - rt.cam.zoom) * (1 - Math.exp(-dt * 8));
    const yaw = rt.cam.yaw;
    fwd.set(-Math.sin(yaw),0,-Math.cos(yaw));
    right.set(Math.cos(yaw),0,-Math.sin(yaw));
    let mx = right.x * ix + fwd.x * iy;
    let mz = right.z * ix + fwd.z * iy;

    // ---- autopilot (Agent Mode): consume the pathfound route in rt.agent ----
    // The agent writes world-space waypoints; we steer toward them in world space
    // (not camera space) and clear the path on arrival so `move_to` can resolve.
    if (!blockedByStory && rt.agent.path) {
      const route = rt.agent.path;
      let wp = route[rt.agent.pathIdx];
      // pop every waypoint we are already standing on
      while (wp && Math.hypot(wp.x - p.pos.x, wp.z - p.pos.z) < 0.28) {
        rt.agent.pathIdx++;
        wp = route[rt.agent.pathIdx];
      }
      if (!wp) {
        rt.agent.path = null;
        rt.agent.pathIdx = 0;
        mx = 0;
        mz = 0;
      } else {
        const dx = wp.x - p.pos.x;
        const dz = wp.z - p.pos.z;
        const d = Math.hypot(dx, dz) || 1;
        mx = dx / d;
        mz = dz / d;
      }
    } else if (!blockedByStory && rt.agent.faceTarget) {
      // turn in place toward the requested point without translating
      const dx = rt.agent.faceTarget.x - p.pos.x;
      const dz = rt.agent.faceTarget.z - p.pos.z;
      if (Math.hypot(dx, dz) > 0.01) {
        const targetYaw = Math.atan2(dx, dz);
        let diff = targetYaw - p.yaw;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        p.yaw += diff * (1 - Math.exp(-dt * 14));
      }
      mx = 0;
      mz = 0;
    }

    const mlen = Math.hypot(mx, mz);
    if (mlen > 1) { mx/=mlen; mz/=mlen; }
    const wantsMove = !blockedByStory && mlen > 0.05;

    // ---- stamina economy: dodge roll (tap SHIFT), sprint (hold SHIFT), guard (hold R) ----
    // the accumulator keeps fractional progress across frames; re-seed if the store
    // was changed elsewhere (new game / load save)
    if (Math.abs(elder.st - stWritten.current) > 1) {
      stAcc.current = elder.st;
      stWritten.current = Math.round(elder.st);
    }
    const handsFull = elder.carryingBody; // hauling the chassis: no acrobatics
    let stVal = stAcc.current;
    if (rt.input.shift && !prevShift.current && !blockedByStory && !handsFull && dodgeTimer.current <= 0 && stVal >= 25) {
      if (mlen > 0.05) { dodgeDir.current.set(mx / mlen, 0, mz / mlen); }
      else { dodgeDir.current.set(Math.sin(p.yaw), 0, Math.cos(p.yaw)); }
      dodgeTimer.current = 0.42;
      p.dodgeIframes = 0.5;
      stVal -= 25;
      sfx.dodge();
    }
    prevShift.current = rt.input.shift;

    let sprinting = false;
    if (rt.input.shift && wantsMove && !handsFull && dodgeTimer.current <= 0 && stVal > 0.5) {
      sprinting = true;
      stVal -= 9 * dt;
    }

    const guarding = blockHeld.current && !blockedByStory && !handsFull && stVal > 0.5;
    if (guarding) { blockTimer.current = 0.2; stVal -= 6 * dt; }
    p.blocking = guarding;

    let moveX = mx, moveZ = mz, moving = wantsMove;
    let speed = elder.carryingGrain ? SPEED * 0.75 : elder.carryingBody ? SPEED * 0.55 : SPEED;
    if (sprinting) speed *= 1.45;
    if (dodgeTimer.current > 0) {
      dodgeTimer.current -= dt;
      moveX = dodgeDir.current.x;
      moveZ = dodgeDir.current.z;
      speed = SPEED * 2.4;
      moving = true;
    }
    if (p.dodgeIframes > 0) p.dodgeIframes -= dt;
    if (p.invuln > 0) p.invuln -= dt;

    if (!sprinting && !guarding && dodgeTimer.current <= 0) stVal += 14 * dt;
    stVal = THREE.MathUtils.clamp(stVal, 0, 100);
    stAcc.current = stVal;
    const stR = Math.round(stVal);
    if (stR !== stWritten.current) {
      stWritten.current = stR;
      useElder.setState({ st: stR });
    }

    p.moving = moving;
    p.speed += ((moving?1:0) - p.speed) * (1 - Math.exp(-dt*16));

    // Movement
    if (moving) {
      const currentTop = elder.currentArea==="village" ? groundAtWorld(p.pos.x,p.pos.z) : INT_Y;
      const nx = p.pos.x + moveX * speed * dt;
      const nz = p.pos.z + moveZ * speed * dt;
      let canX = false, canZ = false;
      if (elder.currentArea==="village") {
        canX = canWalkWorld(nx, p.pos.z, currentTop) && !npcBlockedWorld(nx,p.pos.z);
        canZ = canWalkWorld(p.pos.x, nz, currentTop) && !npcBlockedWorld(p.pos.x,nz);
      } else {
        const interior = interiors[elder.currentArea];
        const inCave = elder.currentArea === "cave";
        if(inCave || interior){
          const map = inCave ? caveMap : interior.map, offX=INT_OFF_X, offZ=INT_OFF_Z;
          const check = (x:number,z:number)=>{
            if(inCave ? caveSolidAtWorld(x,z) : isInteriorSolidAt(map,x,z,offX,offZ)) return false;
            if(npcBlockedWorld(x,z)) return false;
            return true;
          };
          canX = check(nx,p.pos.z);
          canZ = check(p.pos.x,nz);
        }
      }
      if(canX) p.pos.x = nx;
      if(canZ) p.pos.z = nz;
      const targetYaw = Math.atan2(moveX,moveZ);
      let d=targetYaw - p.yaw; while(d>Math.PI) d-=Math.PI*2; while(d<-Math.PI) d+=Math.PI*2;
      p.yaw += d * (1 - Math.exp(-dt*14));
      phase.current += dt*11;
      stepTimer.current -= dt;
      if(stepTimer.current<=0){ stepTimer.current=0.30; sfx.step(); }
    } else {
      phase.current += dt*2.4;
    }

    // Ground Y
    let groundY = 0;
    if (elder.currentArea==="village") groundY = groundAtWorld(p.pos.x,p.pos.z);
    else groundY = INT_Y;
    p.pos.y += (groundY - p.pos.y) * (1 - Math.exp(-dt*15));

    // Rig Animations
    const isAttacking = attackTimer.current > 0;
    const isBlocking = blockTimer.current > 0;
    const swing=Math.sin(phase.current)*0.62*p.speed;
    if(legL.current) legL.current.rotation.x = swing;
    if(legR.current) legR.current.rotation.x = -swing;

    if (isAttacking) {
      if(armR.current) armR.current.rotation.x = -Math.PI * 0.45;
      if(armR.current) armR.current.rotation.y = Math.PI * 0.45;
      if(swordRef.current) swordRef.current.rotation.z = Math.PI * 0.4;
    } else if (isBlocking) {
      if(armL.current) armL.current.rotation.x = -Math.PI * 0.35;
      if(armR.current) armR.current.rotation.x = -Math.PI * 0.35;
      if(armL.current) armL.current.rotation.z = 0.4;
      if(armR.current) armR.current.rotation.z = -0.4;
    } else {
      if(armL.current) { armL.current.rotation.x = -swing*0.85; armL.current.rotation.z = 0; }
      if(armR.current) { armR.current.rotation.x = swing*0.85; armR.current.rotation.z = 0; armR.current.rotation.y = 0; }
      if(swordRef.current) swordRef.current.rotation.z = 0;
    }

    const bob=Math.abs(Math.sin(phase.current))*0.05*p.speed;
    const idle=(1-p.speed)*Math.sin(phase.current*0.9)*0.015;
    if (group.current) {
      group.current.position.set(p.pos.x, p.pos.y + bob + idle, p.pos.z);
      group.current.rotation.y = p.yaw;
    }

    // sword swing arc — bright at the strike, fading through the recovery
    if (swingArc.current) {
      const show = attackTimer.current > 0.12;
      swingArc.current.visible = show;
      if (show) {
        swingArc.current.position.set(p.pos.x, p.pos.y + 0.75, p.pos.z);
        swingArc.current.rotation.y = p.yaw;
        const mat = (swingArc.current.children[0] as THREE.Mesh).material as THREE.MeshBasicMaterial;
        mat.opacity = THREE.MathUtils.clamp(attackTimer.current * 3, 0, 0.95);
      }
    }

    // Camera
    const pitch=0.62, dist=46;
    desired.set(p.pos.x + Math.sin(yaw)*Math.cos(pitch)*dist, p.pos.y + Math.sin(pitch)*dist, p.pos.z + Math.cos(yaw)*Math.cos(pitch)*dist);
    if(!init.current){ init.current=true; camTarget.copy(p.pos); state.camera.position.copy(desired); }
    camTarget.lerp(p.pos,1-Math.exp(-dt*7));
    state.camera.position.lerp(desired,1-Math.exp(-dt*7));
    state.camera.lookAt(camTarget.x, camTarget.y+0.9, camTarget.z);
    const cam=state.camera as THREE.OrthographicCamera;
    if(Math.abs(cam.zoom - rt.cam.zoom)>0.01){ cam.zoom=rt.cam.zoom; cam.updateProjectionMatrix(); }

    // Area Transitions
    if (!blockedByStory) {
      if (elder.currentArea==="village") {
          for(const d of villageDoors){
            const dist=Math.hypot(d.x - p.pos.x, d.z - p.pos.z);
            if(dist<0.75){
              useElder.getState().setArea(d.interior, d.interior);
              // hearth rest: stepping inside mends wounds (+40 HP, docs)
              const nowInside = useElder.getState();
              if (nowInside.hp < 100) {
                useElder.setState({ hp: Math.min(100, nowInside.hp + 40) });
              }
              const offX=INT_OFF_X, offZ=INT_OFF_Z;
              p.pos.set(offX + 7 + 0.5, INT_Y, offZ + 8 + 0.5);
            p.yaw = Math.PI;
            camTarget.copy(p.pos);
            const yawSnap = rt.cam.yaw;
            const pitchSnap=0.62, distSnap=46;
            desired.set(p.pos.x + Math.sin(yawSnap)*Math.cos(pitchSnap)*distSnap, p.pos.y + Math.sin(pitchSnap)*distSnap, p.pos.z + Math.cos(yawSnap)*Math.cos(pitchSnap)*distSnap);
            state.camera.position.copy(desired);
            state.camera.lookAt(p.pos.x, p.pos.y+0.9, p.pos.z);
            init.current = true;
            sfx.door();
            break;
          }
        }
      } else {
        if (elder.currentArea === "cave") {
          // exit mat at the cave mouth — back out to the village
          const matX = INT_OFF_X + CAVE_LANDMARKS.exitMat.tx + 0.5;
          const matZ = INT_OFF_Z + CAVE_LANDMARKS.exitMat.ty + 0.5;
          if (Math.hypot(p.pos.x - matX, p.pos.z - matZ) < 0.65) {
            const wpSouth = eldervilleWorldPos(CAVE_TILE.tx, CAVE_TILE.ty + 1);
            useElder.getState().setArea("village", null);
            p.pos.set(wpSouth.x, wpSouth.y, wpSouth.z);
            camTarget.copy(p.pos);
            const yawSnap2 = rt.cam.yaw;
            const pitchSnap2 = 0.62, distSnap2 = 46;
            desired.set(p.pos.x + Math.sin(yawSnap2) * Math.cos(pitchSnap2) * distSnap2, p.pos.y + Math.sin(pitchSnap2) * distSnap2, p.pos.z + Math.cos(yawSnap2) * Math.cos(pitchSnap2) * distSnap2);
            state.camera.position.copy(desired);
            state.camera.lookAt(p.pos.x, p.pos.y + 0.9, p.pos.z);
            init.current = true;
            sfx.door();
          }
        }
        const interior = interiors[elder.currentArea];
        if(interior){
          const offX=INT_OFF_X, offZ=INT_OFF_Z;
          const matX = offX + 7 + 0.5, matZ = offZ + 9 + 0.5;
          const isHome = elder.currentArea==="home" && !elder.tinslaireInsideTalked;
          if(Math.hypot(p.pos.x - matX, p.pos.z - matZ) < 0.65){
            if(isHome){
              p.pos.set(offX + 7 + 0.5, INT_Y, offZ + 8 + 0.5);
              if(!elder.activeDialog) useElder.getState().showDialog({name:"Tinslaire", lines:["Minslaire! Wait — the elders are at the door! Talk to me first!"]}, "blockExit");
            } else {
              const outside = interior.outside;
              const wpSouth = eldervilleWorldPos(outside[0], outside[1] + 1);
              useElder.getState().setArea("village", null);
              p.pos.set(wpSouth.x, wpSouth.y, wpSouth.z);
              camTarget.copy(p.pos);
              const yawSnap2 = rt.cam.yaw;
              const pitchSnap2=0.62, distSnap2=46;
              desired.set(p.pos.x + Math.sin(yawSnap2)*Math.cos(pitchSnap2)*distSnap2, p.pos.y + Math.sin(pitchSnap2)*distSnap2, p.pos.z + Math.cos(yawSnap2)*Math.cos(pitchSnap2)*distSnap2);
              state.camera.position.copy(desired);
              state.camera.lookAt(p.pos.x, p.pos.y+0.9, p.pos.z);
              init.current = true;
              sfx.door();
            }
          }
        }
      }
    }

    // Interaction Detection
    let prompt: string | null = null;
    let bestDist = 1.7;
    let bestDialog: { dlg: any; source: string } | null = null;
    const isNight = rt.env.night > 0.45;

    if (elder.currentArea==="home") {
      const offX=INT_OFF_X, offZ=INT_OFF_Z;
      if (!elder.eldersDoorDialogDone) {
        const tx = offX + 6 + 0.5, tz = offZ + 5 + 0.5;
        const d=Math.hypot(tx - p.pos.x, tz - p.pos.z);
        if(d<bestDist){
          bestDist=d;
          const spoken = elder.spoken.has("tinslaireInside");
          bestDialog = { dlg: spoken? tinslaireInsideRepeat : tinslaireInsideDialog, source: "tinslaireInside" };
          prompt = "E · Talk";
        }
      } else if (isNight) {
        const tx = offX + 4 + 0.5, tz = offZ + 4 + 0.5;
        const d=Math.hypot(tx - p.pos.x, tz - p.pos.z);
        if(d<bestDist){
          bestDist=d;
          const spoken = elder.spoken.has("tinslaireNight");
          bestDialog = { dlg: spoken? tinslaireNightRepeat : tinslaireNightDialog, source: "tinslaireNight" };
          prompt = "E · Talk";
        }
      }
      // Sword Case
      for(const [sx,sz] of [[9,3],[9,4]]){
        const cx=offX+sx+0.5, cz=offZ+sz+0.5;
        if(Math.hypot(cx-p.pos.x, cz-p.pos.z) < 1.2){
          if(1.0 < bestDist){
            bestDist=1.0;
            if (elder.combatTrialState === "completed") {
              prompt = "E · Take Father's Blade";
              bestDialog = {
                dlg: {
                  name: "Sword Case",
                  lines: [
                    "The glass case sighs open. You lift your father's blade.",
                    "The balance is perfect. The sheath clicks. You are ready to enter the Outskirts Cave!",
                  ],
                },
                source: "swordTaken",
              };
            } else {
              prompt = "E · Inspect Sword Case";
              bestDialog = { dlg: swordCaseDialog, source:"swordCase"};
            }
          }
        }
      }
    } else if (elder.currentArea === "council") {
      const offX = INT_OFF_X, offZ = INT_OFF_Z;
      // Study Desk
      const deskDist = Math.hypot(offX + 6 + 0.5 - p.pos.x, offZ + 4 + 0.5 - p.pos.z);
      if (deskDist < 1.6 && deskDist < bestDist) {
        bestDist = deskDist;
        prompt = "E · Read Study Notes";
        bestDialog = { dlg: scholarDeskClueDialog, source: "scholarDeskClue" };
      }
      // Archive Bookcase
      const shelfDist = Math.hypot(offX + 7 + 0.5 - p.pos.x, offZ + 1 + 0.5 - p.pos.z);
      if (shelfDist < 1.6 && shelfDist < bestDist) {
        bestDist = shelfDist;
        if (elder.scholarTrialState === "puzzle_solved" || elder.scholarTrialState === "completed") {
          prompt = "E · Inspect Archive";
          bestDialog = {
            dlg: {
              name: "Archive Shelf",
              lines: ["The ancient bookcase glass casing is open. The scroll has already been safely retrieved."],
            },
            source: "shelfDone",
          };
        } else {
          prompt = "E · Solve Archive Lock";
          bestDialog = { dlg: null, source: "openScholarPuzzle" };
        }
      }
    } else if (elder.currentArea === "homesteadA") {
      // Widow Oren inside her home
      const offX = INT_OFF_X, offZ = INT_OFF_Z;
      const widowDist = Math.hypot(offX + 6 + 0.5 - p.pos.x, offZ + 6 + 0.5 - p.pos.z);
      if (widowDist < 1.6 && widowDist < bestDist) {
        bestDist = widowDist;
        if (elder.carryingGrain) {
          prompt = "E · Deliver Harvest Grain";
          bestDialog = { dlg: widowOrenDeliverDialog, source: "widowDeliverFlow" };
        } else if (elder.widowTrialState === "delivered" || elder.widowTrialState === "completed") {
          prompt = "E · Talk to Widow Oren";
          bestDialog = { dlg: widowOrenBlessedDialog, source: "widowBlessed" };
        } else {
          prompt = "E · Talk to Widow Oren";
          bestDialog = { dlg: { name: "Widow Oren", lines: ["Welcome, child. The winter chill creeps through the floorboards..."] }, source: "widowNormal" };
        }
      }
    } else if (elder.currentArea === "cave") {
      // the fallen machine — Moss said to bring back the body
      if (elder.caveStage === "boss_defeated" && !elder.carryingBody) {
        const bp = rt.boss.pos;
        const bDist = Math.hypot(bp.x - p.pos.x, bp.z - p.pos.z);
        if (bDist < bestDist && bDist < 2.0) {
          bestDist = bDist;
          prompt = "E · Lift the Machine Body";
          bestDialog = { dlg: caveBodyLiftDialog, source: "bodyLift" };
        }
      }
    } else if (elder.currentArea==="village") {
      // Door elders
      if(elder.eldersAtDoorReady && !elder.eldersDoorDialogDone){
        for(const e of eldersAtDoorPositions){
          const wp=eldervilleWorldPos(e.tx,e.ty);
          const d=Math.hypot(wp.x-p.pos.x, wp.z-p.pos.z);
          if(d<bestDist){
            bestDist=d;
            const dlg = elder.spoken.has("elderMossDoor")? elderMossDoorRepeat: elderMossDoorDialog;
            bestDialog={dlg, source:"elderMossDoor"};
            prompt="E · Talk";
          }
        }
      } else if (elder.eldersDoorDialogDone) {
        // Elder Moss @ Central Well [59, 35]
        const mossPos = eldervilleWorldPos(59, 35);
        const mossDist = Math.hypot(mossPos.x - p.pos.x, mossPos.z - p.pos.z);
        if (mossDist < bestDist) {
          bestDist = mossDist;
          prompt = "E · Talk to Elder Moss";
          if (elder.wellTrialState === "not_started") {
            bestDialog = { dlg: elderMossWellIntroDialog, source: "elderMossWellIntro" };
          } else if (elder.wellTrialState === "assigned") {
            bestDialog = { dlg: elderMossWellAssignedRepeat, source: "elderMossWellAssigned" };
          } else if (elder.wellTrialState === "inspected") {
            bestDialog = { dlg: elderMossWellReportDialog, source: "elderMossWellReport" };
          } else {
            bestDialog = { dlg: elderMossWellCompletedRepeat, source: "elderMossWellCompleted" };
          }
        }

        // Central Well @ [58, 36]
        const wellPos = eldervilleWorldPos(58, 36);
        const wellDist = Math.hypot(wellPos.x - p.pos.x, wellPos.z - p.pos.z);
        if (wellDist < bestDist && wellDist < 1.6) {
          bestDist = wellDist;
          if (elder.wellTrialState === "assigned") {
            prompt = "E · Inspect Well";
            bestDialog = { dlg: wellInspectDialog, source: "wellInspect" };
          } else if (elder.wellTrialState === "inspected") {
            prompt = "E · Listen to Well";
            bestDialog = { dlg: { name: "Central Well", lines: ["The rhythmic mechanical clanking continues to echo from below...", "Report what you heard back to Elder Moss."] }, source: "wellInspected" };
          } else if (elder.wellTrialState === "completed") {
            prompt = "E · Inspect Well";
            bestDialog = { dlg: { name: "Central Well", lines: ["The Central Well. The distant underground hum remains, faint but steady.", "Elder Moss insisted there is nothing down there..."] }, source: "wellDone" };
          } else {
            prompt = "E · Inspect Well";
            bestDialog = { dlg: { name: "Central Well", lines: ["The Central Well of Elderville. Cold, clear water reflects the sky.", "Speak with Elder Moss beside the well to begin your trial."] }, source: "wellNormal" };
          }
        }

        // Elder Sage @ Council Hall [32, 12]
        const sagePos = eldervilleWorldPos(32, 12);
        const sageDist = Math.hypot(sagePos.x - p.pos.x, sagePos.z - p.pos.z);
        if (sageDist < bestDist) {
          bestDist = sageDist;
          prompt = "E · Talk to Elder Sage";
          if (elder.wellTrialState !== "completed") {
            bestDialog = {
              dlg: { name: "Elder Sage", lines: ["First, you must complete Elder Moss's trial at the Central Well on the southern outskirts."] },
              source: "sageWait",
            };
          } else if (elder.scholarTrialState === "not_started") {
            bestDialog = { dlg: elderSageStudyIntroDialog, source: "elderSageStudyIntro" };
          } else if (elder.scholarTrialState === "assigned" || elder.scholarTrialState === "desk_read") {
            bestDialog = { dlg: elderSageStudyAssignedRepeat, source: "elderSageStudyAssigned" };
          } else if (elder.scholarTrialState === "puzzle_solved") {
            bestDialog = { dlg: elderSageStudyDeliverDialog, source: "elderSageStudyDeliver" };
          } else {
            bestDialog = { dlg: elderSageStudyCompletedRepeat, source: "elderSageStudyCompleted" };
          }
        }

        // Elder Thorn @ Western Homestead Path [16, 26]
        const thornPos = eldervilleWorldPos(16, 26);
        const thornDist = Math.hypot(thornPos.x - p.pos.x, thornPos.z - p.pos.z);
        if (thornDist < bestDist) {
          bestDist = thornDist;
          prompt = "E · Talk to Elder Thorn";
          if (elder.scholarTrialState !== "completed") {
            bestDialog = {
              dlg: { name: "Elder Thorn", lines: ["Complete Elder Sage's trial at the Council Hall before testing the heart."] },
              source: "thornWait",
            };
          } else if (elder.widowTrialState === "not_started") {
            bestDialog = { dlg: elderThornIntroDialog, source: "elderThornIntro" };
          } else if (elder.widowTrialState === "assigned" || elder.widowTrialState === "grain_picked") {
            bestDialog = { dlg: elderThornAssignedRepeat, source: "elderThornAssigned" };
          } else if (elder.widowTrialState === "delivered") {
            bestDialog = { dlg: elderThornCompleteDialog, source: "elderThornComplete" };
          } else {
            bestDialog = { dlg: elderThornCompletedRepeat, source: "elderThornCompleted" };
          }
        }

        // Grain Sack in Grand Gardens @ [30, 36]
        if (elder.widowTrialState === "assigned" && !elder.carryingGrain) {
          const grainPos = eldervilleWorldPos(30, 36);
          const grainDist = Math.hypot(grainPos.x - p.pos.x, grainPos.z - p.pos.z);
          if (grainDist < bestDist && grainDist < 1.6) {
            bestDist = grainDist;
            prompt = "E · Lift Grain Sack";
            bestDialog = { dlg: gardenGrainPickupDialog, source: "gardenGrainPickup" };
          }
        }

        // Bazaar Trader @ Marketplace [15, 40]
        const traderPos = eldervilleWorldPos(15, 40);
        const traderDist = Math.hypot(traderPos.x - p.pos.x, traderPos.z - p.pos.z);
        if (traderDist < bestDist) {
          bestDist = traderDist;
          prompt = "E · Trade Provisions";
          if (elder.widowTrialState !== "completed") {
            bestDialog = {
              dlg: { name: "Bazaar Trader", lines: ["Welcome to the Bazaar! Complete your character trials before we pack your expedition kit."] },
              source: "traderWait",
            };
          } else if (elder.marketTrialState === "not_started") {
            bestDialog = { dlg: traderIntroDialog, source: "traderIntro" };
          } else if (elder.marketTrialState === "overpaid") {
            prompt = "E · Return 50 Extra Silver";
            bestDialog = { dlg: traderHonestyReturnDialog, source: "traderReturn" };
          } else {
            prompt = "E · Talk to Trader";
            bestDialog = { dlg: traderCompletedRepeat, source: "traderDone" };
          }
        }

        // Council Combat Initiation @ Blue House Courtyard [36, 6]
        if (elder.marketTrialState === "completed" && elder.combatTrialState === "not_started") {
          const councilPos = eldervilleWorldPos(36, 6);
          const cDist = Math.hypot(councilPos.x - p.pos.x, councilPos.z - p.pos.z);
          if (cDist < bestDist && cDist < 2.2) {
            bestDist = cDist;
            prompt = "E · Council Blade Trial";
            bestDialog = { dlg: councilCombatTrialDialog, source: "councilCombatTrial" };
          }
        }

        // Forge delivery — haul the machine body to Elder Sage's anvil
        if (elder.carryingBody) {
          const forgePos = eldervilleWorldPos(FORGE_TILE.tx, FORGE_TILE.ty);
          const fDist = Math.hypot(forgePos.x - p.pos.x, forgePos.z - p.pos.z);
          if (fDist < bestDist && fDist < 2.2) {
            bestDist = fDist;
            prompt = "E · Deliver the Machine to the Forge";
            bestDialog = { dlg: forgeDeliverDialog, source: "forgeDeliver" };
          }
        }

        // Outskirts Cave @ north end of the eastern gate road
        const cavePos = eldervilleWorldPos(CAVE_TILE.tx, CAVE_TILE.ty);
        const caveDist = Math.hypot(cavePos.x - p.pos.x, cavePos.z - p.pos.z);
        if (caveDist < bestDist && caveDist < 2.2) {
          bestDist = caveDist;
          if (elder.hasSword) {
            prompt = "E · Enter the Outskirts Cave";
            bestDialog = { dlg: outskirtsCaveEnterDialog, source: "caveEnter" };
          } else if (elder.combatTrialState === "completed") {
            prompt = "E · Peer Into the Dark";
            bestDialog = {
              dlg: {
                name: "Outskirts Cave",
                lines: [
                  "The cave mouth exhales cold, machine-tinged air.",
                  "Without your father's blade at your side, you are not ready. Retrieve it from the Red House sword case.",
                ],
              },
              source: "caveLocked",
            };
          } else {
            prompt = "E · Peer Into the Dark";
            bestDialog = {
              dlg: {
                name: "Outskirts Cave",
                lines: [
                  "A dark maw in the hillside where the forest begins. Something stirs inside.",
                  "The Council's trials come first — prove your virtue, then your steel.",
                ],
              },
              source: "caveNormal",
            };
          }
        }
      }

      // Tinslaire in Village during daytime
      if (elder.eldersDoorDialogDone && !isNight) {
        const d=Math.hypot(rt.tinslaire.pos.x - p.pos.x, rt.tinslaire.pos.z - p.pos.z);
        if(d<bestDist){
          bestDist=d;
          // Trial 4 is the one trial Tinslaire is present for. While the extra
          // silver is in your pouch he argues to keep it; once you hand it back
          // he goes quiet and tells you he'll remember. That memory is what
          // Act II's fall is measured against, so it takes priority over his
          // ordinary village chatter.
          if (elder.marketTrialState === "overpaid") {
            bestDialog={ dlg: tinslaireTemptationDialog, source: "tinslaireTemptation" };
            prompt="E · Tinslaire is tugging your sleeve";
          } else if (elder.marketTrialState === "completed" && !elder.spoken.has("tinslaireHonestyWitness")) {
            bestDialog={ dlg: tinslaireHonestyWitnessDialog, source: "tinslaireHonestyWitness" };
            prompt="E · Tinslaire is unusually quiet";
          } else {
            const spoken=elder.spoken.has("tinslaireVillage");
            bestDialog={ dlg: spoken? tinslaireVillageRepeat : tinslaireVillageDialog, source: "tinslaireVillage" };
            prompt="E · Talk to Tinslaire";
          }
        }
      }
    }

    // Show prompt via useUI
    if(!elder.activeDialog && !elder.scholarPuzzleOpen && prompt) ui.setPrompt(prompt);
    else if(!elder.activeDialog) ui.setPrompt(null);

    // Handle Interact
    if(rt.input.interact){
      rt.input.interact=false;
      if (elder.scholarPuzzleOpen) {
        // modal handles inputs
      } else if(elder.activeDialog){
        useElder.getState().advanceDialog();
        sfx.ui();
      } else if(bestDialog){
        if (bestDialog.source === "openScholarPuzzle") {
          useElder.getState().setScholarPuzzleOpen(true);
          sfx.ui();
        } else {
          useElder.getState().showDialog(bestDialog.dlg, bestDialog.source);
          if (bestDialog.source === "wellInspect") {
            sfx.machineRumble();
          } else if (
            bestDialog.source === "elderMossWellReport" ||
            bestDialog.source === "elderSageStudyDeliver" ||
            bestDialog.source === "elderThornComplete" ||
            bestDialog.source === "traderReturn"
          ) {
            sfx.talk();
            sfx.questComplete();
          } else {
            sfx.talk();
          }
        }
      }
    }
  });

  // Player Mesh with sheathed sword, life-suit bio-glow, arms, legs
  return (
    <group>
      <Arrows />
      {/* sword swing arc (world-space, follows the player) */}
      <group ref={swingArc} visible={false}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.62, 1.05, 12, 1, -Math.PI / 2 - 1.1, 2.2]} />
          <meshBasicMaterial color="#ffe9a8" transparent opacity={0.9} side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
      </group>
      <group ref={group}>
        <group ref={legL} position={[0.13,0.36,0]}>
        <mesh position={[0,-0.18,0]} castShadow><boxGeometry args={[0.18,0.38,0.18]} /><meshLambertMaterial color="#2f3d6b" /></mesh>
        <mesh position={[0,-0.38,0.03]} castShadow><boxGeometry args={[0.2,0.1,0.24]} /><meshLambertMaterial color="#33281f" /></mesh>
      </group>
      <group ref={legR} position={[-0.13,0.36,0]}>
        <mesh position={[0,-0.18,0]} castShadow><boxGeometry args={[0.18,0.38,0.18]} /><meshLambertMaterial color="#2f3d6b" /></mesh>
        <mesh position={[0,-0.38,0.03]} castShadow><boxGeometry args={[0.2,0.1,0.24]} /><meshLambertMaterial color="#33281f" /></mesh>
      </group>
      {/* Tunic & Chestplate */}
      <mesh position={[0,0.58,0]} castShadow receiveShadow><boxGeometry args={[0.5,0.46,0.3]} /><meshLambertMaterial color="#e2544f" /></mesh>
      <mesh position={[0,0.78,0]} castShadow><boxGeometry args={[0.54,0.1,0.34]} /><meshLambertMaterial color="#f4e7c9" /></mesh>
      {/* Glowing Bio-membrane Suit Core (Center Chest) */}
      <mesh position={[0,0.62,0.16]}>
        <boxGeometry args={[0.18,0.22,0.02]} />
        <meshBasicMaterial color="#70d6ff" />
      </mesh>
      {/* Back Life Suit Filtration Pack */}
      <mesh position={[0,0.64,-0.18]} castShadow>
        <boxGeometry args={[0.28,0.32,0.12]} />
        <meshLambertMaterial color="#222838" />
      </mesh>
      <mesh position={[0,0.68,-0.25]}>
        <boxGeometry args={[0.12,0.12,0.04]} />
        <meshBasicMaterial color="#50c8ff" />
      </mesh>

      {/* Sheathed Sword on Back */}
      <group ref={swordRef} position={[0.18, 0.65, -0.22]} rotation={[0, 0, -0.25]}>
        {/* Scabbard / Sheath */}
        <mesh position={[0, -0.15, 0]} castShadow>
          <boxGeometry args={[0.08, 0.7, 0.05]} />
          <meshLambertMaterial color="#684830" />
        </mesh>
        {/* Gold Trim */}
        <mesh position={[0, 0.18, 0]}>
          <boxGeometry args={[0.14, 0.06, 0.07]} />
          <meshLambertMaterial color="#e8b040" />
        </mesh>
        {/* Hilt / Handle */}
        <mesh position={[0, 0.32, 0]} castShadow>
          <boxGeometry args={[0.06, 0.22, 0.05]} />
          <meshLambertMaterial color="#302018" />
        </mesh>
        {/* Pommel */}
        <mesh position={[0, 0.45, 0]}>
          <boxGeometry args={[0.1, 0.06, 0.07]} />
          <meshLambertMaterial color="#e8b040" />
        </mesh>
      </group>

      {/* Arms */}
      <group ref={armL} position={[0.32,0.76,0]}>
        <mesh position={[0,-0.17,0]} castShadow><boxGeometry args={[0.14,0.36,0.16]} /><meshLambertMaterial color="#c9433f" /></mesh>
        <mesh position={[0,-0.38,0]} castShadow><boxGeometry args={[0.15,0.12,0.17]} /><meshLambertMaterial color="#f0b98d" /></mesh>
      </group>
      <group ref={armR} position={[-0.32,0.76,0]}>
        <mesh position={[0,-0.17,0]} castShadow><boxGeometry args={[0.14,0.36,0.16]} /><meshLambertMaterial color="#c9433f" /></mesh>
        <mesh position={[0,-0.38,0]} castShadow><boxGeometry args={[0.15,0.12,0.17]} /><meshLambertMaterial color="#f0b98d" /></mesh>
      </group>

      {/* Hauled machine chassis — slung on the back, eye still ticking */}
      {carryingBody && (
        <group position={[0, 0.88, -0.46]} rotation={[0.16, 0, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.62, 0.5, 0.44]} />
            <meshLambertMaterial color="#7a4f34" />
          </mesh>
          <mesh position={[0.2, 0.16, 0.2]}>
            <boxGeometry args={[0.22, 0.16, 0.18]} />
            <meshLambertMaterial color="#5f4028" />
          </mesh>
          <mesh position={[0.05, 0.27, 0.05]}>
            <boxGeometry args={[0.1, 0.08, 0.04]} />
            <meshBasicMaterial color="#ff2030" toneMapped={false} />
          </mesh>
        </group>
      )}

      {/* Head & Hair */}
      <mesh position={[0,1.02,0]} castShadow><boxGeometry args={[0.42,0.4,0.4]} /><meshLambertMaterial color="#f0b98d" /></mesh>
      <mesh position={[0.1,1.06,0.21]}><boxGeometry args={[0.07,0.09,0.02]} /><meshLambertMaterial color="#241a14" /></mesh>
      <mesh position={[-0.1,1.06,0.21]}><boxGeometry args={[0.07,0.09,0.02]} /><meshLambertMaterial color="#241a14" /></mesh>
      <mesh position={[0,1.27,0]} castShadow><boxGeometry args={[0.46,0.14,0.44]} /><meshLambertMaterial color="#3f8f57" /></mesh>
      <mesh position={[0,1.19,0.28]} castShadow><boxGeometry args={[0.44,0.06,0.16]} /><meshLambertMaterial color="#2f6b41" /></mesh>
      <mesh position={[0,1.36,0]} castShadow><boxGeometry args={[0.12,0.08,0.12]} /><meshLambertMaterial color="#ffd75e" /></mesh>
      </group>
    </group>
  );
}
