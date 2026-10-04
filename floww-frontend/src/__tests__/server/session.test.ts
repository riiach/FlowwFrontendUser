import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { open, openSession, seal, sealSession, type ServerSession } from "@/lib/server/session";

const KEY = randomBytes(32);
const session: ServerSession = {
    accessToken: "jwt-value",
    identity: { namespace: "eip155", address: "0x0000000000000000000000000000000000000001" },
    chainId: 11155111,
    expiresAt: "2030-01-01T00:00:00.000Z",
};

describe("session", () => {
    it("암호화 → 복호화 왕복", () => {
        const sealed = sealSession(session, KEY);
        expect(sealed).not.toContain("jwt-value");
        expect(openSession(sealed, KEY, new Date("2029-01-01"))).toEqual(session);
    });

    it("같은 값도 매번 다른 암호문", () => {
        expect(seal(session, KEY)).not.toBe(seal(session, KEY));
    });

    it("변조되면 null", () => {
        const sealed = seal(session, KEY);
        const raw = Buffer.from(sealed, "base64url");
        raw[raw.length - 1] ^= 1;
        expect(open(raw.toString("base64url"), KEY)).toBeNull();
        expect(open("garbage", KEY)).toBeNull();
    });

    it("다른 키면 null", () => {
        expect(open(seal(session, KEY), randomBytes(32))).toBeNull();
    });

    it("만료되면 null", () => {
        const sealed = sealSession(session, KEY);
        expect(openSession(sealed, KEY, new Date("2030-01-01T00:00:00.000Z"))).toBeNull();
    });
});
