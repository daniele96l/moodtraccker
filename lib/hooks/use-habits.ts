"use client";

import { useCallback, useEffect, useState } from "react";
import {
  addHabit as addHabitToStore,
  archiveHabit as archiveHabitInStore,
  bulkSetHabits,
  getHabitLogsForDate,
  getHabits,
  subscribeStore,
  toggleHabitLog,
} from "@/lib/firestore-store";
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

  const markAllHabitsDone = useCallback(() => {
    bulkSetHabits(dateKey, "habit", true);
  }, [dateKey]);

  const markAllVicesAvoided = useCallback(() => {
    bulkSetHabits(dateKey, "vice", true);
  }, [dateKey]);

  const archiveHabit = useCallback((habitId: string) => {
    archiveHabitInStore(habitId);
  }, []);

  return {
    habits,
    logs,
    loading,
    addHabit,
    toggleHabit,
    markAllHabitsDone,
    markAllVicesAvoided,
    archiveHabit,
    refetch: fetchAll,
  };
}
