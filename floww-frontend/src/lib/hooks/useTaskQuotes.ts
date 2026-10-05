"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tasks } from "../api/tasks";
import { taskKeys } from "./keys";
export function useTaskQuotes(taskId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => tasks.quotes(taskId),
    onSuccess: async (data) => {
      client.setQueryData(taskKeys.quotes(taskId), data);
      await client.invalidateQueries({ queryKey: taskKeys.events(taskId) });
    },
  });
}
