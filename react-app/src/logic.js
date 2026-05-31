/**
 * logic.js — pure, framework-free helpers used across the UI.
 * Extracted from pages.jsx so they can be unit-tested in isolation. No React,
 * no DOM, no network — just data in, data out (the SLA/metrics helpers read the
 * current clock, which the tests account for).
 */

// Map a routing label to the CSS class that colours its badge.
export const routeClass = (r) =>
  (r === "auto-settle" || r === "auto-pay" ? "route-auto" : r === "SIU-fraud" ? "route-fraud" : "route-adjuster");

// Fraud-risk meter colour: red ≥60, amber ≥30, else green.
export const meterColor = (v) => (v >= 60 ? "#c55a4e" : v >= 30 ? "#e3a954" : "#1c9d83");

// Referred claims must be actioned within this many hours of receipt.
export const SLA_HOURS = 24;

// SLA badge for a claim: only "referred" claims have a live countdown.
// `nowMs` is injectable so tests are deterministic (defaults to the real clock).
export function slaInfo(c, nowMs = Date.now()) {
  if (c.status !== "referred") return { label: "—", cls: "sla-na" };
  const received = new Date((c.received || "").replace(" ", "T"));
  if (isNaN(received)) return { label: "open", cls: "sla-ok" };
  const ageH = (nowMs - received.getTime()) / 3.6e6;
  const left = SLA_HOURS - ageH;
  if (left <= 0) return { label: `overdue ${Math.floor(-left)}h`, cls: "sla-over" };
  if (left <= 4) return { label: `due in ${Math.ceil(left)}h`, cls: "sla-warn" };
  return { label: `due in ${Math.ceil(left)}h`, cls: "sla-ok" };
}

// Lifecycle stage index for the customer portal progress bar.
export function stageIndex(status) {
  if (["paid", "approved", "rejected", "declined", "auto-settled"].includes(status)) return 4;
  if (status === "referred" || status === "info-requested" || status === "pending-human-review") return 2;
  return 2;
}

// Compact, safe analytics over the whole claims list — the figures Admin Ava
// narrates. Pure: pass `now` for deterministic tests (defaults to real clock).
export function adminMetrics(claims, now = new Date()) {
  const all = claims || [];
  const num = (x) => Number(x || 0);
  const parse = (c) => { const d = new Date(String(c.received || "").replace(" ", "T")); return isNaN(d) ? null : d; };
  const since = (days) => { const t = now.getTime() - days * 864e5; return all.filter((c) => { const d = parse(c); return d && d.getTime() >= t; }); };
  const decisionOf = (c) => c.decision || (["paid", "approved"].includes(c.status) ? "accept" : c.status === "declined" ? "decline" : c.status === "referred" ? "refer" : "other");
  const n = all.length;
  const week = since(7), month = since(30);
  const by = (arr, f) => arr.filter(f).length;
  const sumVal = (arr) => arr.reduce((a, c) => a + num(c.estimated_value), 0);
  const types = ["Motor", "Home", "Travel", "Liability"];
  return {
    generated_at: now.toISOString().slice(0, 10),
    total_claims: n,
    claims_last_7_days: week.length,
    claims_last_30_days: month.length,
    decisions: {
      accepted: by(all, (c) => decisionOf(c) === "accept"),
      referred: by(all, (c) => decisionOf(c) === "refer"),
      declined: by(all, (c) => decisionOf(c) === "decline"),
    },
    in_review: by(all, (c) => c.status === "referred"),
    paid: by(all, (c) => c.status === "paid"),
    vulnerable_customers: by(all, (c) => c.vulnerable_flag),
    fraud: {
      high_risk_ge_60: by(all, (c) => num(c.fraud_risk) >= 60),
      medium_30_59: by(all, (c) => num(c.fraud_risk) >= 30 && num(c.fraud_risk) < 60),
      low_lt_30: by(all, (c) => num(c.fraud_risk) < 30),
      average_score: n ? Math.round(all.reduce((a, c) => a + num(c.fraud_risk), 0) / n) : 0,
    },
    by_type: types.reduce((o, t) => { o[t] = by(all, (c) => (c.claim_type || c.incident_type || "").toLowerCase().includes(t.toLowerCase())); return o; }, {}),
    value: {
      total_claimed_gbp: Math.round(sumVal(all)),
      paid_out_gbp: Math.round(sumVal(all.filter((c) => c.status === "paid"))),
      average_claim_gbp: n ? Math.round(sumVal(all) / n) : 0,
    },
  };
}

// Plain-text fallback Admin Ava uses if the live agent declines.
export function localAnswer(m) {
  return `Here's the current picture across Albion Mutual (as of ${m.generated_at}):
• ${m.total_claims} claims in total — ${m.claims_last_7_days} in the last 7 days, ${m.claims_last_30_days} in the last 30.
• Decisions: ${m.decisions.accepted} accepted, ${m.decisions.referred} referred, ${m.decisions.declined} declined (${m.in_review} currently in review).
• Fraud: ${m.fraud.high_risk_ge_60} high-risk (≥60), average score ${m.fraud.average_score}/100.
• ${m.vulnerable_customers} vulnerable customers flagged for extra care.
• Value: £${m.value.total_claimed_gbp.toLocaleString()} claimed, £${m.value.paid_out_gbp.toLocaleString()} paid out.`;
}
