import { API_PATHS } from "../config/constants";
import type {
    Approval,
    BindTaskAccountRequest,
    CreateOrderRequest,
    Funding,
    PrepareTaskAccountRequest,
    SubmitAccountSignatureRequest,
    TaskAccount,
} from "../types";
import { apiRequest, withIdempotencyKey } from "./client";

function accountUrl(taskId: string, action = ""): string {
    return `${API_PATHS.tasks}/${encodeURIComponent(taskId)}/account${action}`;
}

function postAccountAction(taskId: string, action: string, body?: unknown): Promise<TaskAccount> {
    return apiRequest<TaskAccount>(accountUrl(taskId, `/${action}`), { method: "POST", body });
}

export const accountApi = {
    get: (taskId: string) => apiRequest<TaskAccount>(accountUrl(taskId)),
    funding: (taskId: string) => apiRequest<Funding>(accountUrl(taskId, "/funding")),
    prepare: (taskId: string, input: PrepareTaskAccountRequest) => postAccountAction(taskId, "prepare", input),
    bind: (taskId: string, input: BindTaskAccountRequest) => postAccountAction(taskId, "bind", input),
    approvalRequest: (taskId: string) => apiRequest<Approval>(accountUrl(taskId, "/approval-request"), { method: "POST" }),
    signature: (taskId: string, input: SubmitAccountSignatureRequest) => postAccountAction(taskId, "signature", input),
    approve: (taskId: string) => postAccountAction(taskId, "approve"),
    payment: (taskId: string) => postAccountAction(taskId, "payment"),
    fulfillment: (taskId: string) => postAccountAction(taskId, "fulfillment"),
    reconcile: (taskId: string) => postAccountAction(taskId, "reconcile"),
    order: (taskId: string, input: CreateOrderRequest, idempotencyKey?: string) =>
        apiRequest<Record<string, unknown>>(`${API_PATHS.tasks}/${encodeURIComponent(taskId)}/orders`, {
            method: "POST", body: input, headers: withIdempotencyKey(idempotencyKey),
        }),
};
