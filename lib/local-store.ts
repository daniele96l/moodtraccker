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

function loadRaw(): MoodStore {
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
  patch: Partial<Pick<DayEntry, "mood_score" | "journal_text">>
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
  const idx = store.habit_logs.findIndex(
    (l) => l.habit_id === habitId && l.log_date === dateKey
  );

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

export function getMeditationSessions(dateKey: string): MeditationSession[] {
  return loadRaw()
    .meditation_sessions.filter((s) => s.session_date === dateKey)
    .sort(
      (a, b) =>
        new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
    );
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
  return session;
}
