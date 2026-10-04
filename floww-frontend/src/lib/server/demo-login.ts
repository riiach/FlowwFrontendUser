import "server-only";

import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import type { WalletSigninResponse } from "@/lib/types";
import { serverEnv } from "./env";
import type { ServerSession } from "./session";
import { requestNonce, toServerSession, verifySignin } from "./wallet-auth";

export interface DemoLoginResult {
    session: ServerSession;
    isNewUser: WalletSigninResponse["isNewUser"];
}

/**
 * 데모 로그인 — MetaMask 없이 둘러보기.
 *
 * 임시 키 생성 → nonce → 서명 → verify → (라우트가 세션 쿠키 저장) → 키 폐기
 * 키는 이 함수 안에서만 쓰고 어디에도 저장하거나 로그로 남기지 않는다.
 * 매번 새 키라 서버에는 매번 새 사용자가 생긴다.
 */
export async function demoLogin(chainId: number = serverEnv().walletChainIds[0]): Promise<DemoLoginResult> {
    let privateKey: `0x${string}` | null = generatePrivateKey();
    try {
        const account = privateKeyToAccount(privateKey);
        const { message } = await requestNonce({ address: account.address, chainId });
        const signature = await account.signMessage({ message });
        const signin = await verifySignin({ message, signature });
        return {
            session: toServerSession(signin, account.address, chainId),
            isNewUser: signin.isNewUser,
        };
    } finally {
        // JS 문자열은 메모리에서 지울 수 없으므로 참조를 끊어 GC 대상으로 만든다
        privateKey = null;
    }
}