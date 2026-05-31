# Security assessment — "Is Cloudflare enough?"
**Short answer: Cloudflare is necessary but not sufficient.** It's a strong edge/transport layer; the real security work for an insurance app is at the *application* layer, and in this PoC that is deliberately light. This note is an honest posture review and a production hardening roadmap — useful to discuss with the Jeen panel, as it demonstrates security maturity.

## What Cloudflare (+ Tailscale) already covers — and it's good
- **TLS everywhere** and **no inbound ports** on the host: the Cloudflare tunnel dials out, so the origin (n8n on NAVADA Edge) is never directly reachable from the internet.
- **DDoS protection** and edge filtering at the Cloudflare layer.
- The web app is **static, served from Cloudflare's CDN**; application secrets never reach the browser.
- Node-to-node traffic runs over an encrypted **Tailscale (WireGuard) mesh**.
- Secrets live in n8n's encrypted credential store + **Azure Key Vault**, never in the client or in Git.

So the **network/transport layer is genuinely solid**.

## What Cloudflare does NOT cover — the real gaps (ranked)
1. **Open agent endpoints + `CORS *`.** `/claims-chat`, `/attach-analyze` and `/kb-search` have **no authentication** — anyone with the URL can POST. Because they call OpenAI, that is a **cost/abuse risk**. *(Highest priority.)*
2. **No rate limiting.** It was deliberately removed so the live demo is unthrottled; same abuse/cost exposure as above.
3. **PoC-grade auth.** Admin/team logins are password-gated, but they return **static shared tokens** (no expiry, no per-user scope, not JWT/session); the admin token is passed in the **URL query string**; the admin password is hashed with **md5** (weak).
4. **SQL-injection surface.** Several n8n Postgres nodes build SQL by **string-interpolating user input** (e.g. `admin-login`: `WHERE username = '{{ body.username }}'`). Some Code nodes escape quotes, but not every path — a crafted input could inject. *(Most serious technical vulnerability.)*
5. **PII at rest.** Claimant names/emails/claim details are stored in PostgreSQL on shared infrastructure. The app *describes* encryption/retention/DPA on the Data & Security page, but the PoC implements the minimum.

## Production hardening roadmap (the layered answer)
- **Edge:** Cloudflare **WAF rate-limit rules** on `/claims-chat` + `/attach-analyze`; bot protection; tighten **CORS** to the app's own origin only.
- **API auth:** real **API keys / signed JWTs** with expiry on every endpoint; move tokens from the URL into headers; per-team scoped tokens.
- **Data layer:** **parameterised queries** (eliminate SQLi); least-privilege DB roles; encryption at rest; automated retention/erasure.
- **Identity:** stronger admin hashing (bcrypt/argon2); MFA; scoped n8n member accounts instead of the shared owner login.
- **Ops:** audit logging (already present via `jeen.claim_events`); alerting; scheduled secrets rotation (Key Vault is already in place).

## Quick wins available now (low effort, high value)
- **CORS lockdown** to `ava-albion-mutual.pages.dev` on every webhook (one change each). *Note: this makes the demo work only from the deployed site, not `localhost`.*
- **Cloudflare rate-limit rule** on the LLM endpoints — needs a zone-WAF-scoped API token (the current vault tokens lack that scope) or ~30 seconds in the Cloudflare dashboard. Suggested: ~20 requests/min per IP on `/claims-chat` and `/attach-analyze`.
- **Parameterise the SQL** in the workflows to remove the injection risk.

The last two touch n8n (a brief restart), so they are best applied **after** the live demo.

## One-line summary for the panel
> "Cloudflare and Tailscale give a solid network and transport baseline — TLS, no open ports, DDoS protection. For production insurance I'd layer on application security: API authentication with scoped, expiring tokens; rate limiting at the edge; parameterised queries; and encryption, retention and access controls on the PII. The PoC is intentionally open so it's easy to test."
