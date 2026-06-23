export type DayTab = "mood" | "journal" | "habits" | "meditate";

export interface DayTodo {
  id: string;
  text: string;
  time: string | null;
  location: string | null;
  done: boolean;
}

export interface DayTodoSummary {
  total: number;
  done: number;
  preview: string | null;
}

export type HabitKind = "habit" | "vice";

export type MeditationPattern = "box" | "478" | "silent";

export interface DayEntry {
  id: string;
  entry_date: string;
  mood_score: number | null;
  journal_text: string | null;
  todos: DayTodo[];
  created_at: string;
  updated_at: string;
}

export interface InboxNote {
  id: string;
  title: string;
  body: string;
  created_at: string;
  updated_at: string;
}

export interface GlobalInbox {
  notes: InboxNote[];
  todos: DayTodo[];
  updated_at: string;
}

export interface Habit {
  id: string;
  name: string;
  kind: HabitKind;
  color: string | null;
  sort_order: number;
  archived_at: string | null;
  created_at: string;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  log_date: string;
  completed: boolean;
}

export interface MeditationSession {
  id: string;
  session_date: string;
  duration_seconds: number;
  pattern: string | null;
  completed_at: string;
}

export interface MonthMoodSummary {
  entry_date: string;
  mood_score: number | null;
}
