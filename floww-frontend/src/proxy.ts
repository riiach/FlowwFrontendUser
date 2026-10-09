import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAMES } from "@/lib/constants/constants";
import { LOGIN_PATH, RETURN_TO_PARAM } from "@/lib/auth/return-to";

/**
 * /app/* 라우트 가드 (Next 16: middleware.ts → proxy.ts)
 *
 * 세션 쿠키가 없으면 /login?returnTo=<원래 경로>로 보낸다.
 * 쿠키 복호화·만료 확인은 BFF가 한다 — 만료된 세션은 BFF가 401을 주고 쿠키를 지운다.
 * 세션 쿠키는 expires가 세션 만료 시각이라 만료되면 브라우저가 먼저 지운다.
 */
export function proxy(request: NextRequest) {
    // Temporarily allow all app pages during local UI development.
    // Remove this condition when restoring the login requirement.
    if (process.env.NODE_ENV === "development") return NextResponse.next();
    if (request.cookies.has(SESSION_COOKIE_NAMES.session)) return NextResponse.next();

    const login = new URL(LOGIN_PATH, request.url);
    login.searchParams.set(RETURN_TO_PARAM, `${request.nextUrl.pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(login);
}

export const config = {
    matcher: ["/app/:path*"],
};