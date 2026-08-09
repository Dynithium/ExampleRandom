import * as THREE from "three";
import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";

// captions per pose, same as HTML
const captions = [
  "",
  "* He holds the blade up, flat in his palm. *",
  "* He slides it into its sheath. Click. *",
  "* He kneels, so he's eye to eye with you. *",
];

function Yard() {
  return (
    <>
      {/* sky */}
      <mesh position={[0, 4.5, -6]} rotation-x={0}>
        <planeGeometry args={[20, 10]} />
        <meshBasicMaterial color="#90d0f0" />
      </mesh>
      {/* sun */}
      <mesh position={[5, 5, -5.9]}>
        <boxGeometry args={[1.2, 0.6, 0.2]} />
        <meshBasicMaterial color="#f8e060" />
      </mesh>
      <mesh position={[5, 5.1, -5.8]}>
        <boxGeometry args={[0.6, 0.2, 0.1]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
      </mesh>
      {/* distant hills */}
      <mesh position={[0, 2.2, -4]} receiveShadow>
        <boxGeometry args={[20, 1.2, 1]} />
        <meshLambertMaterial color="#308018" />
      </mesh>
      <mesh position={[0, 1.8, -3.5]} receiveShadow>
        <boxGeometry args={[20, 0.8, 0.8]} />
        <meshLambertMaterial color="#48a028" />
      </mesh>
      <mesh position={[0, 1.5, -3]} receiveShadow>
        <boxGeometry args={[20, 0.4, 0.5]} />
        <meshLambertMaterial color="#68c040" />
      </mesh>
      {/* ground grass */}
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <boxGeometry args={[12, 0.1, 6]} />
        <meshLambertMaterial color="#48a028" />
      </mesh>
      {/* dirt path */}
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <boxGeometry args={[6, 0.02, 3]} />
        <meshLambertMaterial color="#e0c878" />
      </mesh>
      <mesh position={[0, 0.03, 0]}>
        <boxGeometry args={[5.8, 0.01, 2.8]} />
        <meshLambertMaterial color="#f0d890" />
      </mesh>
      {/* fence back */}
      <group position={[0, 0.4, -2]}>
        <mesh position={[-5, 0, 0]} castShadow>
          <boxGeometry args={[0.12, 0.9, 0.12]} />
          <meshLambertMaterial color="#684830" />
        </mesh>
        <mesh position={[5, 0, 0]} castShadow>
          <boxGeometry args={[0.12, 0.9, 0.12]} />
          <meshLambertMaterial color="#684830" />
        </mesh>
        <mesh position={[0, 0.3, 0]} castShadow>
          <boxGeometry args={[10, 0.12, 0.08]} />
          <meshLambertMaterial color="#684830" />
        </mesh>
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[10, 0.08, 0.05]} />
          <meshLambertMaterial color="#684830" />
        </mesh>
      </group>
      {/* flowers */}
      <mesh position={[-3, 0.08, 0.8]} castShadow>
        <boxGeometry args={[0.08, 0.12, 0.08]} />
        <meshLambertMaterial color="#f07090" />
      </mesh>
      <mesh position={[3, 0.08, -0.6]} castShadow>
        <boxGeometry args={[0.08, 0.12, 0.08]} />
        <meshLambertMaterial color="#e8b040" />
      </mesh>
      <mesh position={[2, 0.08, 1]} castShadow>
        <boxGeometry args={[0.08, 0.1, 0.08]} />
        <meshLambertMaterial color="#f8e060" />
      </mesh>
      {/* small crop tufts */}
      <mesh position={[-2.5, 0.06, 0.5]}>
        <boxGeometry args={[0.15, 0.12, 0.15]} />
        <meshLambertMaterial color="#68c040" />
      </mesh>
      <mesh position={[2.8, 0.06, -0.7]}>
        <boxGeometry args={[0.15, 0.12, 0.15]} />
        <meshLambertMaterial color="#68c040" />
      </mesh>
    </>
  );
}

function DustMotes() {
  const ref = useRef<THREE.InstancedMesh>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const N = 18;
  const seeds = useMemo(
    () =>
      Array.from({ length: N }, (_, i) => ({
        x: (Math.sin(i * 12.9) * 0.5 + 0.5) * 6 - 3,
        y: 0.8 + Math.abs(Math.sin(i * 7.3)) * 1.2,
        z: (Math.cos(i * 9.7) * 0.5 + 0.5) * 3 - 1,
        s: 0.02 + (i % 5) * 0.008,
        p: i * 0.7,
      })),
    []
  );
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    seeds.forEach((s, i) => {
      dummy.position.set(
        s.x + Math.sin(t * 0.3 + s.p) * 0.15,
        s.y + Math.sin(t * 0.5 + s.p) * 0.1,
        s.z + Math.cos(t * 0.25 + s.p) * 0.1
      );
      dummy.scale.setScalar(s.s);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, N]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="#f0e8c8" transparent opacity={0.55} />
    </instancedMesh>
  );
}

