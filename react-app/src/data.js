/**
 * data.js — CONFIG & CONTENT (single source of truth)
 * ----------------------------------------------------------------------------
 * Everything the UI needs that isn't logic lives here so it's easy to rebrand
 * or re-point without touching components:
 *   • Backend endpoint URLs (the live n8n webhooks on NAVADA Edge).
 *   • PRODUCT identity & BRAND palette (rename the whole app from one place).
 *   • The demo SCENARIOS, the WORKFLOW_STEPS shown on "How It Works", the
 *     STATS strip, the PROFILE/NAVADA/ASSIGNMENT/SECURITY copy, and the
 *     claim LIFECYCLE_STAGES used by the customer portal.
 * No React in here — just exported constants imported by App.jsx / pages.jsx.
 * ----------------------------------------------------------------------------
 */

// Live agent endpoint (self-hosted n8n, exposed via Cloudflare tunnel).
// import.meta.env.VITE_TRIAGE_URL (from .env) overrides the default if set.
export const TRIAGE_URL =
  import.meta.env.VITE_TRIAGE_URL ||
  "https://n8n.navada-edge-server.uk/webhook/claims-triage";

export const PORTAL_URL = "https://n8n.navada-edge-server.uk/webhook/claims-portal";
const N8N = "https://n8n.navada-edge-server.uk/webhook";
export const CHAT_URL = `${N8N}/claims-chat`;
export const ADMIN_LOGIN_URL = `${N8N}/admin-login`;
export const CLAIMS_ADMIN_URL = `${N8N}/claims-admin`;
export const DECISION_URL = `${N8N}/claims-decision`;
export const USER_LOGIN_URL = `${N8N}/user-login`;
export const USER_CLAIMS_URL = `${N8N}/user-claims`;
export const CONVOS_ADMIN_URL = `${N8N}/conversations-admin`;

// Team Console — per-team login, queue and actions (the connected multi-team workflow).
export const TEAM_LOGIN_URL = `${N8N}/team-login`;
export const TEAM_CLAIMS_URL = `${N8N}/team-claims`;
export const TEAM_ACTION_URL = `${N8N}/team-action`;

// n8n base — used to deep-link a team member straight to a claim's execution.
export const N8N_BASE = "https://n8n.navada-edge-server.uk";

// The three real teams Ava hands work to, and the actions each can take.
// Each team has a real mailbox; Ava emails them when a claim lands in their queue.
export const TEAMS = [
  {
    team: "Claims Adjuster", person: "Claims Adjuster", email: "send2chopstix@gmail.com",
    login: "adjuster",
    desc: "Reviews referred claims — high value (≥ £5k), high severity, or vulnerable customers — and approves or declines.",
    actions: [
      { action: "approve", label: "Approve → Finance", tone: "good" },
      { action: "request-info", label: "Request more info", tone: "warn" },
      { action: "decline", label: "Decline → Legal", tone: "bad" },
    ],
  },
  {
    team: "Legal", person: "Nisha Chopra", email: "Nishachopra.uk@gmail.com",
    login: "legal",
    desc: "Handles fraud-suspected claims, declines and customer appeals.",
    actions: [
      { action: "clear-fraud", label: "Clear → Adjuster", tone: "good" },
      { action: "appeal-uphold", label: "Uphold appeal → Finance", tone: "good" },
      { action: "decline", label: "Uphold decline", tone: "bad" },
    ],
  },
  {
    team: "Finance", person: "Lee Akpareva", email: "leeakpareva@gmail.com",
    login: "finance",
    desc: "Releases payment on approved claims (payment simulation) and confirms settlement.",
    actions: [
      { action: "pay", label: "Release payment", tone: "good" },
      { action: "request-info", label: "Hold · request info", tone: "warn" },
    ],
  },
];

// Link to the live n8n workflow (the agent itself). Override via VITE_N8N_WORKFLOW_URL.
export const N8N_WORKFLOW_URL =
  import.meta.env.VITE_N8N_WORKFLOW_URL ||
  "https://n8n.navada-edge-server.uk/workflow/JeenClaimsChat1";

// Claim lifecycle stages (for the customer portal).
export const LIFECYCLE_STAGES = [
  { key: "submitted", label: "Submitted", desc: "Claim received via Ava" },
  { key: "triaged", label: "AI triaged", desc: "Classified & risk-scored" },
  { key: "review", label: "Decision", desc: "Auto-settled or human review" },
  { key: "settled", label: "Resolved", desc: "Approved / settled / rejected" },
];

export const SCENARIOS = [
  { label: "Low-risk motor scrape", color: "#16b6a3",
    data: { policy_number: "ALB-MOT-441902", claimant_name: "Daniel Hughes", claimant_email: "demo@example.com", incident_type: "Motor", incident_date: "2026-05-21", estimated_value: 480, description: "Minor car park scrape on the rear bumper of my Ford Focus while parked at the supermarket. Small scratch and a cracked indicator cover. No other vehicle involved, no injuries. Policy held for 4 years." } },
  { label: "£46k kitchen fire", color: "#e8870b",
    data: { policy_number: "ALB-HOM-778145", claimant_name: "Priya Nair", claimant_email: "demo@example.com", incident_type: "Home", incident_date: "2026-05-18", estimated_value: 46000, description: "A kitchen fire caused by a faulty dishwasher spread to the adjoining rooms. Significant smoke and water damage to the ground floor, kitchen units destroyed, and we have had to move into temporary accommodation. Fire brigade attended and have a report." } },
  { label: "Suspected fraud", color: "#e23d6e",
    data: { policy_number: "ALB-MOT-902551", claimant_name: "Marcus Webb", claimant_email: "demo@example.com", incident_type: "Motor", incident_date: "2026-05-26", estimated_value: 9000, description: "Car was stolen from outside a friend's house, total loss. I need this settled as quickly as possible, ideally this week. The car was worth exactly 9000. Policy was taken out recently. I do not have the second key or the purchase receipt anymore." } },
  { label: "Vulnerable customer", color: "#ec4e83",
    data: { policy_number: "ALB-HOM-330218", claimant_name: "Eileen Roberts", claimant_email: "demo@example.com", incident_type: "Home", incident_date: "2026-05-20", estimated_value: 3200, description: "My husband passed away last month and while clearing the house I discovered a burst pipe had damaged the bedroom carpet and ceiling. I am 78, recently bereaved and finding all of this very difficult to deal with on my own. I am not sure what I am supposed to do next." } },
  { label: "Lost baggage", color: "#7c5cfc",
    data: { policy_number: "ALB-TRA-561023", claimant_name: "Tom Bedford", claimant_email: "demo@example.com", incident_type: "Travel", incident_date: "2026-05-12", estimated_value: 1450, description: "Checked baggage was lost by the airline on a flight back from Spain and never recovered. Claiming for clothing, a laptop and toiletries. I have the property irregularity report from the airline and receipts for the main items." } },
];

