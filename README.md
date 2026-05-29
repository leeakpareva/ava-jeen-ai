# Jeen UK — Solution Engineer Home Assignment
**Leslie Akpareva · built on NAVADA n8n (ASUS)**

Customer: **Albion Mutual** (fictional UK general insurer)
Use case: **Claims Intake & Triage Agent (FNOL)** — solves a real, high-volume problem; one LLM decision step; two real actions (DB write + email); human-in-the-loop on every sensitive claim.

## What's in here
| File | Purpose |
|---|---|
| `workflow/claims-triage-agent.json` | **Exported n8n workflow** (required deliverable). Already imported into your n8n. |
| `dataset/sample-claims.json` | 6 sample claims, one per routing path (required deliverable). |
| `slides/jeen-claims-triage-deck.html` | 5-slide deck → open in browser, Print → Save as PDF (landscape). |
| `scripts/RUNBOOK.md` | **Build + recording script**: credential setup, pitch, demo order, what to screenshot. |
| `scripts/test_triage.py` | Standalone validator — runs the real triage prompt against OpenAI. **Verified: all 6 routes correct.** |
| `scripts/CREDENTIALS.local.txt` | The 3 credential values (gitignored — do not commit). |
| `screenshots/` | Drop the full-workflow + successful-run screenshots here. |

## Requirements coverage (their rubric)
- ✅ Solves a real business problem — manual claims triage backlog
- ✅ ≥1 LLM-powered decision step — structured triage (type, severity, fraud score, vulnerability, routing)
- ✅ ≥1 action — Postgres write **and** acknowledgement email
- ✅ Human-in-the-loop — native n8n Wait/Form approval for high-value / high-fraud / vulnerable claims
- ✅ Fully working & demoable live
- ✅ Deliverables: workflow export, full-flow screenshot, run screenshots, dataset, ≤5 slides

## Status
- [x] `jeen.claims` table created in Postgres (`navada_pipeline`, schema `jeen`)
- [x] Workflow built and imported into n8n ("Albion Mutual — Claims Triage Agent (FNOL)")
- [x] LLM triage logic validated against the live model (all routes correct)
- [ ] Add 3 credentials in n8n UI (OpenAI ✓ value, Postgres ✓ value, Zoho SMTP — paste your app password)
- [ ] Record the video (follow `scripts/RUNBOOK.md`)
- [ ] Capture screenshots + export deck to PDF

## Quick re-validate the triage brain
```bash
cd ~/jeen-assignment
export OPENAI_API_KEY="$(docker exec navada-command-dashboard printenv OPENAI_API_KEY)"
python scripts/test_triage.py
```
