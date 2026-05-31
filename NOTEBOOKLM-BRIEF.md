# Ava — Source Brief for NotebookLM (deck generation)
**Product:** Ava, Jeen.ai's AI agent for insurance · **Deployed at:** Albion Mutual (a fictional UK general insurer)
**Author:** Leslie (Lee) Akpareva · **Context:** Jeen UK — AI Solution Engineer home assignment, built as a launchable, production-feel PoC.
**Live product:** https://ava-albion-mutual.pages.dev · **Live agent (n8n):** https://n8n.navada-edge-server.uk/workflow/JeenClaimsChat1

> This document is a complete, self-contained description of the app. Use it as the single source for a presentation deck. A suggested slide outline is at the end.

---

## 1. One-line pitch
Ava is a governed, agentic AI that handles an insurance claim end to end — conversational intake, triage, fraud and vulnerability checks, an auditable accept/refer/decline decision, payment simulation, and a connected multi-team workflow where human teams collaborate through email and a role-based console. It is live, testable, and built on self-hosted infrastructure — not a mock-up.

## 2. The customer problem (why this use case)
- Insurers handle huge volumes of First Notice of Loss (FNOL) claims. Triage is largely manual: a person reads each claim, classifies it, scores fraud risk, spots vulnerable customers, and routes it.
- This is slow, inconsistent, expensive, and risky: missed fraud signals, and — under **FCA Consumer Duty** — missed vulnerable-customer obligations.
- Claims also pass between many teams (adjusters, legal/fraud, finance). Hand-offs are where claims stall, get lost, or breach SLA.
- The opportunity: let an AI agent do the repetitive reading and routing instantly and consistently, **keep a human in control of every sensitive outcome**, and make the hand-offs between teams a connected, auditable workflow.
- Domain edge: the author has 17+ years including insurance (Generali UK), so the use case is realistic.

## 3. What Ava does — the journey of one claim
1. **Conversational intake.** The claimant talks to Ava in natural language. Ava introduces herself once, then asks the standard FNOL fields (policy number, name, email, incident type, date, estimated value, description) **plus** the mandatory questions specific to the claim type (e.g. Motor: registration, third party, injuries; Home: cause, rooms affected, habitability; Travel: destination/dates, evidence; Liability: who was injured, solicitor contact).
2. **AI triage.** Ava (an LLM) returns strict, schema-constrained JSON: claim type, severity (Low/Medium/High), a 0–100 fraud-risk score with reasons, an FCA vulnerability flag with reason, and an adjuster summary.
3. **Decision brain (deterministic — NOT the LLM).** A governance rule turns the assessment into **accept / refer / decline** and routes to a team (details in §5).
4. **System of record.** The claim is written to PostgreSQL with a sequential reference and a full audit trail.
5. **Connected teams.** Ava emails the claimant and alerts the assigned team. Each team actions the claim in the **Team Console**; the action moves the claim to the next team and triggers Ava to update the claimant by email.
6. **Settlement.** Approved claims are released by Finance (payment simulation), producing a payment reference.

## 4. Ava is a real agent (not a chatbot)
Ava is an n8n **AI Agent** node, which means she has:
- **Memory** — Postgres-backed chat memory keyed by session, so she remembers the conversation and multiple users can talk to her at once without colliding.
- **Three tools** she calls when useful:
  - **Calculator** — for sums (e.g. totals, excess maths).
  - **Wikipedia** — for general world facts.
  - **Knowledge Base (RAG)** — retrieval over Albion Mutual's own policy/cover/excess/claims rules, via a dedicated **pgvector** store with embeddings (OpenAI `text-embedding-3-small`) and a query cache.
- **Guardrails** — she only helps with Albion Mutual claims, never invents facts, never promises a payout, never gives legal/medical/financial advice, refuses prompt-injection/role-change, and leads with empathy for distressed/vulnerable claimants.
- **Personality** — warm, human, concise; acknowledges what the person said before moving on.

## 5. The decision engine (governed, deterministic, auditable)
Every claim becomes exactly one of: **accept · refer · decline**. The rule (not the model) decides, so it is inspectable and consistent:
- **Policy excess by incident type:** Motor £250 · Home £150 · Travel £100 · Liability £250 (default £100).
- **Decline** → if the estimated value is **below the excess** → routed to **Legal** (appeals); claimant told they can appeal within 14 days.
- **Refer → Legal** if fraud-risk ≥ 60 (Legal/SIU review).
- **Refer → Claims Adjuster** if the customer is vulnerable, OR value ≥ £5,000, OR severity is High.
- **Accept → Finance** otherwise → status "approved", Finance releases payment.
- **Payment simulation:** Finance "pay" sets status "paid" and generates a payment reference.
- **Standardised references:** claims `ALB-<TYPE>-<YYYY>-<sequence>` (e.g. `ALB-MOT-2026-001049`); payments `PAY-<YYYY>-<sequence>` (e.g. `PAY-2026-005002`). Generated by PostgreSQL triggers + sequences.

