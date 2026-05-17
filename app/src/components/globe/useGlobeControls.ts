"use client";

import { useEffect, useRef, useCallback } from "react";
import type { Camera, WebGLRenderer } from "three";

// Lazily import OrbitControls only on client
let OrbitControlsClass: typeof import("three/examples/jsm/controls/OrbitControls").OrbitControls;

interface UseGlobeControlsOptions {
  camera: Camera | null;
  renderer: WebGLRenderer | null;
  earthGroup: import("three").Group | null;
  enabled: boolean;
}

export function useGlobeControls({ camera, renderer, earthGroup, enabled }: UseGlobeControlsOptions) {
  const controlsRef = useRef<InstanceType<typeof import("three/examples/jsm/controls/OrbitControls").OrbitControls> | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAutoRotatingRef = useRef(true);
  const lastInteractionRef = useRef(0);

  const resetIdleTimer = useCallback(() => {
    isAutoRotatingRef.current = false;
    lastInteractionRef.current = Date.now();
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      isAutoRotatingRef.current = true;
    }, 5000);
  }, []);

  useEffect(() => {
    if (!camera || !renderer || !enabled) return;

    let controls: InstanceType<typeof import("three/examples/jsm/controls/OrbitControls").OrbitControls>;

    async function init() {
      const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js");
      OrbitControlsClass = OrbitControls;

      controls = new OrbitControls(camera!, renderer!.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.minDistance = 1.5;
      controls.maxDistance = 5;
      controls.enablePan = false;
      controls.rotateSpeed = 0.5;
      controls.zoomSpeed = 0.8;

      controls.addEventListener("start", resetIdleTimer);
      controls.addEventListener("change", () => {
        if (Date.now() - lastInteractionRef.current < 5100) {
          resetIdleTimer();
        }
      });

      controlsRef.current = controls;
    }

    init();

    return () => {
      if (controls) {
        controls.removeEventListener("start", resetIdleTimer);
        controls.dispose();
      }
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [camera, renderer, enabled, resetIdleTimer]);

  // Auto-rotation tick — called each animation frame
  const tickAutoRotation = useCallback(() => {
    if (isAutoRotatingRef.current && earthGroup) {
      earthGroup.rotation.y += 0.0008;
    }
    if (controlsRef.current) {
      controlsRef.current.update();
    }
  }, [earthGroup]);

  return { controls: controlsRef, tickAutoRotation };
}
