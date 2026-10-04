/** Task Account, funding, and EIP-712 approval domain types. */
/** Task Account, Funding, EIP-712 Approvals */

export type TaskAccountState = string;

export interface TaskAccount {
    state: TaskAccountState;
    /** Other account fields are supplied by the Task Account API. */
    [field: string]: unknown;
}

export interface Funding {
    /** approve/fund call data and balance are returned by the API. */
    [field: string]: unknown;
}

export interface Eip712Domain {
    name?: string;
    version?: string;
    chainId?: number;
    verifyingContract?: string;
    salt?: string;
    [field: string]: unknown;
}

export interface Eip712TypedData {
    types: Record<string, Array<{ name: string; type: string }>>;
    primaryType: string;
    domain: Eip712Domain;
    message: Record<string, unknown>;
}

export interface Approval {
    typedData: Eip712TypedData;
    digest: `0x${string}`;
    nonce: string;
}

export interface PrepareTaskAccountRequest {
    attemptId: string;
    ownerAddress: string;
}

export interface BindTaskAccountRequest {
    accountAddress: string;
    deploymentTxHash: `0x${string}`;
}

export interface SubmitAccountSignatureRequest {
    signature: `0x${string}`;
}

export interface CreateOrderRequest {
    attemptId: string;
}
