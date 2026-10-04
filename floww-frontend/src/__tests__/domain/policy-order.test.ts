import { it, expect } from "vitest";
import { evaluatePolicy } from "@/lib/server/mock/policy";
import { buildQuotes, MOCK_ASSET, MERCHANTS } from "@/lib/server/mock/catalog";
import type { MandateView } from "@/lib/types/task";
const now = new Date("2026-10-05T00:00:00Z");
const mandate: MandateView = {
  mandateId: "m",
  version: 1,
  status: "DRAFT",
  goal: "purchase",
  itemId: "acetaminophen-500mg-10",
  maxAmountBaseUnits: "60000000",
  consumedBaseUnits: "0",
  remainingBaseUnits: "60000000",
  budgetScope: "TASK_TOTAL",
  asset: MOCK_ASSET,
  allowedRecipients: MERCHANTS.map((m) => ({
    merchantId: m.merchantId,
    recipientAddress: m.recipientAddress,
  })),
  allowedActions: ["PURCHASE"],
  expiresAt: "2026-10-06T00:00:00Z",
  confirmedAt: null,
  confirmationMethod: null,
  authorizationReference: null,
};
it("uses the server's eight checks in exact priority order", () => {
  const q = buildQuotes("t", mandate.itemId, now)[0];
  expect(
    evaluatePolicy({ ...mandate, expiresAt: now.toISOString() }, undefined, now)
      .reasonCode,
  ).toBe("MANDATE_EXPIRED");
  expect(evaluatePolicy(mandate, undefined, now).reasonCode).toBe(
    "UNKNOWN_QUOTE_ID",
  );
  const bad = {
    ...q,
    expiresAt: now.toISOString(),
    quotedPayToAddress: MERCHANTS[2].recipientAddress,
    itemId: "wrong",
    inStock: false,
    asset: { ...q.asset, chainId: 1 },
    totalAmountBaseUnits: "64000000",
  };
  expect(evaluatePolicy(mandate, bad, now).reasonCode).toBe("QUOTE_STALE");
  bad.expiresAt = q.expiresAt;
  expect(evaluatePolicy(mandate, bad, now).reasonCode).toBe(
    "RECIPIENT_NOT_ALLOWED",
  );
  bad.quotedPayToAddress = q.quotedPayToAddress;
  expect(evaluatePolicy(mandate, bad, now).reasonCode).toBe("ITEM_NOT_ALLOWED");
  bad.itemId = q.itemId;
  expect(evaluatePolicy(mandate, bad, now).reasonCode).toBe("OUT_OF_STOCK");
  bad.inStock = true;
  expect(evaluatePolicy(mandate, bad, now).reasonCode).toBe(
    "CURRENCY_MISMATCH",
  );
  bad.asset = q.asset;
  expect(evaluatePolicy(mandate, bad, now).reasonCode).toBe("BUDGET_EXCEEDED");
  bad.totalAmountBaseUnits = q.totalAmountBaseUnits;
  expect(evaluatePolicy(mandate, bad, now).decision).toBe("ALLOW");
  expect(
    evaluatePolicy({ ...mandate, consumedBaseUnits: "40000000" }, q, now)
      .reasonCode,
  ).toBe("BUDGET_EXCEEDED");
});
