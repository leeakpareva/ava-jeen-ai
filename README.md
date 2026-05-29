# Ava — Jeen.ai's AI claims agent for insurance
**A governed, agentic, end-to-end claims platform · deployed at "Albion Mutual" (a fictional UK insurer)**
Built by Leslie (Lee) Akpareva for the **Jeen UK · AI Solution Engineer** home assignment, on self-hosted NAVADA infrastructure (n8n + PostgreSQL + OpenAI, fronted by Cloudflare).

> **Live product:** https://ava-albion-mutual.pages.dev
> **Live agent (n8n):** https://n8n.navada-edge-server.uk/workflow/JeenClaimsChat1

---

## What this is
Ava is a conversational AI agent that handles an insurance claim from the first message to a settled decision — and routes the work across **real human teams** who collaborate through the same connected workflow. It is a working PoC designed to feel production-ready.

**The journey of one claim**
1. **Intake** — the claimant talks to **Ava** (a real n8n AI Agent: model + Postgres chat *memory* + 3 tools — Calculator, Wikipedia, and a **Knowledge Base via RAG**). She asks the claim-type-specific questions, with FCA-aware guardrails.
2. **Decision brain** — a *deterministic* rule (not the LLM) decides **accept · refer · decline**, computes the policy excess, fraud and vulnerability signals, and routes to a team.
3. **System of record** — the claim is written to PostgreSQL with a sequential reference (`ALB-<TYPE>-<YYYY>-<seq>`) and a full audit trail (`jeen.claim_events`).
4. **Connected teams** — Ava emails the claimant **and** the assigned team. Each team works the claim in the **Team Console**; actioning it moves the claim to the next team and triggers Ava to update the claimant.
5. **Payment simulation** — approved claims are released by Finance, producing a `PAY-<YYYY>-<seq>` reference.

## The teams (role-based access)
| Team | Sees | Gets the claim when… |
|---|---|---|
| **Claims Adjuster** | only their queue | referral — ≥ £5,000, high severity, or vulnerable customer |
| **Legal** | only their queue | fraud-suspected, declines & appeals |
| **Finance** (admin) | **every queue, full access** | approved claim → release payment |

Team logins authenticate against the live `jeen.team_users` table. Finance has the **admin** role and sees all queues.

## Web app (React + Vite, deployed on Cloudflare Pages)
Pages: **Overview · Ava (live demo) · How It Works · Data & Security · My Claims (Clerk) · Admin · Team Console · Assignment · Present**.
- Full-width rotating hero, white-logo splash loader, mobile-optimised, Jeen brand palette.
- Modern full-screen Ava chat UI; the real n8n canvas screenshot is shown on Overview.

## n8n workflows (live via Cloudflare tunnel — base `https://n8n.navada-edge-server.uk/webhook`)
| Workflow | Endpoints | Role |
|---|---|---|
| `claims-chat-agent.json` (**Ava**) | `POST /claims-chat` | Conversational intake, agent + memory + 3 tools, decision brain, claimant + team emails |
| `claims-team-api.json` | `POST /team-login`, `GET /team-claims`, `POST /team-action` | Team Console: login, per-team queue, actions (approve/decline/pay/escalate/clear-fraud/uphold-appeal/request-info) |
| `claims-admin-api.json` | `POST /admin-login`, `GET /claims-admin`, `POST /claims-decision` | Ops console — every claim + human-in-the-loop approve/reject |
| `claims-user-api.json` | `GET /user-claims`, `GET /conversations-admin` | Customer portal + conversation logs |
| `claims-kb-search.json` | `POST /kb-search` | RAG over `jeen.kb` (pgvector + query cache) |
| `claims-triage-api.json`, `ava-n8n-chat.json`, `claims-portal.json` | various | Structured triage API, in-n8n chat demo, hosted portal |

## Branded email (Zoho SMTP)
Ava sends mobile-optimised, Jeen-branded emails from `claude.navada@zohomail.eu`:
- **Claimant** — acknowledgement on submission + an update at every stage.
- **Team** — a handoff alert when a claim lands in their queue, with links to the **Team Console** and the exact **n8n execution**.

## Data, security & governance
- Secrets live only in n8n's encrypted credential store (cred IDs are `REPLACE_*` placeholders in these files) — never in the browser.
- The LLM is scoped to one decision and returns schema-constrained JSON; it cannot settle, pay or reject on its own.
- Every claim and team action is written to PostgreSQL with timestamps — a defensible, replayable audit trail.
- FCA Consumer-Duty vulnerability flag on every claim; GDPR/DPA/SAR story on the **Data & Security** page.
- Hosting via Cloudflare tunnel over an encrypted Tailscale mesh — no inbound ports on the host.

## Repository layout
| Path | Purpose |
|---|---|
| `react-app/` | Vite + React product. `npm run dev` (:5180) · `npm run build` · deploy to Cloudflare Pages. Endpoints in `src/data.js`. |
| `workflow/*.json` | Exported n8n workflows (importable; credentials bind by `REPLACE_*` id). |
| `scripts/jeen_teams.sql` | Team logins + audit-trail schema (demo passwords only). |
| `scripts/RUNBOOK.md`, `API.md`, `CODE-GUIDE.md`, `PROJECT-STRUCTURE.md`, `SUBMISSION.md` | Docs. |
| `dataset/`, `slides/`, `screenshots/` | Sample claims, deck, screenshots. |

## Demo logins (PoC only)
- **Admin console:** `admin` / `AlbionAdmin2026!`
- **Team Console:** `adjuster` · `legal` · `finance` (admin), password `TeamAlbion2026!`

## Notes on running it
- Workflows import into n8n with credentials already bound by id (`REPLACE_OPENAI_CRED`, `REPLACE_PG_CRED`, `REPLACE_PGVEC_CRED`, `REPLACE_SMTP_CRED`).
- The Team Console auth token is injected at import time; the committed files keep the `REPLACE_TEAM_TOKEN` placeholder.
- Real credential values live only in `scripts/CREDENTIALS.local.txt` (gitignored).
