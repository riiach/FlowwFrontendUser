import "server-only";

import { serverEnv } from "./env";
import { httpUpstreamFetch } from "./http-upstream";
import { mockFetch } from "./mock";

export interface UpstreamInit {
    method?: "GET" | "POST";
    body?: unknown;
    accessToken?: string;
    idempotencyKey?: string;
    timeoutMs?: number;
}

export interface UpstreamResponse {
    status: number;
    data: unknown;
}

/** 라우트는 이 함수만 부른다. FLOWW_UPSTREAM에 따라 실제 서버 또는 목 서버로 보낸다 */
export function upstreamFetch(path: string, init: UpstreamInit = {}): Promise<UpstreamResponse> {
    if (!path.startsWith("/api/")) throw new Error(`Invalid upstream path: ${path}`);
    return serverEnv().upstream === "mock" ? mockFetch(path, init) : httpUpstreamFetch(path, init);
}
