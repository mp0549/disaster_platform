"use client";

interface ToggleProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description?: string;
}

/** Dark-theme switch styled for the filter sidebar. */
export default function Toggle({ checked, onChange, label, description }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-start gap-3 w-full text-left interactive group py-1"
    >
      <span
        className={`mt-0.5 relative inline-flex h-4 w-7 shrink-0 rounded-full transition-colors duration-150 ${
          checked ? "bg-dark-accent" : "bg-white/10"
        }`}
      >
        <span
          className={`absolute top-0.5 inline-block h-3 w-3 rounded-full bg-white shadow transition-transform duration-150 ${
            checked ? "translate-x-[14px]" : "translate-x-0.5"
          }`}
        />
      </span>
      <span className="flex flex-col min-w-0">
        <span className="text-[12px] font-medium text-dark-text">{label}</span>
        {description && (
          <span className="text-[10px] text-dark-muted leading-snug mt-0.5">{description}</span>
        )}
      </span>
    </button>
  );
}
