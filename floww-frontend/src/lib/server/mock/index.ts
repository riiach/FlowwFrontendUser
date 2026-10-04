import "server-only";

import type { UpstreamInit, UpstreamResponse } from "../upstream";
import { matchPattern, mockError, type MockRoute } from "./http";
import { cookieMockStateStore, type MockStateStore } from "./state";

/** 기능 이슈마다 서버와 같은 경로로 핸들러를 추가한다 */
export const MOCK_ROUTES: MockRoute[] = [];

export interface MockFetchOptions {
    store?: MockStateStore;
    routes?: readonly MockRoute[];
    now?: Date;
}

export async function mockFetch(
    path: string,
    init: UpstreamInit = {},
    options: MockFetchOptions = {},
): Promise<UpstreamResponse> {
    const { store = cookieMockStateStore, routes = MOCK_ROUTES, now = new Date() } = options;
    const method = init.method ?? "GET";
    const url = new URL(path, "http://mock.local");

    const matches = routes
        .map((candidate) => ({ candidate, params: matchPattern(candidate.pattern, url.pathname) }))
        .filter((match) => match.params !== null);

    if (matches.length === 0) {
        return mockError(404, "ROUTE_NOT_FOUND", "존재하지 않는 경로입니다", "Route not found");
    }
    const match = matches.find(({ candidate }) => candidate.method === method);
    if (!match) {
        return mockError(405, "METHOD_NOT_ALLOWED", "허용되지 않는 메서드입니다", "Method not allowed");
    }

    const state = await store.read();
    const response = await match.candidate.handler({
        method,
        path: url.pathname,
        params: match.params ?? {},
        query: url.searchParams,
        body: init.body,
        accessToken: init.accessToken,
        idempotencyKey: init.idempotencyKey,
        state,
        now,
    });
    if (method !== "GET") await store.write(state);
    return response;
}
