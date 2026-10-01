import { API_PATHS } from "../config/constants";
import type { AuditEventsResponse } from "../types";
import { apiRequest } from "./client";

/** Read-only client for the Admin BFF endpoints. */
export const adminApi = {
    session: <Session = Record<string, unknown>>() => apiRequest<Session>(API_PATHS.adminSession),

    /** Fetch an audit resource through `/api/audit/**` using safe path segments. */
    audit: <T = unknown>(pathSegments: string[], query?: Record<string, string | number | undefined>) => {
        if (pathSegments.some((segment) => !segment || segment === "." || segment === ".." || segment.includes("/"))) {
            throw new TypeError("Invalid audit path");
        }

        const path = [API_PATHS.adminAudit, ...pathSegments.map(encodeURIComponent)].join("/");
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(query ?? {})) {
            if (value !== undefined) params.set(key, String(value));
        }
        const suffix = params.size ? `?${params.toString()}` : "";
        return apiRequest<T>(`${path}${suffix}`);
    },

    events: (pathSegments: string[], query?: Record<string, string | number | undefined>) =>
        adminApi.audit<AuditEventsResponse>(pathSegments, query),
};
