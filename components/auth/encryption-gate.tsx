"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { useEncryption } from "@/lib/encryption-context";

export function EncryptionGate({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const {
    unlocked,
    loading,
    needsSetup,
    error,
    setupPassphrase,
    unlockPassphrase,
  } = useEncryption();
  const [passphrase, setPassphrase] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!user) return <>{children}</>;

  if (loading && needsSetup === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading encryption…</p>
      </div>
    );
  }

  if (unlocked) return <>{children}</>;

  const isSetup = needsSetup === true;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isSetup) {
        await setupPassphrase(passphrase, confirm);
      } else {
        await unlockPassphrase(passphrase);
      }
      if (!isSetup) setPassphrase("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-3xl border border-border/50 bg-card/90 p-8 shadow-lg shadow-primary/5 backdrop-blur-sm">
        <h1 className="mb-1 text-center text-xl font-medium text-foreground">
          {isSetup ? "Create privacy passphrase" : "Unlock your data"}
        </h1>
        <p className="mb-6 text-center text-sm text-muted-foreground">
          {isSetup
            ? "Your journal and habits are encrypted before they reach Firestore. Only you can read them with this passphrase."
            : "Enter your privacy passphrase to decrypt your journal and habits on this device."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="passphrase">Privacy passphrase</Label>
            <Input
              id="passphrase"
              type="password"
              autoComplete="new-password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              placeholder="At least 8 characters"
            />
          </div>

          {isSetup && (
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm passphrase</Label>
              <Input
                id="confirm"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
          )}

          {error && (
            <p className="text-center text-sm text-destructive">{error}</p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={submitting || loading}
          >
            {submitting
              ? isSetup
                ? "Setting up…"
                : "Unlocking…"
              : isSetup
                ? "Enable encryption"
                : "Unlock"}
          </Button>
        </form>

        <p className="mt-4 text-center text-[10px] text-muted-foreground/70">
          End-to-end encrypted · Firebase stores ciphertext only · Use the same
          passphrase on every device
        </p>
      </div>
    </div>
  );
}
