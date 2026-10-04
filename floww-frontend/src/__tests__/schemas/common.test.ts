import { describe, expect, it } from "vitest";
import { z } from "zod";
import { ApiError } from "@/lib/api/client";
import {
    INVALID_RESPONSE,
    parseOrThrow,
    parseServerError,
    ServerErrorResponseSchema,
    summarizeIssues,
} from "@/lib/api/schemas";

const serverError = {
    reasonCode: "NONCE_EXPIRED",
    code: "NONCE_EXPIRED",
    message: { ko: "로그인 요청이 만료되었습니다", en: "Nonce expired" },
    taskId: null,
    attemptId: null,
    retryable: false,
};

describe("ServerErrorResponseSchema", () => {
    it("서버 에러 모양을 통과시킨다", () => {
        expect(ServerErrorResponseSchema.parse(serverError)).toEqual(serverError);
    });

    it("message가 문자열이면 거절한다 (서버는 {ko,en} 객체)", () => {
        expect(ServerErrorResponseSchema.safeParse({ ...serverError, message: "expired" }).success).toBe(false);
    });

    it("null 필드가 빠지면 거절한다", () => {
        const { taskId: _omit, ...missing } = serverError;
        expect(ServerErrorResponseSchema.safeParse(missing).success).toBe(false);
    });
});

describe("parseServerError", () => {
    it("서버 에러면 객체를, 아니면 null을 돌려준다", () => {
        expect(parseServerError(serverError)?.reasonCode).toBe("NONCE_EXPIRED");
        expect(parseServerError({ code: "X" })).toBeNull();
        expect(parseServerError("oops")).toBeNull();
    });
});

describe("parseOrThrow", () => {
    const Schema = z.object({ nonce: z.string(), expiresAt: z.string() });

    it("성공하면 검증된 값을 돌려준다", () => {
        const value = parseOrThrow(Schema, { nonce: "n", expiresAt: "t" });
        expect(value.nonce).toBe("n");
    });

    it("실패하면 INVALID_RESPONSE ApiError를 던지고 값은 메시지에 넣지 않는다", () => {
        const secret = "eyJ.secret.jwt";
        try {
            parseOrThrow(Schema, { nonce: 1, accessToken: secret }, { context: "wallet.nonce" });
            expect.unreachable();
        } catch (error) {
            expect(error).toBeInstanceOf(ApiError);
            const apiError = error as ApiError;
            expect(apiError.code).toBe(INVALID_RESPONSE);
            expect(apiError.status).toBe(502);
            expect(apiError.message).toContain("[wallet.nonce]");
            expect(apiError.message).toContain("nonce");
            expect(apiError.message).not.toContain(secret);
        }
    });

    it("status를 바꿀 수 있다", () => {
        expect(() => parseOrThrow(Schema, null, { status: 500 })).toThrowError(
            expect.objectContaining({ status: 500 }),
        );
    });
});

describe("summarizeIssues", () => {
    it("최대 개수를 넘으면 나머지 개수를 붙인다", () => {
        const Wide = z.object({ a: z.string(), b: z.string(), c: z.string(), d: z.string() });
        const result = Wide.safeParse({});
        expect(result.success).toBe(false);
        if (!result.success) expect(summarizeIssues(result.error, 2)).toMatch(/\(\+2\)$/);
    });
});