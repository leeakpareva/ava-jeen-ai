import { describe, it, expect } from "vitest";
import { routeClass, meterColor, SLA_HOURS, slaInfo, stageIndex, adminMetrics, localAnswer } from "./logic.js";

describe("routeClass", () => {
  it("maps auto outcomes to route-auto", () => {
    expect(routeClass("auto-settle")).toBe("route-auto");
    expect(routeClass("auto-pay")).toBe("route-auto");
  });
  it("maps fraud to route-fraud", () => {
    expect(routeClass("SIU-fraud")).toBe("route-fraud");
  });
  it("defaults everything else to route-adjuster", () => {
    expect(routeClass("adjuster")).toBe("route-adjuster");
    expect(routeClass(undefined)).toBe("route-adjuster");
    expect(routeClass("")).toBe("route-adjuster");
  });
});

describe("meterColor", () => {
  it("is red at or above 60", () => {
    expect(meterColor(60)).toBe("#c55a4e");
    expect(meterColor(100)).toBe("#c55a4e");
  });
  it("is amber between 30 and 59", () => {
    expect(meterColor(30)).toBe("#e3a954");
    expect(meterColor(59)).toBe("#e3a954");
  });
  it("is green below 30", () => {
    expect(meterColor(0)).toBe("#1c9d83");
    expect(meterColor(29)).toBe("#1c9d83");
  });
});

describe("slaInfo", () => {
  const now = Date.UTC(2026, 4, 31, 12, 0, 0); // fixed clock
  it("returns N/A for non-referred claims", () => {
    expect(slaInfo({ status: "paid" }, now)).toEqual({ label: "—", cls: "sla-na" });
  });
  it("returns 'open' (ok) when received date is missing/invalid", () => {
    expect(slaInfo({ status: "referred", received: "" }, now)).toEqual({ label: "open", cls: "sla-ok" });
    expect(slaInfo({ status: "referred", received: "not-a-date" }, now).cls).toBe("sla-ok");
  });
  it("flags overdue when received more than 24h ago", () => {
    const recv = new Date(now - 30 * 3.6e6).toISOString().replace("T", " ").slice(0, 16);
    const r = slaInfo({ status: "referred", received: recv }, now);
    expect(r.cls).toBe("sla-over");
    expect(r.label).toMatch(/^overdue \d+h$/);
  });
  it("warns when 4h or less remain", () => {
    const recv = new Date(now - 21 * 3.6e6).toISOString().replace("T", " ").slice(0, 16); // ~3h left
    const r = slaInfo({ status: "referred", received: recv }, now);
    expect(r.cls).toBe("sla-warn");
    expect(r.label).toMatch(/^due in \d+h$/);
  });
  it("is ok when plenty of time left", () => {
    const recv = new Date(now - 2 * 3.6e6).toISOString().replace("T", " ").slice(0, 16); // ~22h left
    expect(slaInfo({ status: "referred", received: recv }, now).cls).toBe("sla-ok");
  });
  it("uses a 24h window", () => {
    expect(SLA_HOURS).toBe(24);
  });
});

describe("stageIndex", () => {
  it("returns 4 for terminal statuses", () => {
    ["paid", "approved", "rejected", "declined", "auto-settled"].forEach((s) =>
      expect(stageIndex(s)).toBe(4)
    );
  });
  it("returns 2 for in-progress / referred", () => {
    expect(stageIndex("referred")).toBe(2);
    expect(stageIndex("info-requested")).toBe(2);
    expect(stageIndex("submitted")).toBe(2);
  });
});

describe("adminMetrics", () => {
  const now = new Date("2026-05-31T12:00:00Z");
  const day = (n) => new Date(now.getTime() - n * 864e5).toISOString().slice(0, 10);
  const claims = [
    { status: "paid", decision: "accept", estimated_value: 1000, fraud_risk: 10, claim_type: "Motor", received: day(1) },
    { status: "referred", estimated_value: 5000, fraud_risk: 70, vulnerable_flag: true, claim_type: "Home", received: day(3) },
    { status: "declined", estimated_value: 200, fraud_risk: 40, incident_type: "Travel", received: day(10) },
    { status: "paid", decision: "accept", estimated_value: 3000, fraud_risk: 5, claim_type: "Motor", received: day(40) },
  ];
  const m = adminMetrics(claims, now);

  it("counts totals and time windows", () => {
    expect(m.total_claims).toBe(4);
    expect(m.claims_last_7_days).toBe(2);   // day 1 and day 3
    expect(m.claims_last_30_days).toBe(3);  // excludes day 40
  });
  it("counts decisions", () => {
    expect(m.decisions.accepted).toBe(2);
    expect(m.decisions.declined).toBe(1);
    expect(m.decisions.referred).toBe(1);
  });
  it("counts review/paid/vulnerable", () => {
    expect(m.in_review).toBe(1);
    expect(m.paid).toBe(2);
    expect(m.vulnerable_customers).toBe(1);
  });
  it("bands fraud risk correctly", () => {
    expect(m.fraud.high_risk_ge_60).toBe(1);
    expect(m.fraud.medium_30_59).toBe(1);
    expect(m.fraud.low_lt_30).toBe(2);
    expect(m.fraud.average_score).toBe(Math.round((10 + 70 + 40 + 5) / 4));
  });
  it("buckets by claim type (claim_type or incident_type)", () => {
    expect(m.by_type.Motor).toBe(2);
    expect(m.by_type.Home).toBe(1);
    expect(m.by_type.Travel).toBe(1);
    expect(m.by_type.Liability).toBe(0);
  });
  it("sums value and paid-out", () => {
    expect(m.value.total_claimed_gbp).toBe(9200);
    expect(m.value.paid_out_gbp).toBe(4000);
    expect(m.value.average_claim_gbp).toBe(2300);
  });
  it("handles an empty list without dividing by zero", () => {
    const e = adminMetrics([], now);
    expect(e.total_claims).toBe(0);
    expect(e.fraud.average_score).toBe(0);
    expect(e.value.average_claim_gbp).toBe(0);
  });
});

describe("localAnswer", () => {
  it("renders a readable summary from a metrics object", () => {
    const m = adminMetrics([
      { status: "paid", decision: "accept", estimated_value: 1000, fraud_risk: 10, claim_type: "Motor", received: "2026-05-30" },
    ], new Date("2026-05-31T12:00:00Z"));
    const text = localAnswer(m);
    expect(text).toContain("1 claims in total");
    expect(text).toContain("£1,000 claimed");
    expect(text).toContain("Albion Mutual");
  });
});
