interface SectionHeaderProps {
  title: string;
  rightSlot?: React.ReactNode;
  className?: string;
  id?: string;
  accent?: string;
}

const HEADING_CLASSES = "flex items-center gap-1.5 text-[11px] font-bold tracking-[0.1em] uppercase text-light-subtle";

export default function SectionHeader({ title, rightSlot, className = "", id, accent }: SectionHeaderProps) {
  const accentBar = accent ? (
    <span className="w-0.5 h-4 rounded-full shrink-0" style={{ backgroundColor: accent }} aria-hidden="true" />
  ) : null;

  if (!rightSlot) {
    return (
      <h2 id={id} className={`${HEADING_CLASSES} mb-3 ${className}`}>
        {accentBar}
        {title}
      </h2>
    );
  }
  return (
    <div className={`flex items-center justify-between gap-2 mb-3 ${className}`}>
      <h2 id={id} className={HEADING_CLASSES}>
        {accentBar}
        {title}
      </h2>
      <div className="flex items-center gap-2">{rightSlot}</div>
    </div>
  );
}
