"use client";

import { useState, useEffect } from "react";
import { fetchEventUpdates } from "@/lib/api";
import type { EventUpdate } from "@/lib/types";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";

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
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[11px] font-bold tracking-[0.1em] uppercase text-[#9ca3af]">
          Change History
        </h2>
        {!isLoading && updates.length > 0 && (
          <span className="text-[11px] text-[#9ca3af]">{updates.length} update{updates.length !== 1 ? "s" : ""}</span>
        )}
      </div>

      <div className="rounded-lg border border-[#e5e5e5] bg-white overflow-hidden">
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
          <div className="divide-y divide-[#f0f0f0]">
            {updates.map((update, i) => {
              const isExpanded = expanded.has(update.id);
              return (
                <div key={update.id} className="stagger-item px-5 py-4">
                  <div className="flex items-start gap-3">
                    {/* Timeline dot */}
                    <div className="relative flex flex-col items-center shrink-0 mt-0.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#3b82f6] ring-2 ring-white ring-offset-1" />
                      {i < updates.length - 1 && (
                        <div className="w-px h-full min-h-[20px] bg-[#e5e5e5] mt-1" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Timestamp */}
                      <p className="text-[11px] text-[#6b7280] mb-1">
                        {new Date(update.createdAt).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>

                      {/* Changed fields */}
                      <div className="flex flex-wrap gap-1 mb-2">
                        {update.changedFields.map((field) => (
                          <span
                            key={field}
                            className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-[#f0f9ff] text-[#0369a1] border border-[#bae6fd]"
                          >
                            {field}
                          </span>
                        ))}
                      </div>

                      {/* Expandable snapshot */}
                      <button
                        onClick={() => toggleExpand(update.id)}
                        className="text-[11px] text-[#6b7280] hover:text-[#374151] transition-colors duration-150"
                      >
                        {isExpanded ? "Hide snapshot ↑" : "View snapshot →"}
                      </button>

                      {isExpanded && (
                        <div className="mt-2 p-3 rounded bg-[#f9fafb] border border-[#e5e5e5] overflow-x-auto">
                          <pre className="text-[11px] text-[#374151] font-mono whitespace-pre-wrap break-all">
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
      </div>
    </div>
  );
}
