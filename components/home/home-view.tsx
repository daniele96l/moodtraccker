"use client";

import { useState } from "react";
import { InfiniteCalendar } from "@/components/calendar/infinite-calendar";
import { DaySheet } from "@/components/day/day-sheet";
import { DesktopInboxSidebar } from "@/components/layout/desktop-inbox-sidebar";
import { DesktopScheduleSidebar } from "@/components/layout/desktop-schedule-sidebar";
import type { DayTab } from "@/lib/types";

export function HomeView() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [initialTab, setInitialTab] = useState<DayTab>("mood");
  const [refreshKey, setRefreshKey] = useState(0);
  const [inboxOpen, setInboxOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const openDay = (dateKey: string, tab: DayTab = "mood") => {
    setSelectedDate(dateKey);
    setInitialTab(tab);
    setSheetOpen(true);
  };

  const closeMobilePanels = () => {
    setInboxOpen(false);
    setScheduleOpen(false);
  };

  const toggleInbox = () => {
    setScheduleOpen(false);
    setInboxOpen((v) => !v);
  };

  const toggleSchedule = () => {
    setInboxOpen(false);
    setScheduleOpen((v) => !v);
  };

  return (
    <div className="min-h-screen w-full lg:pl-72 lg:pr-72 xl:pl-80 xl:pr-80">
      {(inboxOpen || scheduleOpen) && (
        <button
          type="button"
          className="fixed inset-0 z-[25] bg-black/40 lg:hidden"
          onClick={closeMobilePanels}
          aria-label="Close panels"
        />
      )}

      <DesktopInboxSidebar
        mobileOpen={inboxOpen}
        onMobileClose={closeMobilePanels}
      />

      <InfiniteCalendar
        onOpenDay={openDay}
        refreshKey={refreshKey}
        inboxOpen={inboxOpen}
        scheduleOpen={scheduleOpen}
        onToggleInbox={toggleInbox}
        onToggleSchedule={toggleSchedule}
      />

      <DesktopScheduleSidebar
        refreshKey={refreshKey}
        onOpenDay={(dateKey, tab) => {
          closeMobilePanels();
          openDay(dateKey, tab);
        }}
        mobileOpen={scheduleOpen}
        onMobileClose={closeMobilePanels}
      />

      {selectedDate && (
        <DaySheet
          dateKey={selectedDate}
          open={sheetOpen}
          initialTab={initialTab}
          onOpenChange={(open) => {
            setSheetOpen(open);
            if (!open) setRefreshKey((k) => k + 1);
          }}
        />
      )}
    </div>
  );
}
