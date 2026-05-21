"use client";

import Toggle from "@/components/ui/Toggle";
import type { MapSettings } from "@/lib/types";

interface AdvancedSettingsProps {
  settings: MapSettings;
  onChange: (next: MapSettings) => void;
}

export default function AdvancedSettings({ settings, onChange }: AdvancedSettingsProps) {
  return (
    <div>
      <span className="label-mono block mb-1.5">Display</span>
      <div className="flex flex-col gap-0.5">
        <Toggle
          label="Cluster nearby events"
          checked={settings.clustering}
          onChange={(clustering) => onChange({ ...settings, clustering })}
        />
        <Toggle
          label="Show event zones"
          checked={settings.zones}
          onChange={(zones) => onChange({ ...settings, zones })}
        />
      </div>
    </div>
  );
}
