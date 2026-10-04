import { describe, expect, it } from "vitest";
import { EnvError, readServerEnv, requireApiBaseUrl, requireSessionKey } from "@/lib/server/env";

const KEY = "a".repeat(64);

describe("readServerEnv — 기본값", () => {
    it("아무 값도 없으면 안전한 기본값을 쓴다", () => {
        const env = readServerEnv({});
        expect(env.upstream).toBe("http");
        expect(env.apiBaseUrl).toBeNull();
        expect(env.sessionKey).toBeNull();
        expect(env.walletAuthEnabled).toBe(true);
        expect(env.walletChainIds).toEqual([11155111]);
        expect(env.vercelBypassSecret).toBeNull();
        expect(env.isProduction).toBe(false);
    });
});

describe("FLOWW_UPSTREAM", () => {
    it("http / mock만 허용한다", () => {
        expect(readServerEnv({ FLOWW_UPSTREAM: "mock" }).upstream).toBe("mock");
        expect(readServerEnv({ FLOWW_UPSTREAM: " HTTP " }).upstream).toBe("http");
        expect(() => readServerEnv({ FLOWW_UPSTREAM: "fake" })).toThrow(EnvError);
    });
});

describe("FLOWW_API_BASE_URL", () => {
    it("https 주소와 localhost http를 허용하고 끝 슬래시를 정리한다", () => {
        expect(readServerEnv({ FLOWW_API_BASE_URL: "https://floww-server-demo.vercel.app/" }).apiBaseUrl)
            .toBe("https://floww-server-demo.vercel.app");
        expect(readServerEnv({ FLOWW_API_BASE_URL: "http://localhost:8080" }).apiBaseUrl)
            .toBe("http://localhost:8080");
        expect(readServerEnv({ FLOWW_API_BASE_URL: "http://127.0.0.1:8080" }).apiBaseUrl)
            .toBe("http://127.0.0.1:8080");
    });

    it.each([
        ["http 외부 주소", "http://example.com"],
        ["경로 포함", "https://example.com/api"],
        ["쿼리 포함", "https://example.com/?a=1"],
        ["계정 정보 포함", "https://user:pw@example.com"],
        ["URL 아님", "localhost:8080"],
    ])("거절: %s", (_label, value) => {
        expect(() => readServerEnv({ FLOWW_API_BASE_URL: value })).toThrow(EnvError);
    });
});

describe("FLOWW_SESSION_SECRET", () => {
    it("64자 hex는 32바이트 키가 된다", () => {
        expect(readServerEnv({ FLOWW_SESSION_SECRET: KEY }).sessionKey?.length).toBe(32);
    });

    it("형식이 틀리면 거절하고, 에러 메시지에 값이 들어가지 않는다", () => {
        const secret = "local-floww-session-secret-for-development-only";
        try {
            readServerEnv({ FLOWW_SESSION_SECRET: secret });
            expect.unreachable();
        } catch (error) {
            expect(error).toBeInstanceOf(EnvError);
            expect((error as Error).message).not.toContain(secret);
            expect((error as EnvError).variable).toBe("FLOWW_SESSION_SECRET");
        }
    });
});

describe("FLOWW_WALLET_CHAIN_IDS", () => {
    it("쉼표로 구분된 양의 정수, 중복 제거", () => {
        expect(readServerEnv({ FLOWW_WALLET_CHAIN_IDS: "11155111, 1, 11155111" }).walletChainIds)
            .toEqual([11155111, 1]);
    });

    it.each(["0", "-1", "abc", "1,,2", "1.5"])("거절: %s", (value) => {
        expect(() => readServerEnv({ FLOWW_WALLET_CHAIN_IDS: value })).toThrow(EnvError);
    });
});

describe("boolean 값", () => {
    it("true/false/1/0만 허용한다", () => {
        expect(readServerEnv({ FLOWW_WALLET_AUTH_ENABLED: "false" }).walletAuthEnabled).toBe(false);
        expect(readServerEnv({ FLOWW_BUSINESS_JWT_ENABLED: "0" }).businessJwtEnabled).toBe(false);
        expect(() => readServerEnv({ FLOWW_WALLET_AUTH_ENABLED: "yes" })).toThrow(EnvError);
    });
});

describe("FLOWW_SERVER_VERCEL_BYPASS_SECRET", () => {
    it("값이 있으면 그대로, 공백이 있으면 거절", () => {
        expect(readServerEnv({ FLOWW_SERVER_VERCEL_BYPASS_SECRET: "abc123" }).vercelBypassSecret).toBe("abc123");
        expect(() => readServerEnv({ FLOWW_SERVER_VERCEL_BYPASS_SECRET: "a b" })).toThrow(EnvError);
    });
});

describe("require 헬퍼", () => {
    it("값이 없으면 에러, 있으면 반환", () => {
        expect(() => requireApiBaseUrl(readServerEnv({}))).toThrow(/BACKEND_NOT_CONFIGURED/);
        expect(requireApiBaseUrl(readServerEnv({ FLOWW_API_BASE_URL: "http://localhost:8080" })))
            .toBe("http://localhost:8080");
        expect(() => requireSessionKey(readServerEnv({}))).toThrow(EnvError);
        expect(requireSessionKey(readServerEnv({ FLOWW_SESSION_SECRET: KEY })).length).toBe(32);
    });
});