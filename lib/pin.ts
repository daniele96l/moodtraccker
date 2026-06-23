import bcrypt from "bcryptjs";

const PIN_HASH_KEY = "moodtracker_pin_hash";

export function hasPin(): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem(PIN_HASH_KEY);
}

export async function setPin(pin: string): Promise<void> {
  const hash = await bcrypt.hash(pin, 10);
  localStorage.setItem(PIN_HASH_KEY, hash);
}

export async function verifyPin(pin: string): Promise<boolean> {
  const hash = localStorage.getItem(PIN_HASH_KEY);
  if (!hash) return false;
  return bcrypt.compare(pin, hash);
}

export function clearPin(): void {
  localStorage.removeItem(PIN_HASH_KEY);
}
