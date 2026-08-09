import * as THREE from "three";

/** Materials shared across the scene so the day/night loop can tweak them once. */
export const windowMat = new THREE.MeshLambertMaterial({
  color: "#2b2415",
  emissive: new THREE.Color("#ffcf6b"),
});
windowMat.emissiveIntensity = 0;

export const glowMat = new THREE.MeshBasicMaterial({ color: "#3a3524", toneMapped: false });
export const fireflyMat = new THREE.MeshBasicMaterial({
  color: "#e9ff8a",
  toneMapped: false,
  transparent: true,
  opacity: 0,
  fog: false,
});
export const starMat = new THREE.MeshBasicMaterial({
  color: "#ffffff",
  toneMapped: false,
  transparent: true,
  opacity: 0,
  fog: false,
});

export const box = new THREE.BoxGeometry(1, 1, 1);
