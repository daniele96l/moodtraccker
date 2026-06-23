"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MoodSlider } from "@/components/day/mood-slider";
import { JournalEditor } from "@/components/day/journal-editor";
import { HabitList } from "@/components/day/habit-list";
import { MeditationTimer } from "@/components/meditation/meditation-timer";
import { useDayEntry } from "@/lib/hooks/use-day-entry";
import { useHabits } from "@/lib/hooks/use-habits";
import { formatDisplayDate } from "@/lib/date-utils";
import {
  getMeditationSessions,
  subscribeStore,
} from "@/lib/local-store";
import type { MeditationSession } from "@/lib/types";

interface DaySheetProps {
  dateKey: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DaySheet({ dateKey, open, onOpenChange }: DaySheetProps) {
  const { entry, loading, upsert } = useDayEntry(dateKey);
  const { habits, logs, loading: habitsLoading, addHabit, toggleHabit } =
    useHabits(dateKey);
  const [mood, setMood] = useState(5);
  const [sessions, setSessions] = useState<MeditationSession[]>([]);

  useEffect(() => {
    if (entry?.mood_score != null) {
      setMood(entry.mood_score);
    } else {
      setMood(5);
    }
  }, [entry]);

  const fetchSessions = useCallback(() => {
    setSessions(getMeditationSessions(dateKey));
  }, [dateKey]);

  useEffect(() => {
    if (!open) return;
    fetchSessions();
    return subscribeStore(fetchSessions);
  }, [open, fetchSessions]);

  const handleMoodChange = (value: number) => {
    setMood(value);
    upsert({ mood_score: value });
  };

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    if (m === 0) return `${sec}s`;
    return sec > 0 ? `${m}m ${sec}s` : `${m}m`;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[90vh] overflow-y-auto rounded-t-2xl border-violet-100 bg-[#faf8ff]"
      >
        <SheetHeader className="pb-2">
          <SheetTitle className="text-base font-medium">
            {formatDisplayDate(dateKey)}
          </SheetTitle>
        </SheetHeader>

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-6 w-6 animate-pulse rounded-full bg-violet-100" />
          </div>
        ) : (
          <Tabs defaultValue="mood" className="mt-2">
            <TabsList className="grid w-full grid-cols-4 bg-violet-50/80">
              <TabsTrigger value="mood">Mood</TabsTrigger>
              <TabsTrigger value="journal">Journal</TabsTrigger>
              <TabsTrigger value="habits">Habits</TabsTrigger>
              <TabsTrigger value="meditate">Meditate</TabsTrigger>
            </TabsList>

            <TabsContent value="mood" className="mt-4 px-1">
              <MoodSlider value={mood} onChange={handleMoodChange} />
            </TabsContent>

            <TabsContent value="journal" className="mt-4 px-1">
              <JournalEditor
                value={entry?.journal_text ?? ""}
                onSave={(text) => upsert({ journal_text: text })}
              />
            </TabsContent>

            <TabsContent value="habits" className="mt-4 px-1">
              <HabitList
                habits={habits}
                logs={logs}
                onToggle={toggleHabit}
                onAdd={addHabit}
                loading={habitsLoading}
              />
            </TabsContent>

            <TabsContent value="meditate" className="mt-4 space-y-4 px-1">
              <MeditationTimer dateKey={dateKey} onComplete={fetchSessions} />
              {sessions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Sessions today
                  </p>
                  {sessions.map((s) => (
                    <div
                      key={s.id}
                      className="rounded-lg border border-violet-100 bg-white/60 px-3 py-2 text-sm"
                    >
                      {formatDuration(s.duration_seconds)}
                      {s.pattern && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          · {s.pattern}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </SheetContent>
    </Sheet>
  );
}
