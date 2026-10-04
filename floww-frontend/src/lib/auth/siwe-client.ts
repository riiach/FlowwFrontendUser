/*
* SIWE 로그인 흐름 (브라우저)
*
* challenge → 지갑 서명 → verify
* 1. nonce는 BFF challenge 쿠키에만 있고, 브라우저는 서명할 message만 받는다.
* 2. 지갑 라이브러리에 묶이지 않도록 서명 함수는 밖에서 받는다 (wagmi signMessageAsync 등).
* */

import { wallet } from "../api/wallet";
import type { Address, Hex, WalletVerifyResponse } from "../types";

export type SignMessage = (message: string) => Promise<Hex>;

export interface SignInWithEthereumInput {
    address: Address;
    chainId: number;
    signMessage: SignMessage;
}

export async function signInWithEthereum({
                                             address,
                                             chainId,
                                             signMessage,
                                         }: SignInWithEthereumInput): Promise<WalletVerifyResponse> {
    const { message } = await wallet.challenge({ address, chainId });
    const signature = await signMessage(message);
    return wallet.verify({ message, signature });
}

/** EIP-1193 4001: 사용자가 지갑 창에서 거절 */
export function isUserRejection(error: unknown): boolean {
    let current: unknown = error;
    for (let depth = 0; current && depth < 5; depth++) {
        const { code, name, cause } = current as { code?: unknown; name?: unknown; cause?: unknown };
        if (code === 4001 || name === "UserRejectedRequestError") return true;
        current = cause;
    }
    return false;
}