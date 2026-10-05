import { describe, it, expect } from "vitest";
import type { AiDraftReady } from "@/lib/types/ai-draft";
import { toCreateTask } from "@/lib/domain/draft/to-create-task";
const now = new Date("2026-10-05T00:00:00Z");
const ready: AiDraftReady = {
  httpContractVersion: "ai-draft-http.v1",
  evidence: null,
  status: "READY_FOR_REVIEW",
  issues: [],
  error: null,
  draft: {
    schemaVersion: "ai-draft.v1",
    objective: "구매",
    itemScope: "타이레놀",
    providerCriteria: "등록 약국",
    maximumTotalCost: {
      amount: "60",
      asset: "fUSDC",
      includesAllUserPaidFees: true,
    },
    deadline: "2026-10-06T18:00:00+09:00",
    fulfillmentCriterion: "배송 완료",
  },
};
describe("draft conversion", () => {
  it("maps fields and normalizes absolute time", () => {
    expect(toCreateTask(ready, now)).toEqual({
      ok: true,
      input: {
        goal: "구매",
        itemId: "acetaminophen-500mg-10",
        maxAmountBaseUnits: "60000000",
        expiresAt: "2026-10-06T09:00:00.000Z",
      },
    });
  });
  it.each(["2026-10-05T00:00:00Z", "2026-11-05T00:00:00Z", "내일"])(
    "rejects expired, distant or relative deadlines %s",
    (deadline) => {
      expect(
        toCreateTask({ ...ready, draft: { ...ready.draft, deadline } }, now).ok,
      ).toBe(false);
    },
  );
  it("requires readiness, fees, supported asset and precision", () => {
    expect(
      toCreateTask({ ...ready, status: "NEEDS_CLARIFICATION" }, now).ok,
    ).toBe(false);
    for (const cost of [
      { amount: "0", asset: "fUSDC", includesAllUserPaidFees: true },
      { amount: "1.0000001", asset: "fUSDC", includesAllUserPaidFees: true },
      { amount: "60", asset: "USDC", includesAllUserPaidFees: true },
      { amount: "60", asset: "fUSDC", includesAllUserPaidFees: false },
    ]) {
      expect(
        toCreateTask(
          { ...ready, draft: { ...ready.draft, maximumTotalCost: cost } },
          now,
        ).ok,
      ).toBe(false);
    }
  });
});
