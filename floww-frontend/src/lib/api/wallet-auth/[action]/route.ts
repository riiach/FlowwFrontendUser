import { NextResponse, type NextRequest } from "next/server";
import type { z } from "zod";
import { WalletNonceRequestSchema, WalletVerifyRequestSchema } from "@/lib/api/schemas/wallet";
import { SESSION_COOKIE_NAMES } from "@/lib/constants/constants";
import type {
    WalletAuthHealth,
    WalletChallengeResponse,
    WalletSessionResponse,
    WalletVerifyResponse,
} from "@/lib/types";
import { walletAuthConfig } from "@/lib/server/config";
import { serverEnv } from "@/lib/server/env";
import { BffError, toErrorResponse } from "@/lib/server/errors";
import { assertEmptyBody, assertSameOrigin, readJsonBody } from "@/lib/server/guard";
import { clearSessionCookie, readSession, setSessionCookie } from "@/lib/server/session";
import {
    clearChallengeCookie,
    readChallenge,
    requestNonce,
    setChallengeCookie,
    toServerSession,
    toWalletSession,
    UpstreamResponseError,
    verifySignin,
} from "@/lib/server/wallet-auth";

/**
 * 지갑 로그인 BFF (브라우저 ↔ BFF)
 *
 * GET  config · health · session
 * POST challenge · verify · logout
 *
 * accessToken(JWT)은 암호화된 HttpOnly 세션 쿠키에만 있고 응답 본문에는 절대 넣지 않는다.
 */

type Context = { params: Promise<{ action: string }> };
type Handler = (request: NextRequest) => Promise<NextResponse>;

/* ──────────────────────────────────────────────
 * GET
 * ────────────────────────────────────────────── */

async function config(): Promise<NextResponse> {
    return NextResponse.json(walletAuthConfig());
}

async function health(): Promise<NextResponse> {
    const env = serverEnv();
    const body: WalletAuthHealth = {
        upstream: env.upstream,
        walletAuthEnabled: env.walletAuthEnabled,
        sessionConfigured: env.sessionKey !== null,
    };
    return NextResponse.json(body);
}

async function session(request: NextRequest): Promise<NextResponse> {
    const current = readSession(request);
    const body: WalletSessionResponse = current ? toWalletSession(current) : null;
    const response = NextResponse.json(body);
    // 쿠키는 있는데 열 수 없으면(만료·변조) 지운다
    if (!current && request.cookies.has(SESSION_COOKIE_NAMES.session)) clearSessionCookie(response);
    return response;
}

/* ──────────────────────────────────────────────
 * POST
 * ────────────────────────────────────────────── */

function assertWalletAuthEnabled(): void {
    if (!serverEnv().walletAuthEnabled) throw new BffError("BACKEND_NOT_CONFIGURED", 503);
}

async function readInput<S extends z.ZodType>(request: NextRequest, schema: S): Promise<z.output<S>> {
    const result = schema.safeParse(await readJsonBody(request));
    if (!result.success) throw new BffError("INVALID_INPUT", 400);
    return result.data;
}

/** 서버 nonce 발급 → { nonce, message }를 challenge 쿠키(5분)에 저장 → 브라우저엔 message만 */
async function challenge(request: NextRequest): Promise<NextResponse> {
    assertWalletAuthEnabled();
    const { address, chainId } = await readInput(request, WalletNonceRequestSchema);
    const { nonce, message, expiresAt } = await requestNonce({ address, chainId });

    const body: WalletChallengeResponse = { message, expiresAt };
    const response = NextResponse.json(body);
    setChallengeCookie(response, { nonce, message, address, chainId, expiresAt });
    return response;
}

/** challenge 쿠키의 message와 일치 확인 → 서버엔 2개 키만 → accessToken 암호화 → 세션 쿠키 */
async function verify(request: NextRequest): Promise<NextResponse> {
    assertWalletAuthEnabled();
    const { message, signature } = await readInput(request, WalletVerifyRequestSchema);
    const stored = readChallenge(request);
    if (!stored) throw new BffError("CHALLENGE_REQUIRED", 401);
    if (stored.message !== message) throw new BffError("CHALLENGE_MISMATCH", 401);

    let signin;
    try {
        signin = await verifySignin({ message, signature });
    } catch (error) {
        // nonce는 1회용이라 실패해도 challenge를 다시 받아야 한다
        const response = toWalletAuthError(error);
        clearChallengeCookie(response);
        return response;
    }

    const serverSession = toServerSession(signin, stored.address, stored.chainId);
    const body: WalletVerifyResponse = { session: toWalletSession(serverSession), isNewUser: signin.isNewUser };
    const response = NextResponse.json(body);
    setSessionCookie(response, serverSession);
    clearChallengeCookie(response);
    return response;
}

/** 세션·challenge 쿠키 삭제 */
async function logout(request: NextRequest): Promise<NextResponse> {
    await assertEmptyBody(request);
    const response = new NextResponse(null, { status: 204 });
    clearSessionCookie(response);
    clearChallengeCookie(response);
    return response;
}

/* ──────────────────────────────────────────────
 * 라우팅
 * ────────────────────────────────────────────── */

const GET_ACTIONS: Record<string, Handler> = { config, health, session };
const POST_ACTIONS: Record<string, Handler> = { challenge, verify, logout };

function toWalletAuthError(error: unknown): NextResponse {
    if (error instanceof UpstreamResponseError) return NextResponse.json(error.body, { status: error.status });
    return toErrorResponse(error);
}

function dispatch(actions: Record<string, Handler>, sameOriginOnly: boolean) {
    return async (request: NextRequest, context: Context): Promise<NextResponse> => {
        try {
            const { action } = await context.params;
            const handler = Object.hasOwn(actions, action) ? actions[action] : undefined;
            if (!handler) throw new BffError("ROUTE_NOT_ALLOWED", 404);
            if (sameOriginOnly) assertSameOrigin(request);
            return await handler(request);
        } catch (error) {
            return toWalletAuthError(error);
        }
    };
}

export const GET = dispatch(GET_ACTIONS, false);
export const POST = dispatch(POST_ACTIONS, true);