"use client";

import { useState } from "react";
import Toggle from "@/components/ui/Toggle";
import type { MapSettings } from "@/lib/types";

interface AdvancedSettingsProps {
  settings: MapSettings;
  onChange: (next: MapSettings) => void;
}

export default function AdvancedSettings({ settings, onChange }: AdvancedSettingsProps) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center justify-between w-full label-mono interactive"
      >
        <span>Display</span>
        <svg
          viewBox="0 0 16 16"
          fill="none"
          className={`w-3 h-3 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="mt-2 flex flex-col gap-1">
          <Toggle
            label="Cluster nearby events"
            description="Group bubbles at low zoom; expand on zoom in"
            checked={settings.clustering}
            onChange={(clustering) => onChange({ ...settings, clustering })}
          />
          <Toggle
            label="Show event zones"
            description="Shade the affected area for storms, alerts, etc."
            checked={settings.zones}
            onChange={(zones) => onChange({ ...settings, zones })}
          />
        </div>
      )}
    </div>
  );
}
