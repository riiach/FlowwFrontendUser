import { NextRequest } from "next/server";
import { beforeEach, it, expect, vi } from "vitest";
import { POST as create } from "@/app/api/tasks/route";
import { POST as draft } from "@/app/api/chat/draft/route";
import { POST as attempt } from "@/app/api/tasks/[taskId]/attempts/route";
import { POST as proposal } from "@/app/api/tasks/[taskId]/ai-proposal/route";
import { GET as events } from "@/app/api/tasks/[taskId]/events/route";
import { upstreamFetch } from "@/lib/server/upstream";
import { sealSession } from "@/lib/server/session";
import { resetServerEnvCache } from "@/lib/server/env";
vi.mock("@/lib/server/upstream", () => ({ upstreamFetch: vi.fn() }));
const upstream = vi.mocked(upstreamFetch);
const ctx = { params: Promise.resolve({ taskId: "t1" }) };
const origin = "https://app.floww.test";
const input = {
  goal: "구매",
  itemId: "acetaminophen-500mg-10",
  maxAmountBaseUnits: "60000000",
  expiresAt: new Date(Date.now() + 86400000).toISOString(),
};
function request(
  path: string,
  body?: unknown,
  extra: Record<string, string> = {},
  method = "POST",
  authenticated = true,
) {
  const headers = new Headers({
    origin,
    "content-type": "application/json",
    ...extra,
  });
  if (authenticated)
    headers.set(
      "cookie",
      "floww_wallet_session=" +
        sealSession({
          accessToken: "jwt",
          identity: {
            namespace: "eip155",
            address: "0x0000000000000000000000000000000000000001",
          },
          chainId: 11155111,
          expiresAt: "2099-01-01T00:00:00Z",
        }),
    );
  return new NextRequest(origin + path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
beforeEach(() => {
  process.env.FLOWW_SESSION_SECRET = "c".repeat(64);
  resetServerEnvCache();
  upstream.mockReset();
});
it("requires session and Idempotency-Key before contacting upstream", async () => {
  expect(
    (await create(request("/api/tasks", input, {}, "POST", false))).status,
  ).toBe(401);
  expect((await create(request("/api/tasks", input))).status).toBe(400);
  expect(upstream).not.toHaveBeenCalled();
});
it("rejects extra keys and forwarded AI actors from browser attempts", async () => {
  for (const body of [
    { quoteId: "q", proposedBy: "AI" },
    { quoteId: "q", proposedBy: "USER", recipientAddress: "evil" },
  ]) {
    expect(
      (await attempt(request("/api/tasks/t1/attempts", body), ctx)).status,
    ).toBe(400);
  }
  expect(upstream).not.toHaveBeenCalled();
});
it("forwards exactly two attempt keys and uses the server's policy response", async () => {
  upstream.mockResolvedValue({ status: 400, data: {} });
  await attempt(
    request("/api/tasks/t1/attempts", { quoteId: "q", proposedBy: "USER" }),
    ctx,
  );
  expect(upstream).toHaveBeenCalledWith("/api/v1/tasks/t1/attempts", {
    accessToken: "jwt",
    method: "POST",
    body: { quoteId: "q", proposedBy: "USER" },
  });
});
it("requires no proposal body and forwards the 120-second timeout", async () => {
  expect(
    (await proposal(request("/api/tasks/t1/ai-proposal", {}), ctx)).status,
  ).toBe(400);
  expect(upstream).not.toHaveBeenCalled();
  upstream.mockResolvedValue({ status: 503, data: {} });
  await proposal(request("/api/tasks/t1/ai-proposal"), ctx);
  expect(upstream).toHaveBeenCalledWith("/api/v1/tasks/t1/ai-proposal", {
    method: "POST",
    accessToken: "jwt",
    timeoutMs: 120000,
  });
});
it.each(["after=-1", "after=1.5", "after=x", "limit=0", "limit=51"])(
  "rejects malformed event query %s",
  async (query) => {
    expect(
      (
        await events(
          request("/api/tasks/t1/events?" + query, undefined, {}, "GET"),
          ctx,
        )
      ).status,
    ).toBe(400);
    expect(upstream).not.toHaveBeenCalled();
  },
);
it("forwards a numeric zero cursor", async () => {
  upstream.mockResolvedValue({
    status: 200,
    data: { events: [], nextCursor: 0, hasMore: false },
  });
  const response = await events(
    request("/api/tasks/t1/events?after=0&limit=2", undefined, {}, "GET"),
    ctx,
  );
  expect(response.status).toBe(200);
  expect(upstream).toHaveBeenCalledWith(
    "/api/v1/tasks/t1/events?after=0&limit=2",
    { accessToken: "jwt" },
  );
});
it("retains provider error envelope and rejects invalid conversations without logging them", async () => {
  const spy = vi.spyOn(console, "log");
  upstream.mockResolvedValue({
    status: 503,
    data: {
      httpContractVersion: "ai-draft-http.v1",
      evidence: null,
      status: "ERROR",
      draft: null,
      issues: [],
      error: { code: "PROVIDER_NOT_CONFIGURED" },
    },
  });
  const response = await draft(
    request("/api/chat/draft", {
      conversation: [{ role: "user", content: "private conversation" }],
    }),
  );
  expect(response.status).toBe(503);
  expect((await response.json()).error.code).toBe("PROVIDER_NOT_CONFIGURED");
  expect(spy).not.toHaveBeenCalled();
  spy.mockRestore();
  upstream.mockClear();
  expect(
    (
      await draft(
        request("/api/chat/draft", {
          conversation: [{ role: "assistant", content: "last" }],
        }),
      )
    ).status,
  ).toBe(400);
  expect(upstream).not.toHaveBeenCalled();
});
it("rejects unsupported media type and overlong conversation", async () => {
  expect(
    (
      await draft(
        request("/api/chat/draft", {}, { "content-type": "text/plain" }),
      )
    ).status,
  ).toBe(415);
  expect(
    (
      await draft(
        request("/api/chat/draft", {
          conversation: [{ role: "user", content: "x".repeat(4001) }],
        }),
      )
    ).status,
  ).toBe(400);
});
it("preserves upstream authentication failure and clears the expired wallet session", async () => {
  upstream.mockResolvedValue({
    status: 401,
    data: {
      reasonCode: "UNAUTHORIZED",
      code: "UNAUTHORIZED",
      message: { ko: "인증 필요", en: "Unauthorized" },
      taskId: null,
      attemptId: null,
      retryable: false,
    },
  });
  const response = await draft(
    request("/api/chat/draft", {
      conversation: [{ role: "user", content: "구매" }],
    }),
  );
  expect(response.status).toBe(401);
  expect(response.headers.get("set-cookie")).toContain(
    "floww_wallet_session=;",
  );
});
