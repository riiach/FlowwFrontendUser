import "server-only";
import type {
  MandateView,
  QuoteView,
  PolicyView,
  PolicyReasonCode,
} from "@/lib/types/task";
import { POLICY_REASONS } from "@/lib/domain/policy/reasons";
import { findMerchant } from "./catalog";
export function evaluatePolicy(
  m: MandateView,
  q: QuoteView | undefined,
  now = new Date(),
  proposedRecipient?: string,
): PolicyView {
  let reason: PolicyReasonCode | null = null;
  const merchant = q ? findMerchant(q.merchantId) : undefined;
  if (
    ["REVOKED", "EXPIRED"].includes(m.status) ||
    Date.parse(m.expiresAt) <= now.getTime()
  )
    reason = "MANDATE_EXPIRED";
  else if (!q) reason = "UNKNOWN_QUOTE_ID";
  else if (Date.parse(q.expiresAt) <= now.getTime()) reason = "QUOTE_STALE";
  else if (
    !merchant ||
    merchant.recipientAddress !== q.recipientAddress ||
    merchant.recipientAddress !== q.quotedPayToAddress ||
    (proposedRecipient !== undefined &&
      proposedRecipient !== merchant.recipientAddress) ||
    !m.allowedRecipients.some(
      (r) =>
        r.merchantId === q.merchantId &&
        r.recipientAddress === merchant.recipientAddress,
    )
  )
    reason = "RECIPIENT_NOT_ALLOWED";
  else if (m.itemId !== q.itemId) reason = "ITEM_NOT_ALLOWED";
  else if (!q.inStock) reason = "OUT_OF_STOCK";
  else if (
    m.asset.chainId !== q.asset.chainId ||
    m.asset.tokenAddress.toLowerCase() !== q.asset.tokenAddress.toLowerCase() ||
    m.asset.tokenDecimals !== q.asset.tokenDecimals
  )
    reason = "CURRENCY_MISMATCH";
  else if (
    BigInt(m.consumedBaseUnits) + BigInt(q.totalAmountBaseUnits) >
    BigInt(m.maxAmountBaseUnits)
  )
    reason = "BUDGET_EXCEEDED";
  return {
    decision: reason ? "DENY" : "ALLOW",
    reasonCode: reason,
    message: reason ? POLICY_REASONS[reason] : null,
    policyVersion: "task-policy-v1",
    decidedAt: now.toISOString(),
  };
}
