import "server-only";

import type { WalletAuthConfig } from "@/lib/types";
import { serverEnv, type ServerEnv } from "./env";

/** GET /api/wallet-auth/config 응답. mock 모드면 화면에 "DEMO DATA" 배지를 띄운다 */
export function walletAuthConfig(env: ServerEnv = serverEnv()): WalletAuthConfig {
    return {
        enabled: env.walletAuthEnabled,
        allowedChainIds: [...env.walletChainIds],
        mock: env.upstream === "mock",
    };
}
