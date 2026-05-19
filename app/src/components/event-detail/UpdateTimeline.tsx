"use client";

import { useState, useEffect } from "react";
import { fetchEventUpdates } from "@/lib/api";
import type { EventUpdate } from "@/lib/types";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import SectionHeader from "@/components/ui/SectionHeader";
import Card from "@/components/ui/Card";

interface UpdateTimelineProps {
  eventId: string;
}

export default function UpdateTimeline({ eventId }: UpdateTimelineProps) {
  const [updates, setUpdates] = useState<EventUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchEventUpdates(eventId).then((data) => {
      setUpdates(data.updates);
      setIsLoading(false);
    });
  }, [eventId]);

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const countLabel =
    !isLoading && updates.length > 0
      ? `${updates.length} update${updates.length !== 1 ? "s" : ""}`
      : null;

  return (
    <div>
      <SectionHeader
        title="Change History"
        rightSlot={countLabel ? <span className="text-[11px] text-light-subtle">{countLabel}</span> : undefined}
      />

      <Card flush>
        {isLoading ? (
          <div className="p-5 space-y-5">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton width="16px" height="16px" className="rounded-full shrink-0 mt-0.5" light />
                <div className="flex-1 space-y-1.5">
                  <Skeleton height="12px" width="30%" light />
                  <Skeleton height="14px" width="60%" light />
                </div>
              </div>
            ))}
          </div>
        ) : updates.length === 0 ? (
          <EmptyState
            title="No updates recorded yet"
            description="Changes to this event will appear here."
            icon="📝"
            light
          />
        ) : (
          <div className="divide-y divide-light-divider">
            {updates.map((update, i) => {
              const isExpanded = expanded.has(update.id);
              return (
                <div key={update.id} className="stagger-item px-5 py-4">
                  <div className="flex items-start gap-3">
                    {/* Timeline dot */}
                    <div className="relative flex flex-col items-center shrink-0 mt-0.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-dark-accent ring-2 ring-white ring-offset-1" />
                      {i < updates.length - 1 && (
                        <div className="w-px h-full min-h-[20px] bg-light-border mt-1" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-light-muted mb-1">
                        {new Date(update.createdAt).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>

                      <div className="flex flex-wrap gap-1 mb-2">
                        {update.changedFields.map((field) => (
                          <span
                            key={field}
                            className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-sky-bg text-sky-text border border-sky-border"
                          >
                            {field}
                          </span>
                        ))}
                      </div>

                      <button
                        onClick={() => toggleExpand(update.id)}
                        className="text-[11px] text-light-muted hover:text-light-text transition-colors duration-150"
                      >
                        {isExpanded ? "Hide snapshot ↑" : "View snapshot →"}
                      </button>

                      {isExpanded && (
                        <div className="mt-2 p-3 rounded bg-light-hover border border-light-border overflow-x-auto">
                          <pre className="text-[11px] text-light-text font-mono whitespace-pre-wrap break-all">
                            {JSON.stringify(update.snapshot, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
