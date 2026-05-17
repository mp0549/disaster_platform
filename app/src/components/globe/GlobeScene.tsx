/**
 * GlobeScene.tsx
 * Manages the Three.js scene, camera, renderer, lights, and animation loop.
 * Exported as a factory function to allow lazy import from Globe.tsx.
 * Not a React component — no "use client" directive needed.
 */

import * as THREE from "three";
import type { EventSummary } from "@/lib/types";
import { TYPE_COLORS_HEX, SEVERITY_SCALE } from "@/lib/constants";
import { latLonToVector3, latLonToQuaternion } from "@/lib/geo";

export interface GlobeSceneInstance {
  updateEvents: (events: EventSummary[]) => void;
  dispose: () => void;
}

const ATMOSPHERE_VERT = `
varying vec3 vNormal;
varying vec3 vPosition;
void main() {
  vNormal = normalize(normalMatrix * normal);
  vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const ATMOSPHERE_FRAG = `
varying vec3 vNormal;
varying vec3 vPosition;
void main() {
  vec3 viewDir = normalize(-vPosition);
  float rimStrength = 1.0 - abs(dot(vNormal, viewDir));
  rimStrength = pow(rimStrength, 2.2);
  vec3 atmosphereColor = vec3(0.28, 0.58, 1.0);
  float alpha = rimStrength * 0.85;
  gl_FragColor = vec4(atmosphereColor, alpha);
}
`;

export async function createGlobeScene(
  container: HTMLDivElement,
  onEventClick: (id: string) => void
): Promise<GlobeSceneInstance> {
  const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js");

  // ── Renderer ──────────────────────────────────────────────────────────────
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    preserveDrawingBuffer: false,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setClearColor(0x0a0a0f, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  container.appendChild(renderer.domElement);

  // ── Scene ─────────────────────────────────────────────────────────────────
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a0f);

  // Distant stars — procedural
  const starGeo = new THREE.BufferGeometry();
  const starCount = 3000;
  const starPositions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount * 3; i++) {
    starPositions[i] = (Math.random() - 0.5) * 200;
  }
  starGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
  const starMat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.15,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.7,
  });
  scene.add(new THREE.Points(starGeo, starMat));

  // ── Camera ────────────────────────────────────────────────────────────────
  const camera = new THREE.PerspectiveCamera(
    45,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );
  camera.position.set(0, 0, 2.5);
  camera.lookAt(0, 0, 0);

  // ── Lights ────────────────────────────────────────────────────────────────
  const ambientLight = new THREE.AmbientLight(0x404060, 0.4);
  scene.add(ambientLight);

  const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
  sunLight.position.set(5, 3, 5);
  scene.add(sunLight);

  const fillLight = new THREE.PointLight(0x4488ff, 0.3);
  fillLight.position.set(-5, -3, -5);
  scene.add(fillLight);

  // ── Earth Group (rotates together) ───────────────────────────────────────
  const earthGroup = new THREE.Group();
  scene.add(earthGroup);

  // ── Earth Sphere ─────────────────────────────────────────────────────────
  const earthGeo = new THREE.SphereGeometry(1, 64, 64);
  const textureLoader = new THREE.TextureLoader();

  // Fallback material — used immediately, replaced if texture loads
  const earthMat = new THREE.MeshPhongMaterial({
    color: 0x1a3a6a,
    emissive: 0x071525,
    emissiveIntensity: 0.3,
    specular: new THREE.Color(0x2244aa),
    shininess: 20,
  });

  // Load NASA Blue Marble texture asynchronously (swap in when ready)
  textureLoader.load(
    "/textures/earth_daymap_8k.jpg",
    (dayTexture) => {
      dayTexture.colorSpace = THREE.SRGBColorSpace;
      // Blue Marble is oriented with 0° lon at center → offset UV by +0.5
      dayTexture.wrapS = THREE.RepeatWrapping;
      dayTexture.offset.x = 0.5;
      earthMat.map = dayTexture;
      earthMat.color.set(0xffffff); // let texture provide color
      earthMat.emissiveIntensity = 0;
      earthMat.specular.set(0x111111);
      earthMat.shininess = 8;
      earthMat.needsUpdate = true;
    },
    undefined,
    () => { /* texture missing — keep procedural fallback */ }
  );

  const earthMesh = new THREE.Mesh(earthGeo, earthMat);
  earthGroup.add(earthMesh);

  // ── Atmosphere Glow ───────────────────────────────────────────────────────
  const atmosphereGeo = new THREE.SphereGeometry(1.025, 64, 64);
  const atmosphereMat = new THREE.ShaderMaterial({
    vertexShader: ATMOSPHERE_VERT,
    fragmentShader: ATMOSPHERE_FRAG,
    transparent: true,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const atmosphereMesh = new THREE.Mesh(atmosphereGeo, atmosphereMat);
  earthGroup.add(atmosphereMesh);

  // ── OrbitControls ─────────────────────────────────────────────────────────
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 1.5;
  controls.maxDistance = 5;
  controls.enablePan = false;
  controls.rotateSpeed = 0.5;
  controls.zoomSpeed = 0.8;

  // ── Auto-rotation ─────────────────────────────────────────────────────────
  let isAutoRotating = true;
  let idleTimer: ReturnType<typeof setTimeout> | null = null;

  controls.addEventListener("start", () => {
    isAutoRotating = false;
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(() => { isAutoRotating = true; }, 5000);
  });

  // ── Event Markers (InstancedMesh) ─────────────────────────────────────────
  const MAX_INSTANCES = 2000;
  const coneGeo = new THREE.ConeGeometry(0.008, 0.028, 6);
  const coneMat = new THREE.MeshPhongMaterial({ vertexColors: true });
  const instancedMesh = new THREE.InstancedMesh(coneGeo, coneMat, MAX_INSTANCES);
  instancedMesh.count = 0;
  instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(instancedMesh);

  // Per-instance color buffer
  const colorBuffer = new Float32Array(MAX_INSTANCES * 3);
  const colorAttr = new THREE.InstancedBufferAttribute(colorBuffer, 3);
  colorAttr.setUsage(THREE.DynamicDrawUsage);
  coneGeo.setAttribute("color", colorAttr);

  let currentEvents: EventSummary[] = [];
  let phaseOffsets: number[] = [];

  const dummy = new THREE.Object3D();
  const color = new THREE.Color();

  function updateMarkers(events: EventSummary[]) {
    currentEvents = events;
    phaseOffsets = events.map(() => Math.random() * Math.PI * 2);
    instancedMesh.count = Math.min(events.length, MAX_INSTANCES);

    events.slice(0, MAX_INSTANCES).forEach((event, i) => {
      const [x, y, z] = latLonToVector3(event.lat, event.lon, 1.01);
      const [qx, qy, qz, qw] = latLonToQuaternion(event.lat, event.lon);

      const scale = SEVERITY_SCALE[event.severity ?? "MODERATE"] ?? 1.0;
      dummy.position.set(x, y, z);
      dummy.quaternion.set(qx, qy, qz, qw);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      instancedMesh.setMatrixAt(i, dummy.matrix);

      // Color
      const hexColor = TYPE_COLORS_HEX[event.type] ?? 0x6b7280;
      color.setHex(hexColor);
      colorBuffer[i * 3] = color.r;
      colorBuffer[i * 3 + 1] = color.g;
      colorBuffer[i * 3 + 2] = color.b;
    });

    instancedMesh.instanceMatrix.needsUpdate = true;
    colorAttr.needsUpdate = true;
  }

  // ── Raycasting for click ──────────────────────────────────────────────────
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let mouseDownPos = { x: 0, y: 0 };

  function onMouseDown(e: MouseEvent) {
    mouseDownPos = { x: e.clientX, y: e.clientY };
  }

  function onMouseUp(e: MouseEvent) {
    const dx = e.clientX - mouseDownPos.x;
    const dy = e.clientY - mouseDownPos.y;
    if (Math.sqrt(dx * dx + dy * dy) > 5) return; // Dragged, not a click

    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(instancedMesh);

    if (intersects.length > 0) {
      const instanceId = intersects[0].instanceId;
      if (instanceId !== undefined && currentEvents[instanceId]) {
        onEventClick(currentEvents[instanceId].id);
      }
    }
  }

  renderer.domElement.addEventListener("mousedown", onMouseDown);
  renderer.domElement.addEventListener("mouseup", onMouseUp);

  // ── Cursor change on hover ────────────────────────────────────────────────
  function onMouseMove(e: MouseEvent) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObject(instancedMesh);
    renderer.domElement.style.cursor = hits.length > 0 ? "pointer" : "grab";
  }
  renderer.domElement.addEventListener("mousemove", onMouseMove);

  // ── Resize handler ────────────────────────────────────────────────────────
  function onResize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
  window.addEventListener("resize", onResize);

  // ── Animation loop ────────────────────────────────────────────────────────
  let frameId: number;
  let time = 0;

  function animate() {
    frameId = requestAnimationFrame(animate);
    time += 0.016;

    // Auto-rotate
    if (isAutoRotating) {
      earthGroup.rotation.y += 0.0008;
    }
    controls.update();

    // Marker pulse — scale oscillation per instance
    if (currentEvents.length > 0) {
      currentEvents.slice(0, MAX_INSTANCES).forEach((event, i) => {
        const phase = phaseOffsets[i] || 0;
        const pulse = 1.0 + Math.sin(time * 2 + phase) * 0.05;
        const [x, y, z] = latLonToVector3(event.lat, event.lon, 1.01);
        const [qx, qy, qz, qw] = latLonToQuaternion(event.lat, event.lon);
        const scale = (SEVERITY_SCALE[event.severity ?? "MODERATE"] ?? 1.0) * pulse;
        dummy.position.set(x, y, z);
        dummy.quaternion.set(qx, qy, qz, qw);
        dummy.scale.setScalar(scale);
        dummy.updateMatrix();
        instancedMesh.setMatrixAt(i, dummy.matrix);
      });
      instancedMesh.instanceMatrix.needsUpdate = true;
    }

    renderer.render(scene, camera);
  }

  animate();

  // ── Public interface ──────────────────────────────────────────────────────
  return {
    updateEvents: updateMarkers,
    dispose: () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", onResize);
      renderer.domElement.removeEventListener("mousedown", onMouseDown);
      renderer.domElement.removeEventListener("mouseup", onMouseUp);
      renderer.domElement.removeEventListener("mousemove", onMouseMove);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      if (idleTimer) clearTimeout(idleTimer);
    },
  };
}
