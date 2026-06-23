"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { loadRaw, type MoodStore } from "@/lib/local-store";

const STORAGE_KEY = "moodtracker_data";

function hasLocalData(): boolean {
  if (typeof window === "undefined") return false;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return false;
  try {
    const store = JSON.parse(raw) as MoodStore;
    return (
      (store.day_entries?.length ?? 0) > 0 ||
      (store.habits?.length ?? 0) > 0 ||
      (store.habit_logs?.length ?? 0) > 0 ||
      (store.meditation_sessions?.length ?? 0) > 0
    );
  } catch {
    return false;
  }
}

interface MigrateBannerProps {
  onComplete: () => void;
}

export function MigrateBanner({ onComplete }: MigrateBannerProps) {
  const { signOut } = useAuth();
  const [busy, setBusy] = useState<"import" | "fresh" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImport = async () => {
    setBusy("import");
    setError(null);
    try {
      const { importLocalStore } = await import("@/lib/firestore-store");
      await importLocalStore(loadRaw());
      localStorage.removeItem(STORAGE_KEY);
      onComplete();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
      setBusy(null);
    }
  };

  const handleFresh = async () => {
    setBusy("fresh");
    setError(null);
    try {
      const { markMigrationComplete } = await import("@/lib/firestore-store");
      await markMigrationComplete(false);
      onComplete();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not continue");
      setBusy(null);
    }
  };

  if (!hasLocalData()) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-50 border-b border-border/50 bg-card/95 px-4 py-3 backdrop-blur-md">
      <div className="mx-auto flex max-w-lg flex-col gap-2">
        <p className="text-sm font-medium text-foreground">
          Import data from this device?
        </p>
        <p className="text-xs text-muted-foreground">
          Local mood tracker data was found. Import it to your Google account or
          start with an empty cloud profile.
        </p>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            disabled={!!busy}
            onClick={handleImport}
            className="h-8 rounded-full"
          >
            {busy === "import" ? "Importing…" : "Import local data"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={!!busy}
            onClick={handleFresh}
            className="h-8 rounded-full"
          >
            {busy === "fresh" ? "Continuing…" : "Start fresh"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={!!busy}
            onClick={() => signOut()}
            className="h-8 rounded-full"
          >
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}
