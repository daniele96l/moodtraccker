"use client";

import { useState } from "react";
import { StickyNote } from "lucide-react";
import { GlobalInboxPanel } from "@/components/global/global-inbox-panel";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useGlobalInbox } from "@/lib/hooks/use-global-inbox";
import { noteDisplayTitle, sortNotes } from "@/lib/note-utils";
import { cn } from "@/lib/utils";

export function FooterNotes() {
  const [open, setOpen] = useState(false);
  const { inbox, pendingTodos, notesCount } = useGlobalInbox();

  const latest = sortNotes(inbox?.notes ?? [])[0];
  const badgeCount = notesCount + pendingTodos;
  const hasContent = badgeCount > 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "relative shrink-0 rounded-full border px-3 py-1.5 text-left transition-all active:scale-95",
          hasContent
            ? "border-primary/30 bg-primary/10 text-foreground"
            : "border-border/60 bg-card/90 text-muted-foreground hover:border-primary/30"
        )}
      >
        <span className="flex items-center gap-1.5 text-xs font-medium">
          <StickyNote className="h-3 w-3 text-primary" />
          Notes
          {badgeCount > 0 && (
            <span className="rounded-full bg-primary/15 px-1.5 text-[10px] text-primary">
              {badgeCount}
            </span>
          )}
        </span>
        <span className="block max-w-[8rem] truncate text-[10px] opacity-70">
          {latest
            ? noteDisplayTitle(latest)
            : pendingTodos > 0
              ? `${pendingTodos} task${pendingTodos > 1 ? "s" : ""}`
              : "Notes & tasks"}
        </span>
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
        >
          <SheetHeader className="shrink-0 border-b border-border/40 px-5 py-4 text-left">
            <SheetTitle className="flex items-center gap-2">
              <StickyNote className="h-4 w-4 text-primary" />
              Notes & tasks
            </SheetTitle>
            <SheetDescription>
              Notes and todos in one place
            </SheetDescription>
          </SheetHeader>

          <GlobalInboxPanel className="flex min-h-0 flex-1 flex-col px-5 py-4" />
        </SheetContent>
      </Sheet>
    </>
  );
}
