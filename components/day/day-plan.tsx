"use client";

import { useMemo, useState } from "react";
import { MapPin, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlanAddForm } from "@/components/day/plan-add-form";
import {
  formatPlanTime,
  sortPlanItems,
  type PlanItemInput,
} from "@/lib/plan-utils";
import type { DayTodo } from "@/lib/types";
import { cn } from "@/lib/utils";

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

function PlanRow({
  todo,
  onRemove,
  onUpdate,
}: {
  todo: DayTodo;
  onRemove: () => void;
  onUpdate: (patch: Partial<PlanItemInput>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(todo.text);
  const [time, setTime] = useState(todo.time ?? "");
  const [location, setLocation] = useState(todo.location ?? "");

  const saveEdit = () => {
    onUpdate({
      text: text.trim() || todo.text,
      time: time || null,
      location: location.trim() || null,
    });
    setEditing(false);
  };

  return (
    <li className="group relative mb-2 ml-2 rounded-2xl border border-border/60 bg-card/90 px-3 py-2.5 shadow-sm transition-all hover:border-primary/25">
      <span className="absolute -left-[0.9rem] top-3 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
      {editing ? (
        <div className="space-y-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="h-8 border-0 bg-muted/50 text-sm shadow-none"
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="h-8 border-0 bg-muted/50 text-sm shadow-none"
            />
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Place"
              className="h-8 border-0 bg-muted/50 text-sm shadow-none"
            />
          </div>
          <div className="flex gap-2">
            <Button type="button" size="sm" className="h-7 flex-1" onClick={saveEdit}>
              Save
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7"
              onClick={() => setEditing(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-2">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="min-w-0 flex-1 text-left"
          >
            <p
              className={cn(
                "text-[11px] font-medium tabular-nums text-primary",
                !todo.time && "text-muted-foreground"
              )}
            >
              {formatPlanTime(todo.time)}
            </p>
            <p className="text-sm font-medium">{todo.text}</p>
            {todo.location && (
              <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{todo.location}</span>
              </p>
            )}
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="rounded-lg p-1.5 text-muted-foreground/50 opacity-0 transition-opacity hover:bg-muted hover:text-muted-foreground group-hover:opacity-100"
            aria-label="Remove"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </li>
  );
}
