import "server-only";

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAMES } from "@/lib/constants/constants";
import type { WalletSession } from "@/lib/types";
import { requireSessionKey, serverEnv } from "./env";

export interface ServerSession extends WalletSession {
    accessToken: string;
}

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;
const TAG_BYTES = 16;

export function seal(payload: unknown, key: Buffer = requireSessionKey()): string {
    const iv = randomBytes(IV_BYTES);
    const cipher = createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(JSON.stringify(payload), "utf8"), cipher.final()]);
    return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64url");
}

/** 변조됐거나 키가 다르면 null */
export function open<T = unknown>(sealed: string, key: Buffer = requireSessionKey()): T | null {
    try {
        const raw = Buffer.from(sealed, "base64url");
        if (raw.length <= IV_BYTES + TAG_BYTES) return null;
        const decipher = createDecipheriv(ALGORITHM, key, raw.subarray(0, IV_BYTES));
        decipher.setAuthTag(raw.subarray(IV_BYTES, IV_BYTES + TAG_BYTES));
        const decrypted = Buffer.concat([decipher.update(raw.subarray(IV_BYTES + TAG_BYTES)), decipher.final()]);
        return JSON.parse(decrypted.toString("utf8")) as T;
    } catch {
        return null;
    }
}

export function sealSession(session: ServerSession, key?: Buffer): string {
    return seal(session, key);
}

/** 만료·변조·형식 오류면 null */
export function openSession(sealed: string, key?: Buffer, now: Date = new Date()): ServerSession | null {
    const session = open<ServerSession>(sealed, key);
    if (!session || typeof session.accessToken !== "string" || typeof session.expiresAt !== "string") return null;
    const expiresAt = Date.parse(session.expiresAt);
    if (!Number.isFinite(expiresAt) || expiresAt <= now.getTime()) return null;
    return session;
}

export function cookieOptions(expires?: Date) {
    return {
        httpOnly: true,
        sameSite: "strict" as const,
        secure: serverEnv().isProduction,
        path: "/",
        ...(expires ? { expires } : {}),
    };
}

export function readSession(request: NextRequest): ServerSession | null {
    const sealed = request.cookies.get(SESSION_COOKIE_NAMES.session)?.value;
    return sealed ? openSession(sealed) : null;
}

export function setSessionCookie(response: NextResponse, session: ServerSession): void {
    response.cookies.set(SESSION_COOKIE_NAMES.session, sealSession(session), cookieOptions(new Date(session.expiresAt)));
}

export function clearSessionCookie(response: NextResponse): void {
    response.cookies.set(SESSION_COOKIE_NAMES.session, "", { ...cookieOptions(), maxAge: 0 });
}
