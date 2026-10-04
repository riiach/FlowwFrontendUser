// API PATHS 모음
export const API_PATHS = Object.freeze({
    walletAuth: "/api/wallet-auth",
    tasks: "/api/tasks",
    adminSession: "/api/session",
    adminAudit: "/api/audit",
    upstreamWalletNonce: "/api/v1/auth/wallet/nonce",
    upstreamWalletVerify: "/api/v1/auth/wallet/verify",
    upstreamTasks: "/api/v1/tasks",
});

// 서버와 STATUS 맞추기
export const WALLET_AUTH_ACTIONS = Object.freeze([
    "config",
    "health",
    "session",
    "challenge",
    "verify",
    "logout",
    "demo",
] as const);

// 세션 쿠키 이름들
export const SESSION_COOKIE_NAMES = Object.freeze({
    challenge: "floww_wallet_challenge",
    session: "floww_wallet_session",
    mockState: "floww_mock_state",
});

export const COOKIE_MAX_AGE = Object.freeze({
    challenge: 5 * 60,
});

// 요청 Time Out
export const REQUEST_LIMITS = Object.freeze({
    /** General BFF upstream request timeout. */
    timeoutMs: 30_000,
    /** AI proposal generation has a longer documented timeout. */
    aiProposalTimeoutMs: 120_000,
    /** Maximum accepted request body size. */
    requestBodyBytes: 8 * 1024,
    /** Maximum upstream response body size. */
    responseBodyBytes: 4 * 1024 * 1024,
    /** Default Task list page size. */
    taskListLimit: 20,
    taskListMinLimit: 1,
    taskListMaxLimit: 50,
    /** Event page size and maximum cursor pages fetched in one loop. */
    eventPageLimit: 50,
    eventMaxPages: 20,
});

export const SUPPORTED_ASSET = Object.freeze({
    chainId: 11_155_111,
    tokenDecimals: 6,
});

// 서버와 에러코드 맞추기
export const API_ERROR_CODES = Object.freeze({
    taskConnectionNotConfigured: "TASK_CONNECTION_NOT_CONFIGURED",
    backendNotConfigured: "BACKEND_NOT_CONFIGURED",
    unauthorized: "UNAUTHORIZED",
    backendAccessProtected: "BACKEND_ACCESS_PROTECTED",
    upstreamUnavailable: "UPSTREAM_UNAVAILABLE",
    invalidResponse: "INVALID_RESPONSE",
    chainNotReady: "CHAIN_NOT_READY",
    routeNotAllowed: "ROUTE_NOT_ALLOWED",
    originNotAllowed: "ORIGIN_NOT_ALLOWED",
    invalidInput: "INVALID_INPUT",
    invalidIdempotencyKey: "INVALID_IDEMPOTENCY_KEY",
});