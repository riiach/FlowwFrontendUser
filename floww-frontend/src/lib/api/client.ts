import { API_ERROR_CODES, REQUEST_LIMITS } from "../constants/constants";

/** Error returned by the same-origin BFF. */
export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

/** ErrorResponse 본문: reasonCode를 먼저 읽고, message는 { ko, en } 중 ko를 쓴다 */
function toApiError(status: number, data: unknown): ApiError {
  const body = isRecord(data) ? data : {};
  const reasonCode =
    typeof body.reasonCode === "string" ? body.reasonCode : undefined;
  const envelopeError = isRecord(body.error) ? body.error : undefined;
  const code =
    reasonCode ??
    (typeof body.code === "string"
      ? body.code
      : typeof envelopeError?.code === "string"
        ? envelopeError.code
        : undefined);
  const localized = isRecord(body.message) ? body.message : undefined;
  const message =
    typeof localized?.ko === "string"
      ? localized.ko
      : typeof body.message === "string"
        ? body.message
        : (code ?? `Request failed (${status})`);
  return new ApiError(message, status, code);
}

export interface ApiRequestOptions
  extends Omit<RequestInit, "body" | "method"> {
  method?: "GET" | "POST";
  body?: unknown;
  timeoutMs?: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function readResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined;
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ApiError(
      API_ERROR_CODES.invalidResponse,
      response.status,
      API_ERROR_CODES.invalidResponse,
    );
  }
}

/** Make a same-origin request to a BFF endpoint. */
export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const {
    method = "GET",
    body,
    timeoutMs = REQUEST_LIMITS.timeoutMs,
    headers,
    signal,
    ...rest
  } = options;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const abortFromCaller = () => controller.abort();
  if (signal?.aborted) controller.abort();
  else signal?.addEventListener("abort", abortFromCaller, { once: true });

  const requestHeaders = new Headers(headers);
  requestHeaders.set("Accept", "application/json");
  if (body !== undefined)
    requestHeaders.set("Content-Type", "application/json");

  try {
    const response = await fetch(path, {
      ...rest,
      method,
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: "same-origin",
      redirect: "error",
      signal: controller.signal,
    });
    const data = await readResponseBody(response);
    if (!response.ok) {
      throw toApiError(response.status, data);
    }
    return data as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      API_ERROR_CODES.upstreamUnavailable,
      0,
      API_ERROR_CODES.upstreamUnavailable,
    );
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", abortFromCaller);
  }
}

export function createIdempotencyKey(): string {
  return globalThis.crypto.randomUUID();
}

export function withIdempotencyKey(key = createIdempotencyKey()): Headers {
  return new Headers({ "Idempotency-Key": key });
}
