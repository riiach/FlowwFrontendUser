import "server-only";

import type { NextRequest, NextResponse } from "next/server";
import type { z } from "zod";
import { API_PATHS, COOKIE_MAX_AGE, SESSION_COOKIE_NAMES } from "@/lib/constants/constants";
import {
    WalletNonceResponseSchema,
    WalletSigninResponseSchema,
} from "@/lib/api/schemas/wallet";
import type {
    Address,
    ApiErrorBody,
    WalletNonceRequest,
    WalletNonceResponse,
    WalletSession,
    WalletSigninResponse,
    WalletVerifyRequest,
} from "@/lib/types";
import { BffError, normalizeUpstreamError } from "./errors";
import { cookieOptions, open, seal, type ServerSession } from "./session";
import { upstreamFetch } from "./upstream";

/* ──────────────────────────────────────────────
 * 서버 호출 (nonce · verify)
 * ────────────────────────────────────────────── */

/** 서버가 2xx가 아닌 응답을 줬을 때. 라우트는 body를 status 그대로 돌려준다 */
export class UpstreamResponseError extends Error {
    readonly status: number;
    readonly body: ApiErrorBody;

    constructor(status: number, body: ApiErrorBody) {
        super(body.reasonCode);
        this.name = "UpstreamResponseError";
        this.status = status;
        this.body = body;
    }
}

async function postUpstream<S extends z.ZodType>(path: string, body: unknown, schema: S): Promise<z.output<S>> {
    const { status, data } = await upstreamFetch(path, { method: "POST", body });
    if (status < 200 || status >= 300) throw new UpstreamResponseError(status, normalizeUpstreamError(status, data));
    const result = schema.safeParse(data);
    if (!result.success) throw new BffError("INVALID_RESPONSE", 502);
    return result.data;
}

/** POST /api/v1/auth/wallet/nonce — 키 2개만 보낸다 */
export function requestNonce({ address, chainId }: WalletNonceRequest): Promise<WalletNonceResponse> {
    return postUpstream(API_PATHS.upstreamWalletNonce, { address, chainId }, WalletNonceResponseSchema);
}

/** POST /api/v1/auth/wallet/verify — 정확히 { message, signature }만 보낸다 */
export function verifySignin({ message, signature }: WalletVerifyRequest): Promise<WalletSigninResponse> {
    return postUpstream(API_PATHS.upstreamWalletVerify, { message, signature }, WalletSigninResponseSchema);
}

/* ──────────────────────────────────────────────
 * challenge 쿠키 (HttpOnly, 5분)
 * nonce·message는 여기에만 두고 브라우저 응답에는 message만 준다
 * ────────────────────────────────────────────── */

export interface WalletChallenge {
    nonce: string;
    message: string;
    address: Address;
    chainId: number;
    expiresAt: string;
}

const CHALLENGE_COOKIE_PATH = API_PATHS.walletAuth;

export function setChallengeCookie(response: NextResponse, challenge: WalletChallenge): void {
    response.cookies.set(SESSION_COOKIE_NAMES.challenge, seal(challenge), {
        ...cookieOptions(),
        path: CHALLENGE_COOKIE_PATH,
        maxAge: COOKIE_MAX_AGE.challenge,
    });
}

export function clearChallengeCookie(response: NextResponse): void {
    response.cookies.set(SESSION_COOKIE_NAMES.challenge, "", {
        ...cookieOptions(),
        path: CHALLENGE_COOKIE_PATH,
        maxAge: 0,
    });
}

/** 쿠키가 없거나, 변조됐거나, 5분이 지났으면 null */
export function readChallenge(request: NextRequest, now: Date = new Date()): WalletChallenge | null {
    const sealed = request.cookies.get(SESSION_COOKIE_NAMES.challenge)?.value;
    if (!sealed) return null;
    const challenge = open<WalletChallenge>(sealed);
    if (!challenge || typeof challenge.message !== "string" || typeof challenge.nonce !== "string") return null;
    const expiresAt = Date.parse(challenge.expiresAt);
    if (!Number.isFinite(expiresAt) || expiresAt <= now.getTime()) return null;
    return challenge;
}

/* ──────────────────────────────────────────────
 * 세션
 * ────────────────────────────────────────────── */

/** 서버 로그인 응답 → 암호화해서 쿠키에 넣을 세션. 주소는 서버처럼 소문자로 */
export function toServerSession(
    signin: WalletSigninResponse,
    address: Address,
    chainId: number,
    now: Date = new Date(),
): ServerSession {
    return {
        accessToken: signin.accessToken,
        identity: { namespace: "eip155", address: address.toLowerCase() as Address },
        chainId,
        expiresAt: new Date(now.getTime() + signin.expiresIn * 1000).toISOString(),
    };
}

/** 브라우저로 보낼 세션 (accessToken 제거) */
export function toWalletSession({ identity, chainId, expiresAt }: ServerSession): WalletSession {
    return { identity, chainId, expiresAt };
}