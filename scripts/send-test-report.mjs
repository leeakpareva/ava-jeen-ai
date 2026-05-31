/**
 * send-test-report.mjs — emails TEST-REPORT.md to leeakpareva@gmail.com via the
 * same Zoho SMTP that n8n uses. No secrets are stored here: the Zoho app password
 * is read from the ZOHO_APP_PASSWORD environment variable at run time.
 *
 * Run:
 *   cd C:\Users\leeak\jeen-assignment
 *   $env:ZOHO_APP_PASSWORD="<your Zoho app password>"
 *   node scripts/send-test-report.mjs
 *
 * Requires nodemailer:  npm i -D nodemailer   (run inside react-app, or globally)
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import nodemailer from "nodemailer";

const __dirname = dirname(fileURLToPath(import.meta.url));
const reportPath = join(__dirname, "..", "TEST-REPORT.md");
const report = readFileSync(reportPath, "utf8");

const pass = process.env.ZOHO_APP_PASSWORD;
if (!pass) {
  console.error("ERROR: set ZOHO_APP_PASSWORD env var first (your Zoho app password).");
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host: "smtp.zoho.eu",
  port: 465,
  secure: true,
  auth: { user: "claude.navada@zohomail.eu", pass },
});

const html =
  "<h2>Ava — Albion Mutual · Final Test Report</h2>" +
  "<p><b>34 / 34 tests passing</b> (22 unit + 12 e2e). Full report below and in the repo at <code>TEST-REPORT.md</code>.</p>" +
  "<pre style='font-family:monospace;white-space:pre-wrap;background:#f6f4fb;padding:14px;border-radius:8px'>" +
  report.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") +
  "</pre>";

const info = await transporter.sendMail({
  from: '"Ava Test Bot" <claude.navada@zohomail.eu>',
  to: "leeakpareva@gmail.com",
  subject: "Ava / Albion Mutual — Final Test Report (34/34 passing)",
  text: report,
  html,
});

console.log("Sent:", info.messageId);
