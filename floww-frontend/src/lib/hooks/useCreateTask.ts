"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tasks } from "../api/tasks";
import type { CreateTaskRequest } from "../types/task";
import { taskIdempotencyKey } from "../utils/idempotency";
import { taskKeys } from "./keys";
import { useWalletSession } from "./useWalletSession";
export function useCreateTask() {
  const client = useQueryClient();
  const { session } = useWalletSession();
  return useMutation({
    mutationFn: (input: CreateTaskRequest) =>
      tasks.create(
        input,
        taskIdempotencyKey(
          input,
          undefined,
          session?.identity.address ?? "session",
        ),
      ),
    onSuccess: async (task) => {
      client.setQueryData(taskKeys.detail(task.taskId), task);
      await client.invalidateQueries({ queryKey: taskKeys.list });
    },
  });
}
