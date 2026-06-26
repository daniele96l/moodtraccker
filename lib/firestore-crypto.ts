"use client";

import type { DocumentData } from "firebase/firestore";
import {
  decryptPayload,
  encryptPayload,
  isEncryptedDoc,
  tryDecryptPayload,
} from "@/lib/encryption";
import type {
  DayEntry,
  GlobalInbox,
  Habit,
  HabitLog,
  MeditationSession,
} from "@/lib/types";

export async function packDayEntry(
  entry: Pick<
    DayEntry,
    | "mood_score"
    | "journal_text"
    | "meditation_done"
    | "todos"
    | "created_at"
    | "updated_at"
  >
): Promise<DocumentData> {
  const encrypted = await encryptPayload({
    mood_score: entry.mood_score,
    journal_text: entry.journal_text,
    meditation_done: entry.meditation_done,
    todos: entry.todos,
  });
  return {
    ...encrypted,
    created_at: entry.created_at,
    updated_at: entry.updated_at,
  };
}

export async function unpackDayEntry(
  dateKey: string,
  data: DocumentData
): Promise<DayEntry> {
  const now = new Date().toISOString();
  if (isEncryptedDoc(data)) {
    const payload = await tryDecryptPayload<{
      mood_score: number | null;
      journal_text: string | null;
      meditation_done?: boolean | null;
      todos?: DayEntry["todos"];
    }>(data);
    if (!payload) {
      return {
        id: dateKey,
        entry_date: dateKey,
        mood_score: null,
        journal_text: null,
        meditation_done: null,
        todos: [],
        created_at: (data.created_at as string) ?? now,
        updated_at: (data.updated_at as string) ?? now,
      };
    }
    return {
      id: dateKey,
      entry_date: dateKey,
      mood_score: payload.mood_score,
      journal_text: payload.journal_text,
      meditation_done: payload.meditation_done ?? null,
      todos: payload.todos ?? [],
      created_at: (data.created_at as string) ?? now,
      updated_at: (data.updated_at as string) ?? now,
    };
  }

  return {
    id: dateKey,
    entry_date: dateKey,
    mood_score: data.mood_score ?? null,
    journal_text: data.journal_text ?? null,
    meditation_done: data.meditation_done ?? null,
    todos: data.todos ?? [],
    created_at: (data.created_at as string) ?? now,
    updated_at: (data.updated_at as string) ?? now,
  };
}

export async function packHabit(habit: Habit): Promise<DocumentData> {
  const encrypted = await encryptPayload({
    name: habit.name,
    kind: habit.kind,
    color: habit.color,
    sort_order: habit.sort_order,
    archived_at: habit.archived_at,
    created_at: habit.created_at,
  });
  return encrypted;
}

export async function unpackHabit(id: string, data: DocumentData): Promise<Habit> {
  if (isEncryptedDoc(data)) {
    const payload = await tryDecryptPayload<Omit<Habit, "id">>(data);
    if (!payload) {
      return {
        id,
        name: "Unavailable",
        kind: "habit",
        color: null,
        sort_order: 0,
        archived_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };
    }
    return { id, ...payload };
  }

  return {
    id,
    name: data.name,
    kind: data.kind,
    color: data.color ?? null,
    sort_order: data.sort_order ?? 0,
    archived_at: data.archived_at ?? null,
    created_at: data.created_at,
  };
}

export async function packHabitLog(log: HabitLog): Promise<DocumentData> {
  const encrypted = await encryptPayload({
    habit_id: log.habit_id,
    log_date: log.log_date,
    completed: log.completed,
  });
  return encrypted;
}

export async function unpackHabitLog(
  id: string,
  data: DocumentData
): Promise<HabitLog> {
  if (isEncryptedDoc(data)) {
    const payload = await tryDecryptPayload<Omit<HabitLog, "id">>(data);
    if (!payload) {
      return {
        id,
        habit_id: "",
        log_date: "",
        completed: false,
      };
    }
    return { id, ...payload };
  }

  return {
    id,
    habit_id: data.habit_id,
    log_date: data.log_date,
    completed: data.completed,
  };
}

export async function packMeditationSession(
  session: MeditationSession
): Promise<DocumentData> {
  const encrypted = await encryptPayload({
    session_date: session.session_date,
    duration_seconds: session.duration_seconds,
    pattern: session.pattern,
    completed_at: session.completed_at,
  });
  return {
    ...encrypted,
    session_date: session.session_date,
    duration_seconds: session.duration_seconds,
    completed_at: session.completed_at,
  };
}

export async function unpackMeditationSession(
  id: string,
  data: DocumentData
): Promise<MeditationSession> {
  const now = new Date().toISOString();
  const plainDate =
    typeof data.session_date === "string" ? data.session_date : "";
  const plainDuration =
    typeof data.duration_seconds === "number" ? data.duration_seconds : 0;
  const plainCompleted =
    typeof data.completed_at === "string" ? data.completed_at : now;

  if (isEncryptedDoc(data)) {
    const payload = await tryDecryptPayload<Omit<MeditationSession, "id">>(data);
    if (!payload) {
      return {
        id,
        session_date: plainDate,
        duration_seconds: plainDuration,
        pattern: null,
        completed_at: plainCompleted,
      };
    }
    return {
      id,
      ...payload,
      session_date: payload.session_date || plainDate,
      duration_seconds: payload.duration_seconds || plainDuration,
      completed_at: payload.completed_at || plainCompleted,
    };
  }

  return {
    id,
    session_date: data.session_date,
    duration_seconds: data.duration_seconds,
    pattern: data.pattern ?? null,
    completed_at: data.completed_at,
  };
}

export async function packGlobalInbox(inbox: GlobalInbox): Promise<DocumentData> {
  const encrypted = await encryptPayload({
    notes: inbox.notes,
    todos: inbox.todos,
  });
  return {
    ...encrypted,
    updated_at: inbox.updated_at,
  };
}

function migrateLegacyInbox(payload: {
  note?: string | null;
  notes?: GlobalInbox["notes"];
  todos?: GlobalInbox["todos"];
}): Pick<GlobalInbox, "notes" | "todos"> {
  const todos = payload.todos ?? [];
  let notes = payload.notes ?? [];
  if (notes.length === 0 && payload.note?.trim()) {
    const body = payload.note.trim();
    const now = new Date().toISOString();
    notes = [
      {
        id: crypto.randomUUID(),
        title: body.split("\n")[0]?.trim().slice(0, 120) ?? "",
        body,
        created_at: now,
        updated_at: now,
      },
    ];
  }
  return { notes, todos };
}

export async function unpackGlobalInbox(data: DocumentData): Promise<GlobalInbox> {
  const now = new Date().toISOString();
  if (isEncryptedDoc(data)) {
    const payload = await tryDecryptPayload<{
      note?: string | null;
      notes?: GlobalInbox["notes"];
      todos: GlobalInbox["todos"];
    }>(data);
    if (!payload) {
      return { notes: [], todos: [], updated_at: now };
    }
    const migrated = migrateLegacyInbox(payload);
    return {
      ...migrated,
      updated_at: (data.updated_at as string) ?? now,
    };
  }

  const migrated = migrateLegacyInbox({
    note: data.note ?? null,
    notes: data.notes ?? [],
    todos: data.todos ?? [],
  });
  return {
    ...migrated,
    updated_at: (data.updated_at as string) ?? now,
  };
}
