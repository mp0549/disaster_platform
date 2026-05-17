"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { EventSummary } from "@/lib/types";

interface GlobeSceneInstance {
  updateEvents: (events: EventSummary[]) => void;
  dispose: () => void;
}

interface GlobeProps {
  events: EventSummary[];
}

export default function Globe({ events }: GlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [isLoaded, setIsLoaded] = useState(false);
  const sceneRef = useRef<GlobeSceneInstance | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let cleanup: (() => void) | undefined;

    async function init() {
      const { createGlobeScene } = await import("./GlobeScene");
      const instance = await createGlobeScene(containerRef.current!, (id: string) => {
        router.push(`/events/${id}`);
      });
      sceneRef.current = instance;
      setIsLoaded(true);
      cleanup = instance.dispose;
    }

    init();

    return () => {
      cleanup?.();
    };
  }, [router]);

  // Update markers when events change
  useEffect(() => {
    if (sceneRef.current && isLoaded) {
      sceneRef.current.updateEvents(events);
    }
  }, [events, isLoaded]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ background: "#0a0a0f" }}
    >
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-[#3b82f6] border-t-transparent rounded-full animate-spin" />
            <span className="label-mono text-[#6b7280]">Initializing Globe</span>
          </div>
        </div>
      )}
    </div>
  );
}
