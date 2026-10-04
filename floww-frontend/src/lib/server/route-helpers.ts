import "server-only";

import { NextResponse, type NextRequest } from "next/server";
import type { z } from "zod";
import { BffError, normalizeUpstreamError, toErrorResponse } from "./errors";
import { assertSameOrigin } from "./guard";
import { sanitize } from "./sanitize";
import { clearSessionCookie, readSession, type ServerSession } from "./session";
import { upstreamFetch, type UpstreamInit } from "./upstream";

export interface SessionContext<P> {
    request: NextRequest;
    session: ServerSession;
    params: P;
}

type RouteContext<P> = { params: Promise<P> };

/**
 * 세션이 필요한 BFF 라우트 래퍼.
 * - POST 등은 Origin 확인
 * - 세션 없음 → 401 SESSION_REQUIRED
 * - 응답이 401이면 세션 쿠키 삭제
 */
export function withSession<P = Record<string, never>>(
    handler: (context: SessionContext<P>) => Promise<NextResponse>,
) {
    return async (request: NextRequest, context?: RouteContext<P>): Promise<NextResponse> => {
        let response: NextResponse;
        try {
            assertSameOrigin(request);
            const session = readSession(request);
            if (!session) throw new BffError("SESSION_REQUIRED", 401);
            const params = (await context?.params) ?? ({} as P);
            response = await handler({ request, session, params });
        } catch (error) {
            response = toErrorResponse(error);
        }

        if (response.status === 401) clearSessionCookie(response);
        return response;
    };
}

export interface ProxyOptions<S extends z.ZodType> extends Omit<UpstreamInit, "accessToken"> {
    schema?: S;
}

/** 서버 호출 → 에러 정규화 → zod 검증 → 토큰류 키 제거 → JSON 응답 */
export async function proxyJson<S extends z.ZodType>(
    session: ServerSession,
    path: string,
    options: ProxyOptions<S> = {},
): Promise<NextResponse> {
    const { schema, ...init } = options;
    const { status, data } = await upstreamFetch(path, { ...init, accessToken: session.accessToken });

    if (status < 200 || status >= 300) {
        return NextResponse.json(normalizeUpstreamError(status, data), { status });
    }
    if (status === 204 || data === undefined) return new NextResponse(null, { status });

    let body: unknown = data;
    if (schema) {
        const result = schema.safeParse(data);
        if (!result.success) throw new BffError("INVALID_RESPONSE", 502);
        body = result.data;
    }
    return NextResponse.json(sanitize(body), { status });
}
