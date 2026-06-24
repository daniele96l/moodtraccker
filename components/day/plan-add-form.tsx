"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PlanItemInput } from "@/lib/plan-utils";

interface PlanAddFormProps {
  onAdd: (input: PlanItemInput) => void;
  dateKey?: string;
  onDateChange?: (dateKey: string) => void;
  className?: string;
}

export function PlanAddForm({
  onAdd,
  dateKey,
  onDateChange,
  className,
}: PlanAddFormProps) {
  const [text, setText] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");

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
    <div className={className}>
      <div className="space-y-2">
        {dateKey !== undefined && onDateChange && (
          <div>
            <Label htmlFor="plan-date" className="text-xs text-muted-foreground">
              Date
            </Label>
            <Input
              id="plan-date"
              type="date"
              value={dateKey}
              onChange={(e) => onDateChange(e.target.value)}
              className="mt-1 h-9 border-0 bg-muted/40 text-sm shadow-none"
            />
          </div>
        )}
        <div>
          <Label htmlFor="plan-title" className="text-xs text-muted-foreground">
            What
          </Label>
          <Input
            id="plan-title"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Meeting, workout, errand…"
            className="mt-1 h-9 border-0 bg-muted/40 text-sm shadow-none"
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
              className="mt-1 h-9 border-0 bg-muted/40 text-sm shadow-none"
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
              className="mt-1 h-9 border-0 bg-muted/40 text-sm shadow-none"
            />
          </div>
        </div>
      </div>
      <Button
        type="button"
        size="sm"
        className="mt-3 h-8 w-full"
        disabled={!text.trim()}
        onClick={handleAdd}
      >
        <Plus className="mr-1 h-3.5 w-3.5" />
        Add event
      </Button>
    </div>
  );
}
