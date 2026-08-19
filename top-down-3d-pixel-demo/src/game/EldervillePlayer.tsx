import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { groundAtWorld, isBlocked, interiors, eldervilleWorldPos, villageDoors, archeryTargets, CAVE_TILE, FORGE_TILE, caveMap, caveSolidAt, CAVE_LANDMARKS } from "./world";
import { rt, useUI } from "./state";
import { isUnlocked, lockedHint, type TrialId } from "./quests";
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
  watchIntroDialog,
  watchLedgerDialog,
  watchWrongDialog,
  watchLitDialog,
  watchCompleteDialog,
  sluiceIntroDialog,
  sluiceNoteDialog,
  sluiceSolvedDialog,
  sluiceCompleteDialog,
  blightIntroDialog,
  blightRowCleanDialog,
  blightRowRotDialog,
  blightCompleteDialog,
  tallyIntroDialog,
  tallyLedgerDialog,
  tallySackDialog,
  tallyCompleteDialog,
  musterIntroDialog,
  musterCallGuardDialog,
  musterCallDodgeDialog,
  musterCallStrikeDialog,
  musterCompleteDialog,
  scrapIntroDialog,
  scrapEngageDialog,
  scrapClearedDialog,
  scrapCompleteDialog,
  type Dialog,
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

/** Trial 10's three quarry constructs, in village tiles. */
export const SCRAP_TILES: [number, number][] = [[61, 60], [67, 61], [63, 65]];

