"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface JournalEditorProps {
  value: string;
  onSave: (text: string) => void;
}

export function JournalEditor({ value, onSave }: JournalEditorProps) {
  const [text, setText] = useState(value);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    setText(value);
  }, [value]);

  const isDirty = text !== value;

  const submit = () => {
    onSave(text);
    setJustSaved(true);
    window.setTimeout(() => setJustSaved(false), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      if (isDirty) submit();
    }
  };

  return (
    <div className="space-y-3">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="How was your day? Write freely…"
        className="min-h-[140px] resize-none rounded-2xl border-border/50 bg-muted/30 text-sm shadow-none focus-visible:ring-primary/20"
      />
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] text-muted-foreground">
          {isDirty ? "Unsaved changes" : "Saved"}
          <span className="hidden sm:inline"> · ⌘↵ to save</span>
        </p>
        <Button
          type="button"
          size="sm"
          className="h-8 rounded-full px-4"
          disabled={!isDirty}
          onClick={submit}
        >
          {justSaved ? (
            <>
              <Check className="mr-1 h-3.5 w-3.5" />
              Saved
            </>
          ) : (
            "Save entry"
          )}
        </Button>
      </div>
      <p
        className={cn(
          "text-center text-[11px] text-emerald-600 transition-opacity",
          justSaved ? "opacity-100" : "opacity-0"
        )}
      >
        Journal saved
      </p>
    </div>
  );
}
