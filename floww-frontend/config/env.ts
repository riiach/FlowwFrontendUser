/*
* env.ts
*   ↓
* task-proxy.ts
*   ↓
* FLOWW_API_BASE_URL + "/api/v1/tasks"
*   ↓
* Server
* */

function readOptionalUrl(name: string): string | undefined {
    const value = process.env[name]?.trim();
    if(!value) return undefined;

    let parsed: URL;
    try {
        parsed = new URL(value);
    } catch {
        throw new Error(`${name} must be a valid absolute URL.`);
    }

    if(parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        throw new Error(`${name} must be an HTTP(S) URL.`);
    }

    return parsed.toString().replace(/\/+$/, "");
}

export const env = Object.freeze({
    flowwApiBaseUrl: readOptionalUrl("FLOWW_API_BASE_URL"),
});

export function requireFlowwApiBaseUrl(): string {
    if (!env.flowwApiBaseUrl) {
        throw new Error("TASK_CONNECTION_NOT_CONFIGURED");
    }

    return env.flowwApiBaseUrl;
}