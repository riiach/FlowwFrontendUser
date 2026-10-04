/*
* 지갑 로그인 API 클라이언트 (브라우저 → BFF)
*
* 1. Floww 서버를 직접 부르지 않고, 서버 연결은 BFF(src/lib/server)가 맡는다.
* 2. JWT(accessToken)는 BFF가 HttpOnly 쿠키에만 보관하므로 여기서 받는 응답에는 없다.
* 3. 흐름: challenge → 지갑 서명 → verify → session
* */

import { API_PATHS } from "../constants/constants";
import type {
    WalletAuthConfig,
    WalletAuthHealth,
    WalletChallengeRequest,
    WalletChallengeResponse,
    WalletSessionResponse,
    WalletVerifyRequest,
    WalletVerifyResponse,
} from "../types";

import { apiRequest } from "./client";

const walletAuthUrl = (action: string) => `${API_PATHS.walletAuth}/${action}`;

export const wallet = {
    config: () => apiRequest<WalletAuthConfig>(walletAuthUrl("config")),
    health: () => apiRequest<WalletAuthHealth>(walletAuthUrl("health")),
    session: () => apiRequest<WalletSessionResponse>(walletAuthUrl("session")),
    challenge: (input: WalletChallengeRequest) =>
        apiRequest<WalletChallengeResponse>(walletAuthUrl("challenge"), { method: "POST", body: input }),
    /** The BFF stores the JWT in an HttpOnly cookie; it is never returned here. */
    verify: (input: WalletVerifyRequest) =>
        apiRequest<WalletVerifyResponse>(walletAuthUrl("verify"), { method: "POST", body: input }),
    logout: () => apiRequest<void>(walletAuthUrl("logout"), { method: "POST" }),
};
