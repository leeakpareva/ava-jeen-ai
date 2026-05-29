# Jeen Triage — Submission Guide
**A governed AI claims-triage agent · PoC for the Jeen ecosystem · by Lee Akpareva**

Everything below is **live and working** on NAVADA Edge (self-hosted n8n + PostgreSQL + OpenAI, exposed via Cloudflare).

## Run the product (React app)
```bash
cd ~/jeen-assignment/react-app
npm install      # first time
npm run dev      # http://localhost:5180
```
Pages: **Overview · Live Demo · How It Works · Data & Security · Admin · Assignment · Present** (interactive deck).

## Live agent endpoints (base: https://n8n.navada-edge-server.uk/webhook)
| Endpoint | What it does |
|---|---|
| `POST /claims-triage` | Structured LLM triage → Postgres → decision JSON |
| `POST /claims-chat` | **Ava** — conversational NLP intake, claim-type-specific questions, registers the claim |
| `GET /claims-portal` | Standalone hosted claim portal (shareable link) |
| `POST /admin-login` | Admin auth against `jeen.admin_users` |
| `GET /claims-admin?token=` | Live claims list |
| `POST /claims-decision` | Approve/reject a claim (human-in-the-loop) |

## Admin console (demo the backend logic)
- Page: **Admin** → login **`admin` / `AlbionAdmin2026!`** (verified against the live PostgreSQL `jeen.admin_users` table).
- Shows every claim the agent has processed, stats, fraud scores, vulnerability flags, routing — and **Approve / Reject** for anything `pending-human-review` (writes back to Postgres).

## How the agent works
1. **Intake** — web form, conversational agent (Ava), or webhook.
2. **AI triage (LLM)** — OpenAI returns schema-constrained JSON: claim type, severity, fraud risk (0-100 + reasons), FCA vulnerability flag, routing, summary.
3. **Record** — written to PostgreSQL (`jeen.claims`) with a claim reference.
4. **Route** — governance rule: value ≥ £10k, fraud ≥ 60, or vulnerable → human review; else auto-settle.
5. **Human-in-the-loop** — sensitive claims become `pending-human-review` in the admin queue for Approve/Reject.

## Demo script (for the Jeen team)
1. **Overview** → the product story.
2. **Live Demo → Talk to Ava** → describe a claim conversationally; watch the n8n stages light up and the decision appear.
3. Try a sensitive one (e.g. a bereavement/vulnerable case) → routed to human review.
4. **Admin** → log in → show the live claims table → **Approve** the pending claim → status updates in PostgreSQL.
5. **How It Works** → the annotated workflow + the real n8n execution screenshot.
6. **Data & Security** → GDPR / DPA / SAR / retention story.
7. **Present** → run the built-in interactive slide deck.

## Assignment deliverables (all included)
Exported workflows (`workflow/*.json`) · full-workflow screenshot (`screenshots/`) · successful-run proof · dataset (`dataset/`) · slide deck (`slides/Jeen-Claims-Triage-Deck.pdf`) · **plus** a live, reviewer-testable product.

## Notes
- **Email approval** to leeakpareva@gmail.com can be enabled by adding a Zoho/SMTP app password credential in n8n (one secret not stored on the server). The working human-in-the-loop today is the admin approval queue.
- Credentials live only in n8n's encrypted store and `scripts/CREDENTIALS.local.txt` (gitignored). Admin password is md5-hashed in the database.
