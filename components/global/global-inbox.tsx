"use client";

import { useEffect, useState } from "react";
import { ListTodo, StickyNote } from "lucide-react";
import { TodoList } from "@/components/day/todo-list";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useGlobalInbox } from "@/lib/hooks/use-global-inbox";
import { useAuth } from "@/lib/auth-context";
import { useEncryption } from "@/lib/encryption-context";
import { cn } from "@/lib/utils";

export function GlobalInbox() {
  const { user } = useAuth();
  const { unlocked } = useEncryption();
  const [open, setOpen] = useState(false);
  const { inbox, loading, setNote, addTodo, toggleTodo, removeTodo } =
    useGlobalInbox();
  const [noteDraft, setNoteDraft] = useState("");
  const [noteDirty, setNoteDirty] = useState(false);

  useEffect(() => {
    if (open) {
      setNoteDraft(inbox?.note ?? "");
      setNoteDirty(false);
    }
  }, [open, inbox?.note]);

  const pendingTodos = inbox?.todos.filter((t) => !t.done).length ?? 0;
  const hasContent = pendingTodos > 0 || !!inbox?.note?.trim();

  const saveNote = () => {
    setNote(noteDraft);
    setNoteDirty(false);
  };

  if (!user || !unlocked) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "fixed bottom-[5.5rem] right-4 z-30 flex h-12 w-12 items-center justify-center rounded-full border shadow-lg transition-transform active:scale-95 sm:right-[calc(50%-15rem+1rem)]",
          hasContent
            ? "border-primary/30 bg-primary text-primary-foreground shadow-primary/20"
            : "border-border/60 bg-card/95 text-muted-foreground backdrop-blur-xl"
        )}
        aria-label="Global notes and todos"
      >
        <ListTodo className="h-5 w-5" />
        {pendingTodos > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-background px-1 text-[10px] font-semibold text-primary ring-2 ring-primary">
            {pendingTodos}
          </span>
        )}
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-md">
          <SheetHeader className="border-b border-border/40 px-5 py-4 text-left">
            <SheetTitle className="flex items-center gap-2">
              <StickyNote className="h-4 w-4 text-primary" />
              Notes & todos
            </SheetTitle>
            <SheetDescription>
              Always here — not tied to a specific day
            </SheetDescription>
          </SheetHeader>

          <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-5 py-4">
            <section className="space-y-2">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Quick note
              </p>
              <Textarea
                value={noteDraft}
                onChange={(e) => {
                  setNoteDraft(e.target.value);
                  setNoteDirty(true);
                }}
                placeholder="Ideas, reminders, anything…"
                className="min-h-24 resize-none border-0 bg-muted/50 text-sm shadow-none"
              />
              {noteDirty && (
                <Button
                  type="button"
                  size="sm"
                  className="h-8"
                  onClick={saveNote}
                >
                  Save note
                </Button>
              )}
            </section>

            <section className="space-y-2">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Global todos
              </p>
              <TodoList
                todos={inbox?.todos ?? []}
                loading={loading}
                placeholder="Add a global todo…"
                emptyLabel="No global todos"
                onAdd={addTodo}
                onToggle={toggleTodo}
                onRemove={removeTodo}
              />
            </section>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
