import { describe, expect, it } from "vitest";
import { matchPattern, ok, route } from "@/lib/server/mock/http";
import { mockFetch } from "@/lib/server/mock";
import { memoryMockStateStore } from "@/lib/server/mock/state";

const routes = [
    route("GET", "/api/v1/tasks/:taskId", ({ params, query }) => ok({ taskId: params.taskId, limit: query.get("limit") })),
    route("POST", "/api/v1/tasks", ({ state, body, idempotencyKey, now }) => {
        state.tasks.push({ taskId: "t1", createdAt: now.toISOString(), body, idempotencyKey });
        return ok({ taskId: "t1" }, 201);
    }),
];

describe("matchPattern", () => {
    it("파라미터를 꺼내고 길이·고정 구간이 다르면 null", () => {
        expect(matchPattern("/api/v1/tasks/:taskId/quotes", "/api/v1/tasks/abc/quotes")).toEqual({ taskId: "abc" });
        expect(matchPattern("/api/v1/tasks/:taskId", "/api/v1/tasks/abc/quotes")).toBeNull();
        expect(matchPattern("/api/v1/tasks/:taskId", "/api/v1/tasks/")).toBeNull();
    });
});

describe("mockFetch", () => {
    it("모르는 경로는 서버와 같은 형식의 404", async () => {
        const store = memoryMockStateStore();
        expect(await mockFetch("/api/v1/unknown", {}, { store, routes })).toEqual({
            status: 404,
            data: {
                reasonCode: "ROUTE_NOT_FOUND",
                code: "ROUTE_NOT_FOUND",
                message: { ko: "존재하지 않는 경로입니다", en: "Route not found" },
                taskId: null,
                attemptId: null,
                retryable: false,
            },
        });
    });

    it("메서드가 다르면 405", async () => {
        const result = await mockFetch("/api/v1/tasks", {}, { store: memoryMockStateStore(), routes });
        expect(result.status).toBe(405);
        expect((result.data as { reasonCode: string }).reasonCode).toBe("METHOD_NOT_ALLOWED");
    });

    it("파라미터와 쿼리를 핸들러에 넘긴다", async () => {
        const result = await mockFetch("/api/v1/tasks/abc?limit=5", {}, { store: memoryMockStateStore(), routes });
        expect(result).toEqual({ status: 200, data: { taskId: "abc", limit: "5" } });
    });

    it("POST 뒤에는 상태를 저장한다", async () => {
        const store = memoryMockStateStore();
        const now = new Date("2026-10-04T00:00:00Z");
        const result = await mockFetch(
            "/api/v1/tasks",
            { method: "POST", body: { goal: "g" }, idempotencyKey: "k" },
            { store, routes, now },
        );
        expect(result.status).toBe(201);
        expect(store.state.tasks).toEqual([{ taskId: "t1", createdAt: now.toISOString(), body: { goal: "g" }, idempotencyKey: "k" }]);
    });
});
