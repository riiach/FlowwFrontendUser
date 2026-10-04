import { describe, expect, it } from "vitest";
import { sanitize } from "@/lib/server/sanitize";

describe("sanitize", () => {
    it("중첩된 토큰류 키를 제거한다", () => {
        const input = {
            accessToken: "a",
            user: { jwt: "b", wallets: [{ address: "0x1", secret: "c", password: "d" }] },
            token: "e",
        };
        expect(sanitize(input)).toEqual({ user: { wallets: [{ address: "0x1" }] } });
    });

    it("이름이 정확히 같을 때만 제거한다", () => {
        const input = { tokenAddress: "0x2", tokenType: "Bearer", Token: "x" };
        expect(sanitize(input)).toEqual(input);
    });

    it("원본을 바꾸지 않는다", () => {
        const input = { token: "a" };
        sanitize(input);
        expect(input).toEqual({ token: "a" });
    });
});
