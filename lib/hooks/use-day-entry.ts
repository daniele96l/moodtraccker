"use client";

import { useCallback, useEffect, useState } from "react";
import { getDayEntry, subscribeStore, upsertDayEntry } from "@/lib/local-store";
import type { DayEntry } from "@/lib/types";

export function useDayEntry(dateKey: string) {
  const [entry, setEntry] = useState<DayEntry | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchEntry = useCallback(() => {
    setEntry(getDayEntry(dateKey));
    setLoading(false);
  }, [dateKey]);

  useEffect(() => {
    fetchEntry();
    return subscribeStore(fetchEntry);
  }, [fetchEntry]);

  const upsert = useCallback(
    (patch: Partial<Pick<DayEntry, "mood_score" | "journal_text">>) => {
      const updated = upsertDayEntry(dateKey, patch);
      setEntry(updated);
    },
    [dateKey]
  );

  return { entry, loading, upsert, refetch: fetchEntry };
}
