"use client";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { tasks } from "../api/tasks";
import { taskKeys } from "./keys";
import { useTask } from "./useTask";
import { isTerminalStatus } from "../domain/task/status";
import type { EventPage } from "../types/task";
import { useQueryClient } from "@tanstack/react-query";
/** Each fetch starts at the last numeric cursor; pages and polls merge without duplicates. */
export function useTaskEvents(taskId: string) {
  const client = useQueryClient();
  const task = useTask(taskId);
  const terminal = task.data ? isTerminalStatus(task.data.status) : false;
  useEffect(() => {
    if (terminal)
      void client.invalidateQueries({ queryKey: taskKeys.events(taskId) });
  }, [terminal, client, taskId]);
  return useQuery({
    queryKey: taskKeys.events(taskId),
    enabled: Boolean(taskId),
    queryFn: async () => {
      const prior = client.getQueryData<EventPage>(taskKeys.events(taskId));
      const page = await tasks.events(taskId, {
        after: prior?.nextCursor ?? 0,
      });
      const merged = new Map((prior?.events ?? []).map((e) => [e.seq, e]));
      page.events.forEach((e) => merged.set(e.seq, e));
      return {
        ...page,
        events: [...merged.values()].sort((a, b) => a.seq - b.seq),
      };
    },
    refetchInterval: (query) =>
      query.state.data?.hasMore
        ? 100
        : task.data && isTerminalStatus(task.data.status)
          ? false
          : 5000,
  });
}
