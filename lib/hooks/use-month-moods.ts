"use client";

import { useCallback, useEffect, useState } from "react";
import { getMonthMeditationDays, getMonthMoods, subscribeStore } from "@/lib/local-store";

export function useMonthMoods(year: number, month: number, refreshKey = 0) {
  const [moods, setMoods] = useState<Record<string, number | null>>({});
  const [meditatedDays, setMeditatedDays] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  const fetchMoods = useCallback(() => {
    setMoods(getMonthMoods(year, month));
    setMeditatedDays(getMonthMeditationDays(year, month));
    setLoading(false);
  }, [year, month]);

  useEffect(() => {
    fetchMoods();
    return subscribeStore(fetchMoods);
  }, [fetchMoods, refreshKey]);

  return { moods, meditatedDays, loading, refetch: fetchMoods };
}
