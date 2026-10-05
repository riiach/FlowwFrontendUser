import type { PolicyReasonCode } from "@/lib/types/task";
export const POLICY_REASONS: Record<
  PolicyReasonCode,
  { ko: string; en: string }
> = {
  MANDATE_EXPIRED: {
    ko: "승인 기한이 만료되었습니다.",
    en: "Mandate expired.",
  },
  UNKNOWN_QUOTE_ID: { ko: "견적을 찾을 수 없습니다.", en: "Unknown quote." },
  QUOTE_STALE: { ko: "견적이 만료되었습니다.", en: "Quote expired." },
  RECIPIENT_NOT_ALLOWED: {
    ko: "허용되지 않은 수취인입니다.",
    en: "Recipient not allowed.",
  },
  ITEM_NOT_ALLOWED: {
    ko: "허용되지 않은 품목입니다.",
    en: "Item not allowed.",
  },
  OUT_OF_STOCK: { ko: "품절입니다.", en: "Out of stock." },
  CURRENCY_MISMATCH: {
    ko: "결제 자산이 일치하지 않습니다.",
    en: "Currency mismatch.",
  },
  BUDGET_EXCEEDED: { ko: "승인 예산을 초과합니다.", en: "Budget exceeded." },
};
