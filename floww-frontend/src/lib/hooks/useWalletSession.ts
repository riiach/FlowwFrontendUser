"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useDisconnect } from "wagmi";
import { wallet } from "../api/wallet";
import { LOGIN_PATH } from "../auth/return-to";

export const WALLET_SESSION_QUERY_KEY = ["wallet-auth", "session"] as const;

/** GET /api/wallet-auth/session — 로그인 안 했으면 data가 null */
export function useWalletSession() {
    const query = useQuery({
        queryKey: WALLET_SESSION_QUERY_KEY,
        queryFn: () => wallet.session(),
        staleTime: 30_000,
    });
    return {
        ...query,
        session: query.data ?? null,
        isLoggedIn: Boolean(query.data),
    };
}

/** 세션 쿠키 삭제 → 지갑 연결 해제 → /login */
export function useWalletLogout() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { disconnect } = useDisconnect();

    return useMutation({
        mutationFn: () => wallet.logout(),
        onSettled: () => {
            queryClient.setQueryData(WALLET_SESSION_QUERY_KEY, null);
            queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== WALLET_SESSION_QUERY_KEY[0] });
            disconnect();
            router.replace(LOGIN_PATH);
        },
    });
}