import { z } from "zod";
import type {
    Address,
    FlowwUser,
    Hex,
    LinkedWallet,
    WalletNonceRequest,
    WalletNonceResponse,
    WalletSigninResponse,
    WalletVerifyRequest,
} from "@/lib/types";

const ADDRESS_PATTERN = /^0x[0-9a-fA-F]{40}$/;
/** 65바이트 EIP-191 personal_sign 서명 */
const SIGNATURE_PATTERN = /^0x[0-9a-fA-F]{130}$/;

/** SIWE 메시지 최대 길이 (서버와 같음) */
export const SIWE_MESSAGE_MAX_LENGTH = 1024;

export const AddressSchema = z.custom<Address>(
    (value) => typeof value === "string" && ADDRESS_PATTERN.test(value),
    { message: "invalid address" },
);

export const SignatureSchema = z.custom<Hex>(
    (value) => typeof value === "string" && SIGNATURE_PATTERN.test(value),
    { message: "invalid signature" },
);

const IsoDateTimeSchema = z.iso.datetime({ offset: true });

/* ──────────────────────────────────────────────
 * 요청 (브라우저 → BFF, BFF → 서버 공용)
 * ────────────────────────────────────────────── */

export const WalletNonceRequestSchema = z.strictObject({
    address: AddressSchema,
    chainId: z.number().int().positive(),
});

export const WalletVerifyRequestSchema = z.strictObject({
    message: z.string().min(1).max(SIWE_MESSAGE_MAX_LENGTH),
    signature: SignatureSchema,
});

/* ──────────────────────────────────────────────
 * 응답 (서버 → BFF)
 * ────────────────────────────────────────────── */

export const WalletNonceResponseSchema = z.object({
    nonce: z.string().min(1),
    message: z.string().min(1).max(SIWE_MESSAGE_MAX_LENGTH),
    expiresAt: IsoDateTimeSchema,
});

export const LinkedWalletSchema = z.object({
    walletId: z.string().min(1),
    address: AddressSchema,
    walletType: z.enum(["EXTERNAL", "MAGIC_EMBEDDED"]),
    primary: z.boolean(),
});

export const FlowwUserSchema = z.object({
    userId: z.string().min(1),
    email: z.string().nullable(),
    displayName: z.string().nullable(),
    role: z.enum(["USER", "ADMIN"]),
    providers: z.array(z.enum(["EMAIL", "WALLET"])),
    wallets: z.array(LinkedWalletSchema),
    createdAt: IsoDateTimeSchema,
});

export const WalletSigninResponseSchema = z.object({
    accessToken: z.string().min(1),
    tokenType: z.literal("Bearer"),
    expiresIn: z.number().int().positive(),
    isNewUser: z.boolean(),
    user: FlowwUserSchema,
});

/* 타입과 스키마가 어긋나면 컴파일 에러 */
const _nonceRequestCheck: z.ZodType<WalletNonceRequest> = WalletNonceRequestSchema;
const _verifyRequestCheck: z.ZodType<WalletVerifyRequest> = WalletVerifyRequestSchema;
const _nonceResponseCheck: z.ZodType<WalletNonceResponse> = WalletNonceResponseSchema;
const _linkedWalletCheck: z.ZodType<LinkedWallet> = LinkedWalletSchema;
const _userCheck: z.ZodType<FlowwUser> = FlowwUserSchema;
const _signinResponseCheck: z.ZodType<WalletSigninResponse> = WalletSigninResponseSchema;
void _nonceRequestCheck;
void _verifyRequestCheck;
void _nonceResponseCheck;
void _linkedWalletCheck;
void _userCheck;
void _signinResponseCheck;