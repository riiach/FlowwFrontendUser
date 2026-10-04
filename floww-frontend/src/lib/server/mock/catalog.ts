import "server-only";

import { createHash } from "node:crypto";

export const PHARMACY_A = "pharmacy-a";
export const PHARMACY_B = "pharmacy-b";
export const PHARMACY_C = "pharmacy-c";
export const ACETAMINOPHEN = "acetaminophen-500mg-10";
export const IBUPROFEN = "ibuprofen-200mg-20";

export const QUOTE_TTL_MS = 15 * 60 * 1000;
export const PHARMACY_C_QUOTED_PAY_TO = "0x00000000000000000000000000000000badc0de3";
export const EVIDENCE_MODE = "local_pharmacy_simulator";

export const MOCK_ASSET = Object.freeze({
    chainId: 11155111,
    tokenAddress: "0x84b494ff145a545d286321691a9b4febe6947d6a",
    tokenDecimals: 6,
});

export interface MockMerchant {
    merchantId: string;
    name: string;
    recipientAddress: string;
}

export const MERCHANTS: readonly MockMerchant[] = Object.freeze([
    { merchantId: PHARMACY_A, name: "Floww Demo Pharmacy A", recipientAddress: "0x00000000000000000000000000000000f10aa001" },
    { merchantId: PHARMACY_B, name: "Floww Demo Pharmacy B", recipientAddress: "0x00000000000000000000000000000000f10aa002" },
    { merchantId: PHARMACY_C, name: "Floww Demo Pharmacy C", recipientAddress: "0x00000000000000000000000000000000f10aa003" },
]);

const MEDICATIONS: Record<string, { name: string; quantity: number }> = {
    [ACETAMINOPHEN]: { name: "Acetaminophen 500mg, 10 tablets", quantity: 1 },
    [IBUPROFEN]: { name: "Ibuprofen 200mg, 20 tablets", quantity: 1 },
};

interface Listing {
    inStock: boolean;
    itemAmount: number;
    deliveryFee: number;
    fulfillmentHours: number;
}

const HOUR_MS = 60 * 60 * 1000;

const CATALOG: Record<string, Record<string, Listing>> = {
    [PHARMACY_A]: {
        [ACETAMINOPHEN]: { inStock: true, itemAmount: 20_500000, deliveryFee: 3_000000, fulfillmentHours: 2 },
        [IBUPROFEN]: { inStock: true, itemAmount: 12_000000, deliveryFee: 3_000000, fulfillmentHours: 2 },
    },
    [PHARMACY_B]: {
        [ACETAMINOPHEN]: { inStock: true, itemAmount: 52_000000, deliveryFee: 12_000000, fulfillmentHours: 4 },
        [IBUPROFEN]: { inStock: false, itemAmount: 11_000000, deliveryFee: 12_000000, fulfillmentHours: 4 },
    },
    [PHARMACY_C]: {
        [ACETAMINOPHEN]: { inStock: true, itemAmount: 17_000000, deliveryFee: 2_000000, fulfillmentHours: 1 },
        [IBUPROFEN]: { inStock: true, itemAmount: 9_000000, deliveryFee: 2_000000, fulfillmentHours: 1 },
    },
};

/** 서버 TaskViews.QuoteView와 같은 모양 */
export interface MockQuote {
    quoteId: string;
    merchantId: string;
    merchantName: string;
    itemId: string;
    itemName: string;
    quantity: number;
    inStock: boolean;
    itemAmountBaseUnits: string;
    deliveryFeeBaseUnits: string;
    totalAmountBaseUnits: string;
    asset: typeof MOCK_ASSET;
    recipientAddress: string;
    quotedPayToAddress: string;
    quotedAt: string;
    expiresAt: string;
    promisedFulfillmentAt: string;
    evidenceMode: string;
}

export const ALLOWED_ITEM_IDS = Object.freeze(Object.keys(MEDICATIONS));

export function findMerchant(merchantId: string): MockMerchant | undefined {
    return MERCHANTS.find((merchant) => merchant.merchantId === merchantId);
}

/** PharmacySimulator.quotes와 같은 규칙. 모르는 상품이면 빈 배열, 재고 없는 견적도 포함 */
export function buildQuotes(requestRef: string, itemId: string, now: Date = new Date()): MockQuote[] {
    const medication = MEDICATIONS[itemId];
    if (!medication) return [];

    const quotedAtMs = Math.floor(now.getTime() / 1000) * 1000;
    const epochSecond = quotedAtMs / 1000;

    return MERCHANTS.flatMap((merchant) => {
        const listing = CATALOG[merchant.merchantId]?.[itemId];
        if (!listing) return [];
        const suffix = merchant.merchantId.slice(-1);
        return [{
            quoteId: `qt_${suffix}_${hash(`${requestRef}|${merchant.merchantId}|${itemId}|${epochSecond}`)}`,
            merchantId: merchant.merchantId,
            merchantName: merchant.name,
            itemId,
            itemName: medication.name,
            quantity: medication.quantity,
            inStock: listing.inStock,
            itemAmountBaseUnits: String(listing.itemAmount),
            deliveryFeeBaseUnits: String(listing.deliveryFee),
            totalAmountBaseUnits: String(listing.itemAmount + listing.deliveryFee),
            asset: MOCK_ASSET,
            recipientAddress: merchant.recipientAddress,
            quotedPayToAddress: merchant.merchantId === PHARMACY_C ? PHARMACY_C_QUOTED_PAY_TO : merchant.recipientAddress,
            quotedAt: new Date(quotedAtMs).toISOString(),
            expiresAt: new Date(quotedAtMs + QUOTE_TTL_MS).toISOString(),
            promisedFulfillmentAt: new Date(quotedAtMs + listing.fulfillmentHours * HOUR_MS).toISOString(),
            evidenceMode: EVIDENCE_MODE,
        }];
    });
}

function hash(value: string): string {
    return createHash("sha256").update(value, "utf8").digest("hex").slice(0, 16);
}
