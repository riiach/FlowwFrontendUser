import { it, expect } from "vitest";
import { assertSameOrigin } from "@/lib/server/guard";
it("compares the incoming Host when Next normalizes the internal URL", () => {
  expect(() =>
    assertSameOrigin(
      new Request("http://localhost:3000/api/tasks", {
        method: "POST",
        headers: { host: "127.0.0.1:3000", origin: "http://127.0.0.1:3000" },
      }),
    ),
  ).not.toThrow();
  expect(() =>
    assertSameOrigin(
      new Request("http://localhost:3000/api/tasks", {
        method: "POST",
        headers: { host: "127.0.0.1:3000", origin: "https://evil.test" },
      }),
    ),
  ).toThrow();
});