// Voxel father
function Father({ pose, lerp }: { pose: number; lerp: number }) {
  const group = useRef<THREE.Group>(null!);
  const blade = useRef<THREE.Group>(null!);
  const armL = useRef<THREE.Group>(null!);
  const armR = useRef<THREE.Group>(null!);
  const legL = useRef<THREE.Group>(null!);
  const legR = useRef<THREE.Group>(null!);
  const head = useRef<THREE.Group>(null!);

  // smooth pose interpolation
  const curPose = useRef(0);
  const curLerp = useRef(0);
  useFrame((_, dt) => {
    curPose.current += (pose - curPose.current) * (1 - Math.exp(-dt * 6));
    curLerp.current += (lerp - curLerp.current) * (1 - Math.exp(-dt * 8));
    const p = curPose.current;
    // interpolate between poses: we use p as float, but also lerp for blade
    // father y: standing 0, kneeling -0.35
    const isKneel = p >= 2.5;
    const kneelT = THREE.MathUtils.clamp((p - 2) * 1.0, 0, 1); // 2->3 transition
    group.current.position.y = THREE.MathUtils.lerp(0, -0.32, kneelT);
    group.current.position.z = THREE.MathUtils.lerp(0, 0.15, kneelT);
    // legs: when kneeling, one knee down
    if (legL.current && legR.current) {
      if (kneelT > 0.1) {
        legL.current.rotation.x = THREE.MathUtils.lerp(0, -1.2, kneelT);
        legL.current.position.z = THREE.MathUtils.lerp(0, 0.18, kneelT);
        legR.current.rotation.x = THREE.MathUtils.lerp(0, 0.1, kneelT);
      } else {
        legL.current.rotation.x = 0;
        legR.current.rotation.x = 0;
        legL.current.position.z = 0;
      }
    }
    // head slightly down when explaining, up when kneeling eye to eye
    if (head.current) {
      head.current.rotation.x = THREE.MathUtils.lerp(0, -0.15, Math.sin(p * 0.5));
      if (kneelT > 0.5) head.current.rotation.x = THREE.MathUtils.lerp(head.current.rotation.x, -0.25, 0.3);
    }
    // arms + blade
    if (armL.current && armR.current && blade.current) {
      if (p < 1.5) {
        // holding blade flat at chest
        armL.current.position.set(-0.32, 0.55, 0);
        armR.current.position.set(0.32, 0.55, 0);
        armL.current.rotation.z = THREE.MathUtils.lerp(0, -0.6, THREE.MathUtils.clamp(p, 0, 1));
        armR.current.rotation.z = THREE.MathUtils.lerp(0, 0.6, THREE.MathUtils.clamp(p, 0, 1));
        armL.current.rotation.x = -0.2;
        armR.current.rotation.x = -0.2;
        blade.current.position.set(0, 0.55, 0.45);
        blade.current.rotation.y = 0;
        blade.current.scale.set(1, 1, 1);
        blade.current.visible = true;
      } else if (p < 2.5) {
        // sheathing: blade moves to waist, arms close
        const t = THREE.MathUtils.clamp((p - 1.5) / 1, 0, 1);
        armL.current.position.set(
          THREE.MathUtils.lerp(-0.32, -0.18, t),
          THREE.MathUtils.lerp(0.55, 0.35, t),
          THREE.MathUtils.lerp(0, 0.1, t)
        );
        armR.current.position.set(
          THREE.MathUtils.lerp(0.32, 0.18, t),
          THREE.MathUtils.lerp(0.55, 0.35, t),
          THREE.MathUtils.lerp(0, 0.1, t)
        );
        armL.current.rotation.z = THREE.MathUtils.lerp(-0.6, -0.2, t);
        armR.current.rotation.z = THREE.MathUtils.lerp(0.6, 0.2, t);
        blade.current.position.set(
          THREE.MathUtils.lerp(0, -0.12, t),
          THREE.MathUtils.lerp(0.55, 0.32, t),
          THREE.MathUtils.lerp(0.45, 0.18, t)
        );
        blade.current.rotation.y = THREE.MathUtils.lerp(0, -0.4, t);
        // click sparkle scale pulse at t~0.9
        const sparkle = Math.sin(t * Math.PI) > 0.9 ? 1.3 : 1;
        blade.current.scale.set(sparkle, sparkle, sparkle);
      } else {
        // kneeling, blade sheathed at waist, arms at sides / one on child's shoulder
        blade.current.visible = false;
        armL.current.position.set(-0.28, 0.38, 0);
        armR.current.position.set(0.28, 0.42, 0.15);
        armL.current.rotation.z = -0.1;
        armL.current.rotation.x = 0.2;
        armR.current.rotation.z = 0.3;
        armR.current.rotation.x = -0.5;
      }
    }
    // subtle breathing bob
    const bob = Math.sin(performance.now() * 0.003) * 0.015;
    group.current.position.y += bob;
  });

  return (
    <group ref={group} position={[-1.1, 0, 0]} rotation-y={Math.PI * 0.45}>
      {/* legs */}
      <group ref={legL} position={[0.14, 0.22, 0]}>
        <mesh position={[0, -0.12, 0]} castShadow>
          <boxGeometry args={[0.16, 0.45, 0.16]} />
          <meshLambertMaterial color="#703040" />
        </mesh>
        <mesh position={[0, -0.36, 0.04]} castShadow>
          <boxGeometry args={[0.18, 0.08, 0.22]} />
          <meshLambertMaterial color="#282020" />
        </mesh>
      </group>
      <group ref={legR} position={[-0.14, 0.22, 0]}>
        <mesh position={[0, -0.12, 0]} castShadow>
          <boxGeometry args={[0.16, 0.45, 0.16]} />
          <meshLambertMaterial color="#703040" />
        </mesh>
        <mesh position={[0, -0.36, 0.04]} castShadow>
          <boxGeometry args={[0.18, 0.08, 0.22]} />
          <meshLambertMaterial color="#282020" />
        </mesh>
      </group>
      {/* torso — tan work tunic */}
      <mesh position={[0, 0.58, 0]} castShadow>
        <boxGeometry args={[0.5, 0.52, 0.32]} />
        <meshLambertMaterial color="#d0b078" />
      </mesh>
      {/* belt */}
      <mesh position={[0, 0.35, 0]} castShadow>
        <boxGeometry args={[0.52, 0.08, 0.34]} />
        <meshLambertMaterial color="#684830" />
      </mesh>
      <mesh position={[0, 0.35, 0.17]} castShadow>
        <boxGeometry args={[0.08, 0.08, 0.02]} />
        <meshLambertMaterial color="#e8b040" />
      </mesh>
      {/* sheath at waist */}
      <mesh position={[-0.28, 0.32, 0.12]} castShadow>
        <boxGeometry args={[0.1, 0.45, 0.08]} />
        <meshLambertMaterial color="#684830" />
      </mesh>
      <mesh position={[-0.28, 0.32, 0.14]}>
        <boxGeometry args={[0.08, 0.02, 0.02]} />
        <meshLambertMaterial color="#906848" />
      </mesh>
      {/* arms */}
      <group ref={armL} position={[-0.32, 0.55, 0]}>
        <mesh position={[0, -0.14, 0]} castShadow>
          <boxGeometry args={[0.14, 0.32, 0.14]} />
          <meshLambertMaterial color="#d0b078" />
        </mesh>
        <mesh position={[0, -0.32, 0]} castShadow>
          <boxGeometry args={[0.13, 0.12, 0.13]} />
          <meshLambertMaterial color="#f0c090" />
        </mesh>
      </group>
      <group ref={armR} position={[0.32, 0.55, 0]}>
        <mesh position={[0, -0.14, 0]} castShadow>
          <boxGeometry args={[0.14, 0.32, 0.14]} />
          <meshLambertMaterial color="#d0b078" />
        </mesh>
        <mesh position={[0, -0.32, 0]} castShadow>
          <boxGeometry args={[0.13, 0.12, 0.13]} />
          <meshLambertMaterial color="#f0c090" />
        </mesh>
      </group>
      {/* head */}
      <group ref={head} position={[0, 0.92, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.36, 0.34, 0.36]} />
          <meshLambertMaterial color="#f0c090" />
        </mesh>
        <mesh position={[0, 0.14, 0]} castShadow>
          <boxGeometry args={[0.38, 0.1, 0.38]} />
          <meshLambertMaterial color="#503828" />
        </mesh>
        <mesh position={[0, 0.18, 0.02]}>
          <boxGeometry args={[0.2, 0.02, 0.1]} />
          <meshLambertMaterial color="#705040" />
        </mesh>
        {/* beard */}
        <mesh position={[0, -0.08, 0.18]} castShadow>
          <boxGeometry args={[0.28, 0.12, 0.08]} />
          <meshLambertMaterial color="#302018" />
        </mesh>
        {/* eyes */}
        <mesh position={[0.08, 0.02, 0.19]}>
          <boxGeometry args={[0.06, 0.06, 0.01]} />
          <meshLambertMaterial color="#201810" />
        </mesh>
        <mesh position={[-0.08, 0.02, 0.19]}>
          <boxGeometry args={[0.06, 0.06, 0.01]} />
          <meshLambertMaterial color="#201810" />
        </mesh>
        <mesh position={[0.08, 0.04, 0.195]}>
          <boxGeometry args={[0.02, 0.02, 0.01]} />
          <meshBasicMaterial color="white" />
        </mesh>
        <mesh position={[-0.08, 0.04, 0.195]}>
          <boxGeometry args={[0.02, 0.02, 0.01]} />
          <meshBasicMaterial color="white" />
        </mesh>
      </group>
      {/* blade */}
      <group ref={blade} position={[0, 0.55, 0.45]}>
        <mesh castShadow>
          <boxGeometry args={[1.1, 0.08, 0.05]} />
          <meshLambertMaterial color="#c8d0d8" />
        </mesh>
        <mesh position={[0, 0.02, 0]}>
          <boxGeometry args={[1.05, 0.015, 0.02]} />
          <meshBasicMaterial color="white" transparent opacity={0.9} />
        </mesh>
        <mesh position={[-0.58, 0, 0]} castShadow>
          <boxGeometry args={[0.14, 0.12, 0.06]} />
          <meshLambertMaterial color="#e8b040" />
        </mesh>
        <mesh position={[-0.65, 0, 0]}>
          <boxGeometry args={[0.08, 0.06, 0.04]} />
          <meshLambertMaterial color="#684830" />
        </mesh>
        {/* tip */}
        <mesh position={[0.58, 0, 0]}>
          <boxGeometry args={[0.08, 0.04, 0.02]} />
          <meshLambertMaterial color="#c8d0d8" />
        </mesh>
      </group>
    </group>
  );
}

