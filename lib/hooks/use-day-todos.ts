"use client";

import { useCallback } from "react";
import { useDayEntry } from "@/lib/hooks/use-day-entry";
import type { DayTodo } from "@/lib/types";

export function useDayTodos(dateKey: string) {
  const { entry, loading, upsert } = useDayEntry(dateKey);
  const todos = entry?.todos ?? [];

  const saveTodos = useCallback(
    (next: DayTodo[]) => {
      upsert({ todos: next });
    },
    [upsert]
  );

  const addTodo = useCallback(
    (text: string) => {
      const todo: DayTodo = {
        id: crypto.randomUUID(),
        text,
        done: false,
      };
      saveTodos([...todos, todo]);
    },
    [todos, saveTodos]
  );

  const toggleTodo = useCallback(
    (id: string) => {
      saveTodos(
        todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
      );
    },
    [todos, saveTodos]
  );

  const removeTodo = useCallback(
    (id: string) => {
      saveTodos(todos.filter((t) => t.id !== id));
    },
    [todos, saveTodos]
  );

  const updateTodoText = useCallback(
    (id: string, text: string) => {
      saveTodos(todos.map((t) => (t.id === id ? { ...t, text } : t)));
    },
    [todos, saveTodos]
  );

  return {
    todos,
    loading,
    addTodo,
    toggleTodo,
    removeTodo,
    updateTodoText,
  };
}
