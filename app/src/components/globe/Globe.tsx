"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { EventSummary } from "@/lib/types";
import Spinner from "../ui/Spinner";

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
    <div ref={containerRef} className="w-full h-full bg-dark-bg">
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Spinner size="lg" />
            <span className="label-mono">Initializing Globe</span>
          </div>
        </div>
      )}
    </div>
  );
}
