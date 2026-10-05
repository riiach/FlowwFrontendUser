import type { MandateView } from "@/lib/types/task";
export function mandateUsage(mandate: MandateView) {
  const maximum = BigInt(mandate.maxAmountBaseUnits),
    consumed = BigInt(mandate.consumedBaseUnits);
  return {
    maximum,
    consumed,
    remaining: maximum > consumed ? maximum - consumed : 0n,
  };
}
