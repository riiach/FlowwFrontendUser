import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
    ACETAMINOPHEN,
    buildQuotes,
    IBUPROFEN,
    MERCHANTS,
    PHARMACY_C_QUOTED_PAY_TO,
    QUOTE_TTL_MS,
} from "@/lib/server/mock/catalog";

const NOW = new Date("2026-09-30T01:00:00.750Z");

describe("catalog (PharmacySimulatorTest와 같은 기대값)", () => {
    it("아세트아미노펜: A 23.5 · B 64 · C 19, 초 단위 절사, 15분 유효", () => {
        const quotes = buildQuotes("task-1", ACETAMINOPHEN, NOW);
        expect(quotes.map((q) => q.merchantId)).toEqual(["pharmacy-a", "pharmacy-b", "pharmacy-c"]);
        expect(quotes.map((q) => q.totalAmountBaseUnits)).toEqual(["23500000", "64000000", "19000000"]);
        for (const quote of quotes) {
            expect(BigInt(quote.itemAmountBaseUnits) + BigInt(quote.deliveryFeeBaseUnits)).toBe(BigInt(quote.totalAmountBaseUnits));
            expect(quote.asset).toEqual({ chainId: 11155111, tokenAddress: "0x84b494ff145a545d286321691a9b4febe6947d6a", tokenDecimals: 6 });
            expect(quote.quotedAt).toBe("2026-09-30T01:00:00.000Z");
            expect(Date.parse(quote.expiresAt) - Date.parse(quote.quotedAt)).toBe(QUOTE_TTL_MS);
        }
    });

    it("이부프로펜: B만 재고 없음, 모르는 상품은 빈 배열", () => {
        expect(buildQuotes("task-1", IBUPROFEN, NOW).map((q) => q.inStock)).toEqual([true, false, true]);
        expect(buildQuotes("task-1", "unknown-item", NOW)).toEqual([]);
    });

    it("C만 payTo가 등록 주소와 다르다", () => {
        const [a, b, c] = buildQuotes("task-1", ACETAMINOPHEN, NOW);
        expect(a.quotedPayToAddress).toBe(a.recipientAddress);
        expect(b.quotedPayToAddress).toBe(b.recipientAddress);
        expect(c.recipientAddress).toBe("0x00000000000000000000000000000000f10aa003");
        expect(c.quotedPayToAddress).toBe(PHARMACY_C_QUOTED_PAY_TO);
    });

    it("quoteId는 서버와 같은 규칙으로 결정적", () => {
        const first = buildQuotes("task-1", ACETAMINOPHEN, NOW);
        expect(buildQuotes("task-1", ACETAMINOPHEN, new Date("2026-09-30T01:00:00.100Z"))).toEqual(first);
        expect(buildQuotes("task-2", ACETAMINOPHEN, NOW)[0].quoteId).not.toBe(first[0].quoteId);

        const expected = createHash("sha256")
            .update(`task-1|pharmacy-a|${ACETAMINOPHEN}|${Date.parse("2026-09-30T01:00:00Z") / 1000}`)
            .digest("hex")
            .slice(0, 16);
        expect(first[0].quoteId).toBe(`qt_a_${expected}`);
    });

    it("판매처 수취 주소는 서로 다르다", () => {
        expect(new Set(MERCHANTS.map((m) => m.recipientAddress)).size).toBe(3);
    });
});
