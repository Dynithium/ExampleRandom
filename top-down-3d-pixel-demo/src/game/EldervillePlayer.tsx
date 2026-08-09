import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { groundAtWorld, isBlocked, interiors, eldervilleWorldPos, villageDoors } from "./world";
import { rt, useUI } from "./state";
import { useElder, villageNPCsData, eldersAtDoorPositions, tinslaireInsideDialog, tinslaireInsideRepeat, elderMossDoorDialog, elderMossDoorRepeat, swordCaseDialog } from "./eldervilleStory";
import { sfx } from "./audio";

const SPEED = 4.6;
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
  return t === 7 || t === 8 || t === 9 || t === 17 || t === 18 || t === 19; // wall, bed, sword, table, chair, bookshelf
}

const INT_OFF_X = 42.5, INT_OFF_Z = 45, INT_Y = 2;
function npcBlockedWorld(x: number, z: number) {
  const s = useElder.getState();
  // village NPCs
  if (s.currentArea === "village") {
    const isDoorVisible = s.eldersAtDoorReady && !s.eldersDoorDialogDone;
    const positions: {x:number,z:number}[] = [];
    if (isDoorVisible) eldersAtDoorPositions.forEach(e=>{ const p=eldervilleWorldPos(e.tx,e.ty); positions.push({x:p.x,z:p.z}); });
    villageNPCsData.forEach(npc=>{
      if(npc.id==="tinslaire" && !s.eldersDoorDialogDone) return;
      const p=eldervilleWorldPos(npc.tx,npc.ty);
      positions.push({x:p.x,z:p.z});
    });
    for(const np of positions) if(Math.hypot(np.x - x, np.z - z) < 0.75) return true;
  } else if (s.currentArea==="home") {
    // interior Tinslaire at (6,5) local -> world off
    const offX=INT_OFF_X, offZ=INT_OFF_Z;
    const nx = offX + 6 + 0.5, nz = offZ + 5 + 0.5;
    if(Math.hypot(nx - x, nz - z) < 0.7) return true;
  }
  return false;
}

const camTarget = new THREE.Vector3();
const desired = new THREE.Vector3();
const fwd = new THREE.Vector3();
const right = new THREE.Vector3();

