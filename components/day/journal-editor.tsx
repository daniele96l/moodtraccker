"use client";

import { useEffect, useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";

interface JournalEditorProps {
  value: string;
  onSave: (text: string) => void;
}

export function JournalEditor({ value, onSave }: JournalEditorProps) {
  const [text, setText] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setText(value);
  }, [value]);

  const handleChange = (next: string) => {
    setText(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => onSave(next), 600);
  };

  return (
    <Textarea
      value={text}
      onChange={(e) => handleChange(e.target.value)}
      placeholder="How was your day? Write freely…"
      className="min-h-[120px] resize-none border-violet-100 bg-white/60 text-sm"
    />
  );
}
