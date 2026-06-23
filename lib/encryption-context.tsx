"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useAuth } from "@/lib/auth-context";
import { getFirebaseDb } from "@/lib/firebase";
import {
  deriveEncryptionKey,
  decryptPayload,
  encryptPayload,
  generateSaltB64,
  setActiveEncryptionKey,
} from "@/lib/encryption";
import { setStoreUser } from "@/lib/firestore-store";

interface EncryptionContextValue {
  unlocked: boolean;
  loading: boolean;
  needsSetup: boolean | null;
  error: string | null;
  setupPassphrase: (passphrase: string, confirm: string) => Promise<void>;
  unlockPassphrase: (passphrase: string) => Promise<void>;
  lock: () => void;
}

const EncryptionContext = createContext<EncryptionContextValue | null>(null);

export function EncryptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [unlocked, setUnlocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saltB64, setSaltB64] = useState<string | null>(null);

  const reset = useCallback(() => {
    setUnlocked(false);
    setNeedsSetup(null);
    setSaltB64(null);
    setError(null);
    setActiveEncryptionKey(null);
    setStoreUser(null);
  }, []);

  useEffect(() => {
    if (!user) {
      reset();
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      const snap = await getDoc(
        doc(getFirebaseDb(), "users", user.uid, "meta", "encryption")
      );
      if (cancelled) return;
      if (snap.exists() && snap.data()?.salt) {
        setSaltB64(snap.data()!.salt as string);
        setNeedsSetup(false);
      } else {
        setNeedsSetup(true);
      }
      setLoading(false);
    })().catch(() => {
      if (!cancelled) {
        setError("Could not load encryption settings.");
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [user, reset]);

  const setupPassphrase = useCallback(
    async (passphrase: string, confirm: string) => {
      if (!user) return;
      if (passphrase.length < 8) {
        setError("Passphrase must be at least 8 characters.");
        return;
      }
      if (passphrase !== confirm) {
        setError("Passphrases do not match.");
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const salt = generateSaltB64();
        const key = await deriveEncryptionKey(passphrase, salt);
        setActiveEncryptionKey(key);
        const probe = await encryptPayload({ ok: true });
        await setDoc(doc(getFirebaseDb(), "users", user.uid, "meta", "encryption"), {
          salt,
          version: 1,
          created_at: new Date().toISOString(),
          probe,
        });
        setSaltB64(salt);
        setStoreUser(user.uid);
        setUnlocked(true);
        setNeedsSetup(false);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Setup failed");
        setActiveEncryptionKey(null);
        setStoreUser(null);
        setUnlocked(false);
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  const unlockPassphrase = useCallback(
    async (passphrase: string) => {
      if (!user || !saltB64) return;
      setLoading(true);
      setError(null);
      try {
        const key = await deriveEncryptionKey(passphrase, saltB64);
        setActiveEncryptionKey(key);
        const snap = await getDoc(
          doc(getFirebaseDb(), "users", user.uid, "meta", "encryption")
        );
        const probe = snap.data()?.probe;
        if (probe) {
          await decryptPayload<{ ok: boolean }>(probe);
        }
        setStoreUser(user.uid);
        setUnlocked(true);
        setError(null);
      } catch {
        setError("Wrong passphrase. Your data stays locked.");
        setActiveEncryptionKey(null);
        setStoreUser(null);
        setUnlocked(false);
      } finally {
        setLoading(false);
      }
    },
    [user, saltB64]
  );

  const lock = useCallback(() => {
    setActiveEncryptionKey(null);
    setStoreUser(null);
    setUnlocked(false);
  }, []);

  const value = useMemo(
    () => ({
      unlocked,
      loading,
      needsSetup,
      error,
      setupPassphrase,
      unlockPassphrase,
      lock,
    }),
    [
      unlocked,
      loading,
      needsSetup,
      error,
      setupPassphrase,
      unlockPassphrase,
      lock,
    ]
  );

  return (
    <EncryptionContext.Provider value={value}>
      {children}
    </EncryptionContext.Provider>
  );
}

export function useEncryption() {
  const ctx = useContext(EncryptionContext);
  if (!ctx) {
    throw new Error("useEncryption must be used within EncryptionProvider");
  }
  return ctx;
}
