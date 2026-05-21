import ExternalLink from "@/components/ui/ExternalLink";
import type { EventSource } from "@/lib/types";
import { SOURCE_LABELS } from "@/lib/constants";

interface SourceLinkProps {
  source: EventSource;
  sourceUrl: string | null;
}

export default function SourceLink({ source, sourceUrl }: SourceLinkProps) {
  if (!sourceUrl) return null;

  const label = SOURCE_LABELS[source] ?? source;

  return (
    <ExternalLink
      href={sourceUrl}
      className="inline-flex items-center gap-1.5 text-[12px] font-medium text-light-strong hover:text-light-strong border border-light-border bg-light-panel hover:bg-light-hover rounded-lg px-3.5 py-1.5 transition-colors duration-150 shadow-sm"
    >
      <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3 shrink-0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 10L10 2M10 2H5M10 2v5" />
      </svg>
      View on {label}
    </ExternalLink>
  );
}
