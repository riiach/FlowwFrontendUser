import "server-only";
import type { EventView, EventPage, TaskView } from "@/lib/types/task";
export function appendEvent(
  task: TaskView,
  events: EventView[],
  kind: string,
  now: Date,
  actor = "server",
  reasonCode: string | null = null,
  attemptId: string | null = null,
): void {
  events.push({
    seq: (events.at(-1)?.seq ?? 0) + 1,
    kind,
    state: task.status,
    reasonCode,
    attemptId,
    actor,
    payload: {},
    createdAt: now.toISOString(),
  });
}
export function eventPage(
  events: EventView[],
  after: number,
  limit: number,
): EventPage {
  const remaining = events.filter((e) => e.seq > after);
  const page = remaining.slice(0, limit);
  return {
    events: page,
    nextCursor: page.at(-1)?.seq ?? after,
    hasMore: remaining.length > limit,
  };
}
