"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  formatNoteDate,
  noteDisplayTitle,
  notePreview,
  sortNotes,
} from "@/lib/note-utils";
import type { InboxNote } from "@/lib/types";
import { cn } from "@/lib/utils";

interface NotesPanelProps {
  notes: InboxNote[];
  loading?: boolean;
  onAdd: () => string;
  onUpdate: (id: string, patch: Partial<Pick<InboxNote, "title" | "body">>) => void;
  onDelete: (id: string) => void;
}

export function NotesPanel({
  notes,
  loading,
  onAdd,
  onUpdate,
  onDelete,
}: NotesPanelProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [dirty, setDirty] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sorted = sortNotes(notes);
  const editing = selectedId !== null;

  useEffect(() => {
    if (!selectedId) {
      setTitle("");
      setBody("");
      setDirty(false);
      return;
    }
    const note = notes.find((n) => n.id === selectedId);
    if (note) {
      setTitle(note.title);
      setBody(note.body);
      setDirty(false);
    }
  }, [selectedId]);

  const flushSave = () => {
    if (!selectedId || !dirty) return;
    onUpdate(selectedId, { title, body });
    setDirty(false);
  };

  useEffect(() => {
    if (!selectedId || !dirty) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      onUpdate(selectedId, { title, body });
      setDirty(false);
    }, 700);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [title, body, selectedId, dirty, onUpdate]);

  const openNote = (id: string) => {
    flushSave();
    setSelectedId(id);
  };

  const goBack = () => {
    flushSave();
    setSelectedId(null);
  };

  const handleNew = () => {
    flushSave();
    const id = onAdd();
    setTitle("");
    setBody("");
    setDirty(false);
    setSelectedId(id);
  };

  const handleDelete = () => {
    if (!selectedId) return;
    onDelete(selectedId);
    setSelectedId(null);
  };

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="h-5 w-5 animate-pulse rounded-full bg-primary/20" />
      </div>
    );
  }

  if (editing) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="mb-3 flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 gap-1 px-2 text-xs"
            onClick={goBack}
          >
            <ChevronLeft className="h-4 w-4" />
            All Notes
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-destructive hover:text-destructive"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        <Input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setDirty(true);
          }}
          placeholder="Title"
          className="mb-2 border-0 bg-transparent px-0 text-lg font-semibold shadow-none focus-visible:ring-0"
        />
        <Textarea
          value={body}
          onChange={(e) => {
            setBody(e.target.value);
            setDirty(true);
          }}
          placeholder="Start writing…"
          className="min-h-[min(20rem,50vh)] flex-1 resize-none border-0 bg-muted/30 px-3 py-3 text-sm shadow-none"
        />
        {dirty && (
          <p className="mt-2 text-center text-[10px] text-muted-foreground">
            Saving…
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {sorted.length} note{sorted.length === 1 ? "" : "s"}
        </p>
        <Button
          type="button"
          size="sm"
          className="h-8 gap-1 rounded-full px-3 text-xs"
          onClick={handleNew}
        >
          <Plus className="h-3.5 w-3.5" />
          New
        </Button>
      </div>

      {sorted.length === 0 ? (
        <button
          type="button"
          onClick={handleNew}
          className="rounded-2xl border border-dashed border-border/60 bg-muted/20 px-4 py-10 text-center transition-colors hover:border-primary/30 hover:bg-muted/40"
        >
          <p className="text-sm font-medium">Create your first note</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Like Apple Notes — separate notes you can edit anytime
          </p>
        </button>
      ) : (
        <ul className="space-y-2 overflow-y-auto">
          {sorted.map((note) => (
            <li key={note.id}>
              <button
                type="button"
                onClick={() => openNote(note.id)}
                className={cn(
                  "w-full rounded-2xl border border-border/60 bg-card/90 px-4 py-3 text-left transition-colors hover:border-primary/25 hover:bg-card"
                )}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate text-sm font-medium">
                    {noteDisplayTitle(note)}
                  </p>
                  <span className="shrink-0 text-[10px] text-muted-foreground">
                    {formatNoteDate(note.updated_at)}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                  {notePreview(note.body)}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
