import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { resetServerEnvCache } from "@/lib/server/env";
import { BffError } from "@/lib/server/errors";
import { httpUpstreamFetch } from "@/lib/server/http-upstream";

let server: Server;
let lastHeaders: Record<string, string | string[] | undefined> = {};
let lastBody = "";

beforeAll(async () => {
    server = createServer((req, res) => {
        lastHeaders = req.headers;
        let body = "";
        req.on("data", (chunk) => (body += chunk));
        req.on("end", () => {
            lastBody = body;
            switch (req.url) {
                case "/api/ok":
                    res.writeHead(200, { "content-type": "application/json" }).end('{"ok":true}');
                    break;
                case "/api/redirect":
                    res.writeHead(307, { location: "https://vercel.com/login" }).end();
                    break;
                case "/api/slow":
                    setTimeout(() => res.writeHead(200).end("{}"), 300);
                    break;
                case "/api/big":
                    res.writeHead(200, { "content-type": "application/json" }).end(`"${"x".repeat(4 * 1024 * 1024)}"`);
                    break;
                case "/api/not-json":
                    res.writeHead(200).end("<html>");
                    break;
                case "/api/empty":
                    res.writeHead(204).end();
                    break;
                default:
                    res.writeHead(404, { "content-type": "application/json" }).end('{"reasonCode":"NOT_FOUND"}');
            }
        });
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
});

afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

beforeEach(() => {
    const { port } = server.address() as AddressInfo;
    process.env.FLOWW_API_BASE_URL = `http://127.0.0.1:${port}`;
    process.env.FLOWW_SERVER_VERCEL_BYPASS_SECRET = "bypass-secret";
    process.env.FLOWW_UPSTREAM = "http";
    resetServerEnvCache();
});

async function codeOf(promise: Promise<unknown>): Promise<string> {
    try {
        await promise;
    } catch (error) {
        if (error instanceof BffError) return `${error.status} ${error.code}`;
        throw error;
    }
    return "no error";
}

describe("httpUpstreamFetch", () => {
    it("헤더와 본문을 붙여 JSON을 돌려준다", async () => {
        const result = await httpUpstreamFetch("/api/ok", {
            method: "POST",
            body: { a: 1 },
            accessToken: "jwt",
            idempotencyKey: "3f8a1c2e-4b5d-4e6f-8a9b-0c1d2e3f4a5b",
        });
        expect(result).toEqual({ status: 200, data: { ok: true } });
        expect(lastHeaders.authorization).toBe("Bearer jwt");
        expect(lastHeaders["idempotency-key"]).toBe("3f8a1c2e-4b5d-4e6f-8a9b-0c1d2e3f4a5b");
        expect(lastHeaders["x-vercel-protection-bypass"]).toBe("bypass-secret");
        expect(lastBody).toBe('{"a":1}');
    });

    it("에러 상태도 본문과 함께 돌려준다", async () => {
        expect(await httpUpstreamFetch("/api/missing")).toEqual({ status: 404, data: { reasonCode: "NOT_FOUND" } });
    });

    it("빈 응답은 data undefined", async () => {
        expect(await httpUpstreamFetch("/api/empty")).toEqual({ status: 204, data: undefined });
    });

    it("리다이렉트는 거부한다", async () => {
        expect(await codeOf(httpUpstreamFetch("/api/redirect"))).toBe("502 BACKEND_ACCESS_PROTECTED");
    });

    it("타임아웃이면 504", async () => {
        expect(await codeOf(httpUpstreamFetch("/api/slow", { timeoutMs: 50 }))).toBe("504 UPSTREAM_UNAVAILABLE");
    });

    it("4MB를 넘으면 중단", async () => {
        expect(await codeOf(httpUpstreamFetch("/api/big"))).toBe("502 INVALID_RESPONSE");
    });

    it("JSON이 아니면 INVALID_RESPONSE", async () => {
        expect(await codeOf(httpUpstreamFetch("/api/not-json"))).toBe("502 INVALID_RESPONSE");
    });

    it("서버에 연결할 수 없으면 502", async () => {
        process.env.FLOWW_API_BASE_URL = "http://127.0.0.1:1";
        resetServerEnvCache();
        expect(await codeOf(httpUpstreamFetch("/api/ok"))).toBe("502 UPSTREAM_UNAVAILABLE");
    });
});
