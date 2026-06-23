import { format, parseISO } from "date-fns";

export function toDateKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function formatDisplayDate(dateKey: string): string {
  return format(parseISO(dateKey), "EEEE, MMMM d, yyyy");
}

export function formatMonthLabel(year: number, month: number): string {
  return format(new Date(year, month, 1), "MMMM yyyy");
}

export function monthKey(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

export function getMonthRange(year: number, month: number) {
  const start = format(new Date(year, month, 1), "yyyy-MM-dd");
  const end = format(new Date(year, month + 1, 0), "yyyy-MM-dd");
  return { start, end };
}
