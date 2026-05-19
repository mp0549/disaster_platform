interface SectionHeaderProps {
  title: string;
  rightSlot?: React.ReactNode;
  className?: string;
  id?: string;
}

const HEADING_CLASSES = "text-[11px] font-bold tracking-[0.1em] uppercase text-light-subtle";

export default function SectionHeader({ title, rightSlot, className = "", id }: SectionHeaderProps) {
  if (!rightSlot) {
    return (
      <h2 id={id} className={`${HEADING_CLASSES} mb-3 ${className}`}>
        {title}
      </h2>
    );
  }
  return (
    <div className={`flex items-center justify-between gap-2 mb-3 ${className}`}>
      <h2 id={id} className={HEADING_CLASSES}>
        {title}
      </h2>
      <div className="flex items-center gap-2">{rightSlot}</div>
    </div>
  );
}
