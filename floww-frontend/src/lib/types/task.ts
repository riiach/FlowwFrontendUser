/** Task and mandate domain types shared by user and admin views. */
/** user와 admin에서 공유되는 Task와 Task가 실행할 수 있는 권한과 조건을 정한 규칙(mandate)*/

export type TaskStatus =
    | "DRAFT"
    | "AWAITING_APPROVAL"
    | "ACTIVE"
    | "EXECUTING"
    | "COMPLETED"
    | "DECLINED"
    | "FAILED"
    | "EXPIRED"
    | "CANCELLED";

export type PolicyDecision = "ALLOW" | "DENY";

export interface TaskAsset {
    chainId: number;
    tokenAddress: string;
    tokenDecimals: number;
}

export interface Mandate {
    mandateId: string;
    version: number;
    status: string;
    itemId: string;
    /** Integer token units; never a human-readable decimal amount. */
    maxAmountBaseUnits: string;
    consumedBaseUnits: string;
    remainingBaseUnits: string;
    asset: TaskAsset;
    expiresAt: string;
    budgetScope: string;
}

export interface TaskAttempt {
    attemptId: string;
    mandateId: string;
    mandateVersion: number;
    quoteId: string;
    merchantId: string;
    status: string;
    /** Integer token units; never a human-readable decimal amount. */
    amountBaseUnits: string;
    recipientAddress: string;
    policy: PolicyDecision;
}

export interface TaskView {
    taskId: string;
    status: TaskStatus;
    statusReasonCode?: string | null;
    goal: string;
    mandate: Mandate;
    attempts: TaskAttempt[];
    updatedAt: string;
    completedAt?: string | null;
}

export interface CreateTaskRequest {
    goal: string;
    itemId: string;
    /** Integer token units. */
    maxAmountBaseUnits: string;
    expiresAt: string;
}

/** Quote schema details are not specified in the available API document. */
export type TaskQuote = Record<string, unknown>;

export interface TaskQuotesResponse {
    taskId: string;
    mandateVersion: number;
    quotes: TaskQuote[];
}

export interface TaskEventsResponse<EventPayload = Record<string, unknown>> {
    events: EventPayload[];
    nextCursor: string | null;
    hasMore: boolean;
}

export interface CreateAttemptRequest {
    quoteId: string;
    proposedBy: "USER";
}

export interface AIProposalResponse<Proposal = Record<string, unknown>> {
    proposal: Proposal;
    attempt: TaskAttempt;
    reusedAttempt: boolean;
}

/** Value shape accepted by APIs that stop a task (reject or cancel). */
export type StopTaskAction = "mandate/reject" | "cancel";


