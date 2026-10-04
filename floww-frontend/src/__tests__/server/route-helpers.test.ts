import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { SESSION_COOKIE_NAMES } from "@/lib/constants/constants";
import { resetServerEnvCache } from "@/lib/server/env";
import { proxyJson, withSession } from "@/lib/server/route-helpers";
import { sealSession, type ServerSession } from "@/lib/server/session";
import { upstreamFetch } from "@/lib/server/upstream";

vi.mock("@/lib/server/upstream", () => ({ upstreamFetch: vi.fn() }));
const mockedUpstream = vi.mocked(upstreamFetch);

const ORIGIN = "https://app.floww.test";
const session: ServerSession = {
    accessToken: "jwt",
    identity: { namespace: "eip155", address: "0x0000000000000000000000000000000000000001" },
    chainId: 11155111,
    expiresAt: "2099-01-01T00:00:00.000Z",
};

function request(method = "GET", withCookie = true, headers: Record<string, string> = {}) {
    const all = new Headers(headers);
    if (withCookie) all.set("cookie", `${SESSION_COOKIE_NAMES.session}=${sealSession(session)}`);
    return new NextRequest(`${ORIGIN}/api/tasks/t1`, { method, headers: all });
}

const handler = withSession<{ taskId: string }>(({ session: s, params }) =>
    proxyJson(s, `/api/v1/tasks/${params.taskId}`, { schema: z.object({ taskId: z.string() }).loose() }),
);
const ctx = { params: Promise.resolve({ taskId: "t1" }) };

beforeEach(() => {
    process.env.FLOWW_SESSION_SECRET = "b".repeat(64);
    resetServerEnvCache();
    mockedUpstream.mockReset();
});

describe("withSession + proxyJson", () => {
    it("세션 토큰으로 서버를 부르고 토큰류 키를 지운다", async () => {
        mockedUpstream.mockResolvedValue({ status: 200, data: { taskId: "t1", accessToken: "leak" } });
        const response = await handler(request(), ctx);
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ taskId: "t1" });
        expect(mockedUpstream).toHaveBeenCalledWith("/api/v1/tasks/t1", { accessToken: "jwt" });
    });

    it("세션이 없으면 401 SESSION_REQUIRED", async () => {
        const response = await handler(request("GET", false), ctx);
        expect(response.status).toBe(401);
        expect((await response.json()).reasonCode).toBe("SESSION_REQUIRED");
        expect(mockedUpstream).not.toHaveBeenCalled();
    });

    it("서버 401이면 서버 에러를 그대로 주고 세션 쿠키를 지운다", async () => {
        const serverError = {
            reasonCode: "UNAUTHORIZED",
            code: "UNAUTHORIZED",
            message: { ko: "인증 필요", en: "Unauthorized" },
            taskId: null,
            attemptId: null,
            retryable: false,
        };
        mockedUpstream.mockResolvedValue({ status: 401, data: serverError });
        const response = await handler(request(), ctx);
        expect(response.status).toBe(401);
        expect(await response.json()).toEqual(serverError);
        expect(response.headers.get("set-cookie")).toMatch(new RegExp(`${SESSION_COOKIE_NAMES.session}=;`));
    });

    it("형식이 다른 서버 에러는 정규화한다", async () => {
        mockedUpstream.mockResolvedValue({ status: 503, data: "<html>" });
        const response = await handler(request(), ctx);
        expect(response.status).toBe(503);
        expect((await response.json()).reasonCode).toBe("UPSTREAM_UNAVAILABLE");
    });

    it("응답이 스키마와 다르면 502 INVALID_RESPONSE", async () => {
        mockedUpstream.mockResolvedValue({ status: 200, data: { nope: true } });
        const response = await handler(request(), ctx);
        expect(response.status).toBe(502);
        expect((await response.json()).reasonCode).toBe("INVALID_RESPONSE");
    });

    it("다른 사이트의 POST는 403", async () => {
        const response = await handler(request("POST", true, { origin: "https://evil.test" }), ctx);
        expect(response.status).toBe(403);
        expect((await response.json()).reasonCode).toBe("ORIGIN_NOT_ALLOWED");
    });
});
