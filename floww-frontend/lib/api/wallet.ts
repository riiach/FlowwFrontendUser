import { API_PATHS } from "../config/constants";
import type {
    WalletAuthConfig,
    WalletAuthHealth,
    WalletChallengeRequest,
    WalletChallengeResponse,
    WalletSessionResponse,
    WalletVerifyRequest,
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
        apiRequest<unknown>(walletAuthUrl("verify"), { method: "POST", body: input }),
    logout: () => apiRequest<void>(walletAuthUrl("logout"), { method: "POST" }),
};
