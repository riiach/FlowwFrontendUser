import { z } from "zod";
export const TaskStatusSchema = z.enum([
  "DRAFT",
  "AWAITING_APPROVAL",
  "ACTIVE",
  "EXECUTING",
  "COMPLETED",
  "DECLINED",
  "FAILED",
  "EXPIRED",
  "CANCELLED",
]);
export const BaseUnitsSchema = z
  .string()
  .max(78)
  .regex(/^(0|[1-9]\d*)$/);
const date = z.iso.datetime({ offset: true });
const address = z.string().regex(/^0x[\da-fA-F]{40}$/);
const message = z.object({ ko: z.string(), en: z.string() });
export const AssetViewSchema = z.object({
  chainId: z.number().int().positive(),
  tokenAddress: address,
  tokenDecimals: z.number().int().min(0).max(255),
});
export const CreateTaskRequestSchema = z.strictObject({
  goal: z
    .string()
    .trim()
    .min(1)
    .max(500)
    .refine((v) => !/[\u0000-\u001f\u007f-\u009f]/.test(v)),
  itemId: z.enum(["acetaminophen-500mg-10", "ibuprofen-200mg-20"]),
  maxAmountBaseUnits: BaseUnitsSchema.refine(
    (v) => BigInt(v) > 0n && BigInt(v) <= 1000000000000n,
  ),
  expiresAt: date,
});
export const MandateViewSchema = z.object({
  mandateId: z.string().min(1),
  version: z.number().int().positive(),
  status: z.string(),
  goal: z.string(),
  itemId: z.string(),
  maxAmountBaseUnits: BaseUnitsSchema,
  consumedBaseUnits: BaseUnitsSchema,
  remainingBaseUnits: BaseUnitsSchema,
  budgetScope: z.string(),
  asset: AssetViewSchema,
  allowedRecipients: z.array(
    z.object({ merchantId: z.string(), recipientAddress: address }),
  ),
  allowedActions: z.array(z.string()),
  expiresAt: date,
  confirmedAt: date.nullable(),
  confirmationMethod: z.string().nullable(),
  authorizationReference: z.string().nullable(),
});
export const PolicyReasonCodeSchema = z.enum([
  "MANDATE_EXPIRED",
  "UNKNOWN_QUOTE_ID",
  "QUOTE_STALE",
  "RECIPIENT_NOT_ALLOWED",
  "ITEM_NOT_ALLOWED",
  "OUT_OF_STOCK",
  "CURRENCY_MISMATCH",
  "BUDGET_EXCEEDED",
]);
export const PolicyViewSchema = z.object({
  decision: z.enum(["ALLOW", "DENY"]),
  reasonCode: PolicyReasonCodeSchema.nullable(),
  message: message.nullable(),
  policyVersion: z.string(),
  decidedAt: date,
});
export const PaymentViewSchema = z.object({
  status: z.string(),
  txHash: z.string().nullable(),
});
export const AttemptCreateRequestSchema = z.strictObject({
  quoteId: z.string().regex(/^[A-Za-z0-9._:-]{1,128}$/),
  proposedBy: z.literal("USER"),
});
export const AttemptViewSchema = z.object({
  attemptId: z.string(),
  mandateId: z.string(),
  mandateVersion: z.number().int().positive(),
  quoteId: z.string(),
  merchantId: z.string().nullable(),
  proposedBy: z.enum(["USER", "AI"]),
  status: z.string(),
  amountBaseUnits: BaseUnitsSchema.nullable(),
  recipientAddress: address.nullable(),
  policy: PolicyViewSchema,
  approval: z
    .object({
      method: z.string(),
      digest: z.string(),
      signerAddress: address,
      signedAt: date,
    })
    .nullable(),
  order: z
    .object({
      orderId: z.string(),
      taskId: z.string(),
      attemptId: z.string(),
      quoteId: z.string(),
      merchantId: z.string(),
      merchantOrderId: z.string(),
      status: z.string(),
      paymentStatus: z.string(),
      amountBaseUnits: BaseUnitsSchema,
      recipientAddress: address,
      createdAt: date,
    })
    .nullable(),
  payment: PaymentViewSchema,
  createdAt: date,
});
export const TaskViewSchema = z.object({
  taskId: z.string().min(1),
  ownerId: z.string(),
  status: TaskStatusSchema,
  statusReasonCode: z.string().nullable(),
  goal: z.string(),
  mandate: MandateViewSchema,
  attempts: z.array(AttemptViewSchema),
  createdAt: date,
  updatedAt: date,
  completedAt: date.nullable(),
});
export const QuoteViewSchema = z.object({
  quoteId: z.string(),
  merchantId: z.string(),
  merchantName: z.string(),
  itemId: z.string(),
  itemName: z.string(),
  quantity: z.number().int().positive(),
  inStock: z.boolean(),
  itemAmountBaseUnits: BaseUnitsSchema,
  deliveryFeeBaseUnits: BaseUnitsSchema,
  totalAmountBaseUnits: BaseUnitsSchema,
  asset: AssetViewSchema,
  recipientAddress: address,
  quotedPayToAddress: address,
  quotedAt: date,
  expiresAt: date,
  promisedFulfillmentAt: date,
  evidenceMode: z.string(),
});
export const QuoteListSchema = z.object({
  taskId: z.string(),
  mandateVersion: z.number().int().positive(),
  quotes: z.array(QuoteViewSchema),
});
export const EventViewSchema = z.object({
  seq: z.number().int().nonnegative().safe(),
  kind: z.string(),
  state: z.string(),
  reasonCode: z.string().nullable(),
  attemptId: z.string().nullable(),
  actor: z.string(),
  payload: z.unknown(),
  createdAt: date,
});
export const EventPageSchema = z.object({
  events: z.array(EventViewSchema),
  nextCursor: z.number().int().nonnegative().safe(),
  hasMore: z.boolean(),
});
export const AiProposalResponseSchema = z.object({
  proposal: z.object({
    status: z.enum([
      "PROPOSED",
      "CLARIFICATION_REQUIRED",
      "NO_CANDIDATE",
      "REJECTED",
      "MODEL_FAILURE",
    ]),
    reason: z.string().nullable(),
    taskRef: z.string().nullable(),
    mandateRef: z.string().nullable(),
    mandateRevision: z.string().nullable(),
    proposedQuote: z
      .object({
        quoteId: z.string(),
        merchantId: z.string(),
        recipient: address,
        itemId: z.string(),
        asset: z.object({
          chainId: z.string(),
          tokenAddress: address,
          decimals: z.number().int(),
        }),
        totalBaseUnits: BaseUnitsSchema,
        expiresAt: date,
        inStock: z.boolean(),
        promisedFulfillmentAt: date,
        prescriptionRequired: z.boolean(),
        identityRequired: z.boolean(),
      })
      .nullable(),
    findings: z.array(
      z.object({ quoteId: z.string(), reasons: z.array(z.string()) }),
    ),
    provenance: z
      .object({
        modelId: z.string().nullable(),
        modelEvidenceMode: z.string(),
        finishReason: z.string().nullable(),
        toolCallId: z.string().nullable(),
        generationId: z.string().nullable(),
        usageStatus: z.string(),
        usage: z.record(z.string(), z.number()),
        cost: z.string().nullable(),
        attempts: z.number().int(),
      })
      .nullable(),
  }),
  attempt: AttemptViewSchema.nullable(),
  reusedAttempt: z.boolean(),
});
