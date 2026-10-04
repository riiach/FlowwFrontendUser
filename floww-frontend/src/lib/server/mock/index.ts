import "server-only";

import { errorBody } from "../errors";
import type { UpstreamInit, UpstreamResponse } from "../upstream";

/** 목 서버 라우터 (Base 3에서 경로별 핸들러로 채움) */
export async function mockFetch(path: string, init: UpstreamInit = {}): Promise<UpstreamResponse> {
    void path;
    void init;
    return { status: 501, data: errorBody("NOT_IMPLEMENTED") };
}
