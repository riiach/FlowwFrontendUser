import "server-only";
import { BffError } from "./errors";
export function integerParam(
  value: string | null,
  fallback: number,
  min: number,
  max: number,
): number {
  if (value === null) return fallback;
  if (!/^(0|[1-9]\d*)$/.test(value)) throw new BffError("INVALID_INPUT", 400);
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < min || number > max)
    throw new BffError("INVALID_INPUT", 400);
  return number;
}
export function assertTaskDeadline(expiresAt: string, now = new Date()): void {
  const expires = Date.parse(expiresAt);
  if (
    !Number.isFinite(expires) ||
    expires <= now.getTime() ||
    expires > now.getTime() + 30 * 86400000
  )
    throw new BffError("INVALID_INPUT", 400);
}
