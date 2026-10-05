import { describe, it, expect } from "vitest";
import { randomBytes } from "node:crypto";
import { mockFetch } from "@/lib/server/mock";
import {
  memoryMockStateStore,
  encodeMockState,
  decodeMockState,
} from "@/lib/server/mock/state";
import {
  TaskViewSchema,
  QuoteListSchema,
  AttemptViewSchema,
  AiProposalResponseSchema,
  EventPageSchema,
} from "@/lib/api/schemas/task";
import { AiDraftEnvelopeSchema } from "@/lib/api/schemas/ai-draft";
import { toCreateTask } from "@/lib/domain/draft/to-create-task";
import type { UpstreamInit } from "@/lib/server/upstream";
import { createMockAccessToken } from "@/lib/server/mock/auth";
const now = new Date("2026-10-05T00:00:00Z");
const key = "9ade40e6-5d99-41a0-bf3f-03b700471a15";
const ownerToken = createMockAccessToken({
  sub: "owner-a",
  address: "0x0000000000000000000000000000000000000001",
  exp: Date.parse("2026-10-08T00:00:00Z") / 1000,
});
const otherToken = createMockAccessToken({
  sub: "owner-b",
  address: "0x0000000000000000000000000000000000000002",
  exp: Date.parse("2026-10-08T00:00:00Z") / 1000,
});
const input = {
  goal: "타이레놀 구매",
  itemId: "acetaminophen-500mg-10",
  maxAmountBaseUnits: "60000000",
  expiresAt: "2026-10-06T00:00:00Z",
};
function setup() {
  const store = memoryMockStateStore();
  const fetch = (path: string, init: UpstreamInit = {}, clock = now) =>
    mockFetch(
      path,
      { accessToken: ownerToken, ...init },
      { store, now: clock },
    );
  return { store, fetch };
}
describe("mock task lifecycle", () => {
  it("creates idempotently, rejects changed bodies, isolates owners and returns validated views", async () => {
    const { fetch } = setup();
    const first = await fetch("/api/v1/tasks", {
      method: "POST",
      body: input,
      idempotencyKey: key,
    });
    expect(first.status).toBe(201);
    const task = TaskViewSchema.parse(first.data);
    const replay = await fetch("/api/v1/tasks", {
      method: "POST",
      body: input,
      idempotencyKey: key,
    });
    expect(replay.status).toBe(200);
    expect(replay.data).toEqual(first.data);
    expect(
      (
        await fetch("/api/v1/tasks", {
          method: "POST",
          body: { ...input, goal: "changed" },
          idempotencyKey: key,
        })
      ).status,
    ).toBe(409);
    expect(
      (await fetch("/api/v1/tasks", { method: "POST", body: input })).status,
    ).toBe(400);
    expect(
      (await fetch(`/api/v1/tasks/${task.taskId}`, { accessToken: otherToken }))
        .status,
    ).toBe(404);
    expect(
      (await fetch("/api/v1/tasks", { accessToken: undefined })).status,
    ).toBe(401);
  });
  it("returns A/B/C amounts and policies; AI reuses its cheapest allowed attempt; events advance", async () => {
    const { fetch, store } = setup();
    const task = TaskViewSchema.parse(
      (
        await fetch("/api/v1/tasks", {
          method: "POST",
          body: input,
          idempotencyKey: key,
        })
      ).data,
    );
    const base = `/api/v1/tasks/${task.taskId}`;
    const q = QuoteListSchema.parse(
      (await fetch(base + "/quotes", { method: "POST" })).data,
    );
    expect(q.quotes.map((q) => q.totalAmountBaseUnits)).toEqual([
      "23500000",
      "64000000",
      "19000000",
    ]);
    const decisions = [];
    for (const quote of q.quotes)
      decisions.push(
        AttemptViewSchema.parse(
          (
            await fetch(base + "/attempts", {
              method: "POST",
              body: { quoteId: quote.quoteId, proposedBy: "USER" },
            })
          ).data,
        ).policy,
      );
    expect(decisions.map((p) => [p.decision, p.reasonCode])).toEqual([
      ["ALLOW", null],
      ["DENY", "BUDGET_EXCEEDED"],
      ["DENY", "RECIPIENT_NOT_ALLOWED"],
    ]);
    const ai = AiProposalResponseSchema.parse(
      (await fetch(base + "/ai-proposal", { method: "POST" })).data,
    );
    expect(ai.attempt?.quoteId).toBe(q.quotes[0].quoteId);
    const replay = AiProposalResponseSchema.parse(
      (await fetch(base + "/ai-proposal", { method: "POST" })).data,
    );
    expect(replay.reusedAttempt).toBe(true);
    expect(replay.attempt?.attemptId).toBe(ai.attempt?.attemptId);
    let cursor = 0;
    const kinds: string[] = [];
    let hasMore = true;
    while (hasMore) {
      const page = EventPageSchema.parse(
        (await fetch(base + `/events?after=${cursor}&limit=2`)).data,
      );
      expect(page.nextCursor).toBeGreaterThan(cursor);
      cursor = page.nextCursor;
      kinds.push(...page.events.map((e) => e.kind));
      hasMore = page.hasMore;
    }
    expect(kinds).toEqual([
      "MANDATE_DRAFTED",
      "TASK_STATUS_CHANGED",
      "QUOTES_COLLECTED",
      "POLICY_DECIDED",
      "POLICY_DECIDED",
      "POLICY_DECIDED",
      "POLICY_DECIDED",
      "AI_PROPOSAL_RESULT",
      "AI_PROPOSAL_RESULT",
    ]);
    const empty = EventPageSchema.parse(
      (await fetch(base + `/events?after=${cursor}`)).data,
    );
    expect(empty.events).toEqual([]);
    expect(empty.nextCursor).toBe(cursor);
    // Full flow must survive the actual 4KB visitor-cookie storage.
    const secret = randomBytes(32);
    expect(
      decodeMockState(encodeMockState(store.state, secret, now), secret),
    ).toEqual(store.state);
  });
  it("persists expiration from GET and validates numeric cursors", async () => {
    const { fetch } = setup();
    const task = TaskViewSchema.parse(
      (
        await fetch("/api/v1/tasks", {
          method: "POST",
          body: input,
          idempotencyKey: key,
        })
      ).data,
    );
    const base = `/api/v1/tasks/${task.taskId}`;
    for (const query of [
      "after=-1",
      "after=1.5",
      "after=abc",
      "limit=0",
      "limit=51",
      "after=9007199254740992",
    ]) {
      expect((await fetch(base + "/events?" + query)).status).toBe(400);
    }
    const expired = TaskViewSchema.parse(
      (await fetch(base, {}, new Date(input.expiresAt))).data,
    );
    expect(expired.status).toBe("EXPIRED");
    const again = TaskViewSchema.parse((await fetch(base)).data);
    expect(again.status).toBe("EXPIRED");
    expect((await fetch(base + "/quotes", { method: "POST" })).status).toBe(
      409,
    );
  });
  it("does not end a task on the first denial; ends after five denied attempts", async () => {
    const { fetch } = setup();
    const task = TaskViewSchema.parse(
      (
        await fetch("/api/v1/tasks", {
          method: "POST",
          body: input,
          idempotencyKey: key,
        })
      ).data,
    );
    const base = `/api/v1/tasks/${task.taskId}`;
    const quotes = QuoteListSchema.parse(
      (await fetch(base + "/quotes", { method: "POST" })).data,
    );
    for (let i = 0; i < 5; i++) {
      await fetch(base + "/attempts", {
        method: "POST",
        body: { quoteId: quotes.quotes[1].quoteId, proposedBy: "USER" },
      });
      const view = TaskViewSchema.parse((await fetch(base)).data);
      expect(view.status).toBe(i === 4 ? "DECLINED" : "AWAITING_APPROVAL");
    }
  });
});
describe("mock draft", () => {
  it("maps a complete request and keeps the conversation out of state", async () => {
    const { fetch, store } = setup();
    const response = await fetch("/api/ai/drafts", {
      method: "POST",
      body: {
        conversation: [
          {
            role: "user",
            content:
              "타이레놀을 등록 약국에서 배송 완료해주세요. 배송비와 수수료 포함 60 fUSDC, 2026-10-06T09:00:00.000Z까지",
          },
        ],
      },
    });
    const envelope = AiDraftEnvelopeSchema.parse(response.data);
    expect(toCreateTask(envelope, now).ok).toBe(true);
    expect(store.state.tasks).toEqual([]);
  });
  it("asks for an absolute deadline and does not accept unresolved fees", async () => {
    const { fetch } = setup();
    const response = await fetch("/api/ai/drafts", {
      method: "POST",
      body: {
        conversation: [
          { role: "user", content: "타이레놀 60 fUSDC 내일 배송 완료" },
        ],
      },
    });
    const envelope = AiDraftEnvelopeSchema.parse(response.data);
    expect(envelope.status).toBe("NEEDS_CLARIFICATION");
    expect(envelope.issues.map((i) => i.code)).toContain(
      "DEADLINE_ABSOLUTE_REQUIRED",
    );
    expect(envelope.issues.map((i) => i.code)).toContain(
      "COST_FEES_UNRESOLVED",
    );
  });
});
