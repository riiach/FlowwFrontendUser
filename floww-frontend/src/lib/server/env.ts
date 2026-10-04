import "server-only";

export type UpstreamMode = "http" | "mock";
export type WalletAuthMode = "team-jwt";

export interface ServerEnv {
    /** 업스트림: 실제 Floww 서버(http) 또는 BFF 안의 목 서버(mock) */
    upstream: UpstreamMode;
    /** Floww 서버 origin (끝 슬래시 없음). mock 모드에서는 없어도 됨 */
    apiBaseUrl: string | null;
    /** 세션 쿠키 암호화 키 32바이트. 없으면 null */
    sessionKey: Buffer | null;
    walletAuthEnabled: boolean;
    walletAuthMode: WalletAuthMode;
    walletChainIds: readonly number[];
    businessJwtEnabled: boolean;
    /** 보호된 Vercel Preview 서버 접근용. 없으면 null */
    vercelBypassSecret: string | null;
    /** 쿠키 Secure 여부 판단용 */
    isProduction: boolean;
}

/** 환경변수 오류. 메시지에는 변수 이름과 규칙만 담는다 */
export class EnvError extends Error {
    readonly variable: string;

    constructor(variable: string, rule: string) {
        super(`${variable}: ${rule}`);
        this.name = "EnvError";
        this.variable = variable;
    }
}

type Source = Record<string, string | undefined>;

const DEFAULT_CHAIN_IDS = [11155111] as const; // Sepolia
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

function read(source: Source, name: string): string | undefined {
    const value = source[name]?.trim();
    return value ? value : undefined;
}

function readBoolean(source: Source, name: string, fallback: boolean): boolean {
    const value = read(source, name)?.toLowerCase();
    if (value === undefined) return fallback;
    if (value === "true" || value === "1") return true;
    if (value === "false" || value === "0") return false;
    throw new EnvError(name, "must be true or false");
}

function readUpstream(source: Source): UpstreamMode {
    const value = read(source, "FLOWW_UPSTREAM")?.toLowerCase() ?? "http";
    if (value === "http" || value === "mock") return value;
    throw new EnvError("FLOWW_UPSTREAM", "must be http or mock");
}

/**
 * 서버 origin 검증.
 * - https는 어떤 호스트든 허용, http는 localhost / 127.0.0.1 / [::1]만 허용
 * - 경로·쿼리·해시·계정 정보 없이 origin만 (예: https://floww-server-demo.vercel.app)
 */
function readApiBaseUrl(source: Source): string | null {
    const name = "FLOWW_API_BASE_URL";
    const value = read(source, name);
    if (!value) return null;

    let url: URL;
    try {
        url = new URL(value);
    } catch {
        throw new EnvError(name, "must be an absolute URL");
    }

    const isLocal = LOCAL_HOSTS.has(url.hostname);
    if (url.protocol !== "https:" && !(url.protocol === "http:" && isLocal)) {
        throw new EnvError(name, "must use https (http is allowed only for localhost)");
    }
    if (url.username || url.password) throw new EnvError(name, "must not contain credentials");
    if (url.pathname !== "/" || url.search || url.hash) {
        throw new EnvError(name, "must be an origin only (no path, query or hash)");
    }
    return url.origin;
}

/** 세션 키: 64자 hex = 32바이트 (openssl rand -hex 32) */
function readSessionKey(source: Source): Buffer | null {
    const name = "FLOWW_SESSION_SECRET";
    const value = read(source, name);
    if (!value) return null;
    if (!/^[0-9a-fA-F]{64}$/.test(value)) {
        throw new EnvError(name, "must be 64 hex characters (generate with: openssl rand -hex 32)");
    }
    return Buffer.from(value, "hex");
}

/** 체인 목록: "11155111" 또는 "11155111,1" */
function readChainIds(source: Source): readonly number[] {
    const name = "FLOWW_WALLET_CHAIN_IDS";
    const value = read(source, name);
    if (!value) return DEFAULT_CHAIN_IDS;

    const ids = value.split(",").map((part) => part.trim());
    if (ids.some((id) => !/^[1-9][0-9]*$/.test(id))) {
        throw new EnvError(name, "must be comma-separated positive integers");
    }
    const unique = [...new Set(ids.map(Number))];
    if (unique.some((id) => !Number.isSafeInteger(id))) throw new EnvError(name, "chain id is too large");
    return Object.freeze(unique);
}

function readWalletAuthMode(source: Source): WalletAuthMode {
    const value = read(source, "FLOWW_WALLET_AUTH_MODE") ?? "team-jwt";
    if (value === "team-jwt") return value;
    throw new EnvError("FLOWW_WALLET_AUTH_MODE", "must be team-jwt");
}

function readBypassSecret(source: Source): string | null {
    const name = "FLOWW_SERVER_VERCEL_BYPASS_SECRET";
    const value = read(source, name);
    if (!value) return null;
    if (/\s/.test(value)) throw new EnvError(name, "must not contain whitespace");
    return value;
}

/** 환경변수 객체를 읽어 검증한다. 테스트에서는 원하는 값을 넣어 직접 호출한다 */
export function readServerEnv(source: Source = process.env): ServerEnv {
    return Object.freeze({
        upstream: readUpstream(source),
        apiBaseUrl: readApiBaseUrl(source),
        sessionKey: readSessionKey(source),
        walletAuthEnabled: readBoolean(source, "FLOWW_WALLET_AUTH_ENABLED", true),
        walletAuthMode: readWalletAuthMode(source),
        walletChainIds: readChainIds(source),
        businessJwtEnabled: readBoolean(source, "FLOWW_BUSINESS_JWT_ENABLED", true),
        vercelBypassSecret: readBypassSecret(source),
        isProduction: source.NODE_ENV === "production",
    });
}

let cached: ServerEnv | null = null;

/** 검증된 환경변수 (처음 호출할 때 읽고 캐시) */
export function serverEnv(): ServerEnv {
    cached ??= readServerEnv();
    return cached;
}

/** 테스트에서 process.env를 바꾼 뒤 캐시를 비울 때 사용 */
export function resetServerEnvCache(): void {
    cached = null;
}

/* ──────────────────────────────────────────────
 * 꼭 필요한 값을 꺼내는 헬퍼 (없으면 에러)
 * ────────────────────────────────────────────── */

/** http 모드에서 서버 주소. 없으면 BACKEND_NOT_CONFIGURED */
export function requireApiBaseUrl(env: ServerEnv = serverEnv()): string {
    if (!env.apiBaseUrl) throw new EnvError("FLOWW_API_BASE_URL", "BACKEND_NOT_CONFIGURED");
    return env.apiBaseUrl;
}

/** 세션 암호화 키. 없으면 에러 (세션 없이 로그인 기능을 쓸 수 없음) */
export function requireSessionKey(env: ServerEnv = serverEnv()): Buffer {
    if (!env.sessionKey) throw new EnvError("FLOWW_SESSION_SECRET", "is required for login sessions");
    return env.sessionKey;
}

export function isMockUpstream(env: ServerEnv = serverEnv()): boolean {
    return env.upstream === "mock";
}