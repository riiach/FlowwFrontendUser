import { withSession, proxyJson } from "@/lib/server/route-helpers";
import { TaskViewSchema } from "@/lib/api/schemas/task";
export const GET = withSession<{ taskId: string }>(
  async ({ session, params }) =>
    proxyJson(session, `/api/v1/tasks/${encodeURIComponent(params.taskId)}`, {
      schema: TaskViewSchema,
    }),
);
