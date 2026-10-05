import type { TaskStatus } from "@/lib/types/task";
export function isTerminalStatus(status: TaskStatus): boolean {
  return ["COMPLETED", "DECLINED", "FAILED", "EXPIRED", "CANCELLED"].includes(
    status,
  );
}
