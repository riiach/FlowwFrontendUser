import { z } from "zod";
import { ApiError } from "../client";
import type { LocalizedMessage, ServerErrorResponse } from '@/lib/types';

/* ──────────────────────────────────────────────
 * 공통 에러 스키마 (ErrorResponse.java)
 * ────────────────────────────────────────────── */

export const LocalizedMessageSchema = z.object({
    ko: z.string(),
    en: z.string(),
});

export const ServerErrorResponseSchema = z.object({
    reasonCode: z.string().min(1),
    code: z.string().min(1),
    message: LocalizedMessageSchema,
    taskId: z.string().nullable(),
    attemptId: z.string().nullable(),
    retryable: z.boolean(),
});

const _localizedMessageCheck: z.ZodType<LocalizedMessage> = LocalizedMessageSchema;
const _serverErrorCheck: z.ZodType<ServerErrorResponse> = ServerErrorResponseSchema;
void _localizedMessageCheck;
void _serverErrorCheck;

export function parseServerError(data: unknown): ServerErrorResponse | null {
    const result = ServerErrorResponseSchema.safeParse(data);
    return result.success ? result.data : null;
}

/* ──────────────────────────────────────────────
 * 검증 헬퍼
 * ────────────────────────────────────────────── */

export const INVALID_RESPONSE = "INVALID_RESPONSE" as const;

export interface ParseOptions {
    context?: string;
    status?: number;
}

export function summarizeIssues(error: z.ZodError, limit = 3): string {
    const parts = error.issues.slice(0, limit).map((issue) => {
        const path = issue.path.length ? issue.path.join(".") : "(root)";
        return `${path}: ${issue.code}`;
    });
    const rest = error.issues.length - parts.length;
    return rest > 0 ? `${parts.join(", ")} (+${rest})` : parts.join(", ");
}

export function parseOrThrow<S extends z.ZodType>(
    schema: S,
    data: unknown,
    options: ParseOptions = {},
): z.output<S> {
    const result = schema.safeParse(data);
    if (result.success) return result.data;

    const where = options.context ? `[${options.context}] ` : "";
    throw new ApiError(
        `${where}${INVALID_RESPONSE}: ${summarizeIssues(result.error)}`,
        options.status ?? 502,
        INVALID_RESPONSE,
    );
}