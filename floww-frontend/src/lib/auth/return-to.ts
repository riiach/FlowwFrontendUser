/**
 * 로그인 후 돌아갈 경로 (?returnTo=)
 * 오픈 리다이렉트를 막기 위해 같은 사이트의 /app 경로만 허용한다.
 */

export const LOGIN_PATH = "/login";
export const RETURN_TO_PARAM = "returnTo";
export const DEFAULT_RETURN_TO = "/app";

const BASE = "http://floww.local";

export function safeReturnTo(value: string | null | undefined): string {
    if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return DEFAULT_RETURN_TO;

    let url: URL;
    try {
        url = new URL(value, BASE);
    } catch {
        return DEFAULT_RETURN_TO;
    }
    if (url.origin !== BASE) return DEFAULT_RETURN_TO;
    if (url.pathname !== DEFAULT_RETURN_TO && !url.pathname.startsWith(`${DEFAULT_RETURN_TO}/`)) return DEFAULT_RETURN_TO;
    return `${url.pathname}${url.search}${url.hash}`;
}

/** /login?returnTo=... 링크 */
export function loginHref(returnTo?: string): string {
    if (!returnTo) return LOGIN_PATH;
    return `${LOGIN_PATH}?${new URLSearchParams({ [RETURN_TO_PARAM]: safeReturnTo(returnTo) })}`;
}