"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import { useAuth } from "@/lib/auth-context";
import { getFirebaseDb } from "@/lib/firebase";
import {
  clearSessionKey,
  decryptPayload,
  deriveAccountEncryptionKey,
  encryptPayload,
  generateSaltB64,
  loadSessionKey,
  saveSessionKey,
  setActiveEncryptionKey,
} from "@/lib/encryption";
import { setStoreUser } from "@/lib/firestore-store";

interface EncryptionContextValue {
  unlocked: boolean;
  loading: boolean;
  error: string | null;
  lock: () => void;
}

const EncryptionContext = createContext<EncryptionContextValue | null>(null);

async function verifyProbe(probe: unknown) {
  if (probe) {
    await decryptPayload<{ ok: boolean }>(
      probe as { _enc?: string; iv?: string; ct?: string }
    );
  }
}

async function unlockWithKey(user: User, key: CryptoKey) {
  setActiveEncryptionKey(key);
  await saveSessionKey(user.uid, key);
  setStoreUser(user.uid);
}

async function tryUnlockWithKey(
  user: User,
  key: CryptoKey,
  probe: unknown
): Promise<boolean> {
  setActiveEncryptionKey(key);
  try {
    await verifyProbe(probe);
    await unlockWithKey(user, key);
    return true;
  } catch {
    setActiveEncryptionKey(null);
    setStoreUser(null);
    return false;
  }
}

export function EncryptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [unlocked, setUnlocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastUidRef = useRef<string | null>(null);

  const reset = useCallback(() => {
    if (lastUidRef.current) clearSessionKey(lastUidRef.current);
    setUnlocked(false);
    setError(null);
    setActiveEncryptionKey(null);
    setStoreUser(null);
  }, []);

  useEffect(() => {
    if (user) {
      lastUidRef.current = user.uid;
      return;
    }
    reset();
  }, [user, reset]);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      setUnlocked(false);
      setActiveEncryptionKey(null);
      setStoreUser(null);

      try {
        const encRef = doc(
          getFirebaseDb(),
          "users",
          user.uid,
          "meta",
          "encryption"
        );
        const snap = await getDoc(encRef);
        if (cancelled) return;

        const data = snap.exists() ? snap.data() : null;
        const salt = data?.salt as string | undefined;
        const probe = data?.probe;
        const accountBound = !!data?.accountBound;

        const sessionKey = await loadSessionKey(user.uid);

        if (sessionKey && (await tryUnlockWithKey(user, sessionKey, probe))) {
          if (!cancelled) {
            setUnlocked(true);
            setLoading(false);
          }
          return;
        }

        if (salt && !accountBound && sessionKey) {
          await unlockWithKey(user, sessionKey);
          if (!cancelled) {
            setUnlocked(true);
            setLoading(false);
          }
          return;
        }

        if (sessionKey) clearSessionKey(user.uid);

        if (salt) {
          const accountKey = await deriveAccountEncryptionKey(user.uid, salt);
          if (await tryUnlockWithKey(user, accountKey, probe)) {
            if (!cancelled) {
              setUnlocked(true);
              setLoading(false);
            }
            return;
          }
        }

        if (!salt) {
          const newSalt = generateSaltB64();
          const newKey = await deriveAccountEncryptionKey(user.uid, newSalt);
          setActiveEncryptionKey(newKey);
          const newProbe = await encryptPayload({ ok: true });
          await setDoc(encRef, {
            salt: newSalt,
            version: 2,
            accountBound: true,
            created_at: new Date().toISOString(),
            probe: newProbe,
          });
          await unlockWithKey(user, newKey);
          if (!cancelled) {
            setUnlocked(true);
            setLoading(false);
          }
          return;
        }

        if (!cancelled) {
          setError(
            "Could not unlock your data. Sign in on a device where you were already signed in, or contact support."
          );
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError("Could not set up encryption for your account.");
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const lock = useCallback(() => {
    if (lastUidRef.current) clearSessionKey(lastUidRef.current);
    setActiveEncryptionKey(null);
    setStoreUser(null);
    setUnlocked(false);
  }, []);

  const value = useMemo(
    () => ({
      unlocked,
      loading,
      error,
      lock,
    }),
    [unlocked, loading, error, lock]
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
