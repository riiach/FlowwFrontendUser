import { z } from "zod";
import { API_PATHS } from "../constants/constants";
import type { CreateTaskRequest, AttemptCreateRequest } from "../types/task";
import { apiRequest, withIdempotencyKey } from "./client";
import {
  TaskViewSchema,
  QuoteListSchema,
  EventPageSchema,
  AttemptViewSchema,
  AiProposalResponseSchema,
  CreateTaskRequestSchema,
  AttemptCreateRequestSchema,
} from "./schemas/task";
import { parseOrThrow } from "./schemas";
const taskUrl = (id: string, suffix = "") =>
  `${API_PATHS.tasks}/${encodeURIComponent(id)}${suffix}`;
function limitValue(limit: number) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 50)
    throw new RangeError("INVALID_LIMIT");
}
export const checkedTask = (value: unknown) =>
  parseOrThrow(TaskViewSchema, value);
export const tasks = {
  async list({ limit = 20 }: { limit?: number } = {}) {
    limitValue(limit);
    return parseOrThrow(
      z.array(TaskViewSchema),
      await apiRequest<unknown>(`${API_PATHS.tasks}?limit=${limit}`),
    );
  },
  async create(input: CreateTaskRequest, idempotencyKey: string) {
    if (!idempotencyKey) throw new TypeError("IDEMPOTENCY_KEY_REQUIRED");
    return checkedTask(
      await apiRequest<unknown>(API_PATHS.tasks, {
        method: "POST",
        body: CreateTaskRequestSchema.parse(input),
        headers: withIdempotencyKey(idempotencyKey),
      }),
    );
  },
  async get(taskId: string) {
    return checkedTask(await apiRequest<unknown>(taskUrl(taskId)));
  },
  async events(
    taskId: string,
    { after = 0, limit = 50 }: { after?: number; limit?: number } = {},
  ) {
    limitValue(limit);
    if (!Number.isSafeInteger(after) || after < 0)
      throw new RangeError("INVALID_CURSOR");
    return parseOrThrow(
      EventPageSchema,
      await apiRequest<unknown>(
        `${taskUrl(taskId, "/events")}?after=${after}&limit=${limit}`,
      ),
    );
  },
  async quotes(taskId: string) {
    return parseOrThrow(
      QuoteListSchema,
      await apiRequest<unknown>(taskUrl(taskId, "/quotes"), { method: "POST" }),
    );
  },
  async proposal(taskId: string) {
    return parseOrThrow(
      AiProposalResponseSchema,
      await apiRequest<unknown>(taskUrl(taskId, "/ai-proposal"), {
        method: "POST",
        timeoutMs: 120000,
      }),
    );
  },
  async attempt(taskId: string, input: AttemptCreateRequest) {
    return parseOrThrow(
      AttemptViewSchema,
      await apiRequest<unknown>(taskUrl(taskId, "/attempts"), {
        method: "POST",
        body: AttemptCreateRequestSchema.parse(input),
      }),
    );
  },
  async stop(taskId: string, action: "reject" | "cancel") {
    return checkedTask(
      await apiRequest<unknown>(
        taskUrl(taskId, action === "reject" ? "/mandate/reject" : "/cancel"),
        { method: "POST" },
      ),
    );
  },
};
export type { TaskQuote } from "../types/task";
