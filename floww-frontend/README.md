This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Task API flow (issues #8–#12)

The browser uses same-origin BFF routes: `POST /api/chat/draft`, `POST/GET /api/tasks`,
`GET /api/tasks/:taskId`, `POST /api/tasks/:taskId/quotes`, `POST /api/tasks/:taskId/attempts`,
`POST /api/tasks/:taskId/ai-proposal`, and `GET /api/tasks/:taskId/events?after=0&limit=50`.
Each requires the encrypted wallet session; mutations also require the same origin.

- Draft requests forward exactly `{ conversation: [{ role, content }] }`. The response
  preserves the AI envelope and adds `createTask` (null unless ready and valid) and
  `conversionIssues`. Conversations stay in component memory, outside Query caches,
  cookies, logs and browser storage. `useChatDraft.reset()` clears the draft as well.
- Amounts are integer strings. fUSDC has six decimals; deadlines must be absolute,
  future times within 30 days. Only the two demo catalog items are supported.
- `useCreateTask` persists one Idempotency-Key per wallet and input in sessionStorage.
  Storage failures fall back to the same key while the page remains open.
- Task details poll every five seconds until terminal. Event polling starts at the
  last numeric cursor, merges sequences without duplicates, drains remaining pages
  and fetches once more when the Task becomes terminal.
- User attempts forward exactly `{ quoteId, proposedBy: "USER" }`; AI proposals send
  no body and have a 120-second timeout. No payment is executed by these endpoints.
- Mock state remains in an encrypted, compressed visitor cookie. Older tasks are
  evicted when its 4KB budget is exceeded; mock mode is for a single-browser demo,
  not durable or concurrent production storage.

Contracts were checked against `web5five/Floww_Server` commit
`f729b0efc442514262f0ca108ab444aba841cccd` (`TaskViews`, `TaskInputs`,
`TaskService`, `TaskPolicy` and `AiTaskProposalService`). Multiple attempts are allowed
while AWAITING_APPROVAL, with at most five attempts; a denial ends the Task only
after that limit or denial of every live quote. AI reuses an existing allowed AI
attempt for the selected quote.

For local mock verification, configure `FLOWW_UPSTREAM=mock` and
`FLOWW_SESSION_SECRET` as a random 64-character hex value, then run the app.
Do not commit the secret. The script signs in using the existing demo endpoint,
keeps cookies only in memory and prints no credentials or conversation bodies:

```bash
node scripts/api-check.mjs all
node scripts/api-check.mjs draft
node scripts/api-check.mjs task
node scripts/api-check.mjs quotes
node scripts/api-check.mjs policy
node scripts/api-check.mjs events
npx vitest run
npx tsc --noEmit
npm run lint
npm run build
```

`FLOWW_CHECK_ORIGIN` overrides http://localhost:3000. For an already authenticated
Preview session, supply `FLOWW_CHECK_COOKIE` through your local environment.
The full assertions target the deterministic mock catalog. Production AI draft
requests may return 503 `PROVIDER_NOT_CONFIGURED`; use mock or a configured Preview
to test draft generation.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
