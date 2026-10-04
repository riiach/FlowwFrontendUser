import "server-only";
import { randomUUID } from "node:crypto";
import type {
  TaskView,
  QuoteView,
  EventView,
  AttemptView,
  AiProposalResponse,
} from "@/lib/types/task";
import {
  CreateTaskRequestSchema,
  AttemptCreateRequestSchema,
} from "@/lib/api/schemas/task";
import { assertTaskDeadline, integerParam } from "../task-input";
import type { MockContext } from "./http";
import type { MockTask } from "./state";
import { route, ok, mockError } from "./http";
import { buildQuotes, MOCK_ASSET, MERCHANTS } from "./catalog";
import { evaluatePolicy } from "./policy";
import { appendEvent, eventPage } from "./events";
import { isTerminalStatus } from "@/lib/domain/task/status";
import { readMockAccessToken } from "./auth";

export interface StoredTask extends MockTask {
  ownerId: string;
  idempotencyKey: string;
  requestFingerprint: string;
  view: TaskView;
  quotes: QuoteView[];
  events: EventView[];
}
function error(code: string, status = 400) {
  return mockError(status, code, code, code);
}
function findTask(c: MockContext): StoredTask | undefined {
  const owner = readMockAccessToken(c.accessToken, c.now);
  return c.state.tasks.find(
    (t) => t.taskId === c.params.taskId && t.ownerId === owner?.sub,
  ) as StoredTask | undefined;
}
function expire(t: StoredTask, now: Date) {
  if (
    !isTerminalStatus(t.view.status) &&
    Date.parse(t.view.mandate.expiresAt) <= now.getTime()
  ) {
    t.view.status = "EXPIRED";
    t.view.statusReasonCode = "MANDATE_EXPIRED";
    t.view.mandate.status = "EXPIRED";
    t.view.updatedAt = now.toISOString();
    appendEvent(
      t.view,
      t.events,
      "TASK_STATUS_CHANGED",
      now,
      "server",
      "MANDATE_EXPIRED",
    );
  }
}
function quotes(t: StoredTask, now: Date) {
  if (!t.quotes.some((q) => Date.parse(q.expiresAt) > now.getTime())) {
    t.quotes = buildQuotes(t.taskId, t.view.mandate.itemId, now);
    appendEvent(t.view, t.events, "QUOTES_COLLECTED", now);
  }
  return {
    taskId: t.taskId,
    mandateVersion: t.view.mandate.version,
    quotes: t.quotes,
  };
}
function attempt(
  t: StoredTask,
  quoteId: string,
  proposedBy: "USER" | "AI",
  now: Date,
): AttemptView {
  const q = t.quotes.find((q) => q.quoteId === quoteId);
  const policy = evaluatePolicy(t.view.mandate, q, now);
  const a: AttemptView = {
    attemptId: randomUUID(),
    mandateId: t.view.mandate.mandateId,
    mandateVersion: t.view.mandate.version,
    quoteId,
    merchantId: q?.merchantId ?? null,
    proposedBy,
    status: policy.decision === "ALLOW" ? "POLICY_ALLOWED" : "BLOCKED",
    amountBaseUnits: q?.totalAmountBaseUnits ?? null,
    recipientAddress: q?.recipientAddress ?? null,
    policy,
    approval: null,
    order: null,
    payment: { status: "NOT_ATTEMPTED", txHash: null },
    createdAt: now.toISOString(),
  };
  t.view.attempts.push(a);
  t.view.updatedAt = now.toISOString();
  appendEvent(
    t.view,
    t.events,
    "POLICY_DECIDED",
    now,
    "server",
    policy.reasonCode,
    a.attemptId,
  );
  const live = t.quotes.filter((q) => Date.parse(q.expiresAt) > now.getTime());
  if (
    policy.decision === "DENY" &&
    (t.view.attempts.length >= 5 ||
      (live.length > 0 &&
        live.every((q) =>
          t.view.attempts.some(
            (a) => a.quoteId === q.quoteId && a.policy.decision === "DENY",
          ),
        )))
  ) {
    t.view.status = "DECLINED";
    t.view.statusReasonCode = "NO_VALID_CANDIDATE";
    t.view.mandate.status = "REVOKED";
    appendEvent(
      t.view,
      t.events,
      "TASK_STATUS_CHANGED",
      now,
      "server",
      "NO_VALID_CANDIDATE",
    );
  }
  return a;
}
const guarded =
  (handler: (c: MockContext, t: StoredTask) => ReturnType<typeof ok>) =>
  (c: MockContext) => {
    if (!readMockAccessToken(c.accessToken, c.now))
      return error("UNAUTHORIZED", 401);
    const t = findTask(c);
    if (!t) return error("TASK_NOT_FOUND", 404);
    expire(t, c.now);
    return handler(c, t);
  };
export const TASK_ROUTES = [
  route("POST", "/api/v1/tasks", (c) => {
    const owner = readMockAccessToken(c.accessToken, c.now);
    if (!owner) return error("UNAUTHORIZED", 401);
    if (!c.idempotencyKey) return error("INVALID_IDEMPOTENCY_KEY");
    const result = CreateTaskRequestSchema.safeParse(c.body);
    if (!result.success) return error("INVALID_INPUT");
    const input = result.data,
      fingerprint = JSON.stringify(input);
    const prior = c.state.tasks.find(
      (t) => t.ownerId === owner.sub && t.idempotencyKey === c.idempotencyKey,
    ) as StoredTask | undefined;
    if (prior) {
      if (prior.requestFingerprint !== fingerprint)
        return error("IDEMPOTENCY_CONFLICT", 409);
      expire(prior, c.now);
      return ok(prior.view);
    }
    try {
      assertTaskDeadline(input.expiresAt, c.now);
    } catch {
      return error("INVALID_INPUT");
    }
    const taskId = randomUUID(),
      stamp = c.now.toISOString();
    const view: TaskView = {
      taskId,
      ownerId: owner.sub,
      status: "AWAITING_APPROVAL",
      statusReasonCode: null,
      goal: input.goal,
      mandate: {
        mandateId: randomUUID(),
        version: 1,
        status: "DRAFT",
        goal: input.goal,
        itemId: input.itemId,
        maxAmountBaseUnits: input.maxAmountBaseUnits,
        consumedBaseUnits: "0",
        remainingBaseUnits: input.maxAmountBaseUnits,
        budgetScope: "TASK_CUMULATIVE",
        asset: MOCK_ASSET,
        allowedRecipients: MERCHANTS.map((m) => ({
          merchantId: m.merchantId,
          recipientAddress: m.recipientAddress,
        })),
        allowedActions: ["PURCHASE"],
        expiresAt: input.expiresAt,
        confirmedAt: null,
        confirmationMethod: null,
        authorizationReference: null,
      },
      attempts: [],
      createdAt: stamp,
      updatedAt: stamp,
      completedAt: null,
    };
    const t: StoredTask = {
      taskId,
      createdAt: stamp,
      ownerId: owner.sub,
      idempotencyKey: c.idempotencyKey,
      requestFingerprint: fingerprint,
      view,
      quotes: [],
      events: [],
    };
    appendEvent(view, t.events, "MANDATE_DRAFTED", c.now, "user");
    appendEvent(view, t.events, "TASK_STATUS_CHANGED", c.now);
    c.state.tasks.push(t);
    return ok(view, 201);
  }),
  route("GET", "/api/v1/tasks", (c) => {
    const owner = readMockAccessToken(c.accessToken, c.now);
    if (!owner) return error("UNAUTHORIZED", 401);
    let limit: number;
    try {
      limit = integerParam(c.query.get("limit"), 20, 1, 50);
    } catch {
      return error("INVALID_INPUT");
    }
    const list = (
      c.state.tasks.filter((t) => t.ownerId === owner.sub) as StoredTask[]
    )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);
    list.forEach((t) => expire(t, c.now));
    return ok(list.map((t) => t.view));
  }),
  route(
    "GET",
    "/api/v1/tasks/:taskId",
    guarded((_c, t) => ok(t.view)),
  ),
  route(
    "POST",
    "/api/v1/tasks/:taskId/quotes",
    guarded((c, t) => {
      if (c.body !== undefined) return error("INVALID_INPUT");
      if (!["AWAITING_APPROVAL", "ACTIVE"].includes(t.view.status))
        return error("INVALID_STATE", 409);
      return ok(quotes(t, c.now));
    }),
  ),
  route(
    "POST",
    "/api/v1/tasks/:taskId/attempts",
    guarded((c, t) => {
      const parsed = AttemptCreateRequestSchema.safeParse(c.body);
      if (!parsed.success) return error("INVALID_INPUT");
      if (t.view.status !== "AWAITING_APPROVAL")
        return error("INVALID_STATE", 409);
      if (t.view.attempts.length >= 5)
        return error("ATTEMPT_LIMIT_REACHED", 409);
      return ok(attempt(t, parsed.data.quoteId, "USER", c.now), 201);
    }),
  ),
  route(
    "POST",
    "/api/v1/tasks/:taskId/ai-proposal",
    guarded((c, t) => {
      if (c.body !== undefined) return error("INVALID_INPUT");
      if (t.view.status !== "AWAITING_APPROVAL")
        return error("INVALID_STATE", 409);
      quotes(t, c.now);
      const allowed = t.quotes
        .filter(
          (q) => evaluatePolicy(t.view.mandate, q, c.now).decision === "ALLOW",
        )
        .sort((a, b) =>
          BigInt(a.totalAmountBaseUnits) < BigInt(b.totalAmountBaseUnits)
            ? -1
            : BigInt(a.totalAmountBaseUnits) > BigInt(b.totalAmountBaseUnits)
              ? 1
              : 0,
        );
      const selected = allowed[0];
      const previous = selected
        ? t.view.attempts.find(
            (a) =>
              a.proposedBy === "AI" &&
              a.quoteId === selected.quoteId &&
              a.status === "POLICY_ALLOWED",
          )
        : undefined;
      if (selected && !previous && t.view.attempts.length >= 5)
        return error("ATTEMPT_LIMIT_REACHED", 409);
      const a = selected
        ? (previous ?? attempt(t, selected.quoteId, "AI", c.now))
        : null;
      const response: AiProposalResponse = {
        proposal: {
          status: selected ? "PROPOSED" : "NO_CANDIDATE",
          reason: selected ? null : "NO_VALID_CANDIDATE",
          taskRef: t.taskId,
          mandateRef: t.view.mandate.mandateId,
          mandateRevision: String(t.view.mandate.version),
          proposedQuote: selected
            ? {
                quoteId: selected.quoteId,
                merchantId: selected.merchantId,
                recipient: selected.quotedPayToAddress,
                itemId: selected.itemId,
                asset: {
                  chainId: String(selected.asset.chainId),
                  tokenAddress: selected.asset.tokenAddress,
                  decimals: selected.asset.tokenDecimals,
                },
                totalBaseUnits: selected.totalAmountBaseUnits,
                expiresAt: selected.expiresAt,
                inStock: selected.inStock,
                promisedFulfillmentAt: selected.promisedFulfillmentAt,
                prescriptionRequired: false,
                identityRequired: false,
              }
            : null,
          findings: t.quotes.map((q) => ({
            quoteId: q.quoteId,
            reasons: evaluatePolicy(t.view.mandate, q, c.now).reasonCode
              ? [evaluatePolicy(t.view.mandate, q, c.now).reasonCode!]
              : [],
          })),
          provenance: null,
        },
        attempt: a,
        reusedAttempt: Boolean(previous),
      };
      appendEvent(
        t.view,
        t.events,
        "AI_PROPOSAL_RESULT",
        c.now,
        "server",
        response.proposal.reason,
        a?.attemptId ?? null,
      );
      return ok(response);
    }),
  ),
  route(
    "GET",
    "/api/v1/tasks/:taskId/events",
    guarded((c, t) => {
      try {
        return ok(
          eventPage(
            t.events,
            integerParam(c.query.get("after"), 0, 0, Number.MAX_SAFE_INTEGER),
            integerParam(c.query.get("limit"), 50, 1, 50),
          ),
        );
      } catch {
        return error("INVALID_INPUT");
      }
    }),
  ),
];