// Full annotated workflow — every node, what it does, and why.
export const WORKFLOW_STEPS = [
  { n: "1", tag: "Trigger", tagClass: "t-trig", title: "Claim intake (Webhook / Form)",
    node: "n8n Webhook · POST /claims-triage",
    what: "Receives the First Notice of Loss (FNOL) — policy number, claimant, incident type, date, value and a free-text description.",
    why: "A single governed entry point for every channel (web form, portal, email-to-webhook). CORS-enabled so this React app can call it directly." },
  { n: "2", tag: "LLM decision", tagClass: "t-llm", title: "AI triage (structured output)",
    node: "OpenAI GPT-4o-mini + Structured Output Parser",
    what: "Reads the claim and returns strict JSON: claim type, severity, a 0–100 fraud-risk score with reasons, an FCA vulnerability flag, a routing recommendation and an adjuster summary.",
    why: "This is the only place the model makes a judgement — and it is constrained to a schema, so the output is always machine-usable and auditable. It never settles or rejects a claim itself." },
  { n: "3", tag: "Action", tagClass: "t-act", title: "Persist to system of record",
    node: "PostgreSQL · INSERT jeen.claims",
    what: "Writes the claim and the full AI assessment to a Postgres table with a generated claim reference.",
    why: "Creates a defensible audit trail from the very first second — every decision, automated or human, is recorded." },
  { n: "4", tag: "Routing rule", tagClass: "t-rule", title: "Needs human review?",
    node: "n8n IF node",
    what: "Evaluates a governance rule: value ≥ £10k, OR fraud risk ≥ 60, OR vulnerable customer, OR routing ≠ auto-settle.",
    why: "Governance is explicit and inspectable — not buried inside the prompt. Anyone can read exactly when a human is required." },
  { n: "5a", tag: "Human-in-the-loop", tagClass: "t-hil", title: "Adjuster approval (sensitive path)",
    node: "n8n Wait → Form (Approve / Reject)",
    what: "The flow pauses. An adjuster opens a review form showing the AI summary, fraud score and vulnerability flag, and approves or rejects with notes.",
    why: "No high-value, high-risk or vulnerable-customer claim is ever actioned without a person. This is the core of 'governed' AI." },
  { n: "5b", tag: "Auto path", tagClass: "t-auto", title: "Auto-settle (clean path)",
    node: "n8n Set → Postgres UPDATE",
    what: "Low-value, low-risk, non-vulnerable claims are fast-tracked and their status is updated automatically.",
    why: "Straight-through processing where it is safe — freeing adjusters to focus on the claims that need judgement." },
  { n: "6", tag: "Action", tagClass: "t-act", title: "Acknowledge the claimant",
    node: "Email (Zoho SMTP) · or JSON response to the portal",
    what: "Sends a branded acknowledgement with the claim reference and next steps; the API path returns the decision JSON to this UI.",
    why: "Closes the loop with the customer immediately — faster first response, fewer SLA breaches." },
];

export const STATS = [
  { n: "~60%", l: "of triage effort is low-value, repetitive reading" },
  { n: "143ms", l: "live execution time of the agent workflow" },
  { n: "FCA", l: "Consumer-Duty vulnerability flag on every claim" },
  { n: "100%", l: "of sensitive claims held for human approval" },
];

export const FORM_URL = "https://n8n.navada-edge-server.uk/form/albion-claim-fnol";

// Product identity within the Jeen ecosystem (rename here to rebrand the whole app).
export const PRODUCT = {
  name: "Ava",
  parent: "Jeen.ai",
  sub: "by Jeen.ai · insurance AI agent",
  agent: "Ava",
  client: "Albion Mutual",
  tagline: "Jeen.ai's AI agent for insurance — governed, agentic claims handling.",
  positioning: "Ava is Jeen.ai's AI agent for insurance clients. She handles claims end to end — conversational intake, triage, fraud and vulnerability checks, routing, RAG-grounded answers and human-in-the-loop approval. Currently deployed at Albion Mutual.",
  customer: "Albion Mutual",
  status: "Live at Albion Mutual · powered by Jeen.ai",
};

// Real Jeen brand palette (from the Jeen logo mark).
export const BRAND = { lilac: "#d6a6e5", red: "#c55a4e", amber: "#e3a954" };

export const PROFILE = {
  name: "Leslie (Lee) Akpareva",
  role: "Principal AI Consultant · 17+ years",
  blurb: "AI engineer and consultant specialising in production-grade, governed agentic systems. I design and ship multi-cloud AI infrastructure end to end — from the model and orchestration down to hosting and security.",
  email: "leeakpareva@gmail.com",
  phone: "07935237704",
  github: "github.com/leeakpareva",
  site: "navada-lab.space",
};

