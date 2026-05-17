"use client";

import { useState, useEffect } from "react";
import { fetchReliefWebReports } from "@/lib/reliefweb";
import type { ReliefWebReport } from "@/lib/reliefweb";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";

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
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-[11px] font-bold tracking-[0.1em] uppercase text-[#9ca3af]">
          Humanitarian Reports
        </h2>
        <span className="text-[10px] text-[#9ca3af]">via ReliefWeb</span>
      </div>

      <div className="rounded-lg border border-[#e5e5e5] bg-white overflow-hidden">
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
                className={`stagger-item px-5 py-3.5 hover:bg-[#f9fafb] transition-colors duration-150 ${
                  i < reports.length - 1 ? "border-b border-[#f0f0f0]" : ""
                }`}
              >
                <a
                  href={report.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block group"
                >
                  <p className="text-[13px] text-[#111827] font-medium leading-snug group-hover:text-[#2563eb] transition-colors duration-150 line-clamp-2">
                    {report.title}
                  </p>
                  {report.date && (
                    <p className="text-[11px] text-[#9ca3af] mt-1">
                      {new Date(report.date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  )}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
