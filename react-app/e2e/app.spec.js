import { test, expect } from "@playwright/test";

/**
 * Frontend-only e2e. Every call to the n8n backend is mocked here, so these
 * tests verify the APP (routing, gating, rendering, tab behaviour, content)
 * deterministically and never touch the live agent, database or email.
 */

const SAMPLE_CLAIMS = [
  { claim_ref: "ALB-MOT-2026-001001", received: "2026-05-30 10:00", claimant_name: "Test User", claim_type: "Motor", estimated_value: 1200, fraud_risk: 15, vulnerable_flag: false, decision: "accept", team: "Finance", status: "paid", routing: "auto-settle", next_step: "Settled" },
  { claim_ref: "ALB-HOM-2026-001002", received: "2026-05-31 09:00", claimant_name: "Jane Doe", claim_type: "Home", estimated_value: 46000, fraud_risk: 20, vulnerable_flag: false, decision: "refer", team: "Claims Adjuster", status: "referred", routing: "adjuster", next_step: "Awaiting adjuster" },
];

// Mock every n8n backend call so the UI has deterministic data and no network.
async function mockBackend(page) {
  await page.route("**/*navada-edge-server.uk/**", (route) => {
    const url = route.request().url();
    if (url.includes("/claims-chat")) return route.fulfill({ json: { ok: true, ready: false, reply: "Hello! I'm Ava. What happened?" } });
    if (url.includes("/user-claims") || url.includes("/claims-admin") || url.includes("/team-claims")) return route.fulfill({ json: SAMPLE_CLAIMS });
    if (url.includes("/conversations-admin")) return route.fulfill({ json: [] });
    if (url.includes("/admin-login")) return route.fulfill({ json: { ok: true, token: "test-token", user: "admin" } });
    if (url.includes("/team-login")) return route.fulfill({ json: { ok: true, token: "test-token", team: "Claims Adjuster", user: "Claims Adjuster", username: "adjuster", role: "handler" } });
    return route.fulfill({ json: { ok: true } });
  });
}

test.beforeEach(async ({ page }) => {
  await mockBackend(page);
});

test("overview loads with product branding", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Albion Mutual|Ava|Jeen/i);
  await expect(page.getByRole("link", { name: /Try it live/i })).toBeVisible();
});

test("Ava demo page is gated by email sign-in", async ({ page }) => {
  await page.goto("/#/demo");
  await expect(page.getByRole("heading", { name: /Sign in to talk to Ava/i })).toBeVisible();
  await page.getByPlaceholder("jane@example.com").fill("tester@example.com");
  await page.getByRole("button", { name: /Talk to Ava/i }).click();
  await expect(page.getByText(/conversational intake agent/i)).toBeVisible({ timeout: 10000 });
});

test("How It Works routes to the gated demo (no ungated Ava)", async ({ page }) => {
  await page.goto("/#/how");
  await expect(page.getByRole("link", { name: /Sign in & talk to Ava/i })).toBeVisible();
  await expect(page.getByText(/One agent\. One workflow\./i)).toBeVisible();
});

test("Data & Security page renders governance content", async ({ page }) => {
  await page.goto("/#/security");
  await expect(page.getByText(/Consumer Duty|GDPR|human/i).first()).toBeVisible();
});

test("Assignment page embeds the official Jeen brief PDF", async ({ page }) => {
  await page.goto("/#/assignment");
  await expect(page.locator('iframe[src*="jeen-assignment-brief.pdf"]')).toBeAttached();
  await expect(page.getByRole("link", { name: /Download/i }).first()).toBeVisible();
});

test("Presentation renders the official deck PDF, not inline slides", async ({ page }) => {
  await page.goto("/#/present");
  await expect(page.locator('iframe[src*="ava-presentation.pdf"]')).toBeAttached();
});

test("Admin console shows login, then MI + Ask Ava tabs after sign-in", async ({ page }) => {
  await page.goto("/#/admin");
  await expect(page.getByRole("heading", { name: /Admin console/i })).toBeVisible();
  await page.getByPlaceholder("••••••••").fill("any");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("heading", { name: /Claims operations dashboard/i })).toBeVisible({ timeout: 10000 });
  await page.getByRole("button", { name: "Ask Ava", exact: true }).click();
  await page.getByRole("button", { name: /How many claims this week/i }).click();
  await expect(page.getByText(/operations analytics agent/i)).toBeVisible();
});

test("Team console renders its login", async ({ page }) => {
  await page.goto("/#/team");
  await expect(page.getByText(/adjuster|legal|finance/i).first()).toBeVisible();
});

test("Database page embeds the live CloudBeaver panel", async ({ page }) => {
  await page.goto("/#/db");
  await expect(page.getByRole("heading", { name: /The live database/i })).toBeVisible();
  await expect(page.locator("iframe")).toBeAttached();
});

test("Observability page shows the Grafana panel and live link", async ({ page }) => {
  await page.goto("/#/obs");
  await expect(page.getByText(/Monitoring the agent in production/i)).toBeVisible();
  await expect(page.getByRole("link", { name: /Open the live dashboard/i })).toBeVisible();
});

test("My Claims portal loads claims for an email (fallback auth)", async ({ page }) => {
  await page.goto("/#/account");
  await page.getByPlaceholder("demo@example.com").fill("demo@example.com");
  await page.getByRole("button", { name: /View my claims/i }).click();
  await expect(page.getByText(/ALB-MOT-2026-001001/i)).toBeVisible({ timeout: 10000 });
});

test("footer no longer exposes navada-edge-server.uk or github links", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('footer a[href*="navada-edge-server.uk"]')).toHaveCount(0);
  await expect(page.locator('footer a[href*="github.com/leeakpareva"]')).toHaveCount(0);
});
