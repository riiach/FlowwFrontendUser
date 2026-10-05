import type { CreateTaskRequest } from "@/lib/types/task";
export interface KeyStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
const volatileKeys = new Map<string, string>();
export function taskFingerprint(input: CreateTaskRequest): string {
  return JSON.stringify([
    input.goal,
    input.itemId,
    input.maxAmountBaseUnits,
    input.expiresAt,
  ]);
}
/** Only the key and input fingerprint are persisted, never conversation. Keep keys after success for safe retries. */
export function taskIdempotencyKey(
  input: CreateTaskRequest,
  storage?: KeyStorage,
  scope = "session",
): string {
  const fingerprint = taskFingerprint(input);
  const slot = "floww:task-key:" + scope + ":" + fingerprint;
  let target = storage;
  if (!target && typeof window !== "undefined") {
    try {
      target = window.sessionStorage;
    } catch {
      /* Private browsing may disable storage. */
    }
  }
  try {
    const prior = target?.getItem(slot);
    if (
      prior &&
      /^[\da-f]{8}-[\da-f]{4}-[1-8][\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i.test(
        prior,
      )
    )
      return prior;
  } catch {
    /* Use the in-memory fallback while this page remains open. */
  }
  const key = volatileKeys.get(slot) ?? globalThis.crypto.randomUUID();
  volatileKeys.set(slot, key);
  try {
    target?.setItem(slot, key);
  } catch {
    /* Same key remains available in memory. */
  }
  return key;
}
