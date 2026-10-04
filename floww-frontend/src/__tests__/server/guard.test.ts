import { describe, expect, it } from "vitest";
import { BffError } from "@/lib/server/errors";
import { assertEmptyBody, assertSameOrigin, readIdempotencyKey, readJsonBody } from "@/lib/server/guard";

const URL_ = "https://app.floww.test/api/tasks";

function post(headers: Record<string, string> = {}, body?: string) {
    return new Request(URL_, { method: "POST", headers, body });
}

async function codeOf(fn: () => unknown): Promise<string | undefined> {
    try {
        await fn();
    } catch (error) {
        if (error instanceof BffError) return `${error.status} ${error.code}`;
        throw error;
    }
    return undefined;
}

describe("assertSameOrigin", () => {
    it("GET은 검사하지 않는다", () => {
        expect(() => assertSameOrigin(new Request(URL_))).not.toThrow();
    });

    it("같은 Origin만 허용", async () => {
        expect(() => assertSameOrigin(post({ origin: "https://app.floww.test" }))).not.toThrow();
        expect(await codeOf(() => assertSameOrigin(post({ origin: "https://evil.test" })))).toBe("403 ORIGIN_NOT_ALLOWED");
    });

    it("Origin이 없으면 Sec-Fetch-Site가 same-origin일 때만 허용", async () => {
        expect(() => assertSameOrigin(post({ "sec-fetch-site": "same-origin" }))).not.toThrow();
        expect(await codeOf(() => assertSameOrigin(post({ "sec-fetch-site": "cross-site" })))).toBe("403 ORIGIN_NOT_ALLOWED");
        expect(await codeOf(() => assertSameOrigin(post()))).toBe("403 ORIGIN_NOT_ALLOWED");
    });
});

describe("readJsonBody", () => {
    it("JSON을 읽고, 비어 있으면 undefined", async () => {
        expect(await readJsonBody(post({}, '{"a":1}'))).toEqual({ a: 1 });
        expect(await readJsonBody(post())).toBeUndefined();
    });

    it("8KB를 넘으면 413", async () => {
        const big = JSON.stringify({ a: "x".repeat(8 * 1024) });
        expect(await codeOf(() => readJsonBody(post({}, big)))).toBe("413 INVALID_INPUT");
        expect(await codeOf(() => readJsonBody(post({ "content-length": "9000" }, "{}")))).toBe("413 INVALID_INPUT");
    });

    it("잘못된 JSON은 400", async () => {
        expect(await codeOf(() => readJsonBody(post({}, "{oops")))).toBe("400 INVALID_INPUT");
    });

    it("assertEmptyBody는 본문이 있으면 400", async () => {
        await expect(assertEmptyBody(post())).resolves.toBeUndefined();
        expect(await codeOf(() => assertEmptyBody(post({}, "{}")))).toBe("400 INVALID_INPUT");
    });
});

describe("readIdempotencyKey", () => {
    const key = "3f8a1c2e-4b5d-4e6f-8a9b-0c1d2e3f4a5b";

    it("UUID만 허용하고 소문자로 정리", () => {
        expect(readIdempotencyKey(post({ "idempotency-key": key.toUpperCase() }))).toBe(key);
    });

    it("형식이 틀리면 400", async () => {
        expect(await codeOf(() => readIdempotencyKey(post({ "idempotency-key": "abc" })))).toBe("400 INVALID_IDEMPOTENCY_KEY");
    });

    it("없으면 required일 때만 400", async () => {
        expect(readIdempotencyKey(post())).toBeNull();
        expect(await codeOf(() => readIdempotencyKey(post(), { required: true }))).toBe("400 INVALID_IDEMPOTENCY_KEY");
    });
});
