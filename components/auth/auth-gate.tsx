"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { MigrateBanner } from "@/components/auth/migrate-banner";
import { useAuth } from "@/lib/auth-context";
import { useEncryption } from "@/lib/encryption-context";
import { getMigrationStatus, isStoreReady } from "@/lib/firestore-store";
import { loadRaw } from "@/lib/local-store";

const STORAGE_KEY = "moodtracker_data";

function hasLocalDataOnDevice(): boolean {
  if (typeof window === "undefined") return false;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return false;
  try {
    const store = loadRaw();
    return (
      store.day_entries.length > 0 ||
      store.habits.length > 0 ||
      store.habit_logs.length > 0 ||
      store.meditation_sessions.length > 0
    );
  } catch {
    return false;
  }
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading, signInWithGoogle } = useAuth();
  const { unlocked } = useEncryption();
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [migrationChecked, setMigrationChecked] = useState(false);
  const [showMigration, setShowMigration] = useState(false);

  const [storeReady, setStoreReady] = useState(false);

  useEffect(() => {
    if (!user || !unlocked) {
      setMigrationChecked(false);
      setShowMigration(false);
      setStoreReady(false);
      return;
    }

    if (isStoreReady()) {
      setStoreReady(true);
      return;
    }

    const interval = window.setInterval(() => {
      if (isStoreReady()) {
        setStoreReady(true);
        window.clearInterval(interval);
      }
    }, 100);

    return () => window.clearInterval(interval);
  }, [user, unlocked]);

  useEffect(() => {
    if (!user || !unlocked || !storeReady) return;

    let cancelled = false;
    (async () => {
      try {
        const { migrated, hasCloudData } = await getMigrationStatus();
        if (cancelled) return;
        const local = hasLocalDataOnDevice();
        setShowMigration(!migrated && local && !hasCloudData);
      } catch {
        setShowMigration(false);
      } finally {
        if (!cancelled) setMigrationChecked(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, unlocked, storeReady]);

  const handleSignIn = async () => {
    setSigningIn(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed");
    } finally {
      setSigningIn(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-sm rounded-3xl border border-border/50 bg-card/90 p-8 shadow-lg shadow-primary/5 backdrop-blur-sm">
          <h1 className="mb-1 text-center text-xl font-medium text-foreground">
            Mood Tracker
          </h1>
          <p className="mb-6 text-center text-sm text-muted-foreground">
            Sign in with Google, then unlock with your private passphrase.
            Journal and habits are encrypted before they reach the cloud.
          </p>

          {error && (
            <p className="mb-4 text-center text-sm text-destructive">{error}</p>
          )}

          <Button
            type="button"
            className="w-full"
            disabled={signingIn}
            onClick={handleSignIn}
          >
            {signingIn ? "Signing in…" : "Continue with Google"}
          </Button>

          <p className="mt-4 text-center text-[10px] text-muted-foreground/60">
            End-to-end encrypted · only you can read your data
          </p>
        </div>
      </div>
    );
  }

  if (!unlocked) {
    return <>{children}</>;
  }

  if (!migrationChecked || !storeReady) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading your data…</p>
      </div>
    );
  }

  return (
    <>
      {showMigration && (
        <MigrateBanner onComplete={() => setShowMigration(false)} />
      )}
      {children}
    </>
  );
}
