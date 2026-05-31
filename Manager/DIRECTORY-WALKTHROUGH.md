# Directory walkthrough — every file, explained
A complete, file-by-file tour of the project so you can confidently walk the Jeen panel through the whole codebase. Top to bottom, the project is: **docs at the root**, the **n8n workflows** (the agent + APIs), the **React product**, the **scripts/data**, and the **presentation assets**.

```
jeen-assignment/
├── README.md, SUBMISSION.md, API.md, CODE-GUIDE.md, PROJECT-STRUCTURE.md, NOTEBOOKLM-BRIEF.md
├── Manager/            ← this presenter pack
├── workflow/           ← 9 exported n8n workflows (the agent + all APIs)
├── react-app/          ← the product (React + Vite, deployed to Cloudflare Pages)
├── scripts/            ← DB schema, RAG seeding, tests, ops scripts
├── dataset/            ← sample claims
├── slides/             ← branded slide deck (HTML + PDF)
├── screenshots/        ← evolution screenshots
└── webapp/             ← earlier Cloudflare Pages Functions prototype (superseded by react-app)
```

---

## Root documents
| File | What it is |
|---|---|
| `README.md` | Top-level project overview — the product, teams, workflows, security, repo layout, demo logins. |
| `SUBMISSION.md` | The assignment submission guide — how to run it, the endpoints, the demo script, deliverables. |
| `API.md` | API reference for every webhook endpoint (request/response shapes). |
| `CODE-GUIDE.md` | A guide to the React codebase — what each file does and the conventions used. |
| `PROJECT-STRUCTURE.md` | A map of the repository structure. |
| `NOTEBOOKLM-BRIEF.md` | A self-contained brief written to generate a slide deck in NotebookLM. |
| `.gitignore` | Keeps secrets and build output out of Git (`.env`, `*.local.txt`, `node_modules`, `dist`, `.wrangler`). |
| `.vscode/settings.json` | Editor settings for the workspace. |

## `Manager/` — this pack
| File | What it is |
|---|---|
| `README.md` | Index + 30-second summary + reading order. |
| `HOW-IT-WORKS.md` | Architecture, the agent, the data flow, the tech stack. |
| `DECISION-RULES-AND-GOVERNANCE.md` | The deterministic rule, how rules are added, why it's deterministic, ethical-AI principles. |
| `DEMO-SCRIPT.md` | A 6–8 minute live demo with exact steps, talking points and credentials. |
| `LIVE-LOGS.md` | Real captured logs — DB, audit trail, n8n executions, live API calls. |
| `DIRECTORY-WALKTHROUGH.md` | This file. |
| `INTERVIEW-QA.md` | Anticipated questions and strong, honest answers. |
| `DELIVERY-LOG.md` | What was built, key decisions, and what's deliberately next. |

## `workflow/` — the n8n workflows (the engine)
Exported n8n workflows. Credentials bind by id placeholder (`REPLACE_OPENAI_CRED`, `REPLACE_PG_CRED`, `REPLACE_PGVEC_CRED`, `REPLACE_SMTP_CRED`); auth tokens are injected at import (`REPLACE_TEAM_TOKEN`, `REPLACE_ADMIN_TOKEN`).
| File | n8n workflow | Role |
|---|---|---|
| `claims-chat-agent.json` | **Ava — Conversational Intake Agent** | The heart: webhook → build transcript → **AI Agent** (model + Postgres memory + Calculator + Wikipedia + Knowledge-Base/RAG + structured-output parser) → IF "ready?" → **decision engine (Code node)** → insert to Postgres → respond → **email claimant** → **alert team**. Also logs the conversation. |
| `claims-team-api.json` | **Team Console API** | `/team-login` (auth vs `jeen.team_users`), `/team-claims` (per-team queue), `/team-action` (approve/decline/pay/escalate/clear-fraud/uphold-appeal/request-info → update status + write `claim_events` + email claimant). |
| `claims-admin-api.json` | **Admin API** | `/admin-login`, `/claims-admin` (all claims for the MI dashboard), `/claims-decision` (human-in-the-loop approve/reject). |
| `claims-user-api.json` | **User & Conversations API** | `/user-claims` (customer portal), `/conversations-admin` (transcripts for the admin console). |
| `claims-kb-search.json` | **Ava RAG** | `/kb-search` — embeds the query (OpenAI), cosine search over `jeen.kb` in pgvector, with a query cache (`x-cache: HIT/MISS`). |
| `claims-triage-api.json` | **Claims Triage API** | A structured (non-conversational) triage endpoint — the same brain via a form/API path. |
| `ava-n8n-chat.json` | **Ava — in-n8n Chat** | A Chat Trigger version so Ava can be demoed live inside the n8n editor. |
| `claims-portal.json` | **Hosted Portal** | Serves a standalone HTML claim portal from n8n. |
| `claims-triage-agent.json` | **Original FNOL agent** | The first version (form trigger + Wait/Form adjuster approval) — kept for history. |

