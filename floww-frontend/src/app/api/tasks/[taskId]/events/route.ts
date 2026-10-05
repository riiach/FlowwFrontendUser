import { withSession, proxyJson } from "@/lib/server/route-helpers";
import { integerParam } from "@/lib/server/task-input";
import { EventPageSchema } from "@/lib/api/schemas/task";
export const GET = withSession<{ taskId: string }>(
  async ({ request, session, params }) => {
    const query = new URL(request.url).searchParams;
    const after = integerParam(
      query.get("after"),
      0,
      0,
      Number.MAX_SAFE_INTEGER,
    );
    const limit = integerParam(query.get("limit"), 50, 1, 50);
    return proxyJson(
      session,
      `/api/v1/tasks/${encodeURIComponent(params.taskId)}/events?after=${after}&limit=${limit}`,
      { schema: EventPageSchema },
    );
  },
);
