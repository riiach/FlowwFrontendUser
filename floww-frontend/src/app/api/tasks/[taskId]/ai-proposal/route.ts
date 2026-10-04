import { withSession, proxyJson } from "@/lib/server/route-helpers";
import { assertEmptyBody } from "@/lib/server/guard";
import { AiProposalResponseSchema } from "@/lib/api/schemas/task";
export const maxDuration = 120;
export const POST = withSession<{ taskId: string }>(
  async ({ request, session, params }) => {
    await assertEmptyBody(request);
    return proxyJson(
      session,
      `/api/v1/tasks/${encodeURIComponent(params.taskId)}/ai-proposal`,
      { method: "POST", timeoutMs: 120000, schema: AiProposalResponseSchema },
    );
  },
);
