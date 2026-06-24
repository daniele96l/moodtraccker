"use client";

import { ListTodo, StickyNote } from "lucide-react";
import { NotesPanel } from "@/components/global/notes-panel";
import { TodoList } from "@/components/day/todo-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGlobalInbox } from "@/lib/hooks/use-global-inbox";

interface GlobalInboxPanelProps {
  layout?: "tabs" | "stacked";
  className?: string;
}

export function GlobalInboxPanel({
  layout = "tabs",
  className,
}: GlobalInboxPanelProps) {
  const {
    inbox,
    loading,
    addNote,
    updateNote,
    deleteNote,
    addTodo,
    toggleTodo,
    removeTodo,
    pendingTodos,
    notesCount,
  } = useGlobalInbox();

  if (layout === "stacked") {
    return (
      <div className={className}>
        <section className="flex min-h-0 flex-1 flex-col border-b border-border/40 pb-4">
          <h2 className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <StickyNote className="h-3.5 w-3.5" />
            Notes
            {notesCount > 0 && (
              <span className="text-[10px] opacity-70">({notesCount})</span>
            )}
          </h2>
          <NotesPanel
            notes={inbox?.notes ?? []}
            loading={loading}
            onAdd={addNote}
            onUpdate={updateNote}
            onDelete={deleteNote}
          />
        </section>
        <section className="flex min-h-0 flex-1 flex-col pt-4">
          <h2 className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <ListTodo className="h-3.5 w-3.5" />
            Tasks
            {pendingTodos > 0 && (
              <span className="text-[10px] opacity-70">({pendingTodos})</span>
            )}
          </h2>
          <TodoList
            todos={inbox?.todos ?? []}
            loading={loading}
            placeholder="Add a task…"
            emptyLabel="No tasks yet"
            onAdd={addTodo}
            onToggle={toggleTodo}
            onRemove={removeTodo}
          />
        </section>
      </div>
    );
  }

  return (
    <Tabs defaultValue="notes" className={className}>
      <TabsList className="mb-4 grid h-9 w-full shrink-0 grid-cols-2 rounded-full bg-muted/60 p-0.5">
        <TabsTrigger
          value="notes"
          className="gap-1 rounded-full text-xs data-active:bg-background data-active:shadow-sm"
        >
          <StickyNote className="h-3 w-3" />
          Notes
          {notesCount > 0 && (
            <span className="text-[10px] opacity-70">({notesCount})</span>
          )}
        </TabsTrigger>
        <TabsTrigger
          value="tasks"
          className="gap-1 rounded-full text-xs data-active:bg-background data-active:shadow-sm"
        >
          <ListTodo className="h-3 w-3" />
          Tasks
          {pendingTodos > 0 && (
            <span className="text-[10px] opacity-70">({pendingTodos})</span>
          )}
        </TabsTrigger>
      </TabsList>
      <TabsContent
        value="notes"
        className="mt-0 flex min-h-0 flex-1 flex-col outline-none"
      >
        <NotesPanel
          notes={inbox?.notes ?? []}
          loading={loading}
          onAdd={addNote}
          onUpdate={updateNote}
          onDelete={deleteNote}
        />
      </TabsContent>
      <TabsContent value="tasks" className="mt-0 outline-none">
        <TodoList
          todos={inbox?.todos ?? []}
          loading={loading}
          placeholder="Add a task…"
          emptyLabel="No tasks yet"
          onAdd={addTodo}
          onToggle={toggleTodo}
          onRemove={removeTodo}
        />
      </TabsContent>
    </Tabs>
  );
}
