"use client";

import { useState } from "react";
import { Calendar, Plus, X } from "lucide-react";
import { format, parseISO } from "date-fns";
import { PlanAddForm } from "@/components/day/plan-add-form";
import { PlanRow } from "@/components/day/plan-row";
import { Button } from "@/components/ui/button";
import { toDateKey } from "@/lib/date-utils";
import {
  removeDayPlanItem,
  updateDayPlanItem,
} from "@/lib/firestore-store";
import { useDayTodos } from "@/lib/hooks/use-day-todos";
import { useUpcomingPlans } from "@/lib/hooks/use-upcoming-plans";
import type { DayTab } from "@/lib/types";
import { cn } from "@/lib/utils";

interface DesktopScheduleSidebarProps {
  refreshKey: number;
  onOpenDay: (dateKey: string, tab?: DayTab) => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function DesktopScheduleSidebar({
  refreshKey,
  onOpenDay,
  mobileOpen = false,
  onMobileClose,
}: DesktopScheduleSidebarProps) {
  const { items } = useUpcomingPlans(refreshKey);
  const [showAdd, setShowAdd] = useState(false);
  const [addDate, setAddDate] = useState(() => toDateKey(new Date()));
  const { addTodo } = useDayTodos(addDate);

  const grouped = items.reduce<Record<string, typeof items>>((acc, item) => {
    if (!acc[item.dateKey]) acc[item.dateKey] = [];
    acc[item.dateKey].push(item);
    return acc;
  }, {});

  const dates = Object.keys(grouped).sort();

  return (
    <aside
      className={cn(
        "fixed right-0 top-0 z-30 flex h-dvh w-[min(18rem,88vw)] flex-col border-l border-border/40 bg-background xl:w-80",
        mobileOpen ? "flex" : "hidden",
        "lg:z-20 lg:flex lg:w-72"
      )}
    >
      <div className="border-b border-border/40 px-4 py-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-medium">
              <Calendar className="h-4 w-4 text-primary" />
              Schedule
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Upcoming calendar events
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              type="button"
              size="icon"
              variant={showAdd ? "default" : "outline"}
              className="h-8 w-8 rounded-full"
              onClick={() => setShowAdd((v) => !v)}
              aria-label={showAdd ? "Close add event" : "Add event"}
              aria-expanded={showAdd}
            >
              <Plus className={cn("h-4 w-4", showAdd && "rotate-45")} />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full lg:hidden"
              onClick={onMobileClose}
              aria-label="Close schedule"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {showAdd && (
          <div className="mt-4 rounded-2xl border border-border/60 bg-muted/20 p-3">
            <PlanAddForm
              dateKey={addDate}
              onDateChange={setAddDate}
              onAdd={(input) => {
                addTodo(input);
                setShowAdd(false);
              }}
            />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        {dates.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border/60 bg-muted/20 px-4 py-8 text-center text-xs text-muted-foreground">
            No upcoming events. Tap + to add one.
          </p>
        ) : (
          <div className="space-y-4">
            {dates.map((dateKey) => (
              <section key={dateKey}>
                <button
                  type="button"
                  onClick={() => onOpenDay(dateKey, "calendar")}
                  className="mb-2 w-full rounded-lg px-1 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground hover:text-foreground"
                >
                  {format(parseISO(dateKey), "EEE, MMM d")}
                </button>
                <ul className="relative space-y-0 border-l border-primary/20 pl-3">
                  {grouped[dateKey].map(({ todo }) => (
                    <PlanRow
                      key={todo.id}
                      todo={todo}
                      className="mb-2"
                      onUpdate={(patch) =>
                        void updateDayPlanItem(dateKey, todo.id, patch)
                      }
                      onRemove={() => void removeDayPlanItem(dateKey, todo.id)}
                    />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
