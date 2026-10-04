import "server-only";

import { createHash } from "node:crypto";
import { getAddress, isAddress, verifyMessage } from "viem";
import { createSiweMessage, generateSiweNonce, parseSiweMessage } from "viem/siwe";
import { WalletNonceRequestSchema, WalletVerifyRequestSchema } from "@/lib/api/schemas/wallet";
import { API_PATHS } from "@/lib/constants/constants";
import type { Address, FlowwUser, WalletNonceResponse, WalletSigninResponse } from "@/lib/types";
import { serverEnv } from "../env";
import { mockError, ok, route, type MockRoute } from "./http";

/**
 * 목 서버 지갑 로그인 (WalletSigninController와 같은 경로·규칙)
 * - nonce: SIWE 메시지 생성, 5분 후 만료
 * - verify: viem verifyMessage로 진짜 서명 검증, nonce는 1회용
 * - 요청 키가 정확히 2개가 아니면 400 INVALID_INPUT
 */

export const MOCK_NONCE_TTL_MS = 5 * 60 * 1000;
export const MOCK_TOKEN_TTL_SECONDS = 60 * 60;
export const MOCK_SIWE_DOMAIN = "floww.mock";
export const MOCK_SIWE_URI = "https://floww.mock";
const MOCK_SIWE_STATEMENT = "Sign in to Floww";
const MOCK_TOKEN_PREFIX = "mock.";

const invalidInput = () => mockError(400, "INVALID_INPUT", "요청 형식이 올바르지 않습니다", "Invalid input");

/* ──────────────────────────────────────────────
 * 목 accessToken — 진짜 JWT가 아니라 다른 목 핸들러가 사용자를 알아보기 위한 값
 * ────────────────────────────────────────────── */

export interface MockTokenPayload {
    sub: string;
    address: Address;
    /** epoch seconds */
    exp: number;
}

export function createMockAccessToken(payload: MockTokenPayload): string {
    return `${MOCK_TOKEN_PREFIX}${Buffer.from(JSON.stringify(payload), "utf8").toString("base64url")}`;
}

/** 형식이 다르거나 만료됐으면 null */
export function readMockAccessToken(token: string | undefined, now: Date = new Date()): MockTokenPayload | null {
    if (!token?.startsWith(MOCK_TOKEN_PREFIX)) return null;
    try {
        const payload = JSON.parse(Buffer.from(token.slice(MOCK_TOKEN_PREFIX.length), "base64url").toString("utf8"));
        if (typeof payload?.sub !== "string" || typeof payload?.address !== "string") return null;
        if (typeof payload.exp !== "number" || payload.exp * 1000 <= now.getTime()) return null;
        return payload as MockTokenPayload;
    } catch {
        return null;
    }
}

function mockUserId(address: string): string {
    return `usr_${createHash("sha256").update(address, "utf8").digest("hex").slice(0, 16)}`;
}

/* ──────────────────────────────────────────────
 * 핸들러
 * ────────────────────────────────────────────── */

const nonce = route("POST", API_PATHS.upstreamWalletNonce, ({ body, state, now }) => {
    const parsed = WalletNonceRequestSchema.safeParse(body);
    // 대소문자가 섞인 주소는 EIP-55 체크섬까지 맞아야 한다
    if (!parsed.success || !isAddress(parsed.data.address)) return invalidInput();

    const { address, chainId } = parsed.data;
    if (!serverEnv().walletChainIds.includes(chainId)) {
        return mockError(400, "CHAIN_NOT_SUPPORTED", "지원하지 않는 체인입니다", "Chain not supported");
    }

    const value = generateSiweNonce();
    const expiresAt = new Date(now.getTime() + MOCK_NONCE_TTL_MS);
    const message = createSiweMessage({
        domain: MOCK_SIWE_DOMAIN,
        uri: MOCK_SIWE_URI,
        statement: MOCK_SIWE_STATEMENT,
        version: "1",
        address: getAddress(address),
        chainId,
        nonce: value,
        issuedAt: now,
        expirationTime: expiresAt,
    });

    state.nonces.push({
        nonce: value,
        message,
        address: address.toLowerCase(),
        chainId,
        expiresAt: expiresAt.toISOString(),
    });

    const response: WalletNonceResponse = { nonce: value, message, expiresAt: expiresAt.toISOString() };
    return ok(response);
});

const verify = route("POST", API_PATHS.upstreamWalletVerify, async ({ body, state, now }) => {
    const parsed = WalletVerifyRequestSchema.safeParse(body);
    if (!parsed.success) return invalidInput();
    const { message, signature } = parsed.data;

    let nonceValue: string | undefined;
    try {
        nonceValue = parseSiweMessage(message).nonce;
    } catch {
        nonceValue = undefined;
    }
    const index = nonceValue ? state.nonces.findIndex((stored) => stored.nonce === nonceValue) : -1;
    if (index < 0) {
        return mockError(401, "NONCE_INVALID", "유효하지 않거나 이미 사용된 nonce입니다", "Nonce is invalid or already used");
    }

    // 1회용: 찾은 순간 지운다 (성공·실패와 상관없이 재사용 불가)
    const [stored] = state.nonces.splice(index, 1);
    if (Date.parse(stored.expiresAt) <= now.getTime()) {
        return mockError(401, "NONCE_EXPIRED", "nonce가 만료되었습니다", "Nonce expired");
    }
    if (stored.message !== message) {
        return mockError(401, "MESSAGE_MISMATCH", "서명한 메시지가 발급한 메시지와 다릅니다", "Message mismatch");
    }

    const address = stored.address as Address;
    const valid = await verifyMessage({ address, message, signature }).catch(() => false);
    if (!valid) {
        return mockError(401, "SIGNATURE_INVALID", "서명이 올바르지 않습니다", "Signature is invalid");
    }

    const userId = mockUserId(address);
    const user: FlowwUser = {
        userId,
        email: null,
        displayName: null,
        role: "USER",
        providers: ["WALLET"],
        wallets: [{ walletId: `wal_${userId.slice(4)}`, address, walletType: "EXTERNAL", primary: true }],
        createdAt: now.toISOString(),
    };
    const response: WalletSigninResponse = {
        accessToken: createMockAccessToken({
            sub: userId,
            address,
            exp: Math.floor(now.getTime() / 1000) + MOCK_TOKEN_TTL_SECONDS,
        }),
        tokenType: "Bearer",
        expiresIn: MOCK_TOKEN_TTL_SECONDS,
        // 목 서버는 사용자를 저장하지 않는다
        isNewUser: false,
        user,
    };
    return ok(response);
});

export const AUTH_ROUTES: readonly MockRoute[] = [nonce, verify];