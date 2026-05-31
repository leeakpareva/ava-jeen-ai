# Manager Pack — Ava (Jeen UK · AI Solution Engineer)
**Everything a hiring manager / interview panel needs to understand, trust and assess this build.**
By Leslie (Lee) Akpareva.

> **What this is:** Ava — Jeen.ai's AI agent for insurance, deployed at the fictional UK insurer "Albion Mutual". A governed, agentic, end-to-end claims platform built as a launchable, production-feel PoC for the Jeen home assignment.

## Live links
- **Product (web app):** https://ava-albion-mutual.pages.dev
- **Live agent (n8n canvas):** https://n8n.navada-edge-server.uk/workflow/JeenClaimsChat1
- **Source (GitHub):** https://github.com/leeakpareva/ava-jeen-ai

## Read in this order
| # | Document | What it answers |
|---|---|---|
| 1 | [HOW-IT-WORKS.md](HOW-IT-WORKS.md) | The architecture, the agent, the data flow, the tech stack |
| 2 | [DECISION-RULES-AND-GOVERNANCE.md](DECISION-RULES-AND-GOVERNANCE.md) | How decisions are made, how rules are added, why they're deterministic, and the ethical-AI stance |
| 3 | [DEMO-SCRIPT.md](DEMO-SCRIPT.md) | A 6–8 minute live demo with exact steps, talking points and credentials |
| 4 | [LIVE-LOGS.md](LIVE-LOGS.md) | Real captured logs — DB, audit trail, n8n executions, live API calls |
| 5 | [DIRECTORY-WALKTHROUGH.md](DIRECTORY-WALKTHROUGH.md) | Every file and folder explained, to walk the panel through the codebase |
| 6 | [SECURITY-ASSESSMENT.md](SECURITY-ASSESSMENT.md) | "Is Cloudflare enough?" — posture review + production hardening roadmap |
| 7 | [ACCESS-AND-STORAGE.md](ACCESS-AND-STORAGE.md) | How to open the databases (CloudBeaver) + exactly where every kind of data (incl. attachment images) is stored |
| 8 | [INTERVIEW-QA.md](INTERVIEW-QA.md) | Anticipated questions and strong, honest answers |
| 9 | [DELIVERY-LOG.md](DELIVERY-LOG.md) | What was built, the decisions made, and what's deliberately next |

## The 30-second summary
Ava handles an insurance claim end to end: a claimant talks to her in plain English; she triages it (an LLM returns structured signals only); a **deterministic rule** — not the model — decides **accept / refer / decline** and routes it to one of three real teams (Claims Adjuster, Legal, Finance); she emails the claimant and the team; humans action the work in a **role-based Team Console**; the claim moves between teams; Finance releases payment (simulated). Every step is written to PostgreSQL as an audit trail. It is live, governed, and testable right now.

## Why it should land well with Jeen
- **It's real and live**, on self-hosted infrastructure — not a slide mock-up.
- **Governance is the product**, not a footnote: deterministic decisions, human-in-the-loop, full audit trail, ethical-AI by construction — exactly the "fragmented pilots → governed production AI" story Jeen sells.
- **It models a real organisation** — connected multi-team workflow with role-based access and email as the collaboration layer.
- **It's packaged as a product** ("Ava by Jeen.ai"), ready to demo to a customer on day one.
