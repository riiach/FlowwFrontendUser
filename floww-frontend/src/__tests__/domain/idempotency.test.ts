import { it, expect } from "vitest";
import { taskIdempotencyKey } from "@/lib/utils/idempotency";
it("reuses a key across retries and property ordering; changes it for changed input or wallet", () => {
  const data = new Map<string, string>();
  const storage = {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => {
      data.set(k, v);
    },
  };
  const input = {
    goal: "구매",
    itemId: "acetaminophen-500mg-10",
    maxAmountBaseUnits: "60000000",
    expiresAt: "2026-10-06T00:00:00Z",
  } as const;
  const key = taskIdempotencyKey(input, storage, "wallet-a");
  expect(
    taskIdempotencyKey(
      {
        expiresAt: input.expiresAt,
        maxAmountBaseUnits: input.maxAmountBaseUnits,
        itemId: input.itemId,
        goal: input.goal,
      },
      storage,
      "wallet-a",
    ),
  ).toBe(key);
  expect(
    taskIdempotencyKey({ ...input, goal: "변경" }, storage, "wallet-a"),
  ).not.toBe(key);
  expect(taskIdempotencyKey(input, storage, "wallet-b")).not.toBe(key);
});
