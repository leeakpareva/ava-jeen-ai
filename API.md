# API Reference — Ava (Jeen.ai) · Albion Mutual

All endpoints are n8n webhooks on the self-hosted instance, exposed via Cloudflare.

**Base URL:** `https://n8n.navada-edge-server.uk/webhook`
**Auth:** customer endpoints are open (demo); admin endpoints require a token from `/admin-login`.
**CORS:** all endpoints allow any origin (so the React app can call them directly).

---

## Agent / claims

### `POST /claims-chat` — Ava, conversational intake agent
The main agent. Stateless per request (send the full history each turn). Ava has
memory, RAG and tools; she registers the claim when she has enough detail.
**Request**
```json
{ "session_id": "sess-abc123",
  "messages": [ { "role": "user", "content": "I had a car bump last night" } ] }
```
**Response (still gathering details)**
```json
{ "ok": true, "ready": false, "reply": "I'm sorry to hear that. What's your policy number?" }
```
**Response (claim registered)**
```json
{ "ok": true, "ready": true, "reply": "All done — your claim is registered…",
  "claim_ref": "ALB-20260529-9351", "claim_type": "Motor", "severity": "Low",
  "fraud_risk": 5, "vulnerable_flag": false, "routing": "auto-settle",
  "status": "auto-settled", "next_step": "Fast-tracked. A handler will confirm within 2 working days." }
```

### `POST /claims-triage` — structured triage (the form path)
Same triage/routing as Ava, but for the structured form (returns the decision directly).
**Request**
```json
{ "policy_number": "ALB-MOT-441902", "claimant_name": "Daniel Hughes",
  "claimant_email": "demo@example.com", "incident_type": "Motor",
  "incident_date": "2026-05-21", "estimated_value": 480,
  "description": "Minor car-park scrape, no injuries." }
```
**Response** — `{ ok, claim_ref, claim_type, severity, estimated_value, fraud_risk, fraud_reasons, vulnerable_flag, vulnerable_reason, routing, ai_summary, status, next_step }`

### `GET /claims-portal` — standalone hosted portal
Returns a self-contained HTML page (the claim form) — a shareable demo link.

---

## RAG (pgvector)

### `POST /kb-search` — knowledge-base retrieval
Embeds the query (OpenAI `text-embedding-3-small`) and cosine-searches the pgvector
store; returns the top-3 knowledge chunks. Also used internally as one of Ava's tools.
**Request** `{ "query": "what excess on a home claim?" }`
**Response**
```json
[ { "title": "Home claim requirements", "category": "home", "content": "…", "score": 0.598 },
  { "title": "Excess and underinsurance", "category": "policy", "content": "…", "score": 0.583 } ]
```

---

## Admin / operations

### `POST /admin-login`
**Request** `{ "username": "admin", "password": "AlbionAdmin2026!" }`
**Response** `{ "ok": true, "token": "jeen-adm-…", "user": "Lee Akpareva", "role": "superadmin" }`
(or `{ "ok": false, "error": "Invalid username or password" }`)

### `GET /claims-admin?token=<token>`
Returns every claim with full detail (claimant, description, AI assessment, status).
401 `{ ok:false }` if the token is wrong.

### `POST /claims-decision` — human-in-the-loop approve/reject
**Request** `{ "token": "jeen-adm-…", "claim_ref": "ALB-…", "decision": "approve", "notes": "Reviewed" }`
**Response** `{ "ok": true, "claim_ref": "ALB-…", "status": "approved" }`

---

## Customer portal & logs

### `GET /user-claims?email=<email>`
Returns the claims filed under that email (drives the Clerk "My Claims" portal + lifecycle).

### `GET /conversations-admin?token=<token>`
Returns logged Ava transcripts (`jeen.conversations`) for the admin console.

---

## Ava's agent tools (called by `/claims-chat` internally)
| Tool | Purpose |
|---|---|
| **Knowledge Base (RAG)** | `POST /kb-search` — answers policy/cover questions from the pgvector KB. |
| **Wikipedia** | general/web lookups (keyless). |
| **Calculator** | figures (excess, totals, proportions). |
| **Memory** | Postgres chat memory keyed by `session_id` (`ava_chat_memory`). |

## Frontend → endpoint map (see `react-app/src/data.js`)
`CHAT_URL` → /claims-chat · `TRIAGE_URL` → /claims-triage · `ADMIN_LOGIN_URL` → /admin-login ·
`CLAIMS_ADMIN_URL` → /claims-admin · `DECISION_URL` → /claims-decision ·
`USER_CLAIMS_URL` → /user-claims · `CONVOS_ADMIN_URL` → /conversations-admin.
