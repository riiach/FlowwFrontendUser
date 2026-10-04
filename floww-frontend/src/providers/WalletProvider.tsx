"use client";

import type { ReactNode } from "react";
import { createConfig, http, injected, WagmiProvider } from "wagmi";
import { sepolia } from "wagmi/chains";
import { QueryProvider } from "./QueryProvider";

/** MetaMask(브라우저 확장)만 연결한다. 체인은 Sepolia 하나 */
export const wagmiConfig = createConfig({
    chains: [sepolia],
    connectors: [injected({ target: "metaMask" })],
    transports: { [sepolia.id]: http() },
    ssr: true,
});

/** wagmi는 react-query 위에서 동작하므로 QueryProvider를 안쪽에 둔다 */
export function WalletProvider({ children }: { children: ReactNode }) {
    return (
        <WagmiProvider config={wagmiConfig}>
            <QueryProvider>{children}</QueryProvider>
        </WagmiProvider>
    );
}