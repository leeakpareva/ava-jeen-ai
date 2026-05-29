# Jeen Home Assignment — Build & Recording Runbook
**Use case:** Albion Mutual (fictional UK insurer) — Claims Intake & Triage Agent (FNOL)
**Platform:** your n8n on ASUS — http://localhost:5678 (or https://n8n.navada-edge-server.uk)

The workflow is **already imported**: *"Albion Mutual — Claims Triage Agent (FNOL)"*.
You just add 3 credentials, do one dry run, then record.

---

## 0) Before you hit record (5 min, off-camera)
1. Open n8n → open the workflow.
2. Add the 3 credentials below (values in `CREDENTIALS.local.txt`).
3. Do one silent test run so you know it works. Then reset and record clean.

### Credential 1 — OpenAI  (node: *OpenAI Chat Model*)
- Type: **OpenAI**
- API Key: `OPENAI_API_KEY` from CREDENTIALS.local.txt
- Save → reopen *OpenAI Chat Model* node → confirm model `gpt-4o-mini` is selected.

### Credential 2 — Postgres  (nodes: *Insert Claim*, *Update: Reviewed*, *Update: Auto-Approved*)
- Type: **Postgres**
- Host `navada-postgres` · Port `5432` · Database `navada_pipeline` · User `postgres` · Password from file · SSL `disable`
- (n8n and Postgres are on the same `navada-edge` docker network, so the container name resolves.)
- Assign this same credential to all three Postgres nodes.

### Credential 3 — Zoho SMTP  (node: *Email Claimant Acknowledgement*)
- Type: **SMTP**
- Host `smtp.zoho.eu` · Port `465` · SSL **on** · User `claude.navada@zohomail.eu` · Password = **your Zoho app password** (paste it — it is the one value not stored locally)

---

## 1) The 90-second pitch (say this at the top of the recording)
> "I'm playing a Solution Engineer at Jeen, building a working AI agent for a UK insurer, Albion Mutual. Their problem is claims triage — every new claim is read and routed by hand, which is slow, inconsistent, and risky for fraud and for vulnerable customers under FCA Consumer Duty. I've built an n8n agent that triages each claim with an LLM, writes it to a governed database, and — crucially — keeps a human in the loop on anything sensitive. Let me show you."

## 2) Walk the canvas (left → right, ~2 min)
- **Claim Form (FNOL)** — "Real intake. A claimant fills this in; it triggers the flow."
- **AI Triage Decision (+ OpenAI model + Risk & Routing Schema)** — "This is the LLM decision step. It returns *structured* output — claim type, severity, a fraud-risk score with reasons, a vulnerability flag for Consumer Duty, and a routing recommendation. It never settles a claim itself."
- **Build Claim Record → Insert Claim → Postgres** — "First action: the claim and the AI's assessment are written to our system of record. Full audit trail."
- **Needs Human Review?** — "A governance rule: high value, high fraud risk, or a vulnerable customer all force human review."
- **Adjuster Approval (Wait)** — "Human-in-the-loop. The flow pauses and an adjuster gets an Approve / Reject form. Nothing happens to a sensitive claim without a person."
- **Auto-Approve branch** — "Clean, low-value claims are fast-tracked automatically."
- **Email Claimant Acknowledgement** — "Second action: the claimant gets a branded email with their claim reference."

## 3) Live runs (the proof — ~4 min)
Open the **form URL** (Form Trigger node → "Open form in new tab" / Production URL). Submit from `dataset/sample-claims.json`:

1. **Daniel Hughes (£480 motor scrape)** → expect `auto-settle`. Show: execution all-green, new Postgres row, acknowledgement email.
2. **Priya Nair (£46k kitchen fire)** → expect `adjuster`. Flow **pauses**. Open the waiting **Adjuster Review** form, read the AI summary, click **Approve**, add a note. Show status flips to `reviewed` in Postgres.
3. **Marcus Webb (recently-incepted, round £9k theft, "settle this week")** → expect **high fraud risk + SIU-fraud**. Point at `fraud_reasons`. Human review again.
4. **Eileen Roberts (bereaved, 78)** → expect **vulnerable_flag = true**. "This is the Consumer-Duty win — the agent caught it at intake and protected the customer by routing to a person."

## 4) Show the database (10 sec of credibility)
CloudBeaver (http://localhost:8978) or any client:
```sql
SELECT claim_ref, claimant_name, claim_type, severity, fraud_risk,
       vulnerable_flag, routing, status, adjuster_decision
FROM jeen.claims ORDER BY id DESC;
```

## 5) Close (15 sec)
> "So that's the whole story Jeen sells — data, a model, and human oversight orchestrated in one governed flow, with an audit trail. The LLM accelerates the routine and surfaces the risky; the adjuster stays in control. Next steps would be policy-system lookups, a fraud-database tool, and dashboards on straight-through rate and vulnerable-customer outcomes."

---

## Capturing the required deliverables (do while recording)
- [ ] **Exported workflow JSON** — already at `workflow/claims-triage-agent.json` (or re-export: ⋯ menu → Download).
- [ ] **1 screenshot of the full workflow** — zoom to fit, capture the whole canvas → `screenshots/`.
- [ ] **1–2 screenshots of a successful run** — the green execution + the new Postgres row.
- [ ] **Dataset** — `dataset/sample-claims.json` (provided).
- [ ] **Deck** — `slides/jeen-claims-triage-deck.html` → open in browser → Print → Save as PDF (landscape).

## If something misbehaves
- LLM node errors on parser → reopen *AI Triage Decision*, confirm **"Require Specific Output Format" / output parser** is on and *Risk & Routing Schema* is connected.
- Postgres "relation does not exist" → the table is `jeen.claims` (schema `jeen`); re-check the schema dropdown.
- Email fails → it's the Zoho app password; everything else is pre-filled.
