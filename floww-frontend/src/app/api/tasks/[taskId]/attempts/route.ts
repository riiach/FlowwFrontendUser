import { withSession, proxyJson } from "@/lib/server/route-helpers";
import { readJsonBody } from "@/lib/server/guard";
import { BffError } from "@/lib/server/errors";
import {
  AttemptCreateRequestSchema,
  AttemptViewSchema,
} from "@/lib/api/schemas/task";
export const POST = withSession<{ taskId: string }>(
  async ({ request, session, params }) => {
    const parsed = AttemptCreateRequestSchema.safeParse(
      await readJsonBody(request),
    );
    if (!parsed.success) throw new BffError("INVALID_INPUT", 400);
    return proxyJson(
      session,
      `/api/v1/tasks/${encodeURIComponent(params.taskId)}/attempts`,
      {
        method: "POST",
        body: { quoteId: parsed.data.quoteId, proposedBy: "USER" },
        schema: AttemptViewSchema,
      },
    );
  },
);
