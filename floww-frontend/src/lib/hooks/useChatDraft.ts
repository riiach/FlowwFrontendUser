"use client";
import { useState, useRef } from "react";
import { chat, type ChatDraftResponse } from "../api/chat";
import type { AiDraftTurn } from "../types/ai-draft";
export function useChatDraft() {
  const [data, setData] = useState<ChatDraftResponse | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isPending, setPending] = useState(false);
  const generation = useRef(0);
  async function generate(conversation: AiDraftTurn[]) {
    const current = ++generation.current;
    setData(null);
    setError(null);
    setPending(true);
    try {
      const response = await chat.draft({ conversation });
      if (current === generation.current) setData(response);
    } catch (e) {
      if (current === generation.current)
        setError(e instanceof Error ? e : new Error("DRAFT_FAILED"));
    } finally {
      if (current === generation.current) setPending(false);
    }
  }
  function reset() {
    generation.current++;
    setData(null);
    setError(null);
    setPending(false);
  }
  return {
    data,
    error,
    isPending,
    generate,
    reset,
    canSave:
      !isPending &&
      data?.status === "READY_FOR_REVIEW" &&
      data.createTask !== null,
  };
}
