"use client";

import { useMemo } from "react";
import { PlanAddForm } from "@/components/day/plan-add-form";
import { PlanRow } from "@/components/day/plan-row";
import { sortPlanItems, type PlanItemInput } from "@/lib/plan-utils";
import type { DayTodo } from "@/lib/types";

interface DayPlanProps {
  todos: DayTodo[];
  loading?: boolean;
  onAdd: (input: PlanItemInput) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, patch: Partial<PlanItemInput>) => void;
}

export function DayPlan({
  todos,
  loading,
  onAdd,
  onRemove,
  onUpdate,
}: DayPlanProps) {
  const sorted = useMemo(() => sortPlanItems(todos), [todos]);

  if (loading) {
    return (
      <div className="flex h-24 items-center justify-center">
        <div className="h-5 w-5 animate-pulse rounded-full bg-primary/20" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-2xl border border-border/60 bg-muted/20 p-3">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Add to schedule
        </p>
        <PlanAddForm onAdd={onAdd} />
      </div>

      {todos.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border/60 bg-muted/20 px-4 py-6 text-center text-xs text-muted-foreground">
          No events scheduled — add time and place above
        </p>
      ) : (
        <ol className="relative space-y-0 border-l border-primary/20 pl-3">
          {sorted.map((todo) => (
            <PlanRow
              key={todo.id}
              todo={todo}
              onRemove={() => onRemove(todo.id)}
              onUpdate={(patch) => onUpdate(todo.id, patch)}
            />
          ))}
        </ol>
      )}
    </div>
  );
}
