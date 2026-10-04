"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tasks } from "../api/tasks";
import { taskKeys } from "./keys";
export function useAiProposal(taskId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => tasks.proposal(taskId),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: taskKeys.detail(taskId) }),
        client.invalidateQueries({ queryKey: taskKeys.events(taskId) }),
      ]);
    },
  });
}
