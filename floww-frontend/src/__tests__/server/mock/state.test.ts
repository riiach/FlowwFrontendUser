import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  decodeMockState,
  emptyMockState,
  encodeMockState,
  MOCK_STATE_MAX_CHARS,
  type MockState,
} from "@/lib/server/mock/state";

const KEY = randomBytes(32);
const NOW = new Date("2026-10-04T00:00:00Z");

function task(i: number) {
  return {
    taskId: `task-${i}`,
    createdAt: new Date(NOW.getTime() + i * 1000).toISOString(),
    goal: randomBytes(200).toString("hex"),
  };
}

describe("mock state cookie", () => {
  it("저장 → 복원 왕복", () => {
    const state: MockState = {
      v: 1,
      tasks: [task(1)],
      nonces: [
        {
          nonce: "n1",
          message: "m",
          address: "0x1",
          chainId: 11155111,
          expiresAt: "2026-10-04T00:05:00Z",
        },
      ],
    };
    expect(decodeMockState(encodeMockState(state, KEY, NOW), KEY)).toEqual(
      state,
    );
  });

  it("쿠키가 없거나 깨졌거나 키가 다르면 빈 상태", () => {
    const sealed = encodeMockState(
      { ...emptyMockState(), tasks: [task(1)] },
      KEY,
      NOW,
    );
    expect(decodeMockState(undefined, KEY)).toEqual(emptyMockState());
    expect(decodeMockState("garbage", KEY)).toEqual(emptyMockState());
    expect(decodeMockState(sealed, randomBytes(32))).toEqual(emptyMockState());
  });

  it("만료된 nonce는 저장하지 않는다", () => {
    const state: MockState = {
      v: 1,
      tasks: [],
      nonces: [
        {
          nonce: "old",
          message: "m",
          address: "0x1",
          chainId: 1,
          expiresAt: "2026-10-03T23:59:59Z",
        },
        {
          nonce: "new",
          message: "m",
          address: "0x1",
          chainId: 1,
          expiresAt: "2026-10-04T00:05:00Z",
        },
      ],
    };
    expect(
      decodeMockState(encodeMockState(state, KEY, NOW), KEY).nonces.map(
        (n) => n.nonce,
      ),
    ).toEqual(["new"]);
  });

  it("4KB를 넘으면 오래된 Task부터 지운다", () => {
    const tasks = Array.from({ length: 30 }, (_, i) => task(i)).reverse();
    const sealed = encodeMockState({ v: 1, tasks, nonces: [] }, KEY, NOW);
    const restored = decodeMockState(sealed, KEY);

    expect(sealed.length).toBeLessThanOrEqual(MOCK_STATE_MAX_CHARS);
    expect(restored.tasks.length).toBeGreaterThan(0);
    expect(restored.tasks.length).toBeLessThan(30);
    expect(restored.tasks.at(-1)?.taskId).toBe("task-29");
  });
});
