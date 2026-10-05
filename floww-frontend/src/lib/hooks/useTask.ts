"use client";
import { useQuery } from "@tanstack/react-query";
import { tasks } from "../api/tasks";
import { isTerminalStatus } from "../domain/task/status";
import { taskKeys } from "./keys";
export function useTask(taskId: string) {
  return useQuery({
    queryKey: taskKeys.detail(taskId),
    queryFn: () => tasks.get(taskId),
    enabled: Boolean(taskId),
    refetchInterval: (query) =>
      query.state.data && isTerminalStatus(query.state.data.status)
        ? false
        : 5000,
  });
}
export function useTasks() {
  return useQuery({ queryKey: taskKeys.list, queryFn: () => tasks.list() });
}
