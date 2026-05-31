# Anticipated questions & strong answers
Honest, confident answers to what a Jeen panel is likely to ask. Keep answers short out loud; the detail here is your backup.

## Product & use case
**Q. Why insurance claims?**
High-volume, repetitive triage with real regulatory weight (fraud, FCA Consumer Duty) and clear hand-offs between teams — the ideal place for a *governed* agent. I also have insurance domain background, so the scenarios are realistic.

**Q. Is this a real system or a prototype?**
Real and live. It runs on my own self-hosted n8n + PostgreSQL + OpenAI, fronted by Cloudflare. You can submit a claim right now and it will be triaged, decided, recorded and emailed. See `Manager/LIVE-LOGS.md` for captured evidence.

## The AI & the decision (the key questions)
**Q. Does the LLM make the decision?**
No. The LLM only *reads* the claim and returns structured signals (type, severity, fraud score, vulnerability flag, summary). A separate **deterministic rule** decides accept/refer/decline. This is the central design choice.

**Q. Is the rule Python?**
No — it's a small **JavaScript function in the n8n workflow** (the "Build Claim Record" Code node): a policy-excess lookup table, then `if/else` on value, fraud, vulnerability and severity. Plain, explicit code.

**Q. How do you guarantee it's deterministic?**
The decision is a pure function of its inputs — no model call, no randomness, no time dependence. Same claim → same outcome, every time, reproducible for audit and appeals. Model temperature can't change an outcome because the rule sits downstream of the model and reads only structured fields.

**Q. How are new rules added?**
You edit that function — a new excess, threshold or routing condition — and it's committed to Git, so every change is a reviewable, attributed, reversible diff. No prompt-engineering, no model retraining. Production next step: move the thresholds into a `jeen.rules` config table so risk & compliance can change them through formal sign-off without an engineer.

**Q. How do you stop the model hallucinating into a decision?**
Three layers: the model is constrained to a JSON schema; guardrails forbid inventing facts or promising payouts; and the outcome is computed by the deterministic rule, not the model. The model's tools are assistive and read-only.

## Governance, ethics & compliance
**Q. How is this ethical / responsible AI?**
Six principles (on the Data & Security page): human accountability, deterministic & explainable decisions, fairness & vulnerability protection, privacy & honesty, auditable & contestable, bounded automation. Every sensitive outcome is owned by a person; declines carry appeal rights.

**Q. FCA Consumer Duty?**
A vulnerability flag is a first-class output on every claim; vulnerable customers are routed to a person with extra care. The same rule applies to everyone — consistent, not discretionary.

**Q. GDPR / DPA?**
Lawful basis (contract + legitimate interest for fraud), DPA-ready, SAR-by-reference, configurable retention + right-to-erasure, data minimisation, DPIA-ready by construction. Detailed on the Data & Security page.

## Engineering
**Q. Why n8n rather than code?**
It makes the orchestration **visible and inspectable** — exactly the "governed production AI" story. The agent, tools, memory, decision and integrations are one canvas a reviewer (or a risk officer) can read. I drop to code (the Code node) only where determinism matters.

**Q. Can it handle multiple users at once?**
Yes — chat memory is keyed per session id, so concurrent claimants don't collide; PostgreSQL handles concurrent writes; each webhook execution is independent.

**Q. Where would rate limiting / abuse protection go?**
At the Cloudflare edge (a WAF rate-limit rule on the agent's path) — the cleanest place; or a Postgres-backed limiter in the workflow. I scoped it out of the live demo deliberately so the agent is unthrottled for you to try.

**Q. Cost?**
gpt-4o-mini is inexpensive; the web app is on Cloudflare Pages' free tier; the agent runs on existing self-hosted infrastructure. Cost is controlled by design.

**Q. What's mocked?**
Payment is simulated (a payment reference, no real bank rail) and the insurer is fictional. Everything else — the agent, decisions, database, RAG, emails, team console, audit trail — is real.

**Q. How does RAG work and why?**
Albion's policy/claims rules are embedded (OpenAI `text-embedding-3-small`) into pgvector; Ava retrieves them by cosine similarity to answer cover/excess questions accurately instead of guessing. A query cache returns repeat questions instantly (`x-cache: HIT`).

**Q. What would you do next?**
Externalise the rules table; integrate a real policy system + fraud database as tools; add a multi-agent orchestrator (Ava + specialist team agents); Cloudflare rate limiting + scoped per-person n8n access; and MI on straight-through rate and vulnerable-customer outcomes.

**Q. What are you most proud of?**
That governance is the product, not a bolt-on — and that it's genuinely live, end to end, with humans firmly in control of anything that matters.
