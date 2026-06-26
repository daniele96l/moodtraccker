"use client";

import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  writeBatch,
  type DocumentData,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import {
  packDayEntry,
  packGlobalInbox,
  packHabit,
  packHabitLog,
  packMeditationSession,
  unpackDayEntry,
  unpackGlobalInbox,
  unpackHabit,
  unpackHabitLog,
  unpackMeditationSession,
} from "@/lib/firestore-crypto";
import type {
  DayEntry,
  DayTodo,
  DayTodoSummary,
  GlobalInbox,
  Habit,
  HabitKind,
  HabitLog,
  MeditationSession,
} from "@/lib/types";
import type { MoodStore } from "@/lib/local-store";
import { normalizePlanItem, planPreview, sortPlanItems, type PlanItemInput } from "@/lib/plan-utils";
import { toDateKey } from "@/lib/date-utils";

const CHANGE_EVENT = "moodtracker:change";

let currentUid: string | null = null;
let cache: MoodStore = emptyCache();
let globalInbox: GlobalInbox = emptyGlobalInbox();
let snapshotsReady = false;
const listeners = new Set<() => void>();
let snapshotUnsubs: (() => void)[] = [];

function emptyCache(): MoodStore {
  return {
    day_entries: [],
    habits: [],
    habit_logs: [],
    meditation_sessions: [],
  };
}

function emptyGlobalInbox(): GlobalInbox {
  return { notes: [], todos: [], updated_at: new Date().toISOString() };
}

function notify() {
  listeners.forEach((l) => l());
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }
}

function requireUid(): string {
  if (!currentUid) throw new Error("Not authenticated");
  return currentUid;
}

export function isStoreReady() {
  return snapshotsReady;
}

export function setStoreUser(uid: string | null) {
  snapshotUnsubs.forEach((u) => u());
  snapshotUnsubs = [];
  currentUid = uid;
  cache = emptyCache();
  globalInbox = emptyGlobalInbox();
  snapshotsReady = false;

  if (!uid) return;

  const db = getFirebaseDb();
  const base = ["users", uid] as const;
  let received = 0;
  const markReady = () => {
    received += 1;
    if (received >= 5) {
      snapshotsReady = true;
      notify();
    }
  };

  snapshotUnsubs.push(
    onSnapshot(collection(db, ...base, "day_entries"), (snap) => {
      void (async () => {
        cache.day_entries = await Promise.all(
          snap.docs.map((d) => unpackDayEntry(d.id, d.data()))
        );
        markReady();
        notify();
      })();
    })
  );

  snapshotUnsubs.push(
    onSnapshot(collection(db, ...base, "habits"), (snap) => {
      void (async () => {
        cache.habits = await Promise.all(
          snap.docs.map((d) => unpackHabit(d.id, d.data()))
        );
        markReady();
        notify();
      })();
    })
  );

  snapshotUnsubs.push(
    onSnapshot(collection(db, ...base, "habit_logs"), (snap) => {
      void (async () => {
        cache.habit_logs = await Promise.all(
          snap.docs.map((d) => unpackHabitLog(d.id, d.data()))
        );
        markReady();
        notify();
      })();
    })
  );

  snapshotUnsubs.push(
    onSnapshot(collection(db, ...base, "meditation_sessions"), (snap) => {
      void (async () => {
        cache.meditation_sessions = await Promise.all(
          snap.docs.map((d) => unpackMeditationSession(d.id, d.data()))
        );
        markReady();
        notify();
      })();
    })
  );

  snapshotUnsubs.push(
    onSnapshot(doc(db, ...base, "meta", "global_inbox"), (snap) => {
      void (async () => {
        if (snap.exists()) {
          globalInbox = await unpackGlobalInbox(snap.data());
        } else {
          globalInbox = emptyGlobalInbox();
        }
        markReady();
        notify();
      })();
    })
  );
}

export function subscribeStore(listener: () => void) {
  listeners.add(listener);
  if (typeof window !== "undefined") {
    window.addEventListener(CHANGE_EVENT, listener);
  }
  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") {
      window.removeEventListener(CHANGE_EVENT, listener);
    }
  };
}

export function getDayEntry(dateKey: string): DayEntry | null {
  return cache.day_entries.find((e) => e.entry_date === dateKey) ?? null;
}

