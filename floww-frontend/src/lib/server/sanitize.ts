import "server-only";

const SENSITIVE_KEYS = new Set(["token", "accessToken", "jwt", "secret", "password"]);

/** 토큰류 키를 깊은 곳까지 제거한 사본을 돌려준다 (키 이름이 정확히 일치할 때만) */
export function sanitize<T>(value: T): T {
    return strip(value) as T;
}

function strip(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(strip);
    if (typeof value !== "object" || value === null) return value;

    const result: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value)) {
        if (!SENSITIVE_KEYS.has(key)) result[key] = strip(child);
    }
    return result;
}
