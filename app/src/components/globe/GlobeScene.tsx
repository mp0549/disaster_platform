/**
 * GlobeScene.tsx — Three.js scene factory invoked by Globe.tsx via dynamic import.
 * Not a React component. Composes EarthMesh + EventMarkers + lights + animation loop.
 */

import * as THREE from "three";
import type { EventSummary } from "@/lib/types";
import { createStarField } from "./starField";
import { createEarthMesh } from "./EarthMesh";
import { createEventMarkers } from "./EventMarkers";

export interface GlobeSceneInstance {
  updateEvents: (events: EventSummary[]) => void;
  dispose: () => void;
}

const IDLE_AUTO_ROTATE_MS = 5000;
const AUTO_ROTATE_SPEED = 0.0008;

export async function createGlobeScene(
  container: HTMLDivElement,
  onEventClick: (id: string) => void
): Promise<GlobeSceneInstance> {
  const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js");

  // ── Renderer ─────────────────────────────────────────────────────────────
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

  // ── Scene ────────────────────────────────────────────────────────────────
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a0f);
  scene.add(createStarField());

  // ── Camera ───────────────────────────────────────────────────────────────
  const camera = new THREE.PerspectiveCamera(
    45,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );
  camera.position.set(0, 0, 2.5);
  camera.lookAt(0, 0, 0);

  // ── Lights ───────────────────────────────────────────────────────────────
  scene.add(new THREE.AmbientLight(0x404060, 0.4));
  const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
  sunLight.position.set(5, 3, 5);
  scene.add(sunLight);
  const fillLight = new THREE.PointLight(0x4488ff, 0.3);
  fillLight.position.set(-5, -3, -5);
  scene.add(fillLight);

  // ── Earth + atmosphere ───────────────────────────────────────────────────
  const earth = createEarthMesh();
  scene.add(earth.group);

  // ── OrbitControls ────────────────────────────────────────────────────────
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 1.5;
  controls.maxDistance = 5;
  controls.enablePan = false;
  controls.rotateSpeed = 0.5;
  controls.zoomSpeed = 0.8;

  // ── Auto-rotation: pauses on user interaction, resumes after idle ────────
  let isAutoRotating = true;
  let idleTimer: ReturnType<typeof setTimeout> | null = null;

  controls.addEventListener("start", () => {
    isAutoRotating = false;
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      isAutoRotating = true;
    }, IDLE_AUTO_ROTATE_MS);
  });

  // ── Event markers + raycasting ───────────────────────────────────────────
  const markers = createEventMarkers();
  scene.add(markers.mesh);
  const detachInteraction = markers.attachInteraction(renderer, camera, onEventClick);

  // ── Resize ───────────────────────────────────────────────────────────────
  function onResize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
  window.addEventListener("resize", onResize);

  // ── Animation loop ───────────────────────────────────────────────────────
  let frameId = 0;
  let time = 0;

  function animate() {
    frameId = requestAnimationFrame(animate);
    time += 0.016;

    if (isAutoRotating) {
      earth.group.rotation.y += AUTO_ROTATE_SPEED;
    }
    controls.update();
    markers.animateTick(time);

    renderer.render(scene, camera);
  }
  animate();

  return {
    updateEvents: markers.updateMarkers,
    dispose: () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", onResize);
      detachInteraction();
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      if (idleTimer) clearTimeout(idleTimer);
    },
  };
}
