"use client";

import { useCallback, useEffect, useState } from "react";
import { getMonthMoods, subscribeStore } from "@/lib/local-store";

export function useMonthMoods(year: number, month: number, refreshKey = 0) {
  const [moods, setMoods] = useState<Record<string, number | null>>({});
  const [loading, setLoading] = useState(true);

  const fetchMoods = useCallback(() => {
    setMoods(getMonthMoods(year, month));
    setLoading(false);
  }, [year, month]);

  useEffect(() => {
    fetchMoods();
    return subscribeStore(fetchMoods);
  }, [fetchMoods, refreshKey]);

  return { moods, loading, refetch: fetchMoods };
}
