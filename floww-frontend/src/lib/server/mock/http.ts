import "server-only";

import type { ServerErrorResponse } from "@/lib/types";
import type { UpstreamResponse } from "../upstream";
import type { MockState } from "./state";

export type MockMethod = "GET" | "POST";

export interface MockContext {
    method: MockMethod;
    path: string;
    params: Record<string, string>;
    query: URLSearchParams;
    body: unknown;
    accessToken?: string;
    idempotencyKey?: string;
    state: MockState;
    now: Date;
}

export type MockHandler = (context: MockContext) => UpstreamResponse | Promise<UpstreamResponse>;

export interface MockRoute {
    method: MockMethod;
    pattern: string;
    handler: MockHandler;
}

export function route(method: MockMethod, pattern: string, handler: MockHandler): MockRoute {
    return { method, pattern, handler };
}

/** "/api/v1/tasks/:taskId" 형식의 패턴과 경로를 비교해 파라미터를 꺼낸다 */
export function matchPattern(pattern: string, path: string): Record<string, string> | null {
    const expected = pattern.split("/");
    const actual = path.split("/");
    if (expected.length !== actual.length) return null;

    const params: Record<string, string> = {};
    for (let i = 0; i < expected.length; i++) {
        const segment = expected[i];
        if (segment.startsWith(":")) {
            if (!actual[i]) return null;
            params[segment.slice(1)] = decodeURIComponent(actual[i]);
        } else if (segment !== actual[i]) {
            return null;
        }
    }
    return params;
}

/** 서버 ErrorResponse와 같은 모양의 에러 응답 */
export function mockError(
    status: number,
    code: string,
    ko: string,
    en: string,
    options: { taskId?: string | null; retryable?: boolean } = {},
): UpstreamResponse {
    const data: ServerErrorResponse = {
        reasonCode: code,
        code,
        message: { ko, en },
        taskId: options.taskId ?? null,
        attemptId: null,
        retryable: options.retryable ?? false,
    };
    return { status, data };
}

export function ok(data: unknown, status = 200): UpstreamResponse {
    return { status, data };
}
