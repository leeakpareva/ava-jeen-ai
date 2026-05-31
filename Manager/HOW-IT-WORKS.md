# How Ava works — architecture & data flow

## 1. The journey of one claim (end to end)
1. **Intake (conversational).** The claimant talks to Ava on the web app. She introduces herself once, then collects the standard FNOL fields (policy number, name, email, incident type, date, estimated value, description) **plus** the mandatory questions for that claim type (Motor: registration, third party, injuries; Home: cause, rooms, habitability; Travel: destination/dates, evidence; Liability: who was injured, solicitor contact).
2. **Triage (LLM).** Ava returns strict, schema-constrained JSON: claim type, severity (Low/Medium/High), a 0–100 fraud-risk score with reasons, an FCA vulnerability flag with reason, and a short adjuster summary. **The model returns signals only — it does not decide the outcome.**
3. **Decision (deterministic rule).** A small JavaScript function turns those signals + the claim facts into **accept / refer / decline** and selects a team. (Full detail in DECISION-RULES-AND-GOVERNANCE.md.)
4. **Record.** The claim is written to PostgreSQL with a sequential reference `ALB-<TYPE>-<YYYY>-<seq>` and the full assessment.
5. **Notify + hand off.** Ava emails the claimant a branded acknowledgement and alerts the assigned team by email (with links to the Team Console and the exact n8n execution).
6. **Human action.** The team works the claim in the role-based Team Console — approve, decline, request info, escalate, clear-fraud, uphold-appeal, release-payment. Each action updates status, writes an audit event, hands the claim to the next team, and triggers Ava to email the claimant an update.
7. **Settle.** Finance releases the payment (simulated), producing a payment reference `PAY-<YYYY>-<seq>`.

## 2. Ava is a real agent (not a chatbot)
Ava is an **n8n AI Agent** node with:
- **Memory** — Postgres-backed chat memory keyed by session id, so she remembers the conversation; many users can talk to her concurrently without colliding.
- **Three tools** (assistive, read-only — they cannot take an action):
  - **Calculator** — arithmetic (totals, excess maths).
  - **Wikipedia** — general world facts.
  - **Knowledge Base (RAG)** — retrieval over Albion Mutual's own cover/excess/claims/fraud/complaints rules, via a dedicated **pgvector** store (OpenAI `text-embedding-3-small`, cosine search) with a query cache.
- **Guardrails** — claims-only; never invents facts; never promises a payout; no legal/medical/financial advice; refuses prompt-injection/role-change; empathy-first for distressed/vulnerable claimants.
- **Structured output** — a schema-constrained JSON contract the rest of the workflow can trust.

## 3. Architecture (where everything runs)
```
Browser (React app, Cloudflare Pages)
        │  HTTPS
        ▼
Cloudflare tunnel  →  self-hosted n8n (ASUS / NAVADA Edge)
        │
        ├── OpenAI gpt-4o-mini (Ava's reasoning) + text-embedding-3-small (RAG)
        ├── PostgreSQL 17  (system of record: claims, teams, events, conversations)
        ├── pgvector       (knowledge base for RAG)
        └── Zoho SMTP      (branded claimant + team emails)
```
- **No inbound ports** are exposed on the host — traffic arrives via the Cloudflare tunnel over an encrypted **Tailscale** mesh; TLS terminates at the Cloudflare edge.
- **Hosting cost is controlled** — the web app is on Cloudflare Pages' free tier; the agent runs on existing self-hosted infrastructure.

## 4. The n8n workflows (8 in total)
| Workflow | Endpoints | Role |
|---|---|---|
| Ava — Conversational Intake | `POST /claims-chat` | The agent: memory + 3 tools, decision engine, claimant + team emails |
| Team Console API | `POST /team-login`, `GET /team-claims`, `POST /team-action` | Per-team login, queue, and actions |
| Admin API | `POST /admin-login`, `GET /claims-admin`, `POST /claims-decision` | Ops console + human-in-the-loop approve/reject |
| User & Conversations API | `GET /user-claims`, `GET /conversations-admin` | Customer portal + conversation logs |
| RAG (kb-search) | `POST /kb-search` | pgvector retrieval + query cache |
| Triage API, in-n8n Chat, Hosted Portal | various | Structured triage, in-n8n chat demo, hosted portal |

## 5. The web application
React 18 + Vite SPA on Cloudflare Pages. Pages: **Overview · Ava (live demo) · How It Works · Data & Security · My Claims (Clerk) · Admin (MI dashboard) · Team Console · Assignment · Present (interactive deck)**. White-logo splash loader, mobile-optimised, Jeen brand palette, modern full-screen chat UI.

## 6. Data model (PostgreSQL, schema `jeen`)
- `claims` — every claim + AI assessment + decision/team/status/payout/payment_ref.
- `team_users` — per-team logins + roles (Finance = admin).
- `claim_events` — the audit trail (who/what/which team/when).
- `conversations` — full chat transcripts, linked to claim references.
- `kb`, `kb_cache` — RAG knowledge base + query cache.
- `admin_users` — admin console login.
- Sequences + triggers generate the standardised claim and payment references automatically.

## 7. Tech stack at a glance
n8n (self-hosted) · OpenAI gpt-4o-mini + text-embedding-3-small · PostgreSQL 17 · pgvector · Zoho SMTP · React 18 + Vite · Clerk (customer auth) · Cloudflare (Pages + tunnel) · Tailscale · Git/GitHub.
