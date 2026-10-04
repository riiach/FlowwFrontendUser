import { withSession, proxyJson } from "@/lib/server/route-helpers";
import { assertEmptyBody } from "@/lib/server/guard";
import { QuoteListSchema } from "@/lib/api/schemas/task";
export const POST = withSession<{ taskId: string }>(
  async ({ request, session, params }) => {
    await assertEmptyBody(request);
    return proxyJson(
      session,
      `/api/v1/tasks/${encodeURIComponent(params.taskId)}/quotes`,
      { method: "POST", schema: QuoteListSchema },
    );
  },
);
