"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { MigrateBanner } from "@/components/auth/migrate-banner";
import { useAuth } from "@/lib/auth-context";
import { useEncryption } from "@/lib/encryption-context";
import { getMigrationStatus, isStoreReady } from "@/lib/firestore-store";
import { loadRaw } from "@/lib/local-store";

const OAUTH_SETUP_URL =
  "https://console.cloud.google.com/auth/overview?project=progetto3-7e3ca";
const STORAGE_KEY = "moodtracker_data";

function formatSignInError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (
    message.includes("restricted_client") ||
    message.includes("not yet configured")
  ) {
    return "oauth_setup";
  }
  return message || "Sign-in failed";
}

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
      setError(formatSignInError(e));
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
            Sign in with Google. Your journal and habits are encrypted and tied
            to your account.
          </p>

          {error === "oauth_setup" ? (
            <div className="mb-4 space-y-2 rounded-2xl border border-amber-200/80 bg-amber-50/80 p-3 text-left text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
              <p className="font-medium">Google OAuth is not configured yet.</p>
              <p className="text-xs opacity-90">
                One-time setup in Google Cloud (about 2 minutes):
              </p>
              <ol className="list-decimal space-y-1 pl-4 text-xs opacity-90">
                <li>Open the OAuth consent screen link below</li>
                <li>Set app name + support email, choose External</li>
                <li>Add <strong>daniele96ligato@gmail.com</strong> as a test user</li>
                <li>Save, then try sign-in again</li>
              </ol>
              <a
                href={OAUTH_SETUP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-xs font-medium underline"
              >
                Configure OAuth consent screen
              </a>
            </div>
          ) : (
            error && (
              <p className="mb-4 text-center text-sm text-destructive">{error}</p>
            )
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
          <p className="mt-2 text-center text-[10px] text-muted-foreground/50">
            First time?{" "}
            <a
              href={OAUTH_SETUP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Set up Google OAuth
            </a>
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
