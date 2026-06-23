"use client";

import { useCallback, useEffect, useState } from "react";
import { getMonthMeditationDays, getMonthMoods, getMonthTodoDays, subscribeStore } from "@/lib/firestore-store";
import type { DayTodoSummary } from "@/lib/types";

export function useMonthMoods(year: number, month: number, refreshKey = 0) {
  const [moods, setMoods] = useState<Record<string, number | null>>({});
  const [meditatedDays, setMeditatedDays] = useState<Record<string, boolean>>({});
  const [todoDays, setTodoDays] = useState<Record<string, DayTodoSummary>>({});
  const [loading, setLoading] = useState(true);

  const fetchMoods = useCallback(() => {
    setMoods(getMonthMoods(year, month));
    setMeditatedDays(getMonthMeditationDays(year, month));
    setTodoDays(getMonthTodoDays(year, month));
    setLoading(false);
  }, [year, month]);

  useEffect(() => {
    fetchMoods();
    return subscribeStore(fetchMoods);
  }, [fetchMoods, refreshKey]);

  return { moods, meditatedDays, todoDays, loading, refetch: fetchMoods };
}
