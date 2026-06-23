"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getGlobalInbox,
  subscribeStore,
  upsertGlobalInbox,
} from "@/lib/firestore-store";
import type { DayTodo, GlobalInbox } from "@/lib/types";

export function useGlobalInbox() {
  const [inbox, setInbox] = useState<GlobalInbox | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchInbox = useCallback(() => {
    setInbox(getGlobalInbox());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchInbox();
    return subscribeStore(fetchInbox);
  }, [fetchInbox]);

  const save = useCallback(
    (patch: Partial<Pick<GlobalInbox, "note" | "todos">>) => {
      void upsertGlobalInbox(patch).then(setInbox);
    },
    []
  );

  const setNote = useCallback(
    (note: string) => {
      save({ note: note || null });
    },
    [save]
  );

  const saveTodos = useCallback(
    (todos: DayTodo[]) => {
      save({ todos });
    },
    [save]
  );

  const addTodo = useCallback(
    (text: string) => {
      const current = getGlobalInbox();
      const todo: DayTodo = {
        id: crypto.randomUUID(),
        text,
        done: false,
      };
      saveTodos([...current.todos, todo]);
    },
    [saveTodos]
  );

  const toggleTodo = useCallback(
    (id: string) => {
      const current = getGlobalInbox();
      saveTodos(
        current.todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
      );
    },
    [saveTodos]
  );

  const removeTodo = useCallback(
    (id: string) => {
      const current = getGlobalInbox();
      saveTodos(current.todos.filter((t) => t.id !== id));
    },
    [saveTodos]
  );

  const pendingCount =
    (inbox?.todos.filter((t) => !t.done).length ?? 0) +
    (inbox?.note?.trim() ? 0 : 0);

  return {
    inbox,
    loading,
    setNote,
    addTodo,
    toggleTodo,
    removeTodo,
    pendingCount,
  };
}
