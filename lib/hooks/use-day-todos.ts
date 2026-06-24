"use client";

import { useCallback } from "react";
import { useDayEntry } from "@/lib/hooks/use-day-entry";
import { createPlanItem, normalizePlanItem } from "@/lib/plan-utils";
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
      saveTodos(todos.filter((t) => t.id !== id));
    },
    [todos, saveTodos]
  );

  const updateTodo = useCallback(
    (id: string, patch: Partial<PlanItemInput>) => {
      saveTodos(
        todos.map((t) =>
          t.id === id
            ? {
                ...t,
                ...patch,
                text: patch.text?.trim() || t.text,
                time: patch.time !== undefined ? patch.time || null : t.time,
                location:
                  patch.location !== undefined
                    ? patch.location?.trim() || null
                    : t.location,
              }
            : t
        )
      );
    },
    [todos, saveTodos]
  );

  return {
    todos,
    loading,
    addTodo,
    removeTodo,
    updateTodo,
  };
}