## 6. Connected multi-team workflow + role-based access
The claim "navigates the system": Ava routes it, a team acts, it moves to the next team, and the claimant is kept informed automatically.

**Three real teams, each with a real mailbox:**
| Team | Person | Mailbox | Receives the claim when… |
|---|---|---|---|
| Claims Adjuster | (adjuster) | send2chopstix@gmail.com | referral: ≥ £5k, high severity, or vulnerable customer |
| Legal | Nisha Chopra | Nishachopra.uk@gmail.com | fraud-suspected, declines & appeals |
| Finance (admin) | Lee Akpareva | leeakpareva@gmail.com | approved claim → release payment |

**Role-based login (Team Console):**
- Adjuster and Legal each sign in and see **only their own queue** and the actions relevant to them.
- **Finance is the admin** — sees **every queue**, with full actions on any claim.
- Logins authenticate against the live `jeen.team_users` table.

**Team actions** (each writes status + an audit event + triggers an Ava email): approve, request-info, decline, escalate, clear-fraud, uphold-appeal, release-payment. Approving a claim makes it leave that queue and appear in the next team's — e.g. Adjuster approves → it lands in Finance.

**Audit trail:** every routing and team action is written to `jeen.claim_events` (who, what, which team, when) — a replayable record of the claim moving through the organisation.

## 7. Branded, automated email (the connective tissue)
Ava sends **mobile-optimised, Jeen-branded** emails via Zoho SMTP:
- **Claimant** — an acknowledgement on submission, and an update at **every** stage as the claim moves through the queues.
- **Team** — a hand-off alert when a claim lands in their queue, including the claim summary, Ava's assessment, and two links: "Action in Team Console" and "View run in n8n" (the exact execution).
This is how human teams collaborate inside the agent-driven workflow without ever touching the n8n editor.

## 8. The web application (the product surface)
React + Vite single-page app, deployed free on **Cloudflare Pages**. Pages:
- **Overview** — the product story, a rotating full-width hero, the agent "at a glance", and the real n8n canvas screenshot ("the workflow we built and run").
- **Ava (live demo)** — chat with Ava (modern, clean, full-screen UI) or use a structured form; she triages, decides and registers the claim live.
- **How It Works** — start a claim, then a step-by-step timeline, a "what happens when you press Send" technical flow, and a dynamic "Ava at runtime" description.
- **Data & Security** — data strategy, UK GDPR lawful basis, DPA, Subject Access Requests, retention/erasure, FCA Consumer Duty, DPIA-readiness.
- **My Claims** — customer portal (Clerk login, with an email fallback) showing claim lifecycle.
- **Admin** — operations console: every claim, stats, SLA tracking, fraud/vulnerability flags, drill-down with full conversation, and human-in-the-loop approve/reject.
- **Team Console** — the role-based per-team workspace described in §6.
- **Assignment** — the Jeen brief and how each requirement is met.
- **Present** — an interactive slide deck built into the app.

UX touches: a **white-logo splash loader** on load and when consoles/n8n launch (a mature, considered feel); mobile-optimised throughout; the Jeen brand palette (lilac, terracotta, amber); Ava's own gradient avatar.

## 9. Architecture & tech stack
- **Orchestration:** self-hosted **n8n** (NAVADA Edge, ASUS host), exposed via a **Cloudflare tunnel** over an encrypted **Tailscale** mesh — no inbound ports on the host.
- **Model:** OpenAI **gpt-4o-mini** for the agent; **text-embedding-3-small** for RAG.
- **Data:** **PostgreSQL 17** as the system of record; a dedicated **pgvector** container for RAG.
- **Email:** **Zoho SMTP** (branded HTML).
- **Frontend:** React 18 + Vite, hash router, IntersectionObserver scroll-reveal, Clerk auth, deployed to **Cloudflare Pages** (free tier — cost-controlled).
- **8 n8n workflows:** conversational intake (Ava), team console API, admin API, user/conversations API, RAG (kb-search), structured triage API, in-n8n chat demo, hosted portal.
- **Database objects:** `jeen.claims`, `jeen.admin_users`, `jeen.team_users`, `jeen.claim_events`, `jeen.conversations`, `jeen.kb`, `jeen.kb_cache`.

## 10. Security & governance (the "governed AI" story)
- **Secrets never reach the browser** — API keys and DB credentials live only in n8n's encrypted credential store; the React app only ever sees the claim form and the decision.
- **The LLM is scoped to a single decision** and returns schema-constrained JSON — it has no tools to settle, pay or reject, and cannot take an action on its own.
- **Deterministic, inspectable routing** — the accept/refer/decline rule is explicit, not buried in a prompt.
- **Human-in-the-loop** on everything sensitive (≥ £5,000, fraud ≥ 60, vulnerable, complex) — a named person approves or rejects.
- **Auditable system of record** — every claim and every action (automated or human) is timestamped in PostgreSQL.
- **Regulatory alignment** — FCA Consumer-Duty vulnerability flag on every claim; UK GDPR lawful basis, DPA, SAR-by-reference, retention/erasure, DPIA-ready by design.
- **Network** — Cloudflare tunnel + Tailscale; TLS at the edge.

## 11. What makes it stand out (talking points)
- It is **actually live and testable**, on real self-hosted infrastructure, not a slide mock-up.
- A **genuine agent** (memory + tools + RAG + guardrails), not a single LLM call.
- **Governance is a feature, not an afterthought** — deterministic decisions, human-in-the-loop, full audit trail.
- A **connected multi-team workflow** with role-based access and email as the collaboration layer — it models how a real claims organisation works.
- **Production-feel polish**: standardised references, payment simulation, branded mobile emails, splash loader, SLA tracking, cost-controlled free hosting.
- **Packaged as a product** in the Jeen ecosystem ("Ava by Jeen.ai"), ready to demo to a customer.

## 12. How it maps to the Jeen brief (requirements coverage)
- **Working agent flow in n8n** → self-hosted, live, executes per claim.
- **≥ 1 LLM decision step** → structured triage (type, severity, fraud, vulnerability, summary).
- **≥ 1 action / integration** → PostgreSQL writes, RAG retrieval, branded email, payment simulation.
- **Human-in-the-loop** → admin approval queue + the per-team console; every sensitive claim waits for a person.
- **Fully working & demoable live** → reviewer-testable hosted URLs.
- **Artefacts** → exported workflows, the n8n canvas screenshot, successful-run evidence, sample dataset, and an in-app interactive deck.

## 13. Suggested demo script (5–7 minutes)
1. **Overview** — the product story + the real n8n canvas.
2. **Talk to Ava** — describe a simple motor claim → watch it get accepted and routed to Finance live.
3. Try a **sensitive** one (a bereaved/vulnerable customer) → referred to a human; show the FCA vulnerability flag.
4. Try a **suspected fraud** or a **below-excess** claim → refer to Legal / decline with appeal rights.
5. **Team Console** — log in as Finance (admin), show all queues; release a payment → payment reference; show the claim moving and the claimant email update.
6. **Admin** — SLA tracking, fraud/vulnerability, drill into the full conversation, approve/reject.
7. **Data & Security** — the governance and GDPR story. Close on "governed AI on your terms — Ava by Jeen.ai."

## 14. Demo credentials (PoC only)
- **Admin console:** `admin` / `AlbionAdmin2026!`
- **Team Console:** `adjuster` · `legal` · `finance` (admin), password `TeamAlbion2026!`

## 15. Roadmap / "what's next" (optional closing slide)
- Policy-system and fraud-database tool integrations for Ava.
- Cloudflare WAF rate limiting + per-person scoped n8n team access.
- A dedicated multi-agent orchestrator (Ava + specialist team sub-agents).
- Bring-your-own-model support; dashboards on straight-through rate, SLA, and vulnerable-customer outcomes.

---

### Suggested slide outline for NotebookLM
1. Title — Ava, Jeen.ai's AI agent for insurance (live at Albion Mutual)
2. The problem — manual claims triage & risky hand-offs
3. Why this use case — volume, fraud, FCA Consumer Duty, domain edge
4. What Ava does — the journey of one claim (the 6 steps)
5. Ava is a real agent — memory, 3 tools, RAG, guardrails
6. The decision engine — accept / refer / decline (governed & deterministic)
7. Connected multi-team workflow + role-based access
8. Email as the collaboration layer
9. The product — web app pages & screenshots
10. Architecture & tech stack (diagram)
11. Security & governance (the "governed AI" story)
12. What makes it stand out
13. Mapping to the Jeen brief
14. Live demo / call to action
15. Roadmap
