# Project Structure — every file, explained
**Ava** — Jeen.ai's AI agent for insurance, deployed at **Albion Mutual**.
Root: `C:\Users\leeak\jeen-assignment\`

```
jeen-assignment/
├── README.md              Start-here overview of the build.
├── SUBMISSION.md          What's delivered + the demo script.
├── CODE-GUIDE.md          Deep walkthrough of every part (present from this).
├── API.md                 Every API endpoint (request/response/auth).
├── PROJECT-STRUCTURE.md   This file — the annotated directory map.
│
├── react-app/             THE PRODUCT (Vite + React 18 front end)
│   ├── index.html         HTML shell + mobile/PWA meta (manifest, theme-color).
│   ├── package.json       Dependencies (react, @clerk/clerk-react) + scripts.
│   ├── vite.config.js     Vite + React plugin; dev server on port 5180.
│   ├── .env               VITE_ vars: Clerk key, triage URL, n8n workflow URL.
│   ├── .env.example       Template for .env.
│   ├── public/
│   │   ├── jeen-icon.svg          App/PWA icon (the Jeen tiles).
│   │   ├── manifest.webmanifest   PWA manifest (installable on mobile).
│   │   └── shots/ava-workflow.png The real n8n canvas (shown on How It Works).
│   └── src/
│       ├── main.jsx       Entry point. Mounts <App/>; wraps in ClerkProvider if a key is set.
│       ├── App.jsx        Shell: logo, hash router, scroll-reveal, mesh hero,
│       │                  minimal top bar + collapsible side panel (with Clerk
│       │                  sign-out), footer, and the route→page switch.
│       ├── pages.jsx      All pages + widgets: Overview, Demo (Ava chat + form),
│       │                  HowItWorks (timeline + "press Send" flow + proof),
│       │                  DataSecurity, Admin (table + drawer + convo logs),
│       │                  Account (Clerk portal + lifecycle), Presentation deck.
│       ├── data.js        Config & content (endpoints, PRODUCT, scenarios, copy).
│       ├── icons.jsx      In-house vector icon set (<Icon name=…/>), no emojis.
│       ├── styles.css     All styling (Jeen palette as CSS vars; mobile rules at end).
│       └── WorkflowFilm.jsx  (Optional/unused) Remotion workflow animation — kept
│                              in case you re-enable it; not currently imported.
│
├── workflow/              THE BACKEND — exported n8n workflows (import into n8n)
│   ├── claims-chat-agent.json   Ava: webhook → AI Agent (+ memory, Calculator,
│   │                            Wikipedia, KB-RAG tools, structured output, guardrails)
│   │                            → routing rule → Postgres → respond + log + link.
│   ├── claims-triage-api.json   /claims-triage — structured form triage.
│   ├── claims-portal.json       /claims-portal — serves the standalone HTML portal.
│   ├── claims-kb-search.json    /kb-search — RAG: embed query → pgvector cosine search.
│   ├── claims-admin-api.json    /admin-login, /claims-admin, /claims-decision.
│   ├── claims-user-api.json     /user-claims, /conversations-admin.
│   └── claims-triage-agent.json The original FNOL form workflow (form trigger +
│                                Wait/Form adjuster approval) — the first build.
│
├── scripts/
│   ├── seed_kb.py         Embeds the insurance knowledge base into pgvector (RAG).
│   ├── test_triage.py     Standalone check of the triage logic against the live model.
│   ├── build_portal_workflow.py  Generates the portal workflow from the webapp HTML.
│   ├── RUNBOOK.md         Original build/record runbook + credential setup.
│   └── CREDENTIALS.local.txt     (gitignored) the live credential values.
│
├── slides/                Jeen-branded HTML deck + exported PDF.
├── dataset/sample-claims.json  6 demo claims (one per routing path).
├── webapp/                The original vanilla-HTML portal (served by claims-portal).
└── screenshots/           Captured UI screenshots used in docs/deck.
```

## Databases (PostgreSQL)
- **`navada-postgres`** (`navada_pipeline`, schema `jeen`) — `claims`, `admin_users`,
  `conversations`, `users`, `ava_chat_memory` (agent memory).
- **`jeen-pgvector`** (`jeenrag`, schema `jeen`) — `kb` (knowledge base + 1536-d
  embeddings) for Ava's RAG. Separate pgvector container.

## Run it
```
cd react-app && npm install && npm run dev      # http://localhost:5180
```
n8n workflows are already imported and active on NAVADA Edge.
