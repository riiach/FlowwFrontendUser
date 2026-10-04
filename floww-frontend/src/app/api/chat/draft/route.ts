import { NextResponse } from "next/server";
import { withSession } from "@/lib/server/route-helpers";
import { readJsonBody } from "@/lib/server/guard";
import { BffError, normalizeUpstreamError } from "@/lib/server/errors";
import { upstreamFetch } from "@/lib/server/upstream";
import {
  AiDraftRequestSchema,
  AiDraftEnvelopeSchema,
} from "@/lib/api/schemas/ai-draft";
import { toCreateTask } from "@/lib/domain/draft/to-create-task";
export const POST = withSession(async ({ request, session }) => {
  if (
    !request.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("application/json")
  )
    throw new BffError("UNSUPPORTED_MEDIA_TYPE", 415);
  const parsed = AiDraftRequestSchema.safeParse(
    await readJsonBody(request, 128 * 1024),
  );
  if (!parsed.success) throw new BffError("INVALID_CONVERSATION", 400);
  const { status, data } = await upstreamFetch("/api/ai/drafts", {
    method: "POST",
    accessToken: session.accessToken,
    body: {
      conversation: parsed.data.conversation.map(({ role, content }) => ({
        role,
        content,
      })),
    },
  });
  const envelope = AiDraftEnvelopeSchema.safeParse(data);
  if (!envelope.success) {
    // Authentication/proxy failures may use the common server error contract.
    if (status < 200 || status >= 300)
      return NextResponse.json(normalizeUpstreamError(status, data), {
        status,
      });
    throw new BffError("INVALID_RESPONSE", 502);
  }
  const conversion = toCreateTask(envelope.data);
  return NextResponse.json(
    {
      ...envelope.data,
      createTask: conversion.ok ? conversion.input : null,
      conversionIssues: conversion.ok ? [] : conversion.issues,
    },
    { status },
  );
});