export function EldervillePlayer() {
  const group = useRef<THREE.Group>(null!);
  const legL = useRef<THREE.Group>(null!);
  const legR = useRef<THREE.Group>(null!);
  const armL = useRef<THREE.Group>(null!);
  const armR = useRef<THREE.Group>(null!);
  const phase = useRef(0);
  const stepTimer = useRef(0);
  const init = useRef(false);
  const prevArea = useRef<string>(useElder.getState().currentArea);

  // set initial spawn inside home interior (4,5) local -> world off (far away so village not visible)
  useEffect(() => {
    const offX=INT_OFF_X, offZ=INT_OFF_Z;
    rt.player.pos.set(offX + 4 + 0.5, INT_Y, offZ + 5 + 0.5);
    rt.player.yaw = Math.PI; // face down
  }, []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const p = rt.player;
    const ui = useUI.getState();
    const elder = useElder.getState();
    // snap camera on area change (teleport 50 units would otherwise lerp over water)
    if (prevArea.current !== elder.currentArea) {
      prevArea.current = elder.currentArea;
      init.current = false;
    }

    // block movement during dialogs / opening
    const blockedByStory = elder.openingBlack || elder.memoryActive || !!elder.activeDialog;
    let ix = 0, iy = 0;
    if (!blockedByStory) {
      ix = THREE.MathUtils.clamp(rt.input.x + rt.input.touchX, -1, 1);
      iy = THREE.MathUtils.clamp(rt.input.y + rt.input.touchY, -1, 1);
      const mag = Math.hypot(ix, iy);
      if (mag > 1) { ix/=mag; iy/=mag; }
    }

    // camera yaw/zoom always update
    rt.cam.yaw += (rt.cam.targetYaw - rt.cam.yaw) * (1 - Math.exp(-dt * 9));
    rt.cam.zoom += (rt.cam.targetZoom - rt.cam.zoom) * (1 - Math.exp(-dt * 8));
    const yaw = rt.cam.yaw;
    fwd.set(-Math.sin(yaw),0,-Math.cos(yaw));
    right.set(Math.cos(yaw),0,-Math.sin(yaw));
    const mx = right.x * ix + fwd.x * iy;
    const mz = right.z * ix + fwd.z * iy;
    const moving = !blockedByStory && Math.hypot(mx,mz) > 0.05;
    p.moving = moving;
    p.speed += ((moving?1:0) - p.speed) * (1 - Math.exp(-dt*16));

    // movement
    if (moving) {
      const currentTop = elder.currentArea==="village" ? groundAtWorld(p.pos.x,p.pos.z) : INT_Y;
      const nx = p.pos.x + mx * SPEED * dt;
      const nz = p.pos.z + mz * SPEED * dt;
      // check walkability
      let canX = false, canZ = false;
      if (elder.currentArea==="village") {
        canX = canWalkWorld(nx, p.pos.z, currentTop) && !npcBlockedWorld(nx,p.pos.z);
        canZ = canWalkWorld(p.pos.x, nz, currentTop) && !npcBlockedWorld(p.pos.x,nz);
      } else {
        const interior = interiors[elder.currentArea];
        if(interior){
          const map=interior.map, offX=INT_OFF_X, offZ=INT_OFF_Z;
          const check = (x:number,z:number)=>{
            if(isInteriorSolidAt(map,x,z,offX,offZ)) return false;
            if(npcBlockedWorld(x,z)) return false;
            return true;
          };
          canX = check(nx,p.pos.z);
          canZ = check(p.pos.x,nz);
        }
      }
      if(canX) p.pos.x = nx;
      if(canZ) p.pos.z = nz;
      const targetYaw = Math.atan2(mx,mz);
      let d=targetYaw - p.yaw; while(d>Math.PI) d-=Math.PI*2; while(d<-Math.PI) d+=Math.PI*2;
      p.yaw += d * (1 - Math.exp(-dt*14));
      phase.current += dt*11;
      stepTimer.current -= dt;
      if(stepTimer.current<=0){ stepTimer.current=0.32; sfx.step(); }
    } else {
      phase.current += dt*2.4;
    }

    // ground Y
    let groundY = 0;
    if (elder.currentArea==="village") groundY = groundAtWorld(p.pos.x,p.pos.z);
    else groundY = INT_Y; // interior flat
    p.pos.y += (groundY - p.pos.y) * (1 - Math.exp(-dt*15));

    // rig
    const swing=Math.sin(phase.current)*0.62*p.speed;
    if(legL.current) legL.current.rotation.x = swing;
    if(legR.current) legR.current.rotation.x = -swing;
    if(armL.current) armL.current.rotation.x = -swing*0.85;
    if(armR.current) armR.current.rotation.x = swing*0.85;
    const bob=Math.abs(Math.sin(phase.current))*0.05*p.speed;
    const idle=(1-p.speed)*Math.sin(phase.current*0.9)*0.015;
    group.current.position.set(p.pos.x, p.pos.y + bob + idle, p.pos.z);
    group.current.rotation.y = p.yaw;

    // camera
    const pitch=0.62, dist=46;
    desired.set(p.pos.x + Math.sin(yaw)*Math.cos(pitch)*dist, p.pos.y + Math.sin(pitch)*dist, p.pos.z + Math.cos(yaw)*Math.cos(pitch)*dist);
    if(!init.current){ init.current=true; camTarget.copy(p.pos); state.camera.position.copy(desired); }
    camTarget.lerp(p.pos,1-Math.exp(-dt*7));
    state.camera.position.lerp(desired,1-Math.exp(-dt*7));
    state.camera.lookAt(camTarget.x, camTarget.y+0.9, camTarget.z);
    const cam=state.camera as THREE.OrthographicCamera;
    if(Math.abs(cam.zoom - rt.cam.zoom)>0.01){ cam.zoom=rt.cam.zoom; cam.updateProjectionMatrix(); }

    // ---- area transitions (walk onto door / mat) ----
    if (!blockedByStory) {
      if (elder.currentArea==="village") {
        // check if near any village door (0.7 radius)
        for(const d of villageDoors){
          const dist=Math.hypot(d.x - p.pos.x, d.z - p.pos.z);
          if(dist<0.7){
            // enter interior
            useElder.getState().setArea(d.interior, d.interior);
            // teleport to interior entry just above mat: local (7,8) facing down
            const offX=INT_OFF_X, offZ=INT_OFF_Z;
            p.pos.set(offX + 7 + 0.5, INT_Y, offZ + 8 + 0.5);
            p.yaw = Math.PI;
            // snap camera instantly — otherwise 50-unit teleport lerps over ocean and looks tiny
            camTarget.copy(p.pos);
            const yawSnap = rt.cam.yaw;
            const pitchSnap=0.62, distSnap=46;
            desired.set(p.pos.x + Math.sin(yawSnap)*Math.cos(pitchSnap)*distSnap, p.pos.y + Math.sin(pitchSnap)*distSnap, p.pos.z + Math.cos(yawSnap)*Math.cos(pitchSnap)*distSnap);
            state.camera.position.copy(desired);
            state.camera.lookAt(p.pos.x, p.pos.y+0.9, p.pos.z);
            init.current = true;
            break;
          }
        }
      } else {
        // inside interior — check exit mat at (7,9) local
        const interior = interiors[elder.currentArea];
        if(interior){
          const offX=INT_OFF_X, offZ=INT_OFF_Z;
          const matX = offX + 7 + 0.5, matZ = offZ + 9 + 0.5;
          // block exit if home and not talked to Tinslaire
          const isHome = elder.currentArea==="home" && !elder.tinslaireInsideTalked;
          if(Math.hypot(p.pos.x - matX, p.pos.z - matZ) < 0.65){
            if(isHome){
              // nudge back and show dialog
              p.pos.set(offX + 7 + 0.5, INT_Y, offZ + 8 + 0.5);
              if(!elder.activeDialog) useElder.getState().showDialog({name:"Tinslaire", lines:["Minslaire! Wait — the elders are at the door! Talk to me first!"]}, "blockExit");
            } else {
              // exit to village at outside pos — land one tile south of door (guaranteed DIRT)
              const outside = interior.outside; // elderville tile [tx,ty]
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
            }
          }
        }
      }
    }

    // ---- interactions prompt & E handling ----
    // compute best nearby interactable
    let prompt: string | null = null;
    let bestDist = 1.6;
    let bestDialog: { dlg: any; source: string } | null = null;

    if (elder.currentArea==="home") {
      // interior Tinslaire at (6,5)
      const offX=INT_OFF_X, offZ=INT_OFF_Z;
      const tx = offX + 6 + 0.5, tz = offZ + 5 + 0.5;
      const d=Math.hypot(tx - p.pos.x, tz - p.pos.z);
      if(d<bestDist){
        bestDist=d;
        const spoken = elder.spoken.has("tinslaireInside");
        bestDialog = { dlg: spoken? tinslaireInsideRepeat : tinslaireInsideDialog, source: "tinslaireInside" };
        prompt = "E · Talk";
      }
      // sword case at (9,3) and (9,4) local
      for(const [sx,sz] of [[9,3],[9,4]]){
        const cx=offX+sx+0.5, cz=offZ+sz+0.5;
        if(Math.hypot(cx-p.pos.x, cz-p.pos.z) < 1.2){
          if(1.0 < bestDist){
            bestDist=1.0;
            bestDialog={ dlg: swordCaseDialog, source:"swordCase"};
            prompt="E · Inspect";
          }
        }
      }
    } else if (elder.currentArea==="village") {
      // door elders if visible
      if(elder.eldersAtDoorReady && !elder.eldersDoorDialogDone){
        for(const e of eldersAtDoorPositions){
          const wp=eldervilleWorldPos(e.tx,e.ty);
          const d=Math.hypot(wp.x-p.pos.x, wp.z-p.pos.z);
          if(d<bestDist){
            bestDist=d;
            // only Moss has dialog, others redirect to Moss
            const dlg = e.id==="elderMossDoor" ? (elder.spoken.has("elderMossDoor")? elderMossDoorRepeat: elderMossDoorDialog) : (elder.spoken.has("elderMossDoor")? elderMossDoorRepeat: elderMossDoorDialog);
            bestDialog={dlg, source:"elderMossDoor"};
            prompt="E · Talk";
          }
        }
      }
      // village NPCs
      villageNPCsData.forEach(npc=>{
        if(npc.id==="tinslaire" && !elder.eldersDoorDialogDone) return;
        const wp=eldervilleWorldPos(npc.tx,npc.ty);
        const d=Math.hypot(wp.x-p.pos.x, wp.z-p.pos.z);
        if(d<bestDist){
          bestDist=d;
          const spoken=elder.spoken.has(npc.id);
          bestDialog={ dlg: spoken? npc.repeat : npc.dialog, source: npc.id };
          prompt="E · Talk";
        }
      });
    }

    // show prompt via useUI (keep old HUD prompt for compatibility, but also elderville prompt)
    // we use useUI prompt to show
    if(!elder.activeDialog && prompt) ui.setPrompt(prompt);
    else if(!elder.activeDialog) ui.setPrompt(null);

    // handle interact
    if(rt.input.interact){
      rt.input.interact=false;
      if(elder.activeDialog){
        useElder.getState().advanceDialog();
        sfx.ui();
      } else if(bestDialog){
        useElder.getState().showDialog(bestDialog.dlg, bestDialog.source);
        sfx.talk();
      }
    }
    // if dialog open but no longer near NPC, keep it (like game.js) until advanced
  });

  // player rig same as before
  return (
    <group ref={group}>
      <group ref={legL} position={[0.13,0.36,0]}>
        <mesh position={[0,-0.18,0]} castShadow><boxGeometry args={[0.18,0.38,0.18]} /><meshLambertMaterial color="#2f3d6b" /></mesh>
        <mesh position={[0,-0.38,0.03]} castShadow><boxGeometry args={[0.2,0.1,0.24]} /><meshLambertMaterial color="#33281f" /></mesh>
      </group>
      <group ref={legR} position={[-0.13,0.36,0]}>
        <mesh position={[0,-0.18,0]} castShadow><boxGeometry args={[0.18,0.38,0.18]} /><meshLambertMaterial color="#2f3d6b" /></mesh>
        <mesh position={[0,-0.38,0.03]} castShadow><boxGeometry args={[0.2,0.1,0.24]} /><meshLambertMaterial color="#33281f" /></mesh>
      </group>
      <mesh position={[0,0.58,0]} castShadow receiveShadow><boxGeometry args={[0.5,0.46,0.3]} /><meshLambertMaterial color="#e2544f" /></mesh>
      <mesh position={[0,0.78,0]} castShadow><boxGeometry args={[0.54,0.1,0.34]} /><meshLambertMaterial color="#f4e7c9" /></mesh>
      <group ref={armL} position={[0.32,0.76,0]}>
        <mesh position={[0,-0.17,0]} castShadow><boxGeometry args={[0.14,0.36,0.16]} /><meshLambertMaterial color="#c9433f" /></mesh>
        <mesh position={[0,-0.38,0]} castShadow><boxGeometry args={[0.15,0.12,0.17]} /><meshLambertMaterial color="#f0b98d" /></mesh>
      </group>
      <group ref={armR} position={[-0.32,0.76,0]}>
        <mesh position={[0,-0.17,0]} castShadow><boxGeometry args={[0.14,0.36,0.16]} /><meshLambertMaterial color="#c9433f" /></mesh>
        <mesh position={[0,-0.38,0]} castShadow><boxGeometry args={[0.15,0.12,0.17]} /><meshLambertMaterial color="#f0b98d" /></mesh>
      </group>
      <mesh position={[0,1.02,0]} castShadow><boxGeometry args={[0.42,0.4,0.4]} /><meshLambertMaterial color="#f0b98d" /></mesh>
      <mesh position={[0.1,1.06,0.21]}><boxGeometry args={[0.07,0.09,0.02]} /><meshLambertMaterial color="#241a14" /></mesh>
      <mesh position={[-0.1,1.06,0.21]}><boxGeometry args={[0.07,0.09,0.02]} /><meshLambertMaterial color="#241a14" /></mesh>
      <mesh position={[0,1.27,0]} castShadow><boxGeometry args={[0.46,0.14,0.44]} /><meshLambertMaterial color="#3f8f57" /></mesh>
      <mesh position={[0,1.19,0.28]} castShadow><boxGeometry args={[0.44,0.06,0.16]} /><meshLambertMaterial color="#2f6b41" /></mesh>
      <mesh position={[0,1.36,0]} castShadow><boxGeometry args={[0.12,0.08,0.12]} /><meshLambertMaterial color="#ffd75e" /></mesh>
    </group>
  );
}
