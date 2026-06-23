"use client";

import { useMemo, useState } from "react";
import { Check, MapPin, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createPlanItem,
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
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, patch: Partial<PlanItemInput>) => void;
}

export function DayPlan({
  todos,
  loading,
  onAdd,
  onToggle,
  onRemove,
  onUpdate,
}: DayPlanProps) {
  const [text, setText] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");

  const sorted = useMemo(() => sortPlanItems(todos), [todos]);
  const pending = sorted.filter((t) => !t.done);
  const done = sorted.filter((t) => t.done);

  if (loading) {
    return (
      <div className="flex h-24 items-center justify-center">
        <div className="h-5 w-5 animate-pulse rounded-full bg-primary/20" />
      </div>
    );
  }

  const handleAdd = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onAdd({
      text: trimmed,
      time: time || null,
      location: location.trim() || null,
    });
    setText("");
    setTime("");
    setLocation("");
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-2xl border border-border/60 bg-muted/20 p-3">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Add to schedule
        </p>
        <div className="space-y-2">
          <div>
            <Label htmlFor="plan-title" className="text-xs text-muted-foreground">
              What
            </Label>
            <Input
              id="plan-title"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Meeting, workout, errand…"
              className="mt-1 h-9 border-0 bg-background/80 text-sm shadow-none"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
              }}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="plan-time" className="text-xs text-muted-foreground">
                Time
              </Label>
              <Input
                id="plan-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="mt-1 h-9 border-0 bg-background/80 text-sm shadow-none"
              />
            </div>
            <div>
              <Label htmlFor="plan-place" className="text-xs text-muted-foreground">
                Place
              </Label>
              <Input
                id="plan-place"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Office, home…"
                className="mt-1 h-9 border-0 bg-background/80 text-sm shadow-none"
              />
            </div>
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          className="h-8 w-full"
          disabled={!text.trim()}
          onClick={handleAdd}
        >
          <Plus className="mr-1 h-3.5 w-3.5" />
          Add event
        </Button>
      </div>

      {todos.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border/60 bg-muted/20 px-4 py-6 text-center text-xs text-muted-foreground">
          No events scheduled — add time and place above
        </p>
      ) : (
        <div className="space-y-4">
          {pending.length > 0 && (
            <ol className="relative space-y-0 border-l border-primary/20 pl-3">
              {pending.map((todo) => (
                <PlanRow
                  key={todo.id}
                  todo={todo}
                  onToggle={() => onToggle(todo.id)}
                  onRemove={() => onRemove(todo.id)}
                  onUpdate={(patch) => onUpdate(todo.id, patch)}
                />
              ))}
            </ol>
          )}
          {done.length > 0 && (
            <div className="space-y-2">
              {pending.length > 0 && (
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Done
                </p>
              )}
              <ul className="space-y-2">
                {done.map((todo) => (
                  <PlanRow
                    key={todo.id}
                    todo={todo}
                    onToggle={() => onToggle(todo.id)}
                    onRemove={() => onRemove(todo.id)}
                    onUpdate={(patch) => onUpdate(todo.id, patch)}
                  />
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PlanRow({
  todo,
  onToggle,
  onRemove,
  onUpdate,
}: {
  todo: DayTodo;
  onToggle: () => void;
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
    <li
      className={cn(
        "group relative mb-2 ml-2 rounded-2xl border px-3 py-2.5 transition-all",
        todo.done
          ? "border-border/40 bg-muted/30"
          : "border-border/60 bg-card/90 shadow-sm hover:border-primary/25"
      )}
    >
      <span
        className={cn(
          "absolute -left-[0.9rem] top-3 h-2 w-2 rounded-full ring-2 ring-background",
          todo.done ? "bg-muted-foreground/40" : "bg-primary"
        )}
      />
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
            onClick={onToggle}
            className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-muted-foreground/25 bg-background transition-colors hover:border-primary/40"
          >
            {todo.done && <Check className="h-3.5 w-3.5 text-primary" />}
          </button>
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
            <p
              className={cn(
                "text-sm font-medium",
                todo.done && "text-muted-foreground line-through"
              )}
            >
              {todo.text}
            </p>
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
