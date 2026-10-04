import "server-only";

import { REQUEST_LIMITS } from "@/lib/constants/constants";
import { BffError } from "./errors";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function assertSameOrigin(request: Request): void {
    if (SAFE_METHODS.has(request.method)) return;

    const origin = request.headers.get("origin");
    if (origin) {
        if (origin === new URL(request.url).origin) return;
        throw new BffError("ORIGIN_NOT_ALLOWED", 403);
    }
    if (request.headers.get("sec-fetch-site") === "same-origin") return;
    throw new BffError("ORIGIN_NOT_ALLOWED", 403);
}

/** JSON 본문을 크기 제한 안에서 읽는다. 본문이 없으면 undefined */
export async function readJsonBody(
    request: Request,
    limit: number = REQUEST_LIMITS.requestBodyBytes,
): Promise<unknown> {
    const declared = Number(request.headers.get("content-length"));
    if (Number.isFinite(declared) && declared > limit) throw new BffError("INVALID_INPUT", 413);
    if (!request.body) return undefined;

    const text = await readLimitedText(request.body, limit, () => new BffError("INVALID_INPUT", 413));
    if (!text.trim()) return undefined;
    try {
        return JSON.parse(text) as unknown;
    } catch {
        throw new BffError("INVALID_INPUT", 400);
    }
}

/** 본문이 없어야 하는 요청에서 본문이 오면 거절한다 */
export async function assertEmptyBody(request: Request): Promise<void> {
    if ((await readJsonBody(request)) !== undefined) throw new BffError("INVALID_INPUT", 400);
}

export function readIdempotencyKey(request: Request, options: { required: true }): string;
export function readIdempotencyKey(request: Request, options?: { required?: boolean }): string | null;
export function readIdempotencyKey(request: Request, options: { required?: boolean } = {}): string | null {
    const key = request.headers.get("idempotency-key")?.trim();
    if (!key) {
        if (options.required) throw new BffError("INVALID_IDEMPOTENCY_KEY", 400);
        return null;
    }
    if (!UUID_PATTERN.test(key)) throw new BffError("INVALID_IDEMPOTENCY_KEY", 400);
    return key.toLowerCase();
}

export async function readLimitedText(
    stream: ReadableStream<Uint8Array>,
    limit: number,
    onExceeded: () => Error,
): Promise<string> {
    const reader = stream.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > limit) {
            await reader.cancel().catch(() => undefined);
            throw onExceeded();
        }
        chunks.push(value);
    }
    return new TextDecoder().decode(Buffer.concat(chunks));
}
