"use client";

import { useEnrichment } from "./EnrichmentProvider";
import type { ReliefWebReport } from "@/lib/reliefweb";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import SectionHeader from "@/components/ui/SectionHeader";
import Card from "@/components/ui/Card";
import ExternalLink from "@/components/ui/ExternalLink";

interface ReliefWebPanelProps {
  country: string | null;
  accentColor?: string;
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

export default function ReliefWebPanel({ country, accentColor }: ReliefWebPanelProps) {
  const { enrichment, isLoading } = useEnrichment();
  const reports: ReliefWebReport[] = enrichment?.reliefwebReports ?? [];

  return (
    <div>
      <SectionHeader
        title="Humanitarian Reports"
        accent={accentColor}
        rightSlot={<span className="text-[10px] text-light-subtle">via ReliefWeb</span>}
      />

      <Card flush>
        {isLoading ? (
          <div className="p-5 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton height="14px" width="85%" light />
                <Skeleton height="10px" width="40%" light />
              </div>
            ))}
          </div>
        ) : reports.length === 0 ? (
          <EmptyState
            title="No reports found"
            description={country ? `No recent humanitarian reports for ${country}.` : "No country data available."}
            icon="📋"
            light
          />
        ) : (
          <ul>
            {reports.map((report, i) => (
              <li
                key={report.id}
                className={`stagger-item ${i < reports.length - 1 ? "border-b border-light-divider" : ""}`}
              >
                <ExternalLink
                  href={report.url}
                  className="group flex items-start gap-2 px-5 py-3.5 hover:bg-light-hover transition-colors duration-150"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-light-strong font-medium leading-snug line-clamp-2 transition-transform duration-150 group-hover:translate-x-0.5">
                      {report.title}
                    </p>
                    {report.date && (
                      <p className="text-[11px] text-light-subtle mt-1">
                        {new Date(report.date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    )}
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
