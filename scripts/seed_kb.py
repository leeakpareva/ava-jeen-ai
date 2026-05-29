#!/usr/bin/env python3
"""Seed Ava's RAG knowledge base: embed insurance domain knowledge with OpenAI
   (text-embedding-3-small, 1536-d) and emit SQL inserts for the pgvector store."""
import os, json, urllib.request, sys

KEY = os.environ.get("OPENAI_API_KEY", "").strip()
if not KEY:
    sys.exit("OPENAI_API_KEY not set")

# (title, category, content) — Albion Mutual / general insurance claims knowledge.
KB = [
    ("Claim routing & auto-settlement rule", "policy",
     "Albion Mutual auto-settles claims under £5,000 that are low-risk, non-vulnerable and not flagged for fraud. Any claim of £5,000 or more, or that is complex, scores high for fraud (60+), or involves a vulnerable customer, is routed to a human adjuster for approval before settlement."),
    ("Vulnerable customers (FCA Consumer Duty)", "compliance",
     "Under FCA Consumer Duty, signs of vulnerability include bereavement, serious illness, disability, mental-health distress and financial hardship. These claims must be handled with empathy, given extra time and support, and always routed to a human handler. Vulnerability is flagged on every claim at intake."),
    ("Motor claim requirements", "motor",
     "For a motor claim, collect the vehicle registration, whether another vehicle or third party was involved, and whether anyone was injured. Helpful evidence: dashcam footage, photos of damage, and the other driver's details. The standard motor excess is £250 plus any voluntary excess."),
    ("Home claim requirements", "home",
     "For a home claim, identify the cause (fire, flood, theft, escape of water, storm or accidental damage), which rooms or items are affected, and whether the property is still habitable. Emergency repairs to prevent further damage are covered. Standard home excess is £150."),
    ("Travel claim requirements", "travel",
     "For a travel claim, collect the destination and trip dates. Lost or delayed baggage needs a Property Irregularity Report from the airline; theft needs a police report within 24 hours; medical claims need receipts and a doctor's note. Valuables have single-item limits."),
    ("Liability claim requirements", "liability",
     "For a liability claim, record who was injured or what property was damaged, and whether a solicitor or the third party has been in contact. Do not admit liability. Public and employers' liability are handled by the adjuster with legal support."),
    ("Fraud indicators (SIU referral)", "fraud",
     "Raise fraud risk for: a recently incepted policy, round-number high values, inconsistent or contradictory dates, pressure to settle quickly, missing supporting documents (e.g. no second key on a theft), and patterns matching previous claims. High-risk claims are referred to the Special Investigations Unit before any payment."),
    ("Settlement timelines & next steps", "process",
     "Auto-settled claims: a handler confirms settlement within 2 working days. Adjuster-reviewed claims: a decision within 3 working days. SIU-referred claims: a specialist reviews before any payment is made. Claimants can quote their claim reference for updates."),
    ("Complaints and the Financial Ombudsman", "compliance",
     "If a customer is unhappy, Albion Mutual aims to resolve complaints within 8 weeks. If unresolved or the customer remains dissatisfied, they can escalate free of charge to the Financial Ombudsman Service (FOS). Complaint handling is recorded for FCA reporting."),
    ("Data protection (UK GDPR)", "compliance",
     "Claim data is processed to handle the claim (contract) and to prevent fraud (legitimate interest). Data is retained per the retention policy, then deleted. Customers have the right to access (SAR), rectification and erasure. PII is minimised and never used to train models."),
    ("What Ava can and cannot do", "agent",
     "Ava registers and triages claims, asks the right questions per claim type, scores fraud and vulnerability, and answers policy questions from this knowledge base. Ava never makes a final settlement decision, never promises a payout amount, and never gives legal advice — a human handler confirms all outcomes."),
    ("Excess and underinsurance", "policy",
     "The excess is the amount the policyholder pays towards a claim. Claims below the applicable excess are not worth pursuing and may be declined. Underinsurance (sum insured set too low) can lead to proportionate settlement under the average clause."),
]

def embed(text):
    body = {"model": "text-embedding-3-small", "input": text}
    req = urllib.request.Request("https://api.openai.com/v1/embeddings",
        data=json.dumps(body).encode(),
        headers={"Authorization": f"Bearer {KEY}", "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)["data"][0]["embedding"]

out = open(os.path.join(os.path.dirname(__file__), "kb_seed.sql"), "w", encoding="utf-8")
out.write("TRUNCATE jeen.kb RESTART IDENTITY;\n")
for title, cat, content in KB:
    e = embed(f"{title}. {content}")
    vec = "[" + ",".join(f"{x:.6f}" for x in e) + "]"
    t = title.replace("'", "''"); c = content.replace("'", "''")
    out.write(f"INSERT INTO jeen.kb(title,category,content,embedding) VALUES('{t}','{cat}','{c}','{vec}');\n")
out.close()
print(f"embedded {len(KB)} KB chunks -> kb_seed.sql")
