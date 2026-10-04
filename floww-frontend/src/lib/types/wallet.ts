/** Browser-safe wallet authentication request and response types. */
/** 지갑 세션과 인증 요청.응답 */

export interface WalletIdentity {
    namespace: "eip155";
    address: string;
}

export interface WalletSession {
    identity: WalletIdentity;
    chainId: number;
    expiresAt: string;
}

export interface WalletAuthConfig {
    enabled: boolean;
    allowedChainIds: number[];
}

export interface WalletAuthHealth {
    /** Diagnostic status details returned by the BFF. */
    [field: string]: unknown;
}

export interface WalletChallengeRequest {
    address: string;
    chainId: number;
}

export interface WalletChallengeResponse {
    challengeId: string;
    message: string;
}

export interface WalletVerifyRequest {
    challengeId: string;
    message: string;
    signature: `0x${string}`;
}

/** Session lookup returns null when no valid session cookie exists. */
export type WalletSessionResponse = WalletSession | null;
