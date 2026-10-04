/** GitHub Issue 5 */

/** 사용자에게 보여줄 한·영 메시지 */
export interface LocalizedMessage {
    ko: string;
    en: string;
}

/**
 * Floww 서버 공통 에러 응답 (ErrorResponse.java, Floww_Server f729b0e)
 * GlobalExceptionHandler와 인증 필터가 모두 이 모양으로 보낸다.
 * null 필드도 생략하지 않는다.
 */
export interface ServerErrorResponse<Code extends string = string> {
    /** 기계 판독용 사유 코드 — 항상 이 필드를 읽는다 */
    reasonCode: Code;
    /** reasonCode와 같은 값. 하위 호환용이라 서버에서 제거 예정 */
    code: Code;
    message: LocalizedMessage;
    /** 관련 Task ID (없으면 null) */
    taskId: string | null;
    /** 관련 시도 ID (현재는 대부분 null) */
    attemptId: string | null;
    /** 같은 요청을 다시 보내도 되는지 */
    retryable: boolean;
}

/** BFF가 직접 만드는 에러 코드 (src/lib/constants의 API_ERROR_CODES와 같은 값) */
export type BffErrorCode =
    | "BACKEND_NOT_CONFIGURED"     // 서버 주소 환경변수 없음
    | "BACKEND_ACCESS_PROTECTED"   // 서버가 리다이렉트(Vercel 보호 등)를 돌려줌
    | "UPSTREAM_UNAVAILABLE"       // 서버 타임아웃·네트워크 실패
    | "INVALID_RESPONSE"           // 서버 응답이 스키마와 다름
    | "ROUTE_NOT_ALLOWED"          // 허용되지 않은 BFF 경로
    | "ORIGIN_NOT_ALLOWED"         // 다른 사이트에서 온 POST
    | "INVALID_INPUT"              // 요청 본문 형식 오류
    | "INVALID_IDEMPOTENCY_KEY"    // Idempotency-Key가 UUID가 아님
    | "SESSION_REQUIRED"           // 로그인 세션 쿠키 없음
    | "CHALLENGE_REQUIRED"
    | "CHALLENGE_MISMATCH"
    | "NOT_IMPLEMENTED";           // MVP 다음 단계 기능

/**
 * 브라우저가 BFF에서 받는 에러 본문.
 * 서버 에러 코드(NONCE_EXPIRED, BUDGET_EXCEEDED 등)와 BFF 코드가 모두 올 수 있다.
 */
export type ApiErrorBody<Code extends string = string> = ServerErrorResponse<Code | BffErrorCode>;





