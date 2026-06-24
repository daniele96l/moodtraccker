"use client";

const ENC_VERSION = "v1";
const PBKDF2_ITERATIONS = 310_000;

let activeKey: CryptoKey | null = null;

export function setActiveEncryptionKey(key: CryptoKey | null) {
  activeKey = key;
}

export function isEncryptionUnlocked(): boolean {
  return activeKey !== null;
}

export function generateSaltB64(): string {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return bytesToB64(salt);
}

export async function deriveAccountEncryptionKey(
  uid: string,
  saltB64: string
): Promise<CryptoKey> {
  return deriveEncryptionKey(uid, saltB64);
}

export async function deriveEncryptionKey(
  passphrase: string,
  saltB64: string
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  const salt = b64ToBytes(saltB64);

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

const SESSION_KEY_PREFIX = "moodtracker-session-key-";

export async function saveSessionKey(uid: string, key: CryptoKey) {
  const jwk = await crypto.subtle.exportKey("jwk", key);
  sessionStorage.setItem(`${SESSION_KEY_PREFIX}${uid}`, JSON.stringify(jwk));
}

export async function loadSessionKey(uid: string): Promise<CryptoKey | null> {
  const raw = sessionStorage.getItem(`${SESSION_KEY_PREFIX}${uid}`);
  if (!raw) return null;
  try {
    const jwk = JSON.parse(raw);
    return crypto.subtle.importKey(
      "jwk",
      jwk,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  } catch {
    return null;
  }
}

export function clearSessionKey(uid: string) {
  sessionStorage.removeItem(`${SESSION_KEY_PREFIX}${uid}`);
}

export function isEncryptedDoc(data: {
  _enc?: string;
  ct?: string;
  iv?: string;
}): boolean {
  return data._enc === ENC_VERSION && !!data.ct && !!data.iv;
}

export async function encryptPayload(
  payload: unknown
): Promise<{ _enc: string; iv: string; ct: string }> {
  if (!activeKey) throw new Error("Encryption not unlocked");

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(JSON.stringify(payload));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    activeKey,
    encoded
  );

  return {
    _enc: ENC_VERSION,
    iv: bytesToB64(iv),
    ct: bytesToB64(new Uint8Array(ciphertext)),
  };
}

export async function decryptPayload<T>(data: {
  _enc?: string;
  iv?: string;
  ct?: string;
}): Promise<T> {
  const result = await tryDecryptPayload<T>(data);
  if (result === null) {
    throw new Error("Decryption failed");
  }
  return result;
}

export async function tryDecryptPayload<T>(data: {
  _enc?: string;
  iv?: string;
  ct?: string;
}): Promise<T | null> {
  if (!activeKey) throw new Error("Encryption not unlocked");
  if (!isEncryptedDoc(data)) {
    return null;
  }

  try {
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: b64ToBytes(data.iv!) as BufferSource },
      activeKey,
      b64ToBytes(data.ct!) as BufferSource
    );
    return JSON.parse(new TextDecoder().decode(plaintext)) as T;
  } catch {
    return null;
  }
}

function bytesToB64(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
}

function b64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
