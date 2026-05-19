// Three.js InstancedMesh + raycasting for disaster markers. Not a React component
// — `.tsx` extension kept for consistency with the rest of the globe/ folder.

import * as THREE from "three";
import type { EventSummary } from "@/lib/types";
import { TYPE_COLORS_HEX, SEVERITY_SCALE } from "@/lib/constants";
import { latLonToVector3, latLonToQuaternion } from "@/lib/geo";

export interface EventMarkersInstance {
  mesh: THREE.InstancedMesh;
  updateMarkers: (events: EventSummary[]) => void;
  animateTick: (time: number) => void;
  attachInteraction: (
    renderer: THREE.WebGLRenderer,
    camera: THREE.Camera,
    onClick: (id: string) => void
  ) => () => void;
}

const DEFAULT_MAX_INSTANCES = 2000;
const CLICK_DRAG_THRESHOLD_PX = 5;
const MARKER_RADIUS = 1.01;

export function createEventMarkers(maxInstances = DEFAULT_MAX_INSTANCES): EventMarkersInstance {
  const coneGeo = new THREE.ConeGeometry(0.008, 0.028, 6);
  const coneMat = new THREE.MeshPhongMaterial({ vertexColors: true });
  const mesh = new THREE.InstancedMesh(coneGeo, coneMat, maxInstances);
  mesh.count = 0;
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

  // Per-instance color buffer (vertex color via instanced attribute)
  const colorBuffer = new Float32Array(maxInstances * 3);
  const colorAttr = new THREE.InstancedBufferAttribute(colorBuffer, 3);
  colorAttr.setUsage(THREE.DynamicDrawUsage);
  coneGeo.setAttribute("color", colorAttr);

  let currentEvents: EventSummary[] = [];
  let phaseOffsets: number[] = [];

  const dummy = new THREE.Object3D();
  const color = new THREE.Color();

  function writeInstance(i: number, event: EventSummary, scaleMultiplier = 1) {
    const [x, y, z] = latLonToVector3(event.lat, event.lon, MARKER_RADIUS);
    const [qx, qy, qz, qw] = latLonToQuaternion(event.lat, event.lon);
    const baseScale = SEVERITY_SCALE[event.severity ?? "MODERATE"] ?? 1.0;
    dummy.position.set(x, y, z);
    dummy.quaternion.set(qx, qy, qz, qw);
    dummy.scale.setScalar(baseScale * scaleMultiplier);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }

  function updateMarkers(events: EventSummary[]) {
    currentEvents = events;
    phaseOffsets = events.map(() => Math.random() * Math.PI * 2);
    mesh.count = Math.min(events.length, maxInstances);

    events.slice(0, maxInstances).forEach((event, i) => {
      writeInstance(i, event);
      const hexColor = TYPE_COLORS_HEX[event.type] ?? 0x6b7280;
      color.setHex(hexColor);
      colorBuffer[i * 3] = color.r;
      colorBuffer[i * 3 + 1] = color.g;
      colorBuffer[i * 3 + 2] = color.b;
    });

    mesh.instanceMatrix.needsUpdate = true;
    colorAttr.needsUpdate = true;
  }

  function animateTick(time: number) {
    if (currentEvents.length === 0) return;
    currentEvents.slice(0, maxInstances).forEach((event, i) => {
      const phase = phaseOffsets[i] || 0;
      const pulse = 1.0 + Math.sin(time * 2 + phase) * 0.05;
      writeInstance(i, event, pulse);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }

  function attachInteraction(
    renderer: THREE.WebGLRenderer,
    camera: THREE.Camera,
    onClick: (id: string) => void
  ) {
    const raycaster = new THREE.Raycaster();
    const mouseNDC = new THREE.Vector2();
    let mouseDownPos = { x: 0, y: 0 };

    function updateMouseFromEvent(e: MouseEvent) {
      const rect = renderer.domElement.getBoundingClientRect();
      mouseNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    }

    function onMouseDown(e: MouseEvent) {
      mouseDownPos = { x: e.clientX, y: e.clientY };
    }

    function onMouseUp(e: MouseEvent) {
      const dx = e.clientX - mouseDownPos.x;
      const dy = e.clientY - mouseDownPos.y;
      if (Math.sqrt(dx * dx + dy * dy) > CLICK_DRAG_THRESHOLD_PX) return;

      updateMouseFromEvent(e);
      raycaster.setFromCamera(mouseNDC, camera);
      const intersects = raycaster.intersectObject(mesh);

      if (intersects.length > 0) {
        const instanceId = intersects[0].instanceId;
        if (instanceId !== undefined && currentEvents[instanceId]) {
          onClick(currentEvents[instanceId].id);
        }
      }
    }

    function onMouseMove(e: MouseEvent) {
      updateMouseFromEvent(e);
      raycaster.setFromCamera(mouseNDC, camera);
      const hits = raycaster.intersectObject(mesh);
      renderer.domElement.style.cursor = hits.length > 0 ? "pointer" : "grab";
    }

    const canvas = renderer.domElement;
    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("mousemove", onMouseMove);

    return () => {
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("mousemove", onMouseMove);
    };
  }

  return { mesh, updateMarkers, animateTick, attachInteraction };
}
