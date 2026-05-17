"use client";

import useSWR from "swr";
import { fetchStats } from "@/lib/api";
import type { StatsResponse } from "@/lib/types";

export function useStats() {
  const { data, error, isLoading } = useSWR<StatsResponse>(
    "/api/stats",
    fetchStats,
    {
      refreshInterval: 60_000,
      revalidateOnFocus: false,
    }
  );

  return {
    stats: data,
    isLoading,
    error,
  };
}
