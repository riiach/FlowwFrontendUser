import "server-only";

import { cookies } from "next/headers";
import { deflateRawSync, inflateRawSync } from "node:zlib";
import { SESSION_COOKIE_NAMES } from "@/lib/constants/constants";
import { cookieOptions, open, seal } from "../session";

export interface MockTask {
  taskId: string;
  createdAt: string;
  [field: string]: unknown;
}

export interface MockNonce {
  nonce: string;
  message: string;
  address: string;
  chainId: number;
  expiresAt: string;
}

export interface MockState {
  v: 1;
  tasks: MockTask[];
  nonces: MockNonce[];
}

export interface MockStateStore {
  read(): Promise<MockState>;
  write(state: MockState): Promise<void>;
}

/** 쿠키 값 최대 길이 (이름·속성 포함 4KB 이내) */
export const MOCK_STATE_MAX_CHARS = 3800;
const MAX_NONCES = 5;

function sealCompressed(state: MockState, key?: Buffer): string {
  const compressed = deflateRawSync(
    Buffer.from(JSON.stringify(state)),
  ).toString("base64url");
  return seal({ v: 1, compressed }, key);
}

export function emptyMockState(): MockState {
  return { v: 1, tasks: [], nonces: [] };
}

/** 만료된 nonce를 빼고, 크기를 넘으면 오래된 Task부터 지운다 */
export function encodeMockState(
  state: MockState,
  key?: Buffer,
  now: Date = new Date(),
): string {
  const nonces = state.nonces
    .filter((nonce) => Date.parse(nonce.expiresAt) > now.getTime())
    .slice(-MAX_NONCES);
  const tasks = [...state.tasks].sort(
    (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt),
  );

  let sealed = sealCompressed({ v: 1, tasks, nonces }, key);
  while (sealed.length > MOCK_STATE_MAX_CHARS && tasks.length > 0) {
    tasks.shift();
    sealed = sealCompressed({ v: 1, tasks, nonces }, key);
  }
  return sealed;
}

/** 쿠키가 없거나 깨졌으면 빈 상태 */
export function decodeMockState(
  sealed: string | undefined,
  key?: Buffer,
): MockState {
  if (!sealed) return emptyMockState();
  const payload = open<MockState & { compressed?: string }>(sealed, key);
  let state = payload;
  if (payload?.compressed) {
    try {
      state = JSON.parse(
        inflateRawSync(Buffer.from(payload.compressed, "base64url"), {
          maxOutputLength: 1024 * 1024,
        }).toString("utf8"),
      );
    } catch {
      return emptyMockState();
    }
  }
  if (
    !state ||
    state.v !== 1 ||
    !Array.isArray(state.tasks) ||
    !Array.isArray(state.nonces)
  ) {
    return emptyMockState();
  }
  return state;
}

/** 라우트 핸들러 안에서 방문자 쿠키로 상태를 읽고 쓴다 */
export const cookieMockStateStore: MockStateStore = {
  async read() {
    const store = await cookies();
    return decodeMockState(store.get(SESSION_COOKIE_NAMES.mockState)?.value);
  },
  async write(state) {
    const store = await cookies();
    store.set(
      SESSION_COOKIE_NAMES.mockState,
      encodeMockState(state),
      cookieOptions(),
    );
  },
};

export function memoryMockStateStore(
  initial: MockState = emptyMockState(),
): MockStateStore & { state: MockState } {
  return {
    state: initial,
    async read() {
      return structuredClone(this.state);
    },
    async write(state) {
      this.state = structuredClone(state);
    },
  };
}