export async function upsertDayEntry(
  dateKey: string,
  patch: Partial<
    Pick<DayEntry, "mood_score" | "journal_text" | "meditation_done" | "todos">
  >
): Promise<DayEntry> {
  const uid = requireUid();
  const now = new Date().toISOString();
  const existing = getDayEntry(dateKey);
  const entry: DayEntry = {
    id: dateKey,
    entry_date: dateKey,
    mood_score:
      patch.mood_score !== undefined
        ? patch.mood_score
        : (existing?.mood_score ?? null),
    journal_text:
      patch.journal_text !== undefined
        ? patch.journal_text
        : (existing?.journal_text ?? null),
    meditation_done:
      patch.meditation_done !== undefined
        ? patch.meditation_done
        : (existing?.meditation_done ?? null),
    todos:
      patch.todos !== undefined ? patch.todos : (existing?.todos ?? []),
    created_at: existing?.created_at ?? now,
    updated_at: now,
  };

  if (existing) {
    const idx = cache.day_entries.findIndex((e) => e.entry_date === dateKey);
    if (idx >= 0) cache.day_entries[idx] = entry;
  } else {
    cache.day_entries.push(entry);
  }
  notify();

  await setDoc(
    doc(getFirebaseDb(), "users", uid, "day_entries", dateKey),
    await packDayEntry(entry)
  );

  return entry;
}

function patchDayPlanTodos(
  dateKey: string,
  updater: (todos: DayTodo[]) => DayTodo[]
): DayTodo[] {
  const existing = getDayEntry(dateKey);
  const todos = (existing?.todos ?? []).map(normalizePlanItem);
  return updater(todos);
}

