"use client";

import { StickyNote, X } from "lucide-react";
import { GlobalInboxPanel } from "@/components/global/global-inbox-panel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DesktopInboxSidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function DesktopInboxSidebar({
  mobileOpen = false,
  onMobileClose,
}: DesktopInboxSidebarProps) {
  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-30 flex h-dvh w-[min(18rem,88vw)] flex-col border-r border-border/40 bg-background xl:w-80",
        mobileOpen ? "flex" : "hidden",
        "lg:z-20 lg:flex lg:w-72"
      )}
    >
      <div className="flex items-center justify-between border-b border-border/40 px-4 py-4">
        <h2 className="flex items-center gap-2 text-sm font-medium">
          <StickyNote className="h-4 w-4 text-primary" />
          Notes & tasks
        </h2>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full lg:hidden"
          onClick={onMobileClose}
          aria-label="Close notes"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-3">
        <GlobalInboxPanel layout="stacked" className="flex min-h-0 flex-1 flex-col gap-0" />
      </div>
    </aside>
  );
}
