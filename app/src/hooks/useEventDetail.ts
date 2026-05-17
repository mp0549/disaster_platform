"use client";

import useSWR from "swr";
import { fetchEventDetail } from "@/lib/api";
import type { EventDetail } from "@/lib/types";

export function useEventDetail(id: string) {
  const { data, error, isLoading } = useSWR(
    id ? `/api/events/${id}` : null,
    () => fetchEventDetail(id),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    event: data?.event as EventDetail | undefined,
    isLoading,
    error,
  };
}
