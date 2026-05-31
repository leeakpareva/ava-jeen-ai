# Live logs & evidence (captured from the running system)
**These are real outputs from the live system — the database, the n8n execution log, and live API calls. Nothing here is mocked.** Captured 2026‑05‑29/30.

> Talking point for the panel: "It's a real, running system — here is the data, the execution log, and a live call, not a screenshot of a design."

---

## 1. System of record — recent claims (PostgreSQL `jeen.claims`)
Every claim Ava has processed, with the deterministic decision, the team it was routed to, status, and the generated payment reference.
```
      claim_ref      | claim_type | severity | fraud | vuln |  value  | decision |      team       |    status    |   payment_ref
---------------------+------------+----------+-------+------+---------+----------+-----------------+--------------+----------------
 ALB-TRA-2026-001054 | Travel     | Low      |     0 | f    | 1450.00 | accept   | Finance         | approved     |
 ALB-MOT-2026-001053 | Motor      | Low      |     0 | f    |  700.00 | accept   | Finance         | approved     |
 ALB-MOT-2026-001052 | Motor      | Low      |     0 | f    |  200.00 | decline  | Legal           | declined     |
 ALB-HOM-2026-001051 | Home       | High     |     0 | t    | 6000.00 | refer    | Claims Adjuster | referred     |
 ALB-MOT-2026-001050 | Motor      | Low      |     0 | f    |  480.00 | accept   | Finance         | approved     |
 ALB-MOT-2026-001049 | Motor      | Low      |     0 | f    |  480.00 | accept   | Finance         | paid         | PAY-2026-005002
```
Reading it: a £200 motor claim was **declined** (below the £250 motor excess) and routed to **Legal**; a £6,000 vulnerable-customer home claim was **referred** to a **Claims Adjuster**; clean low-value claims were **accepted** to **Finance**; one has been **paid** with a real payment reference. This is the deterministic rule in action — see DECISION-RULES-AND-GOVERNANCE.md.

## 2. Audit trail (PostgreSQL `jeen.claim_events`)
Every team action is recorded — who, what, which team, when.
```
        at        |      claim_ref      |    actor     | action |  team
------------------+---------------------+--------------+--------+---------
 2026-05-29 22:49 | ALB-MOT-2026-001049 | Lee Akpareva | paid   | Finance
```

## 3. Data volumes (live counts)
```
 claims | events | conversations | team_users |   kb_chunks (pgvector)
--------+--------+---------------+------------+-------------------------
   24   |   1    |      26       |     3      |          12
```

## 4. n8n execution log (the workflows actually run)
The 8 most recent executions across the Ava workflows — all `success`.
```
 id    status     when             | workflow
 210   success    2026-05-29 22:55 | User & Conversations API
 209   success    2026-05-29 22:55 | Admin API (login · claims · decisions)
 208   success    2026-05-29 22:54 | Admin API (login · claims · decisions)
 207   success    2026-05-29 22:41 | Team Console API (login · queue · action)
 206   success    2026-05-29 22:40 | Ava RAG (kb-search, pgvector + cache)
 205   success    2026-05-29 22:40 | Team Console API (login · queue · action)
 204   success    2026-05-29 22:40 | Admin API (login · claims · decisions)
 203   success    2026-05-29 22:39 | Conversational Intake Agent (Ava)
```

## 5. Live API call — intake → decision (`POST /webhook/claims-chat`)
A real request to the live agent and its JSON response (the model triaged it; the deterministic rule decided):
```json
{
  "ok": true,
  "ready": true,
  "claim_ref": "ALB-TRA-2026-001054",
  "claim_type": "Travel",
  "severity": "Low",
  "estimated_value": "1450.00",
  "fraud_risk": 0,
  "vulnerable_flag": false,
  "decision": "accept",
  "team": "Finance",
  "payout_amount": "1450.00",
  "status": "approved",
  "next_step": "Good news — your claim is approved. Our Finance team will release £1450 to you, usually within 1 working day.",
  "reply": "Thank you, Demo! I've registered your claim for the lost baggage. ..."
}
```

## 6. Live API call — RAG with caching (`POST /webhook/kb-search`)
The same query twice — the first computes embeddings + vector search (cache **MISS**); the second is served from the cache (**HIT**):
```
-- first call  --  HTTP/1.1 200 OK   x-cache: MISS
-- second call --  HTTP/1.1 200 OK   x-cache: HIT
```

## How to reproduce these logs (for the technical reviewer)
- **Claims / audit / counts (SQL):**
  `docker exec -e PGPASSWORD=*** navada-postgres psql -U postgres -d navada_pipeline -c "SELECT claim_ref, decision, team, status FROM jeen.claims ORDER BY id DESC LIMIT 10;"`
- **RAG knowledge base count:**
  `docker exec -e PGPASSWORD=*** jeen-pgvector psql -U postgres -d jeenrag -c "SELECT count(*) FROM jeen.kb;"`
- **n8n executions:** read `execution_entity` in n8n's SQLite, or open the Executions tab in the n8n editor.
- **Live agent:** `curl -X POST https://n8n.navada-edge-server.uk/webhook/claims-chat -H "Content-Type: application/json" -d '{"session_id":"demo","messages":[{"role":"user","content":"..."}]}'`
- **RAG cache:** call `/webhook/kb-search` twice with the same query and watch the `x-cache` response header flip from `MISS` to `HIT`.
