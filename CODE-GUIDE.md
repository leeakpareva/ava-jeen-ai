# Code Guide — Albion Mutual, Powered by Jeen.Ai
A walkthrough of every part of the build, for presenting it confidently.

The product is a **governed AI claims-triage agent**: a customer reports a claim
conversationally to **Ava** (an LLM agent), the workflow classifies and risk-scores it,
records it in PostgreSQL, **auto-settles simple claims** and **routes anything complex
or ≥ £5,000 (or fraud/vulnerable) to a human** via the admin approval queue.

```
Browser (React)                 n8n on NAVADA Edge                 PostgreSQL
──────────────                  ──────────────────                 ──────────
Ava chat / form  ──HTTPS──►  webhook → AI Agent → rule → insert ──►  jeen.claims
admin console    ──HTTPS──►  admin-login / claims / decision    ──►  jeen.admin_users
my claims        ──HTTPS──►  user-claims                         ──►  jeen.conversations
                              (all exposed via Cloudflare tunnel)
```

---

## 1. Frontend (`react-app/`, Vite + React 18)

| File | What it does |
|---|---|
| `index.html` | Page shell + mobile/PWA meta (manifest, theme-color, apple-touch-icon). |
| `src/main.jsx` | Entry point. Mounts `<App/>`; wraps it in Clerk's provider **only if** `VITE_CLERK_PUBLISHABLE_KEY` is set. |
| `src/App.jsx` | The shell: `JeenLogo`, `useHashRoute` (hash router), `Reveal` (scroll animation), `Mesh` (hero blobs), the **minimal top bar + collapsible side panel** (with Clerk sign-out), `Footer`, and the route→page switch. |
| `src/pages.jsx` | All pages + interactive widgets (Ava chat, form console, result card, admin table + drawer, customer portal + lifecycle, presentation deck). |
| `src/data.js` | Config & content: endpoint URLs, `PRODUCT`/`BRAND`, demo `SCENARIOS`, `WORKFLOW_STEPS`, `STATS`, `SECURITY`, `ASSIGNMENT`, `LIFECYCLE_STAGES`. **Rebrand from here.** |
| `src/icons.jsx` | In-house vector icon set (`<Icon name="…">`); no emojis. |
| `src/WorkflowFilm.jsx` | The Remotion composition that animates the Ava workflow on How It Works. |
| `src/styles.css` | All styling. Real Jeen palette (lilac `#d6a6e5`, terracotta `#c55a4e`, amber `#e3a954`) as CSS variables; sections are commented; mobile rules at the bottom. |
| `.env` | `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_TRIAGE_URL`, `VITE_N8N_WORKFLOW_URL`. |

Run: `cd react-app && npm install && npm run dev` → http://localhost:5180

---

## 2. The n8n workflows (the backend "agent")

All live on the self-hosted n8n (`navada-n8n`), exposed at
`https://n8n.navada-edge-server.uk/webhook/…`. Exported JSON in `workflow/`.

### `JeenClaimsChat1` — Ava, the conversational agent  *(the star)*
`POST /claims-chat`  →  **Build Transcript** (Code: turns the message history into
text)  →  **Ava — AI Intake Agent** (n8n AI Agent node + OpenAI Chat Model + a
Structured Output Parser; this is the LLM decision step, with guardrails + self-intro)
→ **Ready to register?** (IF on the agent's `ready` flag):
- **true** → **Build Claim Record** (Set: also applies the deterministic routing rule —
  fraud ≥ 60 → SIU; value ≥ £5,000 / vulnerable / High severity → adjuster; else
  auto-settle) → **Insert Claim → Postgres** → **Respond · Registered** → **Link
  Conversation** (stamps the claim_ref onto the logged transcript).
- **false** → **Respond · Continue** (asks the next question).
A parallel branch logs **every turn**: **Build Log** → **Log Conversation** (upsert into
`jeen.conversations`).

### `JeenClaimsTriageAPI1` — structured form API
`POST /claims-triage`: same LLM triage + deterministic routing, but for the form
(returns the decision JSON directly).

### `JeenClaimsPortal1` — standalone hosted portal
`GET /claims-portal`: serves a self-contained HTML version of the form (shareable link).

### `JeenAdminAPI1` — admin/ops
- `POST /admin-login` — checks `username`/`md5(password)` against `jeen.admin_users`, returns a token.
- `GET /claims-admin?token=` — returns all claims (full detail) for the console.
- `POST /claims-decision` — approve/reject a claim → updates `jeen.claims` (the human-in-the-loop action).

### `JeenUserAPI1` — customer + logs
- `GET /user-claims?email=` — a policyholder's own claims (for the Clerk portal).
- `GET /conversations-admin?token=` — full Ava transcripts for the admin console.

**Why deterministic routing?** The model only *assesses* (type, severity, fraud,
vulnerability). The **£5,000 + complexity rule is enforced in the workflow**, not the
prompt — so it's exact, inspectable and defensible (the governance story Jeen sells).

---

## 3. Database (PostgreSQL, schema `jeen`)
`docker exec -it navada-postgres psql -U postgres -d navada_pipeline` then `SET search_path TO jeen;`

| Table | Purpose |
|---|---|
| `claims` | Every claim + the AI assessment + status/decision (the system of record / audit trail). |
| `admin_users` | Admin console logins (md5-hashed). Demo: `admin` / `AlbionAdmin2026!`. |
| `conversations` | Full Ava transcripts (JSONB), one row per session, linked to a claim. |
| `users` | Policyholder accounts (for the customer portal). |

---

## 4. Guardrails (Ava)
Built into the agent's system prompt: only handles Albion Mutual claims (declines
off-topic & prompt-injection), never invents details, no legal/medical/financial advice,
never promises a payout, never asks for card numbers/passwords, and leads with empathy
for vulnerable claimants. She introduces herself on the first message.

---

## 5. Talking points for the demo
1. **Overview** → the story.  2. **Live Demo → Ava** → report a claim in plain English; watch the n8n stages run.  3. Try a **£100k** or a **bereavement** case → routed to a human.  4. **Admin** → log in, open a claim (drawer shows the full conversation), **Approve** → status updates in Postgres.  5. **How It Works** → the animated workflow + real n8n screenshot.  6. **Data & Security** → GDPR/DPA/SAR.  7. **Present** → the built-in deck.
