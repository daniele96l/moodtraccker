"use client";

import { useCallback, useEffect, useState } from "react";
import {
  addHabit as addHabitToStore,
  getHabitLogsForDate,
  getHabits,
  subscribeStore,
  toggleHabitLog,
} from "@/lib/local-store";
import type { Habit, HabitKind } from "@/lib/types";

export function useHabits(dateKey: string) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(() => {
    setHabits(getHabits());
    setLogs(getHabitLogsForDate(dateKey));
    setLoading(false);
  }, [dateKey]);

  useEffect(() => {
    fetchAll();
    return subscribeStore(fetchAll);
  }, [fetchAll]);

  const addHabit = useCallback((name: string, kind: HabitKind) => {
    addHabitToStore(name, kind);
  }, []);

  const toggleHabit = useCallback(
    (habitId: string) => {
      toggleHabitLog(habitId, dateKey);
    },
    [dateKey]
  );

  return { habits, logs, loading, addHabit, toggleHabit, refetch: fetchAll };
}
