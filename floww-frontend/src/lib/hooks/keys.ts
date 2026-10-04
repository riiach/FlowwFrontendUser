export const taskKeys = {
  all: ["tasks"] as const,
  list: ["tasks", "list"] as const,
  detail: (taskId: string) => ["tasks", "detail", taskId] as const,
  quotes: (taskId: string) => ["tasks", "quotes", taskId] as const,
  events: (taskId: string) => ["tasks", "events", taskId] as const,
};
