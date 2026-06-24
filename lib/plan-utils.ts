import type { DayTodo } from "@/lib/types";

export type PlanItemInput = Pick<DayTodo, "text" | "time" | "location">;

export function sortPlanItems(todos: DayTodo[]): DayTodo[] {
  return [...todos].sort((a, b) => {
    if (a.time && b.time) return a.time.localeCompare(b.time);
    if (a.time) return -1;
    if (b.time) return 1;
    return 0;
  });
}

export function formatPlanTime(time: string | null): string {
  if (!time) return "All day";
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return time;
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: m === 0 ? undefined : "2-digit",
  });
}

export function planPreview(todo: DayTodo): string {
  const title = todo.text.trim();
  if (!todo.time) return title;
  return `${formatPlanTime(todo.time)} · ${title}`;
}

export function createPlanItem(
  input: Pick<DayTodo, "text" | "time" | "location">
): DayTodo {
  return {
    id: crypto.randomUUID(),
    text: input.text.trim(),
    time: input.time?.trim() || null,
    location: input.location?.trim() || null,
    done: false,
  };
}

export function normalizePlanItem(todo: DayTodo): DayTodo {
  return {
    ...todo,
    time: todo.time ?? null,
    location: todo.location ?? null,
  };
}
