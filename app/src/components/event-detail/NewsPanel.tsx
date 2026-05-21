"use client";

import { useEnrichment } from "./EnrichmentProvider";
import SectionHeader from "@/components/ui/SectionHeader";
import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import ExternalLink from "@/components/ui/ExternalLink";

interface NewsPanelProps {
  accentColor?: string;
}

function RelativeTime({ dateStr }: { dateStr: string | null }) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const diff = Date.now() - d.getTime();
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  const label = days >= 1 ? `${days}d ago` : hours >= 1 ? `${hours}h ago` : "Just now";
  return <span className="text-[11px] text-light-subtle">{label}</span>;
}

function ExternalArrow() {
  return (
    <svg
      viewBox="0 0 12 12"
      fill="none"
      className="w-3 h-3 shrink-0 opacity-0 group-hover:opacity-60 transition-opacity duration-150"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 10L10 2M10 2H5M10 2v5" />
    </svg>
  );
}

export default function NewsPanel({ accentColor }: NewsPanelProps) {
  const { enrichment, isLoading } = useEnrichment();
  const raw = enrichment?.newsItems ?? null;
  const items = raw
    ? [...raw].sort((a, b) => {
        const ta = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
        const tb = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
        return tb - ta;
      })
    : null;

  return (
    <div>
      <SectionHeader title="Recent News" accent={accentColor} />
      <Card flush>
        {isLoading && !items ? (
          <div className="p-5 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton height="14px" width="80%" light />
                <Skeleton height="10px" width="35%" light />
              </div>
            ))}
          </div>
        ) : !items || items.length === 0 ? (
          <EmptyState title="No news found" description="No recent news articles matched this event." icon="📰" light />
        ) : (
          <ul>
            {items.map((item, i) => (
              <li
                key={i}
                className={`stagger-item ${i < items.length - 1 ? "border-b border-light-divider" : ""}`}
              >
                <ExternalLink
                  href={item.url}
                  className="group flex items-start gap-2 px-5 py-3.5 hover:bg-light-hover transition-colors duration-150"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-light-strong font-medium leading-snug line-clamp-2 transition-transform duration-150 group-hover:translate-x-0.5">
                      {item.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {item.source && (
                        <span className="text-[10px] text-light-subtle font-medium">{item.source}</span>
                      )}
                      {item.source && item.publishedAt && (
                        <span className="text-[10px] text-light-border">·</span>
                      )}
                      <RelativeTime dateStr={item.publishedAt} />
                    </div>
                  </div>
                  <ExternalArrow />
                </ExternalLink>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
