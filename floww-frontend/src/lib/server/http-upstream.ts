import "server-only";

import { REQUEST_LIMITS } from "@/lib/constants/constants";
import { requireApiBaseUrl, serverEnv } from "./env";
import { BffError } from "./errors";
import { readLimitedText } from "./guard";
import type { UpstreamInit, UpstreamResponse } from "./upstream";

const VERCEL_BYPASS_HEADER = "x-vercel-protection-bypass";

export async function httpUpstreamFetch(path: string, init: UpstreamInit = {}): Promise<UpstreamResponse> {
    const env = serverEnv();
    const url = `${requireApiBaseUrl(env)}${path}`;
    const { method = "GET", body, accessToken, idempotencyKey, timeoutMs = REQUEST_LIMITS.timeoutMs } = init;

    const headers = new Headers({ Accept: "application/json" });
    if (body !== undefined) headers.set("Content-Type", "application/json");
    if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
    if (idempotencyKey) headers.set("Idempotency-Key", idempotencyKey);
    if (env.vercelBypassSecret) headers.set(VERCEL_BYPASS_HEADER, env.vercelBypassSecret);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let response: Response;
    try {
        response = await fetch(url, {
            method,
            headers,
            body: body === undefined ? undefined : JSON.stringify(body),
            redirect: "error",
            cache: "no-store",
            signal: controller.signal,
        });
    } catch (error) {
        clearTimeout(timer);
        if (controller.signal.aborted) throw new BffError("UPSTREAM_UNAVAILABLE", 504);
        if (isRedirectError(error)) throw new BffError("BACKEND_ACCESS_PROTECTED", 502);
        throw new BffError("UPSTREAM_UNAVAILABLE", 502);
    }

    try {
        return { status: response.status, data: await readResponseJson(response) };
    } catch (error) {
        if (error instanceof BffError) throw error;
        if (controller.signal.aborted) throw new BffError("UPSTREAM_UNAVAILABLE", 504);
        throw new BffError("INVALID_RESPONSE", 502);
    } finally {
        clearTimeout(timer);
    }
}

async function readResponseJson(response: Response): Promise<unknown> {
    const limit = REQUEST_LIMITS.responseBodyBytes;
    const declared = Number(response.headers.get("content-length"));
    if (Number.isFinite(declared) && declared > limit) {
        await response.body?.cancel().catch(() => undefined);
        throw new BffError("INVALID_RESPONSE", 502);
    }
    if (!response.body) return undefined;

    const text = await readLimitedText(response.body, limit, () => new BffError("INVALID_RESPONSE", 502));
    if (!text.trim()) return undefined;
    try {
        return JSON.parse(text) as unknown;
    } catch {
        throw new BffError("INVALID_RESPONSE", 502);
    }
}

function isRedirectError(error: unknown): boolean {
    const cause = error instanceof Error ? (error.cause as { message?: unknown } | undefined) : undefined;
    return typeof cause?.message === "string" && cause.message.toLowerCase().includes("redirect");
}