export const NAVADA = {
  name: "NAVADA Edge",
  tagline: "A private, multi-cloud AI edge network",
  blurb: "This demo runs on NAVADA Edge — my own distributed AI infrastructure: 30+ Docker containers across 6 nodes (ASUS command host, AWS, Azure, HP, Snowflake, robotics), meshed over Tailscale and fronted by Cloudflare. The n8n agent, PostgreSQL system-of-record and hosting all run on this network — not a trial environment.",
  points: [
    "Self-hosted n8n orchestration on the ASUS command node",
    "PostgreSQL 17 system of record",
    "Cloudflare tunnel + 13+ subdomains for secure public access",
    "Portainer-managed Docker across all nodes",
  ],
  site: "navada-edge-server.uk",
};

export const ASSIGNMENT = {
  org: "Jeen UK · AI Solution Engineer",
  intro: "The brief: take on the role of a Jeen Solution Engineer and build a working demo of an AI agent for a customer meeting — translating a real customer problem into a practical, governed AI agent workflow.",
  deliverables: [
    { t: "Build a working agent flow", d: "Use n8n, LangFlow or similar. Solve a real business problem, with at least one LLM-powered decision step, at least one action (a tool/integration, not just chat), and a human-in-the-loop step where the use case is sensitive. Must be fully working and demoable live." },
    { t: "Provide artefacts", d: "Exported workflow, one screenshot of the full workflow, 1–2 screenshots of a successful run, and any dataset used." },
    { t: "Presentation (≤5 slides)", d: "Slide 1 Customer Context & Problem · Slide 2 Why This Use Case · Slide 3 Agent Workflow Overview (end-to-end, systems/data, where the LLM is used, where human approval applies)." },
  ],
  wants: ["Hands-on comfort with AI agents and tools", "Good judgement", "A relevant, well-chosen use case", "Clear, structured communication"],
  coverage: [
    { req: "Working agent flow in n8n", met: "Self-hosted n8n, executed live in 143ms" },
    { req: "LLM-powered decision step", met: "OpenAI structured triage: type, severity, fraud score, vulnerability, routing" },
    { req: "Action / integration", met: "PostgreSQL insert + acknowledgement email" },
    { req: "Human-in-the-loop", met: "Adjuster approval on every sensitive claim" },
    { req: "Fully working / live", met: "Reviewer-testable hosted URL + this app" },
    { req: "Exported workflow + screenshots + dataset", met: "All provided in the submission pack" },
    { req: "Presentation", met: "Interactive deck — built into this app" },
  ],
};

export const SECURITY = [
  { icon: "lock", t: "Secrets never touch the client", d: "API keys and database credentials live only inside n8n's encrypted credential store on the server. The browser only ever sees the claim form and the triage result — never a key." },
  { icon: "cube", t: "The LLM is sandboxed to a decision", d: "The model receives only the claim text and returns schema-constrained JSON. It has no tools, no database access and no ability to settle, pay or reject — it cannot take an action on its own." },
  { icon: "userCheck", t: "Human-in-the-loop on anything sensitive", d: "Complex, high-value (≥ £5,000), high-fraud-risk (≥60) or vulnerable-customer claims are always paused for a named adjuster to approve or reject. Automation is bounded by an explicit, inspectable rule." },
  { icon: "database", t: "Auditable system of record", d: "Every claim and every decision — automated or human — is written to PostgreSQL with a claim reference and timestamp, giving a defensible, replayable audit trail." },
  { icon: "globe", t: "Governed network access", d: "Hosting is via a Cloudflare tunnel over an encrypted Tailscale mesh; no inbound ports are exposed on the host. Origins are controlled and traffic is TLS-terminated at the edge." },
  { icon: "document", t: "Regulatory alignment (FCA)", d: "Vulnerable-customer detection is a first-class output, supporting FCA Consumer Duty obligations. PII is minimised, and the design supports retention limits and right-to-erasure on the record store." },
];
