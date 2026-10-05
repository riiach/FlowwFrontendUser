"use client";
import { useReducer } from "react";
import type { AiDraftTurn } from "../types/ai-draft";
export type ChatAction =
  | { type: "append"; turn: AiDraftTurn }
  | { type: "reset" };
export function chatReducer(
  state: AiDraftTurn[],
  action: ChatAction,
): AiDraftTurn[] {
  if (action.type === "reset") return [];
  if (
    !action.turn.content.trim() ||
    action.turn.content.length > 4000 ||
    state.length >= 12 ||
    state.reduce((n, t) => n + t.content.length, 0) +
      action.turn.content.length >
      16000
  )
    return state;
  return [...state, action.turn];
}
/** Conversation lives only in this component's reducer. */
export function useChatSession() {
  const [conversation, dispatch] = useReducer(chatReducer, []);
  return {
    conversation,
    append: (turn: AiDraftTurn) => dispatch({ type: "append", turn }),
    reset: () => dispatch({ type: "reset" }),
  };
}
