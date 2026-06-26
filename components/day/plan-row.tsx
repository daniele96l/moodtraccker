"use client";

import { useEffect, useState } from "react";
import { MapPin, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPlanTime, type PlanItemInput } from "@/lib/plan-utils";
import type { DayTodo } from "@/lib/types";
import { cn } from "@/lib/utils";

interface PlanRowProps {
  todo: DayTodo;
  onRemove: () => void;
  onUpdate: (patch: Partial<PlanItemInput>) => void;
  className?: string;
}

export function PlanRow({ todo, onRemove, onUpdate, className }: PlanRowProps) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(todo.text);
  const [time, setTime] = useState(todo.time ?? "");
  const [location, setLocation] = useState(todo.location ?? "");

  useEffect(() => {
    if (!editing) {
      setText(todo.text);
      setTime(todo.time ?? "");
      setLocation(todo.location ?? "");
    }
  }, [todo, editing]);

  const saveEdit = () => {
    onUpdate({
      text: text.trim() || todo.text,
      time: time || null,
      location: location.trim() || null,
    });
    setEditing(false);
  };

  const cancelEdit = () => {
    setText(todo.text);
    setTime(todo.time ?? "");
    setLocation(todo.location ?? "");
    setEditing(false);
  };

  return (
    <li
      className={cn(
        "group relative mb-2 ml-2 rounded-2xl border border-border/60 bg-card/90 px-3 py-2.5 shadow-sm transition-all hover:border-primary/25",
        className
      )}
    >
      <span className="absolute -left-[0.9rem] top-3 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
      {editing ? (
        <div className="space-y-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="h-8 border-0 bg-muted/50 text-sm shadow-none"
            autoFocus
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
              onClick={cancelEdit}
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
            aria-label="Remove event"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </li>
  );
}
