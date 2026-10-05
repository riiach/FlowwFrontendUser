import type { TaskStatus } from "@/lib/types/task";
export function taskStep(status: TaskStatus): number {
  return {
    DRAFT: 0,
    AWAITING_APPROVAL: 1,
    ACTIVE: 2,
    EXECUTING: 3,
    COMPLETED: 4,
    DECLINED: 1,
    FAILED: 3,
    EXPIRED: 1,
    CANCELLED: 1,
  }[status];
}
