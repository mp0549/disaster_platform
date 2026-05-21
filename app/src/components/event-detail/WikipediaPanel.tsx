"use client";

import { useEnrichment } from "./EnrichmentProvider";
import SectionHeader from "@/components/ui/SectionHeader";
import Card from "@/components/ui/Card";
import ExternalLink from "@/components/ui/ExternalLink";

interface WikipediaPanelProps {
  accentColor?: string;
}

export default function WikipediaPanel({ accentColor }: WikipediaPanelProps) {
  const { enrichment, isLoading } = useEnrichment();

  // Hidden while loading and hidden if no data after load
  if (isLoading || !enrichment?.wikipediaSummary) return null;

  return (
    <div>
      <SectionHeader
        title="Background"
        accent={accentColor}
        rightSlot={<span className="text-[10px] text-light-subtle">via Wikipedia</span>}
      />
      <Card>
        <p className="text-[13px] text-light-muted leading-relaxed">{enrichment.wikipediaSummary}</p>
        {enrichment.wikipediaUrl && (
          <ExternalLink
            href={enrichment.wikipediaUrl}
            className="inline-flex items-center gap-1 mt-3 text-[11px] text-light-subtle hover:text-light-muted transition-colors duration-150"
          >
            Read more on Wikipedia →
          </ExternalLink>
        )}
      </Card>
    </div>
  );
}
