"use client";

import { useState } from "react";
import { Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Habit, HabitKind } from "@/lib/types";
import { cn } from "@/lib/utils";

interface HabitListProps {
  habits: Habit[];
  logs: Record<string, boolean>;
  onToggle: (habitId: string) => void;
  onAdd: (name: string, kind: HabitKind) => void;
  loading: boolean;
}

export function HabitList({
  habits,
  logs,
  onToggle,
  onAdd,
  loading,
}: HabitListProps) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<HabitKind>("habit");

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd(name.trim(), kind);
    setName("");
    setAdding(false);
  };

  const habitItems = habits.filter((h) => h.kind === "habit");
  const viceItems = habits.filter((h) => h.kind === "vice");

  const renderGroup = (title: string, items: Habit[]) => (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground/70">None yet</p>
      ) : (
        items.map((habit) => {
          const done = logs[habit.id] ?? false;
          return (
            <button
              key={habit.id}
              type="button"
              onClick={() => onToggle(habit.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors",
                done
                  ? "border-violet-200 bg-violet-50"
                  : "border-violet-100/80 bg-white/60 hover:bg-violet-50/50"
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                  done
                    ? "border-violet-400 bg-violet-400 text-white"
                    : "border-violet-200"
                )}
              >
                {done && <Check className="h-3 w-3" />}
              </span>
              <span className={done ? "text-foreground" : "text-muted-foreground"}>
                {habit.name}
              </span>
            </button>
          );
        })
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex h-20 items-center justify-center">
        <div className="h-5 w-5 animate-pulse rounded-full bg-violet-100" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {renderGroup("Habits", habitItems)}
      {renderGroup("Vices", viceItems)}

      {adding ? (
        <div className="space-y-2 rounded-xl border border-violet-100 bg-white/60 p-3">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            className="text-sm"
            autoFocus
          />
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant={kind === "habit" ? "default" : "outline"}
              onClick={() => setKind("habit")}
            >
              Habit
            </Button>
            <Button
              type="button"
              size="sm"
              variant={kind === "vice" ? "default" : "outline"}
              onClick={() => setKind("vice")}
            >
              Vice
            </Button>
          </div>
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={handleAdd}>
              Save
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setAdding(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full border-violet-100"
          onClick={() => setAdding(true)}
        >
          <Plus className="mr-1 h-4 w-4" />
          Add habit or vice
        </Button>
      )}
    </div>
  );
}