export async function updateDayPlanItem(
  dateKey: string,
  id: string,
  patch: Partial<PlanItemInput>
): Promise<DayEntry> {
  const next = patchDayPlanTodos(dateKey, (todos) =>
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
  return upsertDayEntry(dateKey, { todos: next });
}

export async function removeDayPlanItem(
  dateKey: string,
  id: string
): Promise<DayEntry> {
  const next = patchDayPlanTodos(dateKey, (todos) =>
    todos.filter((t) => t.id !== id)
  );
  return upsertDayEntry(dateKey, { todos: next });
}

export function getMonthMoods(
  year: number,
  month: number
): Record<string, number | null> {
  const start = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const end = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const map: Record<string, number | null> = {};
  cache.day_entries.forEach((e) => {
    if (e.entry_date >= start && e.entry_date <= end) {
      map[e.entry_date] = e.mood_score;
    }
  });
  return map;
}

function meditationSessionDate(session: MeditationSession): string | null {
  const key = session.session_date?.trim();
  if (key && /^\d{4}-\d{2}-\d{2}$/.test(key)) return key;
  const fromCompleted = session.completed_at?.slice(0, 10);
  if (fromCompleted && /^\d{4}-\d{2}-\d{2}$/.test(fromCompleted)) {
    return fromCompleted;
  }
  return null;
}

export function getMonthMeditationDays(
  year: number,
  month: number
): Record<string, boolean> {
  const start = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const end = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const candidateDays = new Set<string>();
  cache.meditation_sessions.forEach((s) => {
    const dateKey = meditationSessionDate(s);
    if (dateKey && dateKey >= start && dateKey <= end) {
      candidateDays.add(dateKey);
    }
  });
  cache.day_entries.forEach((e) => {
    if (
      e.entry_date >= start &&
      e.entry_date <= end &&
      e.meditation_done != null
    ) {
      candidateDays.add(e.entry_date);
    }
  });

  const map: Record<string, boolean> = {};
  candidateDays.forEach((dateKey) => {
    if (isMeditationDone(dateKey)) map[dateKey] = true;
  });
  return map;
}

function summarizeTodos(todos: DayTodo[]): DayTodoSummary | null {
  if (todos.length === 0) return null;
  const sorted = sortPlanItems(todos.map(normalizePlanItem));
  const first = sorted[0];
  return {
    total: todos.length,
    done: 0,
    preview: first ? planPreview(first) : null,
  };
}

export function getMonthTodoDays(
  year: number,
  month: number
): Record<string, DayTodoSummary> {
  const start = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const end = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const map: Record<string, DayTodoSummary> = {};
  cache.day_entries.forEach((e) => {
    if (e.entry_date >= start && e.entry_date <= end) {
      const summary = summarizeTodos(e.todos ?? []);
      if (summary) map[e.entry_date] = summary;
    }
  });
  return map;
}

export function getGlobalInbox(): GlobalInbox {
  return globalInbox;
}

export async function upsertGlobalInbox(
  patch: Partial<Pick<GlobalInbox, "notes" | "todos">>
): Promise<GlobalInbox> {
  const uid = requireUid();
  const now = new Date().toISOString();
  const next: GlobalInbox = {
    notes: patch.notes !== undefined ? patch.notes : globalInbox.notes,
    todos: patch.todos !== undefined ? patch.todos : globalInbox.todos,
    updated_at: now,
  };

  globalInbox = next;
  notify();

  await setDoc(
    doc(getFirebaseDb(), "users", uid, "meta", "global_inbox"),
    await packGlobalInbox(next)
  );

  return next;
}

export function getUpcomingPlans(): Array<{ dateKey: string; todo: DayTodo }> {
  const today = toDateKey(new Date());
  const items: Array<{ dateKey: string; todo: DayTodo }> = [];

  cache.day_entries.forEach((entry) => {
    if (entry.entry_date < today) return;
    sortPlanItems((entry.todos ?? []).map(normalizePlanItem)).forEach((todo) => {
      items.push({ dateKey: entry.entry_date, todo });
    });
  });

  return items.sort((a, b) => {
    if (a.dateKey !== b.dateKey) return a.dateKey.localeCompare(b.dateKey);
    if (a.todo.time && b.todo.time) return a.todo.time.localeCompare(b.todo.time);
    if (a.todo.time) return -1;
    if (b.todo.time) return 1;
    return 0;
  });
}

export function getHabits(): Habit[] {
  return cache.habits
    .filter((h) => !h.archived_at)
    .sort((a, b) => a.sort_order - b.sort_order);
}

export function getHabitLogsForDate(dateKey: string): Record<string, boolean> {
  const habitIds = new Set(cache.habits.map((h) => h.id));
  const map: Record<string, boolean> = {};
  cache.habit_logs.forEach((log) => {
    if (log.log_date === dateKey && habitIds.has(log.habit_id)) {
      map[log.habit_id] = log.completed;
    }
  });
  return map;
}

export async function addHabit(name: string, kind: HabitKind): Promise<Habit> {
  const uid = requireUid();
  const habit: Habit = {
    id: crypto.randomUUID(),
    name,
    kind,
    color: null,
    sort_order: cache.habits.length,
    archived_at: null,
    created_at: new Date().toISOString(),
  };

  cache.habits.push(habit);
  notify();

  await setDoc(
    doc(getFirebaseDb(), "users", uid, "habits", habit.id),
    await packHabit(habit)
  );

  return habit;
}

async function persistHabitLog(log: HabitLog) {
  const uid = requireUid();
  const logId = `${log.habit_id}_${log.log_date}`;
  await setDoc(
    doc(getFirebaseDb(), "users", uid, "habit_logs", logId),
    await packHabitLog(log)
  );
}

export async function toggleHabitLog(
  habitId: string,
  dateKey: string
): Promise<boolean> {
  const habit = cache.habits.find((h) => h.id === habitId);
  if (!habit) return false;

  const idx = cache.habit_logs.findIndex(
    (l) => l.habit_id === habitId && l.log_date === dateKey
  );

  let nextCompleted: boolean;
  let log: HabitLog;

  if (habit.kind === "vice") {
    nextCompleted = idx < 0 ? true : !cache.habit_logs[idx].completed;
    if (idx >= 0) {
      cache.habit_logs[idx].completed = nextCompleted;
      log = cache.habit_logs[idx];
    } else {
      log = {
        id: crypto.randomUUID(),
        habit_id: habitId,
        log_date: dateKey,
        completed: true,
      };
      cache.habit_logs.push(log);
    }
  } else if (idx >= 0) {
    cache.habit_logs[idx].completed = !cache.habit_logs[idx].completed;
    nextCompleted = cache.habit_logs[idx].completed;
    log = cache.habit_logs[idx];
  } else {
    log = {
      id: crypto.randomUUID(),
      habit_id: habitId,
      log_date: dateKey,
      completed: true,
    };
    cache.habit_logs.push(log);
    nextCompleted = true;
  }

  notify();
  await persistHabitLog(log);
  return nextCompleted;
}

export async function setHabitLog(
  habitId: string,
  dateKey: string,
  completed: boolean
) {
  const idx = cache.habit_logs.findIndex(
    (l) => l.habit_id === habitId && l.log_date === dateKey
  );

  let log: HabitLog;
  if (idx >= 0) {
    cache.habit_logs[idx].completed = completed;
    log = cache.habit_logs[idx];
  } else {
    log = {
      id: crypto.randomUUID(),
      habit_id: habitId,
      log_date: dateKey,
      completed,
    };
    cache.habit_logs.push(log);
  }

  notify();
  await persistHabitLog(log);
}

export async function bulkSetHabits(
  dateKey: string,
  kind: HabitKind,
  completed: boolean
) {
  const targets = cache.habits.filter(
    (h) => !h.archived_at && h.kind === kind
  );

  for (const habit of targets) {
    await setHabitLog(habit.id, dateKey, completed);
  }
}

export async function archiveHabit(habitId: string) {
  const uid = requireUid();
  const habit = cache.habits.find((h) => h.id === habitId);
  if (!habit) return;

  habit.archived_at = new Date().toISOString();
  notify();

  await setDoc(
    doc(getFirebaseDb(), "users", uid, "habits", habitId),
    await packHabit(habit)
  );
}

export function getHabitLogs(habitId: string) {
  return cache.habit_logs.filter((l) => l.habit_id === habitId);
}

export function getMeditationSessions(dateKey: string): MeditationSession[] {
  return cache.meditation_sessions
    .filter(
      (s) =>
        meditationSessionDate(s) === dateKey && s.duration_seconds >= 10
    )
    .sort(
      (a, b) =>
        new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
    );
}

export function isMeditationDone(dateKey: string): boolean {
  const entry = getDayEntry(dateKey);
  if (entry?.meditation_done != null) return entry.meditation_done;
  return getMeditationSessions(dateKey).length > 0;
}

export async function toggleMeditationDone(dateKey: string): Promise<boolean> {
  const next = !isMeditationDone(dateKey);
  await upsertDayEntry(dateKey, { meditation_done: next });
  return next;
}

export async function addMeditationSession(
  dateKey: string,
  durationSeconds: number,
  pattern: string | null
): Promise<MeditationSession> {
  const uid = requireUid();
  const session: MeditationSession = {
    id: crypto.randomUUID(),
    session_date: dateKey,
    duration_seconds: durationSeconds,
    pattern,
    completed_at: new Date().toISOString(),
  };

  cache.meditation_sessions.push(session);
  notify();

  await setDoc(
    doc(getFirebaseDb(), "users", uid, "meditation_sessions", session.id),
    await packMeditationSession(session)
  );

  if (durationSeconds >= 10) {
    await upsertDayEntry(dateKey, { meditation_done: true });
  }

  return session;
}

export async function getMigrationStatus(): Promise<{
  migrated: boolean;
  hasCloudData: boolean;
}> {
  const uid = requireUid();
  const meta = await getDoc(
    doc(getFirebaseDb(), "users", uid, "meta", "settings")
  );
  const migrated = meta.exists() && !!meta.data()?.localMigratedAt;

  const hasCloudData =
    cache.day_entries.length > 0 ||
    cache.habits.length > 0 ||
    cache.habit_logs.length > 0 ||
    cache.meditation_sessions.length > 0;

  return { migrated, hasCloudData };
}

export async function markMigrationComplete(imported: boolean) {
  const uid = requireUid();
  await setDoc(doc(getFirebaseDb(), "users", uid, "meta", "settings"), {
    localMigratedAt: new Date().toISOString(),
    importedLocalData: imported,
  });
}

export async function importLocalStore(store: MoodStore) {
  const uid = requireUid();
  const db = getFirebaseDb();
  const ops: Array<{
    ref: ReturnType<typeof doc>;
    data: DocumentData;
  }> = [];

  for (const entry of store.day_entries) {
    ops.push({
      ref: doc(db, "users", uid, "day_entries", entry.entry_date),
      data: await packDayEntry(entry),
    });
  }

  for (const habit of store.habits) {
    ops.push({
      ref: doc(db, "users", uid, "habits", habit.id),
      data: await packHabit(habit),
    });
  }

  for (const log of store.habit_logs) {
    ops.push({
      ref: doc(db, "users", uid, "habit_logs", `${log.habit_id}_${log.log_date}`),
      data: await packHabitLog(log),
    });
  }

  for (const session of store.meditation_sessions) {
    ops.push({
      ref: doc(db, "users", uid, "meditation_sessions", session.id),
      data: await packMeditationSession(session),
    });
  }

  for (let i = 0; i < ops.length; i += 450) {
    const batch = writeBatch(db);
    ops.slice(i, i + 450).forEach(({ ref, data }) => batch.set(ref, data));
    await batch.commit();
  }

  await markMigrationComplete(true);
}
