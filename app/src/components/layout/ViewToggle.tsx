"use client";

interface ViewToggleProps {
  value: "3d" | "2d";
  onChange: (value: "3d" | "2d") => void;
}

export default function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <div
      className="glass rounded-lg p-1 flex items-center gap-0.5 border border-white/[0.06]"
      role="tablist"
      aria-label="Visualization mode"
    >
      <button
        role="tab"
        aria-selected={value === "3d"}
        onClick={() => onChange("3d")}
        className={`px-3 py-1.5 rounded-md text-[11px] font-bold tracking-[0.1em] uppercase transition-all duration-200 ${
          value === "3d"
            ? "bg-[#3b82f6] text-white"
            : "text-[#6b7280] hover:text-[#e5e5e5]"
        }`}
      >
        3D
      </button>
      <button
        role="tab"
        aria-selected={value === "2d"}
        onClick={() => onChange("2d")}
        className={`px-3 py-1.5 rounded-md text-[11px] font-bold tracking-[0.1em] uppercase transition-all duration-200 ${
          value === "2d"
            ? "bg-[#3b82f6] text-white"
            : "text-[#6b7280] hover:text-[#e5e5e5]"
        }`}
      >
        2D
      </button>
    </div>
  );
}