function stepArrows(dt: number) {
  const elder = useElder.getState();
  const dummyCoords = [eldervilleWorldPos(34, 6), eldervilleWorldPos(36, 6), eldervilleWorldPos(38, 6)];
  const scrapCoords = SCRAP_TILES.map(([tx, ty]) => eldervilleWorldPos(tx, ty));
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
      // Trial 10 — the quarry constructs take arrows too
      if (!dead && elder.scrapTrialState === "assigned") {
        scrapCoords.forEach((c, si) => {
          if (!dead && elder.scrapHealth[si] > 0 && Math.hypot(c.x - a.x, c.z - a.z) < 0.8) {
            const before = useElder.getState().scrapTrialState;
            useElder.getState().damageScrap(si, ARROW_DMG);
            sfx.hit();
            if (before === "assigned" && useElder.getState().scrapTrialState === "inspected") sfx.questComplete();
            dead = true;
          }
        });
      }
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
          // Trial 10 — quarry constructs are melee targets as well
          if (elder.scrapTrialState === "assigned") {
            SCRAP_TILES.forEach(([stx, sty], si) => {
              if (elder.scrapHealth[si] <= 0) return;
              const sp = eldervilleWorldPos(stx, sty);
              const sd = Math.hypot(sp.x - p.pos.x, sp.z - p.pos.z);
              if (sd < 1.9) {
                const dot = ((sp.x - p.pos.x) * facingX + (sp.z - p.pos.z) * facingZ) / (sd || 1);
                if (dot > 0.3) {
                  const before = useElder.getState().scrapTrialState;
                  useElder.getState().damageScrap(si, 20);
                  sfx.hit();
                  if (before === "assigned" && useElder.getState().scrapTrialState === "inspected") sfx.questComplete();
                }
              }
            });
          }

          const dummyCoords = [
            eldervilleWorldPos(34, 6),
            eldervilleWorldPos(36, 6),
            eldervilleWorldPos(38, 6),
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
    } else if (elder.currentArea === "watchhouse") {
      // Trial 5: the watch roster board
      const offX = INT_OFF_X, offZ = INT_OFF_Z;
      const d = Math.hypot(offX + 7 + 0.5 - p.pos.x, offZ + 4 + 0.5 - p.pos.z);
      if (d < 1.8 && d < bestDist) {
        bestDist = d;
        prompt = "E · Read the Watch Roster";
        bestDialog = { dlg: watchLedgerDialog, source: "watchLedger" };
      }
    } else if (elder.currentArea === "granary") {
      // Trial 8: the tally board and the four sacks
      const offX = INT_OFF_X, offZ = INT_OFF_Z;
      const boardD = Math.hypot(offX + 3 + 0.5 - p.pos.x, offZ + 5 + 0.5 - p.pos.z);
      if (boardD < 1.8 && boardD < bestDist) {
        bestDist = boardD;
        prompt = "E · Read the Tally Board";
        bestDialog = { dlg: tallyLedgerDialog, source: "tallyLedger" };
      }
      if (elder.tallyTrialState === "assigned") {
        ([[2, 2], [11, 2], [2, 6], [10, 6]] as [number, number][]).forEach(([sx, sy], i) => {
          if (elder.sacksWeighed[i]) return;
          const sd = Math.hypot(offX + sx + 0.5 - p.pos.x, offZ + sy + 0.5 - p.pos.z);
          if (sd < 1.7 && sd < bestDist) {
            bestDist = sd;
            prompt = `E · Weigh sack ${i + 1}/4`;
            bestDialog = { dlg: tallySackDialog, source: `tallySack:${i}` };
          }
        });
      }
    } else if (elder.currentArea === "orchardHut") {
      // Trial 7: the Orchard Keeper
      const offX = INT_OFF_X, offZ = INT_OFF_Z;
      const d = Math.hypot(offX + 6 + 0.5 - p.pos.x, offZ + 6 + 0.5 - p.pos.z);
      if (d < 1.8 && d < bestDist) {
        bestDist = d;
        prompt = "E · Talk to the Orchard Keeper";
        if (!isUnlocked(elder, "blight")) {
          bestDialog = { dlg: { name: "Orchard Keeper", lines: [lockedHint(elder, "blight")] }, source: "locked:blight" };
        } else if (elder.blightTrialState === "not_started") {
          bestDialog = { dlg: blightIntroDialog, source: "blightIntro" };
        } else if (elder.blightTrialState === "assigned") {
          bestDialog = { dlg: { name: "Orchard Keeper", lines: ["All three rows, boy. Hand in the soil. Then come back."] }, source: "blightWait" };
        } else if (elder.blightTrialState === "inspected") {
          bestDialog = { dlg: blightCompleteDialog, source: "blightComplete" };
        } else {
          bestDialog = { dlg: { name: "Orchard Keeper", lines: ["Say nothing about the middle row. To anyone."] }, source: "blightDone" };
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
        /**
         * Village interactions.
         *
         * Every task-giver below is wrapped in `gate(...)`, which consults the
         * quest spine in quests.ts. A giver whose trial is not yet unlocked
         * still talks to you — they just say what they are waiting on instead
         * of handing out a task. That single rule is what stops the player from
         * walking to trial 11 during trial 2; there is no longer a per-trial
         * conditional that can be forgotten.
         */
        const gate = (
          id: TrialId,
          near: { x: number; z: number },
          label: string,
          build: () => { dlg: Dialog; source: string } | null,
        ) => {
          const d = Math.hypot(near.x - p.pos.x, near.z - p.pos.z);
          if (d >= bestDist) return;
          if (!isUnlocked(elder, id)) {
            bestDist = d;
            prompt = label;
            bestDialog = {
              dlg: { name: "Elderville", lines: [lockedHint(elder, id)] },
              source: `locked:${id}`,
            };
            return;
          }
          const built = build();
          if (!built) return;
          bestDist = d;
          prompt = label;
          bestDialog = built;
        };

        // ---- Trial 1: Elder Moss @ Central Well ---------------------------
        gate("well", eldervilleWorldPos(59, 35), "E · Talk to Elder Moss", () => {
          if (elder.wellTrialState === "not_started") return { dlg: elderMossWellIntroDialog, source: "elderMossWellIntro" };
          if (elder.wellTrialState === "assigned") return { dlg: elderMossWellAssignedRepeat, source: "elderMossWellAssigned" };
          if (elder.wellTrialState === "inspected") return { dlg: elderMossWellReportDialog, source: "elderMossWellReport" };
          // Moss also runs Trial 8; once the well is done he switches to the tally.
          if (isUnlocked(elder, "tally") && !elder.spoken.has("tallyComplete")) {
            if (elder.tallyTrialState === "not_started") return { dlg: tallyIntroDialog, source: "tallyIntro" };
            if (elder.tallyTrialState === "inspected") return { dlg: tallyCompleteDialog, source: "tallyComplete" };
            if (elder.tallyTrialState === "assigned")
              return { dlg: { name: "Elder Moss", lines: ["Read the board, weigh all four sacks, then bring me the number."] }, source: "tallyWait" };
          }
          return { dlg: elderMossWellCompletedRepeat, source: "elderMossWellCompleted" };
        });

        // Central Well itself
        {
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
        }

        // ---- Trial 2 / 6 / 10: Elder Sage @ Council Hall ------------------
        gate("scholar", eldervilleWorldPos(32, 12), "E · Talk to Elder Sage", () => {
          if (elder.scholarTrialState === "not_started") return { dlg: elderSageStudyIntroDialog, source: "elderSageStudyIntro" };
          if (elder.scholarTrialState === "assigned" || elder.scholarTrialState === "desk_read") return { dlg: elderSageStudyAssignedRepeat, source: "elderSageStudyAssigned" };
          if (elder.scholarTrialState === "puzzle_solved") return { dlg: elderSageStudyDeliverDialog, source: "elderSageStudyDeliver" };
          // Sage also runs Trial 6 (cistern) and Trial 10 (quarry scrap).
          if (isUnlocked(elder, "sluice") && elder.sluiceTrialState === "not_started") return { dlg: sluiceIntroDialog, source: "sluiceIntro" };
          if (isUnlocked(elder, "sluice") && elder.sluiceTrialState === "assigned")
            return { dlg: { name: "Elder Sage", lines: ["Head gate feeds. Middle gate holds. Last gate throttled. Go and set them."] }, source: "sluiceWait" };
          if (isUnlocked(elder, "scrap") && elder.scrapTrialState === "not_started") return { dlg: scrapIntroDialog, source: "scrapIntro" };
          if (isUnlocked(elder, "scrap") && elder.scrapTrialState === "assigned")
            return { dlg: { name: "Elder Sage", lines: ["Three of them, in the quarry. Bring me a fragment when it is done."] }, source: "scrapWait" };
          if (isUnlocked(elder, "scrap") && elder.scrapTrialState === "inspected") return { dlg: scrapCompleteDialog, source: "scrapComplete" };
          return { dlg: elderSageStudyCompletedRepeat, source: "elderSageStudyCompleted" };
        });

        // ---- Trial 3 / 5 / 9: Elder Thorn @ homestead path ----------------
        gate("widow", eldervilleWorldPos(16, 26), "E · Talk to Elder Thorn", () => {
          if (elder.widowTrialState === "not_started") return { dlg: elderThornIntroDialog, source: "elderThornIntro" };
          if (elder.widowTrialState === "assigned" || elder.widowTrialState === "grain_picked") return { dlg: elderThornAssignedRepeat, source: "elderThornAssigned" };
          if (elder.widowTrialState === "delivered") return { dlg: elderThornCompleteDialog, source: "elderThornComplete" };
          // Thorn also runs Trial 5 (the watch) and Trial 9 (the muster).
          if (isUnlocked(elder, "watch") && elder.watchTrialState === "not_started") return { dlg: watchIntroDialog, source: "watchIntro" };
          if (isUnlocked(elder, "watch") && elder.watchTrialState === "assigned")
            return { dlg: { name: "Elder Thorn", lines: ["The roster is in the Watchhouse. Read it, then light the rampart."] }, source: "watchWait" };
          if (isUnlocked(elder, "watch") && elder.watchTrialState === "inspected") return { dlg: watchCompleteDialog, source: "watchComplete" };
          return { dlg: elderThornCompletedRepeat, source: "elderThornCompleted" };
        });

        // Grain Sack in Grand Gardens
        if (elder.widowTrialState === "assigned" && !elder.carryingGrain) {
          const grainPos = eldervilleWorldPos(30, 36);
          const grainDist = Math.hypot(grainPos.x - p.pos.x, grainPos.z - p.pos.z);
          if (grainDist < bestDist && grainDist < 1.6) {
            bestDist = grainDist;
            prompt = "E · Lift Grain Sack";
            bestDialog = { dlg: gardenGrainPickupDialog, source: "gardenGrainPickup" };
          }
        }

        // ---- Trial 4: Bazaar Trader ---------------------------------------
        gate("market", eldervilleWorldPos(15, 40), "E · Trade Provisions", () => {
          if (elder.marketTrialState === "not_started") return { dlg: traderIntroDialog, source: "traderIntro" };
          if (elder.marketTrialState === "overpaid") {
            prompt = "E · Return 50 Extra Silver";
            return { dlg: traderHonestyReturnDialog, source: "traderReturn" };
          }
          return { dlg: traderCompletedRepeat, source: "traderDone" };
        });

        // ---- Trial 5: the three signal braziers on the north rampart ------
        if (elder.watchTrialState === "assigned") {
          const spots: [number, number][] = [[32, 4], [36, 4], [40, 4]];
          const names = ["West Brazier", "East Brazier", "Centre Brazier"];
          spots.forEach(([bx, by], i) => {
            const bp = eldervilleWorldPos(bx, by);
            const bd = Math.hypot(bp.x - p.pos.x, bp.z - p.pos.z);
            if (bd < bestDist && bd < 1.7 && !elder.braziersLit[i]) {
              bestDist = bd;
              prompt = `E · Light the ${names[i]}`;
              bestDialog = { dlg: { name: names[i], lines: ["You touch the torch to the oil-soaked kindling."] }, source: `brazier:${i}` };
            }
          });
        }

        // ---- Trial 6: the three aqueduct sluice gates ---------------------
        if (elder.sluiceTrialState === "assigned") {
          const labels = ["SHUT", "HALF", "OPEN"];
          ([[42, 46], [48, 46], [54, 46]] as [number, number][]).forEach(([sx, sy], i) => {
            const sp = eldervilleWorldPos(sx, sy);
            const sd = Math.hypot(sp.x - p.pos.x, sp.z - p.pos.z);
            if (sd < bestDist && sd < 1.8) {
              bestDist = sd;
              const which = ["Head", "Middle", "Last"][i];
              prompt = `E · ${which} Gate — now ${labels[elder.sluiceGates[i]]}`;
              bestDialog = { dlg: sluiceNoteDialog, source: `sluice:${i}` };
            }
          });
        }
        // the cistern head, once the gates are right
        if (elder.sluiceTrialState === "inspected") {
          const cp = eldervilleWorldPos(44, 48);
          const cd = Math.hypot(cp.x - p.pos.x, cp.z - p.pos.z);
          if (cd < bestDist && cd < 2.0) {
            bestDist = cd;
            prompt = "E · Check the Cistern";
            bestDialog = { dlg: sluiceSolvedDialog, source: "sluiceCistern" };
          }
        }

        // ---- Trial 7: the three orchard rows ------------------------------
        if (elder.blightTrialState === "assigned") {
          ([[9, 38], [13, 40], [17, 38]] as [number, number][]).forEach(([rx, ry], i) => {
            const rp = eldervilleWorldPos(rx, ry);
            const rd = Math.hypot(rp.x - p.pos.x, rp.z - p.pos.z);
            if (rd < bestDist && rd < 1.8 && !elder.rowsInspected[i]) {
              bestDist = rd;
              prompt = `E · Put your hand in the soil (row ${i + 1}/3)`;
              bestDialog = {
                dlg: i === elder.blightRow ? blightRowRotDialog : blightRowCleanDialog,
                source: `blightRow:${i}`,
              };
            }
          });
        }

        // ---- Trial 9: the muster with Thorn in Founders' Plaza ------------
        gate("muster", eldervilleWorldPos(44, 12), "E · Report to the Muster", () => {
          if (elder.musterTrialState === "not_started") return { dlg: musterIntroDialog, source: "musterIntro" };
          if (elder.musterTrialState === "assigned") {
            const call = [musterCallGuardDialog, musterCallDodgeDialog, musterCallStrikeDialog][Math.min(elder.musterStep, 2)];
            prompt = `E · Thorn's call (${elder.musterStep}/3)`;
            return { dlg: call, source: `musterCall:${elder.musterStep}` };
          }
          if (elder.musterTrialState === "inspected") return { dlg: musterCompleteDialog, source: "musterComplete" };
          return null;
        });

        // ---- Trial 10: the quarry constructs ------------------------------
        if (elder.scrapTrialState === "assigned") {
          const qp = eldervilleWorldPos(64, 62);
          const qd = Math.hypot(qp.x - p.pos.x, qp.z - p.pos.z);
          if (qd < bestDist && qd < 2.4 && !elder.spoken.has("scrapEngage")) {
            bestDist = qd;
            prompt = "E · Approach the wreckage";
            bestDialog = { dlg: scrapEngageDialog, source: "scrapEngage" };
          }
        }
        if (elder.scrapTrialState === "inspected" && !elder.spoken.has("scrapCleared")) {
          const qp = eldervilleWorldPos(64, 62);
          const qd = Math.hypot(qp.x - p.pos.x, qp.z - p.pos.z);
          if (qd < bestDist && qd < 2.6) {
            bestDist = qd;
            prompt = "E · Take a fragment";
            bestDialog = { dlg: scrapClearedDialog, source: "scrapCleared" };
          }
        }

        // ---- Trial 11: the Council blade trial ----------------------------
        gate("blade", eldervilleWorldPos(36, 8), "E · Council Blade Trial", () => {
          if (elder.combatTrialState === "not_started") return { dlg: councilCombatTrialDialog, source: "councilCombatTrial" };
          return null;
        });

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

        // ---- Trial 12: the Outskirts Cave ---------------------------------
        {
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
                dlg: { name: "Outskirts Cave", lines: ["The cave mouth exhales cold, machine-tinged air.", "Without your father's blade at your side, you are not ready. Retrieve it from the Red House sword case."] },
                source: "caveLocked",
              };
            } else {
              prompt = "E · Peer Into the Dark";
              bestDialog = {
                dlg: { name: "Outskirts Cave", lines: ["A dark maw in the hillside where the forest begins. Something stirs inside.", `The Council's trials come first — ${lockedHint(elder, "cave") || "prove your virtue, then your steel."}`] },
                source: "caveNormal",
              };
            }
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
        } else if (bestDialog.source.startsWith("brazier:")) {
          // Trial 5 — lighting is order-sensitive; a wrong light snuffs the line.
          const i = Number(bestDialog.source.split(":")[1]);
          const res = useElder.getState().lightBrazier(i);
          const st = useElder.getState();
          if (res === "wrong") {
            sfx.puzzleError();
            st.showDialog(watchWrongDialog, "watchWrong");
          } else if (st.watchTrialState === "inspected") {
            sfx.puzzleUnlock();
            st.showDialog(watchLitDialog, "watchLit");
          } else {
            sfx.puzzleClick();
            st.showDialog(bestDialog.dlg!, bestDialog.source);
          }
        } else if (bestDialog.source.startsWith("sluice:")) {
          // Trial 6 — cycle a gate; the store detects the solved combination.
          const i = Number(bestDialog.source.split(":")[1]);
          useElder.getState().cycleSluice(i);
          const st = useElder.getState();
          if (st.sluiceTrialState === "inspected") {
            sfx.puzzleUnlock();
            st.showDialog(sluiceSolvedDialog, "sluiceSolved");
          } else {
            sfx.puzzleClick();
          }
        } else if (bestDialog.source === "sluiceCistern") {
          sfx.questComplete();
          useElder.getState().showDialog(sluiceCompleteDialog, "sluiceComplete");
        } else if (bestDialog.source.startsWith("blightRow:")) {
          const i = Number(bestDialog.source.split(":")[1]);
          useElder.getState().inspectRow(i);
          sfx.talk();
          useElder.getState().showDialog(bestDialog.dlg!, bestDialog.source);
        } else if (bestDialog.source.startsWith("tallySack:")) {
          const i = Number(bestDialog.source.split(":")[1]);
          useElder.getState().weighSack(i);
          sfx.puzzleClick();
          useElder.getState().showDialog(bestDialog.dlg!, bestDialog.source);
        } else if (bestDialog.source.startsWith("musterCall:")) {
          // Trial 9 — Thorn's drill. Each call is answered by performing the
          // move; talking to him advances to the next call.
          useElder.getState().advanceMuster();
          sfx.talk();
          useElder.getState().showDialog(bestDialog.dlg!, bestDialog.source);
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
