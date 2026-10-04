import { z } from "zod";
import type { AiDraftEnvelope } from "@/lib/types/ai-draft";
export const AiDraftIssueCodeSchema = z.enum([
  "OBJECTIVE_MISSING",
  "OBJECTIVE_AMBIGUOUS",
  "ITEM_SCOPE_MISSING",
  "ITEM_SCOPE_AMBIGUOUS",
  "PROVIDER_CRITERIA_MISSING",
  "PROVIDER_CRITERIA_AMBIGUOUS",
  "FULFILLMENT_CRITERION_MISSING",
  "FULFILLMENT_CRITERION_AMBIGUOUS",
  "COST_MISSING",
  "COST_AMOUNT_MISSING",
  "COST_ASSET_MISSING",
  "COST_FEES_UNRESOLVED",
  "COST_FEES_EXCLUDED",
  "DEADLINE_MISSING",
  "DEADLINE_ABSOLUTE_REQUIRED",
]);
export const AiDraftErrorCodeSchema = z.enum([
  "INVALID_REQUEST",
  "INVALID_CONVERSATION",
  "UNAUTHORIZED",
  "UNSUPPORTED_MEDIA_TYPE",
  "REQUEST_TOO_LARGE",
  "PROVIDER_NOT_CONFIGURED",
  "PROVIDER_TIMEOUT",
  "MODEL_PROPOSAL_FAILED",
  "MODEL_PROPOSAL_INVALID",
]);
export const AiDraftRequestSchema = z
  .strictObject({
    conversation: z
      .array(
        z.strictObject({
          role: z.enum(["user", "assistant"]),
          content: z.string().trim().min(1).max(4000),
        }),
      )
      .min(1)
      .max(12),
  })
  .refine(
    (v) =>
      v.conversation.at(-1)?.role === "user" &&
      v.conversation.reduce((n, t) => n + t.content.length, 0) <= 16000,
  );
const text = z.string().trim().min(1).max(500);
export const AiDraftSchema = z.strictObject({
  schemaVersion: z.literal("ai-draft.v1"),
  objective: text,
  itemScope: text,
  providerCriteria: text,
  maximumTotalCost: z.strictObject({
    amount: z.string().regex(/^(0|[1-9]\d*)(\.\d{1,18})?$/),
    asset: text,
    includesAllUserPaidFees: z.literal(true),
  }),
  deadline: z.iso.datetime({ offset: true }),
  fulfillmentCriterion: text,
});
const progress = z.object({
  schemaVersion: z.literal("ai-draft.v1"),
  objective: z.string().nullable().optional(),
  itemScope: z.string().nullable().optional(),
  providerCriteria: z.string().nullable().optional(),
  maximumTotalCost: z
    .object({
      amount: z.string().nullable().optional(),
      asset: z.string().nullable().optional(),
      includesAllUserPaidFees: z.boolean().nullable().optional(),
    })
    .nullable()
    .optional(),
  deadline: z.string().nullable().optional(),
  fulfillmentCriterion: z.string().nullable().optional(),
});
const issue = z.object({
  code: AiDraftIssueCodeSchema,
  field: z.string(),
  question: z.string().nullable(),
});
const base = {
  httpContractVersion: z.literal("ai-draft-http.v1"),
  evidence: z
    .object({
      modelId: z.string().nullable(),
      modelEvidenceMode: z.string(),
      toolCallId: z.string().nullable(),
      generationId: z.string().nullable(),
      usageStatus: z.string(),
      usage: z.record(z.string(), z.number()),
      cost: z.string().nullable(),
      attempts: z.number().int().nonnegative(),
    })
    .nullable(),
};
export const AiDraftEnvelopeSchema: z.ZodType<AiDraftEnvelope> =
  z.discriminatedUnion("status", [
    z.object({
      ...base,
      status: z.literal("READY_FOR_REVIEW"),
      draft: AiDraftSchema,
      issues: z.array(issue),
      error: z.null(),
    }),
    z.object({
      ...base,
      status: z.literal("NEEDS_CLARIFICATION"),
      draft: progress,
      issues: z.array(issue),
      error: z.null(),
    }),
    z.object({
      ...base,
      status: z.literal("ERROR"),
      draft: z.null(),
      issues: z.tuple([]),
      error: z.object({ code: AiDraftErrorCodeSchema }),
    }),
  ]);