## `react-app/` — the product
Vite + React 18 single-page app, deployed to Cloudflare Pages.
| File | What it does |
|---|---|
| `src/main.jsx` | App entry — mounts React, wraps in Clerk's provider when a key is present (else email fallback). |
| `src/App.jsx` | The shell — the Jeen logo (SVG), the hash router, scroll-reveal + mesh-gradient helpers, the nav + collapsible side panel, the **white-logo splash loader**, and the footer. |
| `src/pages.jsx` | Every page: Overview (hero + canvas), Ava chat + structured form, How It Works, Data & Security (incl. decision governance + ethical AI), **Admin MI dashboard** (KPIs + charts), **Team Console** (role-based), My Claims (Clerk), Assignment, and the interactive Presentation deck. |
| `src/data.js` | Single source of content/config — endpoint URLs, product/brand identity, the team definitions, scenarios, workflow steps, stats, security & ethics copy. Re-point or rebrand from here. |
| `src/icons.jsx` | Inline vector icons (no emoji) + Ava's gradient avatar. |
| `src/styles.css` | The full design system — Jeen palette, hero, chat UI, splash, MI dashboard charts, team console, mobile rules. |
| `src/WorkflowFilm.jsx` | An earlier animated workflow component (not in the current routes; kept for reference). |
| `index.html` | The HTML shell Vite injects into. |
| `vite.config.js` | Vite build config. |
| `package.json` / `package-lock.json` | Dependencies and scripts (`npm run dev` / `npm run build`). |
| `.env.example` | Template for environment variables (Clerk key, endpoint overrides). |
| `.env` | Local env (gitignored). |
| `public/jeen-icon.svg` | Favicon / PWA icon. |
| `public/manifest.webmanifest` | PWA manifest (installable, snaps to mobile). |
| `public/shots/workflow-canvas.png` | The real n8n canvas screenshot used on Overview & How It Works. |
| `public/shots/hero-1/2/3.jpg` | The rotating hero images. |
| `public/shots/ava-diagram.png`, `ava-workflow.png`, `webapp-preview.png`, `workflow-execution.png` | Diagram + supporting imagery. |

## `scripts/` — database, RAG, tests, ops
| File | What it does |
|---|---|
| `jeen_teams.sql` | Creates `jeen.team_users` (per-team logins + roles; Finance = admin) and `jeen.claim_events` (audit trail); seeds the three teams. Idempotent. |
| `seed_kb.py` | Embeds Albion Mutual's policy/claims knowledge and loads it into the pgvector `jeen.kb` table for RAG. |
| `test_triage.py` | Standalone validator — runs the triage prompt against OpenAI and checks routing. |
| `build_portal_workflow.py` | Helper that generated the hosted-portal workflow. |
| `n8n_inspect.js` | Read-only inspection of n8n's SQLite (users, projects, sharing, workflow state) — an ops utility. |
| `n8n_setup_team.js` | Sets the n8n owner password (from an env var) and activates the workflows — an ops utility. |
| `RUNBOOK.md` | Build/record runbook — credential setup and a recording script. |
| `CREDENTIALS.local.txt` | The real secret values (**gitignored** — never committed). |

## `dataset/`, `slides/`, `screenshots/`, `webapp/`
| Path | What it is |
|---|---|
| `dataset/sample-claims.json` | Sample claims, one per routing path — for demos and tests. |
| `slides/jeen-branded-deck.html`, `jeen-claims-triage-deck.html` | Branded HTML slide decks. |
| `slides/Jeen-Claims-Triage-Deck.pdf` | The deck exported to PDF. |
| `screenshots/*` | The product's visual evolution (v1 → v6) — useful to show iteration. |
| `webapp/functions/api/triage.js`, `webapp/index.html` | An earlier Cloudflare Pages **Functions** prototype (serverless triage) — superseded by the `react-app` + n8n design; kept for history. |

---

### How to talk to it (one sentence)
"The `workflow/` folder is the engine — an n8n AI agent plus governed APIs; `react-app/` is the product that consumes them; `scripts/` sets up the database and RAG; and everything a person needs to run, audit or extend it is documented at the root and in `Manager/`."
