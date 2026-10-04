/** Read-only admin audit views reuse the same domain records as the user app. */
/** 읽기 전용 감사 데이터 타입 */

import type { TaskAccount } from "./account";
import type { TaskAttempt, TaskView } from "./task";

export type AdminTask = TaskView;
export type AdminAttempt = TaskAttempt;
export type AdminTaskAccount = TaskAccount;

/** Audit event fields follow the server event schema. */
export interface AuditEvent {
    [field: string]: unknown;
}

export interface AuditEventsResponse {
    events: AuditEvent[];
    nextCursor: string | null;
    hasMore: boolean;
}
