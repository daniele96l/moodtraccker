"use client";

import { useState } from "react";
import { Check, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DayTodo } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TodoListProps {
  todos: DayTodo[];
  loading?: boolean;
  placeholder?: string;
  emptyLabel?: string;
  onAdd: (text: string) => void;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}

export function TodoList({
  todos,
  loading,
  placeholder = "Add something to do…",
  emptyLabel = "Nothing planned yet",
  onAdd,
  onToggle,
  onRemove,
}: TodoListProps) {
  const [text, setText] = useState("");

  if (loading) {
    return (
      <div className="flex h-24 items-center justify-center">
        <div className="h-5 w-5 animate-pulse rounded-full bg-primary/20" />
      </div>
    );
  }

  const pending = todos.filter((t) => !t.done);
  const done = todos.filter((t) => t.done);

  const handleAdd = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setText("");
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          className="h-9 border-0 bg-muted/50 text-sm shadow-none"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd();
          }}
        />
        <Button
          type="button"
          size="sm"
          className="h-9 shrink-0 px-3"
          disabled={!text.trim()}
          onClick={handleAdd}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {todos.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border/60 bg-muted/20 px-4 py-6 text-center text-xs text-muted-foreground">
          {emptyLabel}
        </p>
      ) : (
        <div className="space-y-4">
          {pending.length > 0 && (
            <ul className="space-y-2">
              {pending.map((todo) => (
                <TodoRow
                  key={todo.id}
                  todo={todo}
                  onToggle={() => onToggle(todo.id)}
                  onRemove={() => onRemove(todo.id)}
                />
              ))}
            </ul>
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
                  <TodoRow
                    key={todo.id}
                    todo={todo}
                    onToggle={() => onToggle(todo.id)}
                    onRemove={() => onRemove(todo.id)}
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

function TodoRow({
  todo,
  onToggle,
  onRemove,
}: {
  todo: DayTodo;
  onToggle: () => void;
  onRemove: () => void;
}) {
  return (
    <li
      className={cn(
        "group flex items-center gap-2 rounded-2xl border px-3 py-2.5 transition-all",
        todo.done
          ? "border-border/40 bg-muted/30"
          : "border-border/60 bg-card/80 hover:border-primary/20"
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <span
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
            todo.done
              ? "border-primary/40 bg-primary/15 text-primary"
              : "border-muted-foreground/25 bg-background"
          )}
        >
          {todo.done && <Check className="h-3.5 w-3.5" />}
        </span>
        <span
          className={cn(
            "min-w-0 flex-1 text-sm",
            todo.done && "text-muted-foreground line-through"
          )}
        >
          {todo.text}
        </span>
      </button>
      <button
        type="button"
        onClick={onRemove}
        className="rounded-lg p-1.5 text-muted-foreground/50 opacity-0 transition-opacity hover:bg-muted hover:text-muted-foreground group-hover:opacity-100"
        aria-label="Remove"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </li>
  );
}
