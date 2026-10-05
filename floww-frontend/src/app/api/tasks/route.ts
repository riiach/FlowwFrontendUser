import { z } from "zod";
import { withSession, proxyJson } from "@/lib/server/route-helpers";
import { readJsonBody, readIdempotencyKey } from "@/lib/server/guard";
import { BffError } from "@/lib/server/errors";
import { assertTaskDeadline, integerParam } from "@/lib/server/task-input";
import {
  TaskViewSchema,
  CreateTaskRequestSchema,
} from "@/lib/api/schemas/task";
export const GET = withSession(async ({ request, session }) => {
  const limit = integerParam(
    new URL(request.url).searchParams.get("limit"),
    20,
    1,
    50,
  );
  return proxyJson(session, `/api/v1/tasks?limit=${limit}`, {
    schema: z.array(TaskViewSchema),
  });
});
export const POST = withSession(async ({ request, session }) => {
  const idempotencyKey = readIdempotencyKey(request, { required: true });
  const parsed = CreateTaskRequestSchema.safeParse(await readJsonBody(request));
  if (!parsed.success) throw new BffError("INVALID_INPUT", 400);
  assertTaskDeadline(parsed.data.expiresAt);
  return proxyJson(session, "/api/v1/tasks", {
    method: "POST",
    body: parsed.data,
    idempotencyKey,
    schema: TaskViewSchema,
  });
});
