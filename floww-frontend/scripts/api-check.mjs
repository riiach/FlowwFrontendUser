import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

const mode = process.argv[2] ?? "all";
if (!["all", "draft", "task", "quotes", "policy", "events"].includes(mode))
  throw new Error(
    "Use: node scripts/api-check.mjs [all|draft|task|quotes|policy|events]",
  );
const origin = new URL(
  process.env.FLOWW_CHECK_ORIGIN ?? "http://localhost:3000",
).origin;
const jar = new Map();
if (process.env.FLOWW_CHECK_COOKIE) {
  for (const cookie of process.env.FLOWW_CHECK_COOKIE.split(";")) {
    const i = cookie.indexOf("=");
    if (i > 0) jar.set(cookie.slice(0, i).trim(), cookie.slice(i + 1).trim());
  }
}
async function request(path, method = "GET", body, extraHeaders = {}) {
  const headers = {
    Accept: "application/json",
    Origin: origin,
    ...extraHeaders,
  };
  if (jar.size)
    headers.Cookie = [...jar].map(([k, v]) => k + "=" + v).join("; ");
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const response = await fetch(origin + path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(120000),
    redirect: "error",
  });
  for (const cookie of response.headers.getSetCookie()) {
    const pair = cookie.split(";")[0],
      i = pair.indexOf("=");
    if (i > 0) jar.set(pair.slice(0, i), pair.slice(i + 1));
  }
  const data = await response.json();
  // Never print cookies, tokens or conversation text.
  if (!response.ok)
    throw new Error(
      path +
        ": " +
        response.status +
        " " +
        (data.reasonCode ?? data.error?.code ?? "INVALID_RESPONSE"),
    );
  return { data, status: response.status };
}
if (!jar.size) await request("/api/wallet-auth/demo", "POST");
const deadline = new Date(Date.now() + 2 * 86400000).toISOString();
const sentences = [
  "타이레놀을 구매하고 싶어요.",
  "아세트아미노펜을 등록된 약국에서 구매하고 싶어요.",
  "아세트아미노펜을 등록된 약국에서 60 fUSDC로 구매하고 배송 완료해주세요.",
  "아세트아미노펜을 등록된 약국에서 배송비와 수수료 포함 60 fUSDC로 내일 배송 완료해주세요.",
  `아세트아미노펜을 등록된 약국에서 배송비와 수수료 포함 60 fUSDC로 ${deadline}까지 배송 완료해주세요.`,
];
let draft;
if (mode === "draft" || mode === "all") {
  for (const [i, content] of sentences.entries()) {
    draft = (
      await request("/api/chat/draft", "POST", {
        conversation: [{ role: "user", content }],
      })
    ).data;
    console.log(
      JSON.stringify({
        sample: i + 1,
        status: draft.status,
        createTask: draft.createTask,
        missing: draft.issues.map((i) => i.code),
        conversionIssues: draft.conversionIssues,
      }),
    );
  }
  assert.equal(draft.status, "READY_FOR_REVIEW");
  assert.ok(draft.createTask);
  if (mode === "draft") process.exit(0);
}
const input = draft?.createTask ?? {
  goal: "의약품 구매 및 배송",
  itemId: "acetaminophen-500mg-10",
  maxAmountBaseUnits: "60000000",
  expiresAt: deadline,
};
const key = randomUUID(),
  headers = { "Idempotency-Key": key };
const first = await request("/api/tasks", "POST", input, headers);
const repeated = await request("/api/tasks", "POST", input, headers);
assert.equal(first.status, 201);
assert.equal(repeated.status, 200);
assert.equal(first.data.taskId, repeated.data.taskId);
const task = first.data,
  path = "/api/tasks/" + encodeURIComponent(task.taskId);
const detail = (await request(path)).data;
assert.equal(detail.taskId, task.taskId);
const list = (await request("/api/tasks?limit=20")).data;
assert.ok(list.some((t) => t.taskId === task.taskId));
console.log(
  JSON.stringify({
    taskId: task.taskId,
    status: task.status,
    maxAmountBaseUnits: task.mandate.maxAmountBaseUnits,
    remainingBaseUnits: task.mandate.remainingBaseUnits,
    expiresAt: task.mandate.expiresAt,
    idempotency: "same taskId",
  }),
);
if (mode === "task") process.exit(0);
const quoteList = (await request(path + "/quotes", "POST")).data;
for (const q of quoteList.quotes)
  console.log(
    JSON.stringify({
      merchant: q.merchantName,
      quoteId: q.quoteId,
      total: q.totalAmountBaseUnits,
      inStock: q.inStock,
      payTo: q.quotedPayToAddress,
    }),
  );
assert.deepEqual(
  quoteList.quotes.map((q) => q.totalAmountBaseUnits),
  ["23500000", "64000000", "19000000"],
);
if (mode === "quotes") process.exit(0);
const reasons = [null, "BUDGET_EXCEEDED", "RECIPIENT_NOT_ALLOWED"];
for (const [i, q] of quoteList.quotes.entries()) {
  const a = (
    await request(path + "/attempts", "POST", {
      quoteId: q.quoteId,
      proposedBy: "USER",
    })
  ).data;
  assert.equal(a.policy.reasonCode, reasons[i]);
  assert.equal(a.payment.status, "NOT_ATTEMPTED");
  console.log(
    JSON.stringify({
      merchant: q.merchantName,
      decision: a.policy.decision,
      reasonCode: a.policy.reasonCode,
      ko: a.policy.message?.ko ?? "허용",
    }),
  );
}
const ai = (await request(path + "/ai-proposal", "POST")).data;
const reused = (await request(path + "/ai-proposal", "POST")).data;
assert.equal(ai.attempt.quoteId, quoteList.quotes[0].quoteId);
assert.equal(reused.reusedAttempt, true);
assert.equal(ai.attempt.attemptId, reused.attempt.attemptId);
console.log(
  JSON.stringify({
    aiStatus: ai.proposal.status,
    selectedQuoteId: ai.attempt.quoteId,
    reusedAttempt: reused.reusedAttempt,
  }),
);
if (mode === "policy") process.exit(0);
let after = 0,
  hasMore = true;
const kinds = [];
while (hasMore) {
  const page = (await request(path + `/events?after=${after}&limit=2`)).data;
  assert.ok(Number.isSafeInteger(page.nextCursor));
  assert.ok(page.nextCursor > after);
  for (const e of page.events) {
    kinds.push(e.kind);
    console.log(JSON.stringify({ seq: e.seq, kind: e.kind, actor: e.actor }));
  }
  console.log(
    JSON.stringify({ nextCursor: page.nextCursor, hasMore: page.hasMore }),
  );
  after = page.nextCursor;
  hasMore = page.hasMore;
}
assert.deepEqual(kinds.slice(0, 3), [
  "MANDATE_DRAFTED",
  "TASK_STATUS_CHANGED",
  "QUOTES_COLLECTED",
]);
const empty = (await request(path + `/events?after=${after}`)).data;
assert.equal(empty.events.length, 0);
assert.equal(empty.nextCursor, after);
console.log(
  "PASS: draft → task → quotes → policy → AI proposal → numeric events",
);
