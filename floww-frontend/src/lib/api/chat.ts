import { z } from "zod";
import { apiRequest } from "./client";
import {
  AiDraftEnvelopeSchema,
  AiDraftRequestSchema,
} from "./schemas/ai-draft";
import { CreateTaskRequestSchema } from "./schemas/task";
import { parseOrThrow } from "./schemas";
import type { AiDraftRequest, AiDraftEnvelope } from "../types/ai-draft";
import type { CreateTaskRequest } from "../types/task";
export type ChatDraftResponse = AiDraftEnvelope & {
  createTask: CreateTaskRequest | null;
  conversionIssues: string[];
};
export const chat = {
  async draft(input: AiDraftRequest): Promise<ChatDraftResponse> {
    const response = await apiRequest<unknown>("/api/chat/draft", {
      method: "POST",
      body: AiDraftRequestSchema.parse(input),
    });
    const envelope = parseOrThrow(AiDraftEnvelopeSchema, response);
    const conversion = parseOrThrow(
      z.object({
        createTask: CreateTaskRequestSchema.nullable(),
        conversionIssues: z.array(z.string()),
      }),
      response,
    );
    return { ...envelope, ...conversion };
  },
};
