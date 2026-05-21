"use client";

interface ViewToggleProps {
  value: "3d" | "2d";
  onChange: (value: "3d" | "2d") => void;
}

export default function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <div
      className="relative flex bg-white/[0.06] border border-white/[0.06] rounded-lg p-0.5"
      role="tablist"
      aria-label="Visualization mode"
    >
      {/* Sliding amber indicator */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-0.5 bottom-0.5 w-[calc(50%-2px)] rounded-[6px] transition-transform duration-200 ease-out"
        style={{
          background: "linear-gradient(135deg, #EF9F27 0%, #BA7517 100%)",
          transform: value === "2d" ? "translateX(calc(100% + 2px))" : "translateX(0)",
        }}
      />

      {["3d", "2d"].map((v) => {
        const isActive = value === v;
        return (
          <button
            key={v}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(v as "3d" | "2d")}
            className={`relative z-10 flex-1 px-3.5 py-1.5 rounded-md text-[11px] font-bold tracking-[0.1em] uppercase transition-colors duration-150 ${
              isActive ? "text-[#1a0a00]" : "text-dark-muted hover:text-dark-text"
            }`}
          >
            {v.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
