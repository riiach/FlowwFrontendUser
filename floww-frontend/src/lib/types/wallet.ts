import type { ServerErrorResponse } from "./api";

/**
 * 지갑 로그인 타입.
 *
 * 두 구간을 나눠서 정의한다.
 *  1) Server contract — BFF ↔ Floww Server (/api/v1/auth/wallet/*)
 *     Floww_Server f729b0e 기준: WalletSigninController, WalletSigninService,
 *     WalletSigninInputs, SigninResponse, UserResponse
 *  2) Browser contract — 브라우저 ↔ BFF (/api/wallet-auth/*)
 *     JWT(accessToken)는 절대 브라우저로 내려가지 않는다.
 */

/** 0x로 시작하는 16진수 문자열 */
export type Hex = `0x${string}`;

/** 0x + 40자리 16진수. 서버는 소문자로 정규화해서 저장한다. */
export type Address = `0x${string}`;

/* ──────────────────────────────────────────────
 * 1) Server contract (BFF ↔ Floww Server)
 * ────────────────────────────────────────────── */

/**
 * POST /api/v1/auth/wallet/nonce 요청.
 * 서버는 키가 정확히 2개일 때만 받는다 (다른 키가 있으면 400 INVALID_INPUT).
 * - address: 0x + 40 hex, 대소문자가 섞였으면 EIP-55 체크섬이 맞아야 함
 * - chainId: 양의 정수 (문자열 불가)
 */
export interface WalletNonceRequest {
    address: Address;
    chainId: number;
}

/** POST /api/v1/auth/wallet/nonce 응답 (WalletSigninService.NonceResponse) */
export interface WalletNonceResponse {
    /** 1회용 challenge 값. 5분 후 만료 */
    nonce: string;
    /** 지갑이 그대로 서명할 SIWE 메시지 (최대 1024자) */
    message: string;
    /** ISO-8601 */
    expiresAt: string;
}

/**
 * POST /api/v1/auth/wallet/verify 요청.
 * 서버는 키가 정확히 2개일 때만 받는다. challengeId 같은 키를 더하면 400.
 * - signature: 0x + 130 hex (65바이트 EIP-191 personal_sign)
 */
export interface WalletVerifyRequest {
    message: string;
    signature: Hex;
}

export type UserRole = "USER" | "ADMIN";
export type AuthProvider = "EMAIL" | "WALLET";
/** DB에는 둘 다 정의돼 있지만, 현재 지갑 로그인은 항상 EXTERNAL로 저장된다 */
export type WalletType = "EXTERNAL" | "MAGIC_EMBEDDED";

/** UserResponse.wallets 항목 (WalletSigninService.WalletResponse) */
export interface LinkedWallet {
    walletId: string;
    address: Address;
    walletType: WalletType;
    primary: boolean;
}

/** UserResponse */
export interface FlowwUser {
    userId: string;
    /** 지갑으로만 가입한 사용자는 null */
    email: string | null;
    displayName: string | null;
    role: UserRole;
    providers: AuthProvider[];
    wallets: LinkedWallet[];
    /** ISO-8601 */
    createdAt: string;
}

/** POST /api/v1/auth/wallet/verify 응답 (SigninResponse) */
export interface WalletSigninResponse {
    /** JWT. BFF에서만 다루고 세션 쿠키에 암호화해서 넣는다 */
    accessToken: string;
    tokenType: "Bearer";
    /** 초 단위 */
    expiresIn: number;
    isNewUser: boolean;
    user: FlowwUser;
}

/* ──────────────────────────────────────────────
 * 2) Browser contract (브라우저 ↔ BFF)
 * ────────────────────────────────────────────── */

export interface WalletIdentity {
    namespace: "eip155";
    address: Address;
}

/** GET /api/wallet-auth/session — 세션이 없으면 null */
export interface WalletSession {
    identity: WalletIdentity;
    chainId: number;
    /** ISO-8601 */
    expiresAt: string;
}

export type WalletSessionResponse = WalletSession | null;

/** GET /api/wallet-auth/config */
export interface WalletAuthConfig {
    enabled: boolean;
    allowedChainIds: number[];
    /** FLOWW_UPSTREAM=mock 일 때 true → 화면에 "DEMO DATA" 배지 */
    mock: boolean;
}

export interface WalletAuthHealth {
    /** BFF가 전달하는 진단 정보 */
    [field: string]: unknown;
}

/** POST /api/wallet-auth/challenge 요청 — 서버 nonce 요청과 같은 형식 */
export type WalletChallengeRequest = WalletNonceRequest;

/**
 * POST /api/wallet-auth/challenge 응답.
 * nonce는 BFF가 HttpOnly challenge 쿠키에만 보관하고 브라우저에는 주지 않는다.
 */
export interface WalletChallengeResponse {
    message: string;
    expiresAt: string;
}

/**
 * POST /api/wallet-auth/verify 응답.
 * accessToken 없이 세션 정보만 돌려준다 (JWT는 쿠키 안에만 있음).
 */
export interface WalletVerifyResponse {
    session: WalletSession;
    isNewUser: boolean;
}

/** 지갑 로그인 API가 돌려주는 사유 코드 (ErrorCode.java) */
export type WalletAuthErrorCode =
    | "INVALID_INPUT"        // 400 키 개수·주소·서명 형식이 틀림
    | "CHAIN_NOT_SUPPORTED"  // 400 허용되지 않은 chainId
    | "NONCE_INVALID"        // 401 없는 nonce이거나 이미 사용됨
    | "NONCE_EXPIRED"        // 401 5분 지남
    | "MESSAGE_MISMATCH"     // 401 서명한 메시지가 발급한 메시지와 다름
    | "SIGNATURE_INVALID"    // 401 서명 주소가 요청 주소와 다름
    | "USER_SUSPENDED"       // 403 정지된 사용자
    | "TOO_MANY_REQUESTS";   // 429 요청이 너무 많음 (retryable: true)

/** 지갑 로그인 에러 응답 (서버 → BFF) */
export type WalletAuthErrorResponse = ServerErrorResponse<WalletAuthErrorCode>;