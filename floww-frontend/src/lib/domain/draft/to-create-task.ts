import type { AiDraftEnvelope } from "@/lib/types/ai-draft";
import type { CreateTaskRequest } from "@/lib/types/task";
import { AiDraftSchema } from "@/lib/api/schemas/ai-draft";
import { toBaseUnits } from "@/lib/utils/base-units";
import { matchItem } from "./item-match";
import { CreateTaskRequestSchema } from "@/lib/api/schemas/task";
export type DraftConversion =
  | { ok: true; input: CreateTaskRequest }
  | { ok: false; issues: string[] };
export function toCreateTask(
  envelope: AiDraftEnvelope,
  now = new Date(),
): DraftConversion {
  if (envelope.status !== "READY_FOR_REVIEW" || envelope.issues.length)
    return { ok: false, issues: ["DRAFT_NOT_READY"] };
  const parsed = AiDraftSchema.safeParse(envelope.draft);
  if (!parsed.success) return { ok: false, issues: ["INVALID_DRAFT"] };
  const draft = parsed.data;
  const issues: string[] = [];
  const itemId = matchItem(draft.itemScope);
  if (!itemId) issues.push("ITEM_SCOPE_AMBIGUOUS");
  if (draft.maximumTotalCost.asset !== "fUSDC")
    issues.push("UNSUPPORTED_ASSET");
  let amount = "0";
  try {
    amount = toBaseUnits(draft.maximumTotalCost.amount);
    if (BigInt(amount) <= 0n) issues.push("INVALID_AMOUNT");
  } catch {
    issues.push("INVALID_AMOUNT");
  }
  const deadline = Date.parse(draft.deadline);
  if (
    !Number.isFinite(deadline) ||
    deadline <= now.getTime() ||
    deadline > now.getTime() + 30 * 86400000
  )
    issues.push("INVALID_DEADLINE");
  if (issues.length || !itemId) return { ok: false, issues };
  const input = CreateTaskRequestSchema.safeParse({
    goal: draft.objective,
    itemId,
    maxAmountBaseUnits: amount,
    expiresAt: new Date(deadline).toISOString(),
  });
  return input.success
    ? { ok: true, input: input.data }
    : { ok: false, issues: ["INVALID_TASK_INPUT"] };
}
