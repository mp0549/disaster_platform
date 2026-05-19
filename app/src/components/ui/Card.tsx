interface CardProps {
  children: React.ReactNode;
  className?: string;
  /** Visual tint. `neutral` = white panel; `sky` = AI summary blue. */
  tint?: "neutral" | "sky";
  /** Whether the card clips overflow (e.g. for divided lists). */
  flush?: boolean;
}

const TINTS = {
  neutral: "border-light-border bg-light-panel",
  sky: "border-sky-edge bg-sky-bg",
} as const;

export default function Card({
  children,
  className = "",
  tint = "neutral",
  flush = false,
}: CardProps) {
  return (
    <div
      className={`rounded-lg border ${TINTS[tint]} ${flush ? "overflow-hidden" : "p-5"} ${className}`}
    >
      {children}
    </div>
  );
}
