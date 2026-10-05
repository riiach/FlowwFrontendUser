import type { AiDraftIssueCode } from "@/lib/types/ai-draft";
export const ISSUE_MESSAGES: Record<AiDraftIssueCode, string> = {
  OBJECTIVE_MISSING: "무엇을 구매하고 싶으신가요?",
  OBJECTIVE_AMBIGUOUS: "구매 목적을 구체적으로 알려주세요.",
  ITEM_SCOPE_MISSING:
    "타이레놀(아세트아미노펜) 또는 이부프로펜 중 어떤 품목인가요?",
  ITEM_SCOPE_AMBIGUOUS: "구매할 품목 하나를 정확히 선택해주세요.",
  PROVIDER_CRITERIA_MISSING: "어떤 판매처 조건을 원하시나요?",
  PROVIDER_CRITERIA_AMBIGUOUS: "판매처 조건을 구체적으로 알려주세요.",
  FULFILLMENT_CRITERION_MISSING: "무엇을 완료 기준으로 볼까요?",
  FULFILLMENT_CRITERION_AMBIGUOUS:
    "배송 완료 등 확인 가능한 완료 기준을 알려주세요.",
  COST_MISSING: "배송비와 수수료를 포함한 최대 금액을 fUSDC로 알려주세요.",
  COST_AMOUNT_MISSING: "최대 금액은 얼마인가요?",
  COST_ASSET_MISSING: "자산은 fUSDC인가요?",
  COST_FEES_UNRESOLVED: "배송비와 모든 수수료를 포함한 금액인가요?",
  COST_FEES_EXCLUDED: "배송비와 모든 수수료를 포함한 총액을 알려주세요.",
  DEADLINE_MISSING: "날짜, 시각, 시간대를 포함한 정확한 기한을 알려주세요.",
  DEADLINE_ABSOLUTE_REQUIRED:
    "상대 날짜 대신 정확한 날짜, 시각, 시간대를 알려주세요.",
};
