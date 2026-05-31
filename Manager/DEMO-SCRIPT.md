# Live demo script (6–8 minutes)
**Goal:** show a real, governed, end-to-end claims agent — and prove it runs.

## Before you start
- Open the product: **https://ava-albion-mutual.pages.dev**
- Have a second tab on the live n8n workflow: **https://n8n.navada-edge-server.uk/workflow/JeenClaimsChat1**
- Logins:
  - **Admin console:** `admin` / `AlbionAdmin2026!`
  - **Team Console:** `adjuster` · `legal` · `finance` (Finance = admin, sees all), password `TeamAlbion2026!`
  - **n8n editor (to show the canvas):** owner email login — see `scripts/CREDENTIALS.local.txt` (kept out of Git).
- Tip: it's a real system — when you submit a claim, real branded emails are sent.

## The opening line (say this)
> "I played a Jeen Solution Engineer building a working AI agent for a UK insurer, Albion Mutual. The agent — Ava — handles a claim end to end, but crucially the AI only *assists*: a deterministic rule decides every outcome, and humans own anything sensitive. It's live on my own self-hosted infrastructure — let me show you."

## Step 1 — Overview (45s)
Land on the home page. Point out: Ava is Jeen.ai's insurance agent, live at Albion Mutual; scroll to the **real n8n canvas screenshot** under "One workflow, end to end" — "this is the actual workflow we built and run."

## Step 2 — Talk to Ava: a clean claim (90s)
Go to **Ava**. Describe a simple motor claim conversationally (e.g. "minor car-park scrape on my Ford Focus, about £480, no one injured"). Answer her follow-ups. When she registers it, point out the **decision card**: Accepted → Finance, with a claim reference. "The model triaged it; a deterministic rule decided to accept and routed it to Finance."

## Step 3 — A sensitive claim (90s)
Start a new chat with a **vulnerable** scenario (e.g. a recently bereaved 78-year-old). Show that Ava leads with empathy and the claim is **referred to a human** with the FCA vulnerability flag. "No vulnerable-customer claim is ever auto-actioned."
(Optionally also try a **suspected fraud** claim, or a **below-excess** claim → declined with appeal rights → Legal.)

## Step 4 — How It Works (60s)
Go to **How It Works**. Walk the timeline and the "what happens when you press Send" flow. Stop on the **decision engine** step: "accept / refer / decline is a deterministic rule — explicit code, not the model." Mention the "Ava at runtime" panel.

## Step 5 — Team Console: the connected workflow (90s)
Go to **Team Console**. Log in as **finance** (admin) — show **all queues**. Then explain role-based access: adjuster and legal only see their own work. Open a referred claim, **release a payment** → show the payment reference appear and the claim move. "Ava emailed the claimant and the team; the claim navigates team to team; every step is an audit event."

## Step 6 — Admin MI dashboard (60s)
Go to **Admin** (`admin` / `AlbionAdmin2026!`). Show the **KPI tiles and charts** — decisions, claims by type, fraud-risk buckets, value & risk — "live management information straight from PostgreSQL." Show **Approve/Reject** on a referred claim (human-in-the-loop), and drill into a claim to see the full conversation.

## Step 7 — Data & Security + governance (60s)
Go to **Data & Security**. Land on **"How decisions are made — and how rules change"** and the **Responsible & ethical AI** cards. Key line: "The AI assists; an explicit, version-controlled rule decides; humans own sensitive outcomes; everything is audited."

## Step 8 — Prove it's real (30s)
Switch to the n8n tab and show the live canvas / an execution. "This isn't a mock-up — it executes."

## Close (20s)
> "That's the Jeen story made concrete: data, a model, and human oversight orchestrated into one governed, auditable workflow — packaged as a product, Ava by Jeen.ai. Next steps would be policy-system and fraud-database tools, externalised rules for risk & compliance, and MI on straight-through rate and vulnerable-customer outcomes."

## If something misbehaves
- A blank or error reply right after a deploy/restart = a 30–90s n8n warm-up; wait and retry.
- Mobile: the web app's **Admin** and **Team Console** are the best way to view a claim; the n8n *editor* is desktop-oriented.
