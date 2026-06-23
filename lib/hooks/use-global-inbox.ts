"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getGlobalInbox,
  subscribeStore,
  upsertGlobalInbox,
} from "@/lib/firestore-store";
import { createPlanItem } from "@/lib/plan-utils";
import { createInboxNote } from "@/lib/note-utils";
import type { DayTodo, GlobalInbox, InboxNote } from "@/lib/types";

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
    (patch: Partial<Pick<GlobalInbox, "notes" | "todos">>) => {
      void upsertGlobalInbox(patch).then(setInbox);
    },
    []
  );

  const saveNotes = useCallback(
    (notes: InboxNote[]) => {
      save({ notes });
    },
    [save]
  );

  const saveTodos = useCallback(
    (todos: DayTodo[]) => {
      save({ todos });
    },
    [save]
  );

  const addNote = useCallback(() => {
    const current = getGlobalInbox();
    const note = createInboxNote();
    saveNotes([note, ...current.notes]);
    return note.id;
  }, [saveNotes]);

  const updateNote = useCallback(
    (id: string, patch: Partial<Pick<InboxNote, "title" | "body">>) => {
      const current = getGlobalInbox();
      const now = new Date().toISOString();
      saveNotes(
        current.notes.map((n) =>
          n.id === id
            ? {
                ...n,
                title: patch.title !== undefined ? patch.title : n.title,
                body: patch.body !== undefined ? patch.body : n.body,
                updated_at: now,
              }
            : n
        )
      );
    },
    [saveNotes]
  );

  const deleteNote = useCallback(
    (id: string) => {
      const current = getGlobalInbox();
      saveNotes(current.notes.filter((n) => n.id !== id));
    },
    [saveNotes]
  );

  const addTodo = useCallback(
    (text: string) => {
      const current = getGlobalInbox();
      saveTodos([
        ...current.todos,
        createPlanItem({ text, time: null, location: null }),
      ]);
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

  const pendingTodos = inbox?.todos.filter((t) => !t.done).length ?? 0;
  const notesCount = inbox?.notes.length ?? 0;

  return {
    inbox,
    loading,
    addNote,
    updateNote,
    deleteNote,
    addTodo,
    toggleTodo,
    removeTodo,
    pendingTodos,
    notesCount,
  };
}
