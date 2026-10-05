import type { AttemptView } from "@/lib/types/task";
export function latestAttempt(attempts: AttemptView[]): AttemptView | null {
  return attempts.at(-1) ?? null;
}
export function allowedAttempts(attempts: AttemptView[]): AttemptView[] {
  return attempts.filter(
    (a) => a.policy.decision === "ALLOW" && a.status === "POLICY_ALLOWED",
  );
}
