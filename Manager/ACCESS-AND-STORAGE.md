# Access & storage — where everything lives
Practical reference for the demo: how to open the databases, and exactly where each kind of data is stored.

## Database UI — CloudBeaver
- URL: **http://localhost:8978** (HTTP — "force HTTPS" is disabled; leave it off).
- CloudBeaver login: user **`navada`** / password in Key Vault secret `cloudbeaver-admin-password`.
- Two PostgreSQL connections are **created and saved** (verified working):

| Connection | Host | Port | Database | PG version | Status |
|---|---|---|---|---|---|
| **Albion Mutual — Claims** | `navada-postgres` | 5432 | `navada_pipeline` | 17.9 | Established ✓ |
| **Albion Mutual — RAG** | `jeen-pgvector` | 5432 | `jeenrag` | 17.10 | Established ✓ |

- DB login for both: user **`postgres`**, password in Key Vault secret `jeen-postgres-password` (`Navada2026pg!`). SSL off, credentials saved.
- To demo: expand **Albion Mutual — Claims → navada_pipeline → Schemas → jeen → Tables** and open `claims`.

## Where each kind of data is stored
| Data | Where | Notes |
|---|---|---|
| Claims (+ AI assessment, decision, team, status, payment ref) | `jeen.claims` (navada_pipeline) | 25+ rows; the main demo table |
| Team logins + roles | `jeen.team_users` | 3 teams; Finance = admin |
| Audit trail (team actions) | `jeen.claim_events` | who / what / which team / when |
| Conversations (full Ava transcripts) | `jeen.conversations` | linked to claim references |
| Admin login | `jeen.admin_users` | md5-hashed |
| **Attachment content** | `jeen.attachments` | filename, mime, and the **AI-extracted text summary** |
| RAG knowledge base + cache | `jeen.kb`, `jeen.kb_cache` (in `jeenrag` on `jeen-pgvector`) | 12 embedded chunks |

## Where ATTACHMENT IMAGES are stored (important)
- **The raw image/document is NOT persisted.** When a claimant attaches a photo or PDF, it is sent **transiently** to OpenAI vision (`gpt-4o-mini`) via the `/attach-analyze` n8n workflow, analysed, and then **discarded** — it is never written to disk, to R2, or to the database.
- **Only the extracted content is stored**: a text summary of what the image shows (damage, visible text, amounts, dates, reg plates) is saved to `jeen.attachments.summary`, and that summary is fed into Ava's conversation so her triage uses it.
- The `jeen.attachments.data_b64` column exists but is **intentionally left empty** in this build (we chose "vision, no R2"), to keep storage light and avoid large blobs in SQL.
- **To retain the actual images** (a real claim file would): either (a) store the base64 in `data_b64`, or (b) add **Cloudflare R2** object storage and keep a URL on the row. R2 needs an R2 API token / access keys, which are not currently in the vault — a small follow-up.

## Persistence (for next week's demo)
- `navada-postgres` and `cloudbeaver` both have **`restart=always`** + data volumes, so they come back automatically on PC reboot with all data and the saved CloudBeaver connections intact.
- Only `docker rm` / `compose down -v` would remove data — don't run those.

## Credentials (all in Azure Key Vault `navada-edge-vault`)
| Secret | Use |
|---|---|
| `jeen-postgres-password` | Postgres `postgres` user (both DBs) |
| `cloudbeaver-admin-password` | CloudBeaver login (user `navada`) |
| `scripts/CREDENTIALS.local.txt` | OpenAI / SMTP / app secrets (gitignored, on disk) |
