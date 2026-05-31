# Delivery log — what was built, and why
A concise record of capabilities delivered, key design decisions, and deliberate next steps. Useful to show range and judgement.

## Capabilities delivered
- **Conversational intake agent (Ava)** — n8n AI Agent with Postgres chat **memory** + **3 tools** (Calculator, Wikipedia, Knowledge-Base RAG) + guardrails + personality; claim-type-specific mandatory questions.
- **Deterministic decision engine** — accept / refer / decline, policy-excess by type, fraud/vulnerability/value/severity routing; computed in an explicit JS Code node, not the model.
- **Three connected teams + role-based access** — Claims Adjuster, Legal, Finance (admin); per-team queues and actions; Finance admin sees all queues.
- **Connected workflow** — claims move team→team; each action writes status + an audit event; claimant updated automatically.
- **Payment simulation** — Finance releases payment → `PAY-YYYY-xxxxx`.
- **Standardised references** — `ALB-<TYPE>-<YYYY>-<seq>` via Postgres triggers + sequences.
- **RAG** — pgvector knowledge base + query cache (`x-cache: HIT/MISS`).
- **Branded, mobile-optimised email** — Zoho SMTP; claimant acknowledgement + stage updates + team handoff alerts (with Team Console + n8n execution links).
- **Web product** — Overview, Ava chat, How It Works, Data & Security (incl. decision governance + ethical AI), Admin **MI dashboard** (KPIs + charts), Team Console, My Claims (Clerk), Assignment, interactive deck; splash loader; mobile/PWA.
- **Audit & MI** — `jeen.claim_events` audit trail; live admin dashboard from PostgreSQL.
- **Governance & ethics** — LLM scoped to signals; human-in-the-loop on all sensitive outcomes; deterministic, explainable, contestable; FCA/GDPR alignment.
- **Deployed & live** — Cloudflare Pages (web) + Cloudflare tunnel/Tailscale (agent); committed to GitHub with no secrets.

## Key decisions (and the reasoning)
| Decision | Why |
|---|---|
| LLM returns signals; a rule decides | Governance, reproducibility, explainability — the core requirement for production insurance AI. |
| Decision logic in a JS Code node (not Python, not the prompt) | Deterministic, version-controlled, diff-reviewable; no model retraining to change a rule. |
| n8n for orchestration | Makes the whole flow visible and inspectable — the "governed production AI" story made concrete. |
| Email as the team collaboration layer | Mirrors how real claims organisations actually hand work between teams. |
| Role-based Team Console instead of giving teams the n8n editor | Realistic, safe access; the editor is for building, not casework. |
| pgvector + cache for RAG | Accurate, grounded answers on the insurer's own rules, fast on repeat queries. |
| Self-hosted + Cloudflare free tier | Real infrastructure, controlled cost. |

## Deliberately scoped out (and why)
- **Rate limiting** — left off so the agent is unthrottled for live testing; the production answer is a Cloudflare WAF rule (documented).
- **Real payment rail** — simulated; out of scope for a PoC, and payment is the right place for a hard human gate anyway.
- **Per-person n8n accounts / team project** — demo uses the owner login; scoped members are a production step.
- **Externalised rules table** — rules live in code (version-controlled) for now; the production step is a `jeen.rules` config table with risk/compliance sign-off.

## What's next (roadmap)
Policy-system + fraud-database tools for Ava · externalised rules engine · multi-agent orchestrator (Ava + specialist team agents) · Cloudflare rate limiting + scoped access · MI on straight-through rate, SLA and vulnerable-customer outcomes · bring-your-own-model.
