# Floww Frontend ✨

> A portfolio frontend for **Floww**, the AI Agent Blockchain Wallet project our team built at **GWDC HACKATHON 26**. I’m rebuilding the frontend as a standalone project to keep learning and exploring. 🛍️🤖🔗

<img width="3840" height="2160" alt="auth_preview" src="https://github.com/user-attachments/assets/7610b3d3-2614-485c-8a0e-d712abefbd45" />

## 🌐 Live Preview

- **Production:** [https://floww-frontend.vercel.app](https://floww-frontend.vercel.app)
- Vercel Deployment Protection is currently enabled, so Vercel authentication may be required to view the site.
- Deployment details: [Vercel project](https://vercel.com/riiachs-projects/floww-frontend)

## 👋 Project Status

The **AUTH page** is implemented so far, including the Sign in / Sign up and verification UI flows. You can explore the screens for choosing an authentication method, email and wallet verification, and confirmation.

The dashboard and AI Chat screens are not implemented yet. For now, this project focuses on refining the authentication experience and frontend structure. Connecting real sign-in and wallet authentication also requires backend and provider configuration.

## 🏁 The Hackathon and Floww

One of the GWDC HACKATHON 26 challenges was **“Build a Financial Service Powered by AI Agents and Blockchain.”** Our team built **Floww**, a shopping service that uses an AI Agent and a blockchain wallet to propose shopping tasks for users to review and approve. The server side includes flows for task drafts, quotes, user approvals, and AI proposals. 🧾

- [GWDC HACKATHON 2026 challenge brief](https://www.gwdc.net/hackathon.html)
- [Floww server repository](https://github.com/web5five/Floww_Server)
- [Floww frontend repository](https://github.com/riiach/FlowwFrontendUser)

## 💭 Why I Rebuilt the Frontend

I wanted to understand more deeply how a wallet and a frontend pass transaction steps between each other. Revisiting our hackathon idea as a standalone interface is also a chance for me to build my knowledge and hands-on experience with dashboard and AI Chat frontends.

Breaking the interface into small components and connecting them into an authentication flow is part of the learning process, too. I’ll keep adding to this README as the project grows. 🌱

## 🧰 Tech Stack

- **Next.js 16** · App Router
- **React 19** · TypeScript
- **Tailwind CSS 4** and component-specific CSS
- **wagmi / RainbowKit / viem / ethers** · EVM wallet connectivity
- **React Hook Form / Zod** · Forms and input validation
- **Vitest / Playwright** · Testing tools

## 🚀 Run Locally

```bash
npm ci
npm run dev
```

The development server runs at [http://localhost:3000](http://localhost:3000) by default.

To connect to the backend, create a local `.env.local` file using `.env.example` as a reference, then add values for your environment. Never commit secrets. The default configuration uses the HTTP backend, so configure `FLOWW_API_BASE_URL` and the session settings. To try the mock server, set `FLOWW_UPSTREAM=mock` and use a random 64-character hexadecimal value for `FLOWW_SESSION_SECRET`.

```bash
npm run build
npm run start
```

Other commands:

```bash
npm run lint
npm test
npx tsc --noEmit
```

## 🗂️ Project Structure

```text
src/
├── app/
│   ├── (auth)/login/       # Login route
│   ├── api/                # Frontend BFF API routes
│   └── page.tsx            # Main entry point: currently the AUTH screen
├── components/
│   ├── auth/               # Auth page and smaller UI components
│   ├── brand/              # Floww logo and brand elements
│   └── shared/             # Components shared across screens
├── lib/
│   ├── auth/               # Authentication logic
│   ├── hooks/              # Reusable React hooks
│   ├── server/             # Server config, BFF, and upstream logic
│   ├── types/               # Shared types
│   └── ...
├── providers/              # App-wide providers
└── styles/                 # Global, page, and component styles
public/                     # Logos, images, and other static assets
scripts/                    # API check scripts
```

## 🔌 Server API Notes

The browser calls same-origin BFF routes. Main endpoints include `POST /api/chat/draft`, `POST/GET /api/tasks`, `GET /api/tasks/:taskId`, `POST /api/tasks/:taskId/quotes`, `POST /api/tasks/:taskId/attempts`, `POST /api/tasks/:taskId/ai-proposal`, and `GET /api/tasks/:taskId/events`.

Amounts are sent as integer strings, and fUSDC uses six decimal places. An AI proposal may reuse an existing allowed attempt. **These API flows do not execute payments.** The mock server is for a single-browser demo and is not durable or designed for concurrent use.

For API contracts and implementation details, see [Floww_Server](https://github.com/web5five/Floww_Server) and the existing project documentation.

## 💳 How Wallet Mandates Work
<img width="2430" height="2294" alt="mermaid-diagram" src="https://github.com/user-attachments/assets/0129e077-a4cd-4a90-af72-249b50f29ebf" />


## 📚 Further Reading about this Project

Blog posts I wrote on this project:

- [Step Indicator Tutorial](https://riachoi-services.vercel.app/blog/frontend-step-indicator-tutorial)

---

A personal portfolio project in progress. Feedback is always welcome! 💌
