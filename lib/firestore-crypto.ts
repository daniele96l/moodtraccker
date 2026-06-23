"use client";

import type { DocumentData } from "firebase/firestore";
import {
  decryptPayload,
  encryptPayload,
  isEncryptedDoc,
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
    "mood_score" | "journal_text" | "todos" | "created_at" | "updated_at"
  >
): Promise<DocumentData> {
  const encrypted = await encryptPayload({
    mood_score: entry.mood_score,
    journal_text: entry.journal_text,
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
    const payload = await decryptPayload<{
      mood_score: number | null;
      journal_text: string | null;
      todos?: DayEntry["todos"];
    }>(data);
    return {
      id: dateKey,
      entry_date: dateKey,
      mood_score: payload.mood_score,
      journal_text: payload.journal_text,
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
    return { id, ...(await decryptPayload<Omit<Habit, "id">>(data)) };
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
    return { id, ...(await decryptPayload<Omit<HabitLog, "id">>(data)) };
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
  return encrypted;
}

export async function unpackMeditationSession(
  id: string,
  data: DocumentData
): Promise<MeditationSession> {
  if (isEncryptedDoc(data)) {
    return {
      id,
      ...(await decryptPayload<Omit<MeditationSession, "id">>(data)),
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
    note: inbox.note,
    todos: inbox.todos,
  });
  return {
    ...encrypted,
    updated_at: inbox.updated_at,
  };
}

export async function unpackGlobalInbox(data: DocumentData): Promise<GlobalInbox> {
  const now = new Date().toISOString();
  if (isEncryptedDoc(data)) {
    const payload = await decryptPayload<{
      note: string | null;
      todos: GlobalInbox["todos"];
    }>(data);
    return {
      note: payload.note,
      todos: payload.todos ?? [],
      updated_at: (data.updated_at as string) ?? now,
    };
  }

  return {
    note: data.note ?? null,
    todos: data.todos ?? [],
    updated_at: (data.updated_at as string) ?? now,
  };
}