function YoungMinslaire({ pose }: { pose: number }) {
  const group = useRef<THREE.Group>(null!);
  const head = useRef<THREE.Group>(null!);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (group.current) {
      group.current.position.y = Math.sin(t * 2.2) * 0.01;
      // look at father
      const look = pose >= 2.5 ? -0.2 : 0.3;
      group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, -0.25 + look, 0.05);
    }
    if (head.current) head.current.rotation.z = Math.sin(t * 1.5) * 0.04;
  });
  return (
    <group ref={group} position={[1.2, 0, 0]} rotation-y={-0.25} scale={[0.78, 0.78, 0.78]}>
      <mesh position={[0, 0.22, 0]} castShadow>
        <boxGeometry args={[0.32, 0.4, 0.18]} />
        <meshLambertMaterial color="#2f3d6b" />
      </mesh>
      <mesh position={[0, 0.025, 0.04]} castShadow>
        <boxGeometry args={[0.18, 0.08, 0.18]} />
        <meshLambertMaterial color="#33281f" />
      </mesh>
      {/* torso */}
      <mesh position={[0, 0.52, 0]} castShadow>
        <boxGeometry args={[0.42, 0.38, 0.26]} />
        <meshLambertMaterial color="#d03838" />
      </mesh>
      <mesh position={[0, 0.68, 0]}>
        <boxGeometry args={[0.44, 0.06, 0.28]} />
        <meshLambertMaterial color="#f4e7c9" />
      </mesh>
      {/* arms */}
      <mesh position={[0.24, 0.52, 0]} castShadow>
        <boxGeometry args={[0.11, 0.28, 0.11]} />
        <meshLambertMaterial color="#c9433f" />
      </mesh>
      <mesh position={[-0.24, 0.52, 0]} castShadow>
        <boxGeometry args={[0.11, 0.28, 0.11]} />
        <meshLambertMaterial color="#c9433f" />
      </mesh>
      <mesh position={[0.24, 0.35, 0]} castShadow>
        <boxGeometry args={[0.12, 0.1, 0.12]} />
        <meshLambertMaterial color="#f0c090" />
      </mesh>
      <mesh position={[-0.24, 0.35, 0]} castShadow>
        <boxGeometry args={[0.12, 0.1, 0.12]} />
        <meshLambertMaterial color="#f0c090" />
      </mesh>
      {/* head */}
      <group ref={head} position={[0, 0.84, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.34, 0.32, 0.34]} />
          <meshLambertMaterial color="#f0c090" />
        </mesh>
        <mesh position={[0, 0.14, 0]} castShadow>
          <boxGeometry args={[0.36, 0.08, 0.36]} />
          <meshLambertMaterial color="#503828" />
        </mesh>
        <mesh position={[0, 0.05, 0.17]}>
          <boxGeometry args={[0.06, 0.06, 0.01]} />
          <meshLambertMaterial color="#201810" />
        </mesh>
        <mesh position={[0.08, 0.02, 0.17]}>
          <boxGeometry args={[0.05, 0.05, 0.01]} />
          <meshLambertMaterial color="#201810" />
        </mesh>
        <mesh position={[-0.06, 0.02, 0.17]}>
          <boxGeometry args={[0.05, 0.05, 0.01]} />
          <meshLambertMaterial color="#201810" />
        </mesh>
      </group>
    </group>
  );
}

function MemoryScene({ index }: { index: number }) {
  const pose = Math.min(Math.max(index, 0), 3);
  // click sparkle when pose 2
  const sparkleRef = useRef<THREE.Mesh>(null!);
  useFrame((state) => {
    if (sparkleRef.current) {
      const t = state.clock.elapsedTime;
      // sparkle only visible at pose 2, pulses
      const visible = pose === 2;
      sparkleRef.current.visible = visible;
      if (visible) {
        sparkleRef.current.rotation.y += 0.12;
        sparkleRef.current.rotation.z += 0.08;
        const s = 1 + Math.sin(t * 12) * 0.15;
        sparkleRef.current.scale.setScalar(s);
        // @ts-ignore
        sparkleRef.current.material.opacity = 0.7 + Math.sin(t * 10) * 0.3;
      }
    }
  });
  return (
    <>
      <ambientLight intensity={0.9} color="#fff8e6" />
      <hemisphereLight args={["#90d0f0", "#a07048", 0.7]} />
      <directionalLight
        castShadow
        position={[4, 6, 3]}
        intensity={1.4}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.5}
        shadow-camera-far={20}
        shadow-bias={-0.0005}
      />
      <Yard />
      <DustMotes />
      <Father pose={pose} lerp={pose} />
      <YoungMinslaire pose={pose} />
      {/* click sparkle at sheath when pose 2 */}
      <mesh ref={sparkleRef} position={[-1.38, 0.32, 0.15]} visible={false}>
        <octahedronGeometry args={[0.12, 0]} />
        <meshBasicMaterial color="#ffd75e" transparent opacity={0.9} toneMapped={false} />
      </mesh>
      {/* second sparkle */}
      <mesh position={[-1.42, 0.4, 0.12]} visible={pose === 2}>
        <boxGeometry args={[0.04, 0.04, 0.04]} />
        <meshBasicMaterial color="white" />
      </mesh>
    </>
  );
}

export function MemoryCutscene3D({ index }: { index: number }) {
  const caption = captions[Math.min(index, 3)];
  return (
    <div className="absolute inset-0 flex flex-col bg-[#88b0d8]">
      {/* top label */}
      <div className="relative h-[28px] shrink-0 border-b-2 border-[#4068a8] bg-[#90d0f0] px-3 py-1">
        <div className="text-[8px] font-bold tracking-widest text-[#e8b040]">MEMORY — YEARS AGO</div>
        <div className="text-[7px] text-[#f0e8c8]">Your father's yard · late afternoon</div>
        <div className="absolute right-3 top-1 h-3 w-8 border border-[#b09048] bg-[#f8e060]" />
      </div>
      {/* 3D canvas */}
      <div className="relative flex-1 bg-[#90d0f0]">
        <Canvas
          shadows="soft"
          dpr={1 / 3}
          orthographic
          camera={{ position: [0, 1.8, 4.2], zoom: 48, near: 0.1, far: 20 }}
          gl={{ antialias: false, powerPreference: "high-performance", stencil: false }}
          style={{ imageRendering: "pixelated" as any }}
          onCreated={({ camera }) => {
            (camera as THREE.OrthographicCamera).lookAt(0, 0.6, 0);
          }}
        >
          <MemoryScene index={index} />
        </Canvas>
        {/* vignette */}
        <div className="pointer-events-none absolute inset-0 border-[4px] border-black opacity-[0.12]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_60%,rgba(0,0,0,0.4)_100%)]" />
      </div>
      {/* caption bar */}
      {caption && (
        <div className="shrink-0 border-t-2 border-[#201810] bg-[#181818] px-3 py-2 text-center text-[9px] italic text-[#f0e8c8]" style={{ fontFamily: "monospace" }}>
          {caption}
        </div>
      )}
    </div>
  );
}
