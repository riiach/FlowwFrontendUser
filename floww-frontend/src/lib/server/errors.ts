import "server-only";

import { NextResponse } from "next/server";
import { parseServerError } from "@/lib/api/schemas";
import type { ApiErrorBody, BffErrorCode, LocalizedMessage } from "@/lib/types";

const MESSAGES: Record<BffErrorCode, LocalizedMessage> = {
    BACKEND_NOT_CONFIGURED: { ko: "서버 연결이 설정되지 않았습니다.", en: "Backend is not configured." },
    BACKEND_ACCESS_PROTECTED: { ko: "서버 접근이 보호되어 있습니다.", en: "Backend access is protected." },
    UPSTREAM_UNAVAILABLE: { ko: "서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.", en: "Upstream is unavailable. Please try again." },
    INVALID_RESPONSE: { ko: "서버 응답 형식이 올바르지 않습니다.", en: "Upstream response is invalid." },
    ROUTE_NOT_ALLOWED: { ko: "허용되지 않은 경로입니다.", en: "Route is not allowed." },
    ORIGIN_NOT_ALLOWED: { ko: "허용되지 않은 출처의 요청입니다.", en: "Request origin is not allowed." },
    INVALID_INPUT: { ko: "요청 형식이 올바르지 않습니다.", en: "Request input is invalid." },
    INVALID_IDEMPOTENCY_KEY: { ko: "Idempotency-Key 형식이 올바르지 않습니다.", en: "Idempotency-Key is invalid." },
    SESSION_REQUIRED: { ko: "로그인이 필요합니다.", en: "Login is required." },
    NOT_IMPLEMENTED: { ko: "아직 지원하지 않는 기능입니다.", en: "Not implemented yet." },
};

const RETRYABLE = new Set<BffErrorCode>(["UPSTREAM_UNAVAILABLE"]);

export class BffError extends Error {
    readonly code: BffErrorCode;
    readonly status: number;

    constructor(code: BffErrorCode, status: number) {
        super(code);
        this.name = "BffError";
        this.code = code;
        this.status = status;
    }
}

export function errorBody(code: BffErrorCode): ApiErrorBody {
    return {
        reasonCode: code,
        code,
        message: MESSAGES[code],
        taskId: null,
        attemptId: null,
        retryable: RETRYABLE.has(code),
    };
}

export function jsonError(code: BffErrorCode, status: number): NextResponse<ApiErrorBody> {
    return NextResponse.json(errorBody(code), { status });
}

/** 서버 에러 본문은 그대로 쓰고, 형식이 다르면 상태 코드로 BFF 에러를 만든다 */
export function normalizeUpstreamError(status: number, data: unknown): ApiErrorBody {
    const serverError = parseServerError(data);
    if (serverError) return serverError;
    return errorBody(status >= 500 ? "UPSTREAM_UNAVAILABLE" : "INVALID_RESPONSE");
}

export function toErrorResponse(error: unknown): NextResponse<ApiErrorBody> {
    if (error instanceof BffError) return jsonError(error.code, error.status);
    if (error instanceof Error && error.name === "EnvError") return jsonError("BACKEND_NOT_CONFIGURED", 503);
    return jsonError("UPSTREAM_UNAVAILABLE", 502);
}
