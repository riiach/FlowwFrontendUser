"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { injected, useAccount, useConnect, useSignMessage, useSwitchChain } from "wagmi";
import { sepolia } from "wagmi/chains";
import { wallet } from "../api/wallet";
import { safeReturnTo } from "../auth/return-to";
import { signInWithEthereum } from "../auth/siwe-client";
import type { Address, WalletVerifyResponse } from "../types";
import { WALLET_SESSION_QUERY_KEY } from "./useWalletSession";

export interface UseWalletLoginOptions {
    /** ?returnTo= 값. 안전한 /app 경로가 아니면 /app으로 */
    returnTo?: string | null;
}

/**
 * 로그인 버튼용 훅
 * - loginWithMetaMask: 연결 → (필요하면) 체인 전환 → challenge → 서명 → verify
 * - loginAsDemo: BFF가 임시 키로 로그인
 * 성공하면 세션 캐시를 채우고 returnTo로 이동한다.
 */
export function useWalletLogin({ returnTo }: UseWalletLoginOptions = {}) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const account = useAccount();
    const { connectAsync, connectors } = useConnect();
    const { switchChainAsync } = useSwitchChain();
    const { signMessageAsync } = useSignMessage();

    const onSuccess = (result: WalletVerifyResponse) => {
        queryClient.setQueryData(WALLET_SESSION_QUERY_KEY, result.session);
        router.replace(safeReturnTo(returnTo));
    };

    const metaMask = useMutation({
        mutationFn: async () => {
            let address: Address | undefined = account.address;
            let chainId = account.chainId;
            if (!account.isConnected || !address) {
                const connector = connectors.find((candidate) => candidate.type === "injected") ?? injected();
                const connected = await connectAsync({ connector });
                address = connected.accounts[0];
                chainId = connected.chainId;
            }
            if (chainId !== sepolia.id) {
                chainId = (await switchChainAsync({ chainId: sepolia.id })).id;
            }
            const signer = address;
            return signInWithEthereum({
                address: signer,
                chainId,
                signMessage: (message) => signMessageAsync({ account: signer, message }),
            });
        },
        onSuccess,
    });

    const demo = useMutation({
        mutationFn: () => wallet.demo(),
        onSuccess,
    });

    return {
        loginWithMetaMask: () => metaMask.mutate(),
        loginAsDemo: () => demo.mutate(),
        isPending: metaMask.isPending || demo.isPending,
        error: metaMask.error ?? demo.error,
        reset: () => {
            metaMask.reset();
            demo.reset();
        },
    };
}