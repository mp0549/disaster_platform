// Three.js earth + atmosphere factory. Not a React component — `.tsx` extension
// kept for consistency with the rest of the globe/ folder.

import * as THREE from "three";
import { ATMOSPHERE_VERT, ATMOSPHERE_FRAG } from "./shaders";

export interface EarthMeshInstance {
  group: THREE.Group;
  earth: THREE.Mesh;
  atmosphere: THREE.Mesh;
}

const EARTH_TEXTURE_URL = "/textures/earth_daymap_8k.jpg";

export function createEarthMesh(): EarthMeshInstance {
  const group = new THREE.Group();

  // Fallback material — used immediately; replaced when the texture loads.
  const earthMat = new THREE.MeshPhongMaterial({
    color: 0x1a3a6a,
    emissive: 0x071525,
    emissiveIntensity: 0.3,
    specular: new THREE.Color(0x2244aa),
    shininess: 20,
  });

  new THREE.TextureLoader().load(
    EARTH_TEXTURE_URL,
    (dayTexture) => {
      dayTexture.colorSpace = THREE.SRGBColorSpace;
      // Blue Marble is centered at 0° lon → offset UV by +0.5 so seams align.
      dayTexture.wrapS = THREE.RepeatWrapping;
      dayTexture.offset.x = 0.5;
      earthMat.map = dayTexture;
      earthMat.color.set(0xffffff);
      earthMat.emissiveIntensity = 0;
      earthMat.specular.set(0x111111);
      earthMat.shininess = 8;
      earthMat.needsUpdate = true;
    },
    undefined,
    () => {
      // Texture missing — keep procedural fallback
    }
  );

  const earth = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 64), earthMat);
  group.add(earth);

  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(1.025, 64, 64),
    new THREE.ShaderMaterial({
      vertexShader: ATMOSPHERE_VERT,
      fragmentShader: ATMOSPHERE_FRAG,
      transparent: true,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  group.add(atmosphere);

  return { group, earth, atmosphere };
}
