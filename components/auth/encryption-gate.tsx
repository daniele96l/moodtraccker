"use client";

import { useAuth } from "@/lib/auth-context";
import { useEncryption } from "@/lib/encryption-context";
import { Button } from "@/components/ui/button";

export function EncryptionGate({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const { unlocked, loading, error } = useEncryption();

  if (!user) return <>{children}</>;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Securing your account…</p>
      </div>
    );
  }

  if (unlocked) return <>{children}</>;

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-3xl border border-border/50 bg-card/90 p-8 text-center shadow-lg shadow-primary/5 backdrop-blur-sm">
        <p className="text-sm text-destructive">
          {error ?? "Could not unlock your data."}
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-4"
          onClick={() => void signOut()}
        >
          Sign out
        </Button>
      </div>
    </div>
  );
}
