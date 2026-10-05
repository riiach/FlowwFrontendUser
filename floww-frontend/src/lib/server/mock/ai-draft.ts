import "server-only";
import type {
  AiDraftInProgress,
  AiDraftIssue,
  AiDraftIssueCode,
} from "@/lib/types/ai-draft";
import { AiDraftRequestSchema } from "@/lib/api/schemas/ai-draft";
import { ISSUE_MESSAGES } from "@/lib/domain/draft/issue-messages";
import { matchItem, ITEMS } from "@/lib/domain/draft/item-match";
import { route, ok } from "./http";
import { readMockAccessToken } from "./auth";
export const AI_DRAFT_ROUTES = [
  route("POST", "/api/ai/drafts", ({ body, accessToken, now }) => {
    const parsed = AiDraftRequestSchema.safeParse(body);
    const base = { httpContractVersion: "ai-draft-http.v1", evidence: null };
    if (!readMockAccessToken(accessToken, now))
      return ok(
        {
          ...base,
          status: "ERROR",
          draft: null,
          issues: [],
          error: { code: "UNAUTHORIZED" },
        },
        401,
      );
    if (!parsed.success)
      return ok(
        {
          ...base,
          status: "ERROR",
          draft: null,
          issues: [],
          error: { code: "INVALID_CONVERSATION" },
        },
        400,
      );
    // Used only during this request; never write conversation into mock state.
    const text = parsed.data.conversation
      .filter((t) => t.role === "user")
      .map((t) => t.content)
      .join("\n");
    const item = matchItem(text);
    const amount = text.match(/(?:^|[^\d.])(\d+(?:\.\d+)?)\s*fUSDC\b/i)?.[1];
    const dates = [
      ...text.matchAll(
        /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?(?:Z|[+-]\d{2}:\d{2})/g,
      ),
    ];
    const deadline = dates.at(-1)?.[0] ?? null;
    const fees =
      /(?:배송비|수수료|모든 비용|fees).{0,20}(?:포함|include)|(?:포함|include).{0,20}(?:배송비|수수료|fees)/i.test(
        text,
      );
    const provider = /약국|판매처|pharmac|등록된|허용된/i.test(text);
    const fulfilled = /배송 완료|배송완료|배달 완료|delivery|수령/i.test(text);
    const draft: AiDraftInProgress = {
      schemaVersion: "ai-draft.v1",
      objective: item ? "의약품 구매 및 배송" : null,
      itemScope:
        item === ITEMS.acetaminophen
          ? "아세트아미노펜 500mg 10정"
          : item
            ? "이부프로펜 200mg 20정"
            : null,
      providerCriteria: provider ? "등록된 약국" : null,
      maximumTotalCost: amount
        ? { amount, asset: "fUSDC", includesAllUserPaidFees: fees }
        : null,
      deadline,
      fulfillmentCriterion: fulfilled ? "배송 완료" : null,
    };
    const issues: AiDraftIssue[] = [];
    const add = (code: AiDraftIssueCode, field: string) =>
      issues.push({ code, field, question: ISSUE_MESSAGES[code] });
    if (!item) {
      add("OBJECTIVE_MISSING", "objective");
      add("ITEM_SCOPE_AMBIGUOUS", "itemScope");
    }
    if (!provider) add("PROVIDER_CRITERIA_MISSING", "providerCriteria");
    if (!fulfilled)
      add("FULFILLMENT_CRITERION_MISSING", "fulfillmentCriterion");
    if (!amount) add("COST_MISSING", "maximumTotalCost");
    else if (!fees)
      add("COST_FEES_UNRESOLVED", "maximumTotalCost.includesAllUserPaidFees");
    if (!deadline || !Number.isFinite(Date.parse(deadline)))
      add(
        /내일|오늘|모레|다음|tomorrow|next/i.test(text)
          ? "DEADLINE_ABSOLUTE_REQUIRED"
          : "DEADLINE_MISSING",
        "deadline",
      );
    return ok({
      ...base,
      status: issues.length ? "NEEDS_CLARIFICATION" : "READY_FOR_REVIEW",
      draft,
      issues,
      error: null,
    });
  }),
];
