"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { clearPin, hasPin, setPin, verifyPin } from "@/lib/pin";
import { clearStore } from "@/lib/local-store";

type Mode = "loading" | "setup" | "unlock" | "unlocked";

export function PinGate({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>("loading");
  const [pin, setPinValue] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setMode(hasPin() ? "unlock" : "setup");
  }, []);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (pin.length < 4) {
      setError("PIN must be at least 4 digits.");
      return;
    }
    if (pin !== confirmPin) {
      setError("PINs do not match.");
      return;
    }
    setSubmitting(true);
    await setPin(pin);
    setPinValue("");
    setConfirmPin("");
    setMode("unlocked");
    setSubmitting(false);
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const ok = await verifyPin(pin);
    if (!ok) {
      setError("Incorrect PIN.");
      setSubmitting(false);
      return;
    }
    setPinValue("");
    setMode("unlocked");
    setSubmitting(false);
  };

  const handleForgotPin = useCallback(() => {
    clearPin();
    clearStore();
    window.location.reload();
  }, []);

  if (mode === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf8ff]">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (mode === "unlocked") {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#faf8ff] p-6">
      <div className="w-full max-w-sm rounded-2xl bg-white/80 p-8 shadow-sm">
        <h1 className="mb-1 text-center text-xl font-medium text-foreground">
          Mood Tracker
        </h1>
        <p className="mb-6 text-center text-sm text-muted-foreground">
          {mode === "setup"
            ? "Set a PIN to protect your journal."
            : "Enter your PIN to continue."}
        </p>

        <form
          onSubmit={mode === "setup" ? handleSetup : handleUnlock}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="pin">PIN</Label>
            <Input
              id="pin"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              value={pin}
              onChange={(e) => setPinValue(e.target.value)}
              placeholder="••••"
              className="text-center tracking-widest"
            />
          </div>

          {mode === "setup" && (
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm PIN</Label>
              <Input
                id="confirm"
                type="password"
                inputMode="numeric"
                autoComplete="off"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                placeholder="••••"
                className="text-center tracking-widest"
              />
            </div>
          )}

          {error && (
            <p className="text-center text-sm text-destructive">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={submitting}>
            {mode === "setup" ? "Set PIN" : "Unlock"}
          </Button>
        </form>

        {mode === "unlock" && (
          <button
            type="button"
            onClick={handleForgotPin}
            className="mt-4 w-full text-center text-xs text-muted-foreground hover:text-foreground"
          >
            Forgot PIN? Reset app (clears all local data)
          </button>
        )}

        <p className="mt-4 text-center text-[10px] text-muted-foreground/60">
          Data stored locally on this device
        </p>
      </div>
    </div>
  );
}
