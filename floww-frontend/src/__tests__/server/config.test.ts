import { describe, expect, it } from "vitest";
import { walletAuthConfig } from "@/lib/server/config";
import { readServerEnv } from "@/lib/server/env";

describe("walletAuthConfig", () => {
    it("mock 모드면 mock: true", () => {
        expect(walletAuthConfig(readServerEnv({ FLOWW_UPSTREAM: "mock" }))).toEqual({
            enabled: true,
            allowedChainIds: [11155111],
            mock: true,
        });
        expect(walletAuthConfig(readServerEnv({})).mock).toBe(false);
    });
});
