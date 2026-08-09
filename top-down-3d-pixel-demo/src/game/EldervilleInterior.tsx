import * as THREE from "three";
import { useRef, useLayoutEffect } from "react";
import { interiors } from "./world";
import { useElder } from "./eldervilleStory";

const floorColor = "#c89858";
const wallColor = "#a07048";
const wallDark = "#805830";
const bedColor = "#c05050";
const bedLight = "#e07068";
const wood = "#906848";
const woodDark = "#684830";

// Helper to create interior room at origin (0,0) with tiles 1 unit
export function InteriorRoom() {
  const currentInterior = useElder((s) => s.currentInterior);
  const currentArea = useElder((s) => s.currentArea);
  if (currentArea === "village" || !currentInterior) return null;
  const data = interiors[currentInterior];
  if (!data) return null;
  const map = data.map;
  const W = map[0].length;
  const H = map.length;
  // offset so room centered at far away (50,50) so village remains visible and not z-fighting
  const offX = 50 - W / 2;
  const offZ = 50 - H / 2;

  const centerX = offX + W / 2;
  const centerZ = offZ + H / 2;
  const INT_Y = 2; // floor height = village ground (topOf 4), above water 1.24
  return (
    <group position={[0, INT_Y, 0]}>
      {/* floor — sits on ground, not below water */}
      <mesh position={[centerX, -0.05, centerZ]} receiveShadow>
        <boxGeometry args={[W, 0.1, H]} />
        <meshLambertMaterial color={floorColor} />
      </mesh>
      {/* tiles */}
      {map.map((row, y) =>
        row.map((t, x) => {
          const wx = offX + x + 0.5;
          const wz = offZ + y + 0.5;
          const key = `${x}-${y}`;
          // Walls
          if (t === 7) {
            return (
              <group key={key} position={[wx, 0.9, wz]}>
                <mesh castShadow receiveShadow>
                  <boxGeometry args={[1, 1.8, 1]} />
                  <meshLambertMaterial color={wallColor} />
                </mesh>
                <mesh position={[0, 0.9, 0]}>
                  <boxGeometry args={[1, 0.1, 1]} />
                  <meshLambertMaterial color={wallDark} />
                </mesh>
              </group>
            );
          }
          // Beds
          if (t === 8) {
            return (
              <group key={key} position={[wx, 0.18, wz]}>
                <mesh castShadow>
                  <boxGeometry args={[0.9, 0.22, 0.9]} />
                  <meshLambertMaterial color={bedColor} />
                </mesh>
                <mesh position={[0, 0.14, -0.25]} castShadow>
                  <boxGeometry args={[0.5, 0.12, 0.2]} />
                  <meshLambertMaterial color={"#f0e8d0"} />
                </mesh>
              </group>
            );
          }
          // Sword case (occupies 2 tiles vertically, we render at both but with blade)
          if (t === 9) {
            const above = y > 0 && map[y - 1][x] === 9;
            return (
              <group key={key} position={[wx, 0.5, wz]}>
                <mesh castShadow>
                  <boxGeometry args={[0.7, 0.9, 0.2]} />
                  <meshLambertMaterial color={"#90d0f0"} />
                </mesh>
                <mesh position={[0, 0.1, 0.15]} castShadow>
                  <boxGeometry args={[0.1, 0.7, 0.05]} />
                  <meshLambertMaterial color={"#c8d0d8"} />
                </mesh>
                {!above && (
                  <mesh position={[0, 0.55, 0.12]}>
                    <boxGeometry args={[0.4, 0.08, 0.05]} />
                    <meshLambertMaterial color={"#e8b040"} />
                  </mesh>
                )}
              </group>
            );
          }
          // Table
          if (t === 17) {
            return (
              <group key={key} position={[wx, 0.3, wz]}>
                <mesh castShadow>
                  <boxGeometry args={[0.95, 0.08, 0.95]} />
                  <meshLambertMaterial color={wood} />
                </mesh>
                <mesh position={[0.3, -0.2, 0.3]}>
                  <boxGeometry args={[0.08, 0.4, 0.08]} />
                  <meshLambertMaterial color={woodDark} />
                </mesh>
                <mesh position={[-0.3, -0.2, 0.3]}>
                  <boxGeometry args={[0.08, 0.4, 0.08]} />
                  <meshLambertMaterial color={woodDark} />
                </mesh>
                <mesh position={[0.3, -0.2, -0.3]}>
                  <boxGeometry args={[0.08, 0.4, 0.08]} />
                  <meshLambertMaterial color={woodDark} />
                </mesh>
                <mesh position={[-0.3, -0.2, -0.3]}>
                  <boxGeometry args={[0.08, 0.4, 0.08]} />
                  <meshLambertMaterial color={woodDark} />
                </mesh>
              </group>
            );
          }
          // Chair
          if (t === 18) {
            return (
              <group key={key} position={[wx, 0.25, wz]}>
                <mesh castShadow>
                  <boxGeometry args={[0.5, 0.1, 0.5]} />
                  <meshLambertMaterial color={"#b08860"} />
                </mesh>
                <mesh position={[0, 0.25, -0.2]} castShadow>
                  <boxGeometry args={[0.5, 0.4, 0.08]} />
                  <meshLambertMaterial color={woodDark} />
                </mesh>
              </group>
            );
          }
          // Bookshelf
          if (t === 19) {
            return (
              <group key={key} position={[wx, 0.6, wz]}>
                <mesh castShadow>
                  <boxGeometry args={[0.95, 1.2, 0.4]} />
                  <meshLambertMaterial color={woodDark} />
                </mesh>
                {[0, 1, 2].map((r) => (
                  <mesh key={r} position={[0, 0.3 - r * 0.3, 0.18]}>
                    <boxGeometry args={[0.8, 0.08, 0.1]} />
                    <meshLambertMaterial color={["#d03838", "#48a0f0", "#79c257"][r]} />
                  </mesh>
                ))}
              </group>
            );
          }
          // Exit mat
          if (t === 16) {
            return (
              <group key={key} position={[wx, 0.02, wz]}>
                <mesh receiveShadow>
                  <boxGeometry args={[0.9, 0.04, 0.9]} />
                  <meshLambertMaterial color={"#684830"} />
                </mesh>
                <mesh position={[0, 0.03, 0]}>
                  <boxGeometry args={[0.7, 0.02, 0.7]} />
                  <meshLambertMaterial color={"#906848"} />
                </mesh>
              </group>
            );
          }
          return null;
        })
      )}
      {/* ceiling ambient light for interior */}
      <ambientLight intensity={0.9} />
      <hemisphereLight args={["#fff8e0", "#a07048", 0.6]} />
    </group>
  );
}

// Utility to check if interior tile is solid (like game.js isSolid)
export function isInteriorSolid(map: number[][], tx: number, tz: number) {
  if (tx < 0 || tz < 0 || tx >= map[0].length || tz >= map.length) return true;
  const t = map[tz][tx];
  return t === 7 || t === 8 || t === 9; // wall, bed, sword case block (like game.js)
}

// For exterior door detection in elderville (world tiles)
export function isVillageDoorAt(tx: number, ty: number): string | null {
  const doors: Record<string, [number, number]> = { council: [8, 7], home: [30, 7], homesteadA: [8, 20], homesteadB: [30, 20] };
  for (const [k, [dx, dy]] of Object.entries(doors)) if (dx === tx && dy === ty) return k;
  return null;
}
