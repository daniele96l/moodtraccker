import type {
  DayEntry,
  Habit,
  HabitLog,
  HabitKind,
  MeditationSession,
} from "@/lib/types";

const STORAGE_KEY = "moodtracker_data";
const CHANGE_EVENT = "moodtracker:change";

export interface MoodStore {
  day_entries: DayEntry[];
  habits: Habit[];
  habit_logs: HabitLog[];
  meditation_sessions: MeditationSession[];
}

function emptyStore(): MoodStore {
  return {
    day_entries: [],
    habits: [],
    habit_logs: [],
    meditation_sessions: [],
  };
}

export function loadRaw(): MoodStore {
  if (typeof window === "undefined") return emptyStore();
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return emptyStore();
  try {
    return { ...emptyStore(), ...JSON.parse(raw) };
  } catch {
    return emptyStore();
  }
}

function saveRaw(store: MoodStore) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function subscribeStore(listener: () => void) {
  window.addEventListener(CHANGE_EVENT, listener);
  return () => window.removeEventListener(CHANGE_EVENT, listener);
}

export function clearStore() {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function getDayEntry(dateKey: string): DayEntry | null {
  return loadRaw().day_entries.find((e) => e.entry_date === dateKey) ?? null;
}

export function upsertDayEntry(
  dateKey: string,
  patch: Partial<
    Pick<DayEntry, "mood_score" | "journal_text" | "meditation_done" | "todos">
  >
): DayEntry {
  const store = loadRaw();
  const now = new Date().toISOString();
  const idx = store.day_entries.findIndex((e) => e.entry_date === dateKey);

  if (idx >= 0) {
    store.day_entries[idx] = {
      ...store.day_entries[idx],
      ...patch,
      updated_at: now,
    };
    saveRaw(store);
    return store.day_entries[idx];
  }

  const entry: DayEntry = {
    id: crypto.randomUUID(),
    entry_date: dateKey,
    mood_score: patch.mood_score ?? null,
    journal_text: patch.journal_text ?? null,
    meditation_done: patch.meditation_done ?? null,
    todos: patch.todos ?? [],
    created_at: now,
    updated_at: now,
  };
  store.day_entries.push(entry);
  saveRaw(store);
  return entry;
}

export function getMonthMoods(
  year: number,
  month: number
): Record<string, number | null> {
  const start = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const end = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const map: Record<string, number | null> = {};
  loadRaw().day_entries.forEach((e) => {
    if (e.entry_date >= start && e.entry_date <= end) {
      map[e.entry_date] = e.mood_score;
    }
  });
  return map;
}

export function getMonthMeditationDays(
  year: number,
  month: number
): Record<string, boolean> {
  const start = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const end = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const candidateDays = new Set<string>();
  loadRaw().meditation_sessions.forEach((s) => {
    if (s.session_date >= start && s.session_date <= end) {
      candidateDays.add(s.session_date);
    }
  });
  loadRaw().day_entries.forEach((e) => {
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

export function getHabits(): Habit[] {
  return loadRaw().habits
    .filter((h) => !h.archived_at)
    .sort((a, b) => a.sort_order - b.sort_order);
}

export function getHabitLogsForDate(dateKey: string): Record<string, boolean> {
  const store = loadRaw();
  const habitIds = new Set(store.habits.map((h) => h.id));
  const map: Record<string, boolean> = {};
  store.habit_logs.forEach((log) => {
    if (log.log_date === dateKey && habitIds.has(log.habit_id)) {
      map[log.habit_id] = log.completed;
    }
  });
  return map;
}

export function addHabit(name: string, kind: HabitKind): Habit {
  const store = loadRaw();
  const habit: Habit = {
    id: crypto.randomUUID(),
    name,
    kind,
    color: null,
    sort_order: store.habits.length,
    archived_at: null,
    created_at: new Date().toISOString(),
  };
  store.habits.push(habit);
  saveRaw(store);
  return habit;
}

export function toggleHabitLog(
  habitId: string,
  dateKey: string
): boolean {
  const store = loadRaw();
  const habit = store.habits.find((h) => h.id === habitId);
  if (!habit) return false;

  const idx = store.habit_logs.findIndex(
    (l) => l.habit_id === habitId && l.log_date === dateKey
  );

  if (habit.kind === "vice") {
    const next =
      idx < 0 ? true : !store.habit_logs[idx].completed;
    if (idx >= 0) {
      store.habit_logs[idx].completed = next;
    } else {
      store.habit_logs.push({
        id: crypto.randomUUID(),
        habit_id: habitId,
        log_date: dateKey,
        completed: true,
      });
    }
    saveRaw(store);
    return idx < 0 ? true : next;
  }

  if (idx >= 0) {
    store.habit_logs[idx].completed = !store.habit_logs[idx].completed;
    saveRaw(store);
    return store.habit_logs[idx].completed;
  }

  const log: HabitLog = {
    id: crypto.randomUUID(),
    habit_id: habitId,
    log_date: dateKey,
    completed: true,
  };
  store.habit_logs.push(log);
  saveRaw(store);
  return true;
}

export function setHabitLog(
  habitId: string,
  dateKey: string,
  completed: boolean
) {
  const store = loadRaw();
  const idx = store.habit_logs.findIndex(
    (l) => l.habit_id === habitId && l.log_date === dateKey
  );
  if (idx >= 0) {
    store.habit_logs[idx].completed = completed;
  } else {
    store.habit_logs.push({
      id: crypto.randomUUID(),
      habit_id: habitId,
      log_date: dateKey,
      completed,
    });
  }
  saveRaw(store);
}

export function bulkSetHabits(
  dateKey: string,
  kind: HabitKind,
  completed: boolean
) {
  const store = loadRaw();
  const targets = store.habits.filter(
    (h) => !h.archived_at && h.kind === kind
  );
  targets.forEach((habit) => {
    const idx = store.habit_logs.findIndex(
      (l) => l.habit_id === habit.id && l.log_date === dateKey
    );
    if (idx >= 0) {
      store.habit_logs[idx].completed = completed;
    } else {
      store.habit_logs.push({
        id: crypto.randomUUID(),
        habit_id: habit.id,
        log_date: dateKey,
        completed,
      });
    }
  });
  saveRaw(store);
}

export function archiveHabit(habitId: string) {
  const store = loadRaw();
  const habit = store.habits.find((h) => h.id === habitId);
  if (habit) {
    habit.archived_at = new Date().toISOString();
    saveRaw(store);
  }
}

export function getHabitLogs(habitId: string) {
  return loadRaw().habit_logs.filter((l) => l.habit_id === habitId);
}

export function getMeditationSessions(dateKey: string): MeditationSession[] {
  return loadRaw()
    .meditation_sessions.filter(
      (s) => s.session_date === dateKey && s.duration_seconds >= 10
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

export function toggleMeditationDone(dateKey: string): boolean {
  const next = !isMeditationDone(dateKey);
  upsertDayEntry(dateKey, { meditation_done: next });
  return next;
}

export function addMeditationSession(
  dateKey: string,
  durationSeconds: number,
  pattern: string | null
): MeditationSession {
  const store = loadRaw();
  const session: MeditationSession = {
    id: crypto.randomUUID(),
    session_date: dateKey,
    duration_seconds: durationSeconds,
    pattern,
    completed_at: new Date().toISOString(),
  };
  store.meditation_sessions.push(session);
  saveRaw(store);
  if (durationSeconds >= 10) {
    upsertDayEntry(dateKey, { meditation_done: true });
  }
  return session;
}
