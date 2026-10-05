"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tasks } from "../api/tasks";
import { taskKeys } from "./keys";
export function useAttempt(taskId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (quoteId: string) =>
      tasks.attempt(taskId, { quoteId, proposedBy: "USER" }),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: taskKeys.detail(taskId) }),
        client.invalidateQueries({ queryKey: taskKeys.events(taskId) }),
      ]);
    },
  });
}
