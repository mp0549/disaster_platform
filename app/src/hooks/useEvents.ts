"use client";

import useSWR from "swr";
import { fetchEvents } from "@/lib/api";
import type { EventSummary, FilterState } from "@/lib/types";

function buildKey(filters: Partial<FilterState>): string {
  return `/api/events?${JSON.stringify(filters)}`;
}

export function useEvents(filters: Partial<FilterState> = {}) {
  const { data, error, isLoading, mutate } = useSWR(
    buildKey(filters),
    () => fetchEvents(filters),
    {
      refreshInterval: 60_000, // Poll every 60 seconds
      revalidateOnFocus: false,
      keepPreviousData: true,
    }
  );

  return {
    events: (data?.events ?? []) as EventSummary[],
    count: data?.count ?? 0,
    isLoading,
    error,
    refresh: mutate,
  };
}
