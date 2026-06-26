"use client";

import { useCallback } from "react";
import { useDayEntry } from "@/lib/hooks/use-day-entry";
import { createPlanItem, normalizePlanItem } from "@/lib/plan-utils";
import {
  removeDayPlanItem,
  updateDayPlanItem,
} from "@/lib/firestore-store";
import type { DayTodo } from "@/lib/types";
import type { PlanItemInput } from "@/lib/plan-utils";

export function useDayTodos(dateKey: string) {
  const { entry, loading, upsert } = useDayEntry(dateKey);
  const todos = (entry?.todos ?? []).map(normalizePlanItem);

  const saveTodos = useCallback(
    (next: DayTodo[]) => {
      upsert({ todos: next });
    },
    [upsert]
  );

  const addTodo = useCallback(
    (input: PlanItemInput) => {
      if (!input.text.trim()) return;
      saveTodos([...todos, createPlanItem(input)]);
    },
    [todos, saveTodos]
  );

  const removeTodo = useCallback(
    (id: string) => {
      void removeDayPlanItem(dateKey, id);
    },
    [dateKey]
  );

  const updateTodo = useCallback(
    (id: string, patch: Partial<PlanItemInput>) => {
      void updateDayPlanItem(dateKey, id, patch);
    },
    [dateKey]
  );

  return {
    todos,
    loading,
    addTodo,
    removeTodo,
    updateTodo,
  };
}
