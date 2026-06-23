"use client";

import { useCallback, useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MoodSlider } from "@/components/day/mood-slider";
import { JournalEditor } from "@/components/day/journal-editor";
import { HabitList } from "@/components/day/habit-list";
import { MeditationTimer } from "@/components/meditation/meditation-timer";
import { useDayEntry } from "@/lib/hooks/use-day-entry";
import { useHabits } from "@/lib/hooks/use-habits";
import { moodColor } from "@/lib/mood-colors";
import {
  getMeditationSessions,
  subscribeStore,
} from "@/lib/local-store";
import type { MeditationSession } from "@/lib/types";
import type { DayTab } from "@/lib/types";

interface DaySheetProps {
  dateKey: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab?: DayTab;
}

export function DaySheet({ dateKey, open, onOpenChange, initialTab = "mood" }: DaySheetProps) {
  const { entry, loading, upsert } = useDayEntry(dateKey);
  const {
    habits,
    logs,
    loading: habitsLoading,
    addHabit,
    toggleHabit,
    markAllHabitsDone,
    markAllVicesAvoided,
    archiveHabit,
  } = useHabits(dateKey);
  const [mood, setMood] = useState(5);
  const [sessions, setSessions] = useState<MeditationSession[]>([]);
  const [tab, setTab] = useState<DayTab>(initialTab);

  useEffect(() => {
    if (open) setTab(initialTab);
  }, [open, initialTab, dateKey]);

  const parsed = parseISO(dateKey);
  const title = format(parsed, "EEEE, MMMM d");
  const year = format(parsed, "yyyy");

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="flex max-h-[min(36rem,88vh)] w-[calc(100%-2rem)] max-w-md flex-col gap-0 overflow-hidden rounded-3xl border-border/50 bg-card p-0 shadow-2xl shadow-primary/10 sm:max-w-md"
      >
        <div
          className="relative border-b border-border/40 px-6 pb-4 pt-6"
          style={{
            background: `linear-gradient(180deg, ${moodColor(mood)}55 0%, transparent 100%)`,
          }}
        >
          <DialogHeader className="gap-1 text-left">
            <DialogTitle className="text-lg font-medium tracking-tight">
              {title}
            </DialogTitle>
            <p className="text-xs font-medium text-muted-foreground">{year}</p>
          </DialogHeader>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pb-6 pt-4">
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-6 w-6 animate-pulse rounded-full bg-primary/15" />
            </div>
          ) : (
            <Tabs value={tab} onValueChange={(v) => setTab(v as DayTab)} className="flex min-h-0 flex-col">
              <TabsList className="mb-4 grid h-9 w-full shrink-0 grid-cols-4 rounded-full bg-muted/60 p-0.5">
                <TabsTrigger
                  value="mood"
                  className="rounded-full text-xs data-active:bg-background data-active:shadow-sm"
                >
                  Mood
                </TabsTrigger>
                <TabsTrigger
                  value="journal"
                  className="rounded-full text-xs data-active:bg-background data-active:shadow-sm"
                >
                  Journal
                </TabsTrigger>
                <TabsTrigger
                  value="habits"
                  className="rounded-full text-xs data-active:bg-background data-active:shadow-sm"
                >
                  Habits
                </TabsTrigger>
                <TabsTrigger
                  value="meditate"
                  className="rounded-full text-xs data-active:bg-background data-active:shadow-sm"
                >
                  Meditate
                </TabsTrigger>
              </TabsList>

              <TabsContent value="mood" className="mt-0 outline-none">
                <MoodSlider value={mood} onChange={handleMoodChange} />
              </TabsContent>

              <TabsContent value="journal" className="mt-0 outline-none">
                <JournalEditor
                  value={entry?.journal_text ?? ""}
                  onSave={(text) => upsert({ journal_text: text })}
                />
              </TabsContent>

              <TabsContent value="habits" className="mt-0 outline-none">
                <HabitList
                  dateKey={dateKey}
                  habits={habits}
                  logs={logs}
                  onToggle={toggleHabit}
                  onAdd={addHabit}
                  onMarkAllHabits={markAllHabitsDone}
                  onMarkAllVices={markAllVicesAvoided}
                  onArchive={archiveHabit}
                  loading={habitsLoading}
                />
              </TabsContent>

              <TabsContent
                value="meditate"
                className="mt-0 space-y-4 outline-none"
              >
                <MeditationTimer dateKey={dateKey} onComplete={fetchSessions} />
                {sessions.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      Sessions
                    </p>
                    {sessions.map((s) => (
                      <div
                        key={s.id}
                        className="rounded-xl border border-border/50 bg-muted/30 px-3 py-2 text-sm"
                      >
                        {formatDuration(s.duration_seconds)}
                        {s.pattern && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            {s.pattern}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
