import * as THREE from "three";

/**
 * Procedural star field — random points distributed in a cube around the origin.
 * Returned object can be added directly to the scene.
 */
export function createStarField(count = 3000, spread = 200): THREE.Points {
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count * 3; i++) {
    positions[i] = (Math.random() - 0.5) * spread;
  }
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const mat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.15,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.7,
  });

  return new THREE.Points(geo, mat);
}
