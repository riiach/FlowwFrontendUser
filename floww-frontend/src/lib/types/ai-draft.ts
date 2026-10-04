/**
 * AI 초안 타입 — POST /api/ai/drafts (서버 계약)
 *
 * 대화를 보내면 서버(Kiln 모델)가 Mandate 초안을 만들어 돌려준다.
 * Floww_Server f729b0e 기준: AiDraftHttpController, AiDraftAdapter, AiDraftPreflight
 *
 * 주의: 이 초안은 사람이 읽는 형식이라 Task 생성 형식과 다르다.
 *       itemScope → itemId, amount → maxAmountBaseUnits 변환은 BFF(domain/draft)가 한다.
 */

/* ──────────────────────────────────────────────
 * 요청
 * ────────────────────────────────────────────── */

/**
 * 대화 한 턴. 서버는 키가 정확히 2개일 때만 받는다.
 * - role: "user" | "assistant" ("system"은 서버가 직접 붙임)
 * - content: 턴당 최대 4,000자
 */
export interface AiDraftTurn {
    role: "user" | "assistant";
    content: string;
}

/**
 * 요청 본문. 키는 conversation 하나만 허용.
 * - 최대 12턴, 전체 16,000자, 본문 128KB
 * - 마지막 턴은 반드시 role: "user"
 */
export interface AiDraftRequest {
    conversation: AiDraftTurn[];
}

/* ──────────────────────────────────────────────
 * 초안 (AiDraftPreflight, schemaVersion "ai-draft.v1")
 * ────────────────────────────────────────────── */

export interface AiDraftCost {
    /** 십진수 문자열, 예: "60" 또는 "23.5" (base units 아님) */
    amount: string;
    /** 자산 이름, 예: "fUSDC" */
    asset: string;
    /** 배송비·수수료 포함 금액인지. 서버는 true일 때만 확정으로 본다 */
    includesAllUserPaidFees: boolean;
}

/** status가 READY_FOR_REVIEW일 때의 완성된 초안 (6개 필드 + schemaVersion) */
export interface AiDraft {
    schemaVersion: "ai-draft.v1";
    /** 무엇을 원하는지 → Task goal */
    objective: string;
    /** 어떤 품목인지 (자유 문장) → BFF가 허용 itemId로 매칭 */
    itemScope: string;
    /** 판매처 조건 */
    providerCriteria: string;
    /** 최대 총액 → maxAmountBaseUnits */
    maximumTotalCost: AiDraftCost;
    /** 시간대 포함 절대 시각 (ISO-8601 offset), 예: "2026-10-09T18:00:00+09:00" → expiresAt */
    deadline: string;
    /** 무엇을 이행 완료로 볼지 */
    fulfillmentCriterion: string;
}

/**
 * status가 NEEDS_CLARIFICATION일 때의 초안.
 * 아직 정해지지 않은 필드는 빠지거나 null이거나 빈 문자열일 수 있다.
 */
export type AiDraftInProgress = {
    schemaVersion: "ai-draft.v1";
} & {
    [K in Exclude<keyof AiDraft, "schemaVersion" | "maximumTotalCost">]?: string | null;
} & {
    maximumTotalCost?: Partial<{ [K in keyof AiDraftCost]: AiDraftCost[K] | null }> | null;
};

/* ──────────────────────────────────────────────
 * 확인 질문 (issues)
 * ────────────────────────────────────────────── */

/** 서버가 되묻는 사유 코드 (AiDraftPreflight) */
export type AiDraftIssueCode =
    | "OBJECTIVE_MISSING" | "OBJECTIVE_AMBIGUOUS"
    | "ITEM_SCOPE_MISSING" | "ITEM_SCOPE_AMBIGUOUS"
    | "PROVIDER_CRITERIA_MISSING" | "PROVIDER_CRITERIA_AMBIGUOUS"
    | "FULFILLMENT_CRITERION_MISSING" | "FULFILLMENT_CRITERION_AMBIGUOUS"
    | "COST_MISSING" | "COST_AMOUNT_MISSING" | "COST_ASSET_MISSING"
    | "COST_FEES_UNRESOLVED" | "COST_FEES_EXCLUDED"
    | "DEADLINE_MISSING" | "DEADLINE_ABSOLUTE_REQUIRED";

/**
 * 빠졌거나 모호한 항목.
 * question은 영어로 온다 → 화면에서는 code로 한국어 질문을 매핑 (domain/draft/issue-messages.ts)
 */
export interface AiDraftIssue {
    code: AiDraftIssueCode;
    /** "objective", "maximumTotalCost.amount" 같은 경로 */
    field: string;
    question: string | null;
}

/* ──────────────────────────────────────────────
 * 모델 실행 기록 (evidence)
 * ────────────────────────────────────────────── */

export interface AiDraftEvidence {
    /** 서버가 기대한 모델일 때만 값이 있음 */
    modelId: string | null;
    modelEvidenceMode: string;
    toolCallId: string | null;
    generationId: string | null;
    usageStatus: string;
    /** 토큰 사용량, 예: { promptTokens: 812, completionTokens: 140 } */
    usage: Record<string, number>;
    cost: string | null;
    attempts: number;
}

/* ──────────────────────────────────────────────
 * 응답 envelope (ai-draft-http.v1)
 * 성공·실패 모두 같은 키 6개가 항상 온다.
 * ────────────────────────────────────────────── */

export type AiDraftStatus = "READY_FOR_REVIEW" | "NEEDS_CLARIFICATION" | "ERROR";

/** 에러 코드 (HTTP 상태) */
export type AiDraftErrorCode =
    | "INVALID_REQUEST"          // 400 본문 형식이 틀림
    | "INVALID_CONVERSATION"     // 400 턴 수·길이·role 규칙 위반, 마지막이 user가 아님
    | "UNAUTHORIZED"             // 401 JWT 없음
    | "UNSUPPORTED_MEDIA_TYPE"   // 415 JSON이 아님
    | "REQUEST_TOO_LARGE"        // 413 128KB 초과
    | "PROVIDER_NOT_CONFIGURED"  // 503 서버에 Kiln 키 없음 (Production 서버)
    | "PROVIDER_TIMEOUT"         // 504 모델 응답 시간 초과
    | "MODEL_PROPOSAL_FAILED"    // 502 모델 호출 실패
    | "MODEL_PROPOSAL_INVALID";  // 502 모델이 규칙에 어긋난 초안을 만듦

interface AiDraftEnvelopeBase {
    httpContractVersion: "ai-draft-http.v1";
    evidence: AiDraftEvidence | null;
}

/** 200 — 모든 항목이 채워져 저장 검토 가능 */
export interface AiDraftReady extends AiDraftEnvelopeBase {
    status: "READY_FOR_REVIEW";
    draft: AiDraft;
    issues: AiDraftIssue[];
    error: null;
}

/** 200 — 빠진 항목이 있어 다시 물어봐야 함 */
export interface AiDraftNeedsClarification extends AiDraftEnvelopeBase {
    status: "NEEDS_CLARIFICATION";
    draft: AiDraftInProgress;
    issues: AiDraftIssue[];
    error: null;
}

/** 4xx·5xx — draft는 항상 null */
export interface AiDraftError extends AiDraftEnvelopeBase {
    status: "ERROR";
    draft: null;
    issues: [];
    error: { code: AiDraftErrorCode };
}

/** POST /api/ai/drafts 응답. status로 좁혀서 쓴다 */
export type AiDraftEnvelope = AiDraftReady | AiDraftNeedsClarification | AiDraftError;