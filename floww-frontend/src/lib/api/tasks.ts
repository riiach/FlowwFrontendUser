import { API_PATHS, REQUEST_LIMITS } from "../constants/constants";
import type {
    AIProposalResponse,
    CreateAttemptRequest,
    CreateTaskRequest,
    TaskAttempt,
    TaskEventsResponse,
    TaskQuote,
    TaskQuotesResponse,
    TaskStatus,
    TaskView,
} from "../types/task";
import { apiRequest, withIdempotencyKey } from "./client";

const TASK_STATUSES: readonly TaskStatus[] = [
    "DRAFT", "AWAITING_APPROVAL", "ACTIVE", "EXECUTING", "COMPLETED",
    "DECLINED", "FAILED", "EXPIRED", "CANCELLED",
];

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
    return typeof value === "string";
}

function isTaskAttempt(value: unknown): boolean {
    return isRecord(value) &&
        isString(value.attemptId) && isString(value.mandateId) &&
        typeof value.mandateVersion === "number" && isString(value.quoteId) &&
        isString(value.merchantId) && isString(value.status) &&
        isString(value.amountBaseUnits) && isString(value.recipientAddress) &&
        (value.policy === "ALLOW" || value.policy === "DENY");
}

/** Runtime guard for the shared TaskView contract. */
export function checkedTask(value: unknown): TaskView {
    const mandate = isRecord(value) && isRecord(value.mandate) ? value.mandate : undefined;
    if (
        !isRecord(value) || typeof value.taskId !== "string" || typeof value.goal !== "string" ||
        typeof value.status !== "string" || !TASK_STATUSES.includes(value.status as TaskStatus) ||
        !mandate || !isString(mandate.mandateId) || typeof mandate.version !== "number" ||
        !isString(mandate.status) || !isString(mandate.itemId) ||
        !isString(mandate.maxAmountBaseUnits) || !isString(mandate.consumedBaseUnits) ||
        !isString(mandate.remainingBaseUnits) || !isRecord(mandate.asset) ||
        typeof mandate.asset.chainId !== "number" || !isString(mandate.asset.tokenAddress) ||
        typeof mandate.asset.tokenDecimals !== "number" || !isString(mandate.expiresAt) ||
        !isString(mandate.budgetScope) || !Array.isArray(value.attempts) ||
        !value.attempts.every(isTaskAttempt) || typeof value.updatedAt !== "string"
    ) {
        throw new TypeError("INVALID_RESPONSE");
    }
    return value as unknown as TaskView;
}

export interface ListTasksOptions { limit?: number }

function taskUrl(taskId: string, suffix = ""): string {
    return `${API_PATHS.tasks}/${encodeURIComponent(taskId)}${suffix}`;
}

export const tasks = {
    async list({ limit = REQUEST_LIMITS.taskListLimit }: ListTasksOptions = {}): Promise<TaskView[]> {
        if (limit < REQUEST_LIMITS.taskListMinLimit || limit > REQUEST_LIMITS.taskListMaxLimit) {
            throw new RangeError(`limit must be between ${REQUEST_LIMITS.taskListMinLimit} and ${REQUEST_LIMITS.taskListMaxLimit}`);
        }
        const result = await apiRequest<unknown>(`${API_PATHS.tasks}?limit=${limit}`);
        if (!Array.isArray(result)) throw new TypeError("INVALID_RESPONSE");
        return result.map(checkedTask);
    },

    async create(input: CreateTaskRequest, idempotencyKey?: string): Promise<TaskView> {
        const result = await apiRequest<unknown>(API_PATHS.tasks, {
            method: "POST", body: input, headers: withIdempotencyKey(idempotencyKey),
        });
        return checkedTask(result);
    },

    async get(taskId: string): Promise<TaskView> {
        return checkedTask(await apiRequest<unknown>(taskUrl(taskId)));
    },

    async events<EventPayload = Record<string, unknown>>(
        taskId: string,
        { after, limit = REQUEST_LIMITS.eventPageLimit }: { after?: string; limit?: number } = {},
    ): Promise<TaskEventsResponse<EventPayload>> {
        if (limit < 1 || limit > REQUEST_LIMITS.eventPageLimit) {
            throw new RangeError(`limit must be between 1 and ${REQUEST_LIMITS.eventPageLimit}`);
        }
        const collected: EventPayload[] = [];
        let cursor = after;
        let nextCursor: string | null = cursor ?? null;
        let hasMore = false;

        for (let page = 0; page < REQUEST_LIMITS.eventMaxPages; page += 1) {
            const query = new URLSearchParams({ limit: String(limit) });
            if (cursor) query.set("after", cursor);
            const result = await apiRequest<unknown>(`${taskUrl(taskId, "/events")}?${query.toString()}`);
            if (!isRecord(result) || !Array.isArray(result.events) || typeof result.hasMore !== "boolean") {
                throw new TypeError("INVALID_RESPONSE");
            }
            collected.push(...(result.events as EventPayload[]));
            nextCursor = typeof result.nextCursor === "string" ? result.nextCursor : null;
            hasMore = result.hasMore;
            if (!hasMore || !nextCursor) break;
            cursor = nextCursor;
        }
        return { events: collected, nextCursor, hasMore };
    },

    async quotes(taskId: string): Promise<TaskQuotesResponse> {
        const result = await apiRequest<unknown>(taskUrl(taskId, "/quotes"), { method: "POST" });
        if (!isRecord(result) || !Array.isArray(result.quotes)) throw new TypeError("INVALID_RESPONSE");
        return result as unknown as TaskQuotesResponse;
    },

    proposal<Proposal = Record<string, unknown>>(taskId: string): Promise<AIProposalResponse<Proposal>> {
        return apiRequest<AIProposalResponse<Proposal>>(taskUrl(taskId, "/ai-proposal"), {
            method: "POST", timeoutMs: REQUEST_LIMITS.aiProposalTimeoutMs,
        });
    },

    attempt(taskId: string, input: CreateAttemptRequest): Promise<TaskAttempt> {
        return apiRequest<TaskAttempt>(taskUrl(taskId, "/attempts"), { method: "POST", body: input });
    },

    async stop(taskId: string, action: "reject" | "cancel"): Promise<TaskView> {
        const suffix = action === "reject" ? "/mandate/reject" : "/cancel";
        return checkedTask(await apiRequest<unknown>(taskUrl(taskId, suffix), { method: "POST" }));
    },
};

export type { TaskQuote };
