"use client";

import { useState, useEffect } from "react";
import { fetchReliefWebReports } from "@/lib/reliefweb";
import type { ReliefWebReport } from "@/lib/reliefweb";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import SectionHeader from "@/components/ui/SectionHeader";
import Card from "@/components/ui/Card";
import ExternalLink from "@/components/ui/ExternalLink";

interface ReliefWebPanelProps {
  country: string | null;
}

export default function ReliefWebPanel({ country }: ReliefWebPanelProps) {
  const [reports, setReports] = useState<ReliefWebReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!country) {
      setIsLoading(false);
      return;
    }
    fetchReliefWebReports(country).then((data) => {
      setReports(data);
      setIsLoading(false);
    });
  }, [country]);

  return (
    <div>
      <SectionHeader
        title="Humanitarian Reports"
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
            title="No humanitarian reports available"
            description={country ? `No recent reports for ${country}.` : "No country data available."}
            icon="📋"
            light
          />
        ) : (
          <ul>
            {reports.map((report, i) => (
              <li
                key={report.id}
                className={`stagger-item px-5 py-3.5 hover:bg-light-hover transition-colors duration-150 ${
                  i < reports.length - 1 ? "border-b border-light-divider" : ""
                }`}
              >
                <ExternalLink href={report.url} className="block group">
                  <p className="text-[13px] text-light-strong font-medium leading-snug group-hover:text-blue-600 transition-colors duration-150 line-clamp-2">
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
                </ExternalLink>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
