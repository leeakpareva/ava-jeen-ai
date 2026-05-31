/**
 * pages.jsx — ALL PAGE CONTENT + the interactive pieces
 * ----------------------------------------------------------------------------
 * Sections (each exported and mounted by App.jsx based on the URL hash):
 *   • Overview      — hero, problem, capabilities (the marketing page).
 *   • Demo          — the live agent, two tabs:
 *        ChatAgent()   : conversational intake (Ava). POSTs the message
 *                        history to /claims-chat; renders replies; shows the
 *                        triage decision when Ava registers the claim.
 *        FormConsole() : structured form -> /claims-triage, with a live stage
 *                        animation while the n8n flow runs.
 *      ResultCard() draws the decision (routing, fraud meter, vulnerability…).
 *   • HowItWorks    — Remotion animation + step timeline + real n8n screenshot.
 *   • DataSecurity  — data lifecycle + security + GDPR/DPA/SAR cards.
 *   • Admin         — login (jeen.admin_users) -> live claims table, stats,
 *                     approve/reject (human-in-the-loop), conversation logs,
 *                     and a click-through ClaimDrawer with full detail.
 *   • Account       — customer portal: Clerk sign-in (or email fallback) ->
 *                     the user's claims with a ClaimLifecycle tracker.
 *   • Presentation  — full-screen interactive slide deck for the live demo.
 * All network calls hit the live n8n webhooks defined in data.js.
 * ----------------------------------------------------------------------------
 */
import React, { useState, useRef, useEffect } from "react";
import { SignIn, SignedIn, SignedOut, UserButton, useUser } from "@clerk/clerk-react";
import { JeenLogo, Reveal, Mesh } from "./App.jsx";
import { Icon, AvaAvatar } from "./icons.jsx";

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
import {
  TRIAGE_URL, PORTAL_URL, FORM_URL, SCENARIOS, WORKFLOW_STEPS, STATS,
  PROFILE, NAVADA, ASSIGNMENT, SECURITY, ETHICS, PRODUCT,
  CHAT_URL, ATTACH_URL, ADMIN_LOGIN_URL, CLAIMS_ADMIN_URL, DECISION_URL,
  USER_LOGIN_URL, USER_CLAIMS_URL, CONVOS_ADMIN_URL, N8N_WORKFLOW_URL, LIFECYCLE_STAGES,
  TEAM_LOGIN_URL, TEAM_CLAIMS_URL, TEAM_ACTION_URL, TEAMS, N8N_BASE, DB_UI_URL, GRAFANA_URL,
} from "./data.js";

const routeClass = (r) => (r === "auto-settle" || r === "auto-pay" ? "route-auto" : r === "SIU-fraud" ? "route-fraud" : "route-adjuster");
const meterColor = (v) => (v >= 60 ? "#c55a4e" : v >= 30 ? "#e3a954" : "#1c9d83");

// SLA: referred claims (awaiting a human team) must be actioned within SLA_HOURS of receipt.
const SLA_HOURS = 24;
function slaInfo(c) {
  if (c.status !== "referred") return { label: "—", cls: "sla-na" };
  const received = new Date((c.received || "").replace(" ", "T"));
  if (isNaN(received)) return { label: "open", cls: "sla-ok" };
  const ageH = (Date.now() - received.getTime()) / 3.6e6;
  const left = SLA_HOURS - ageH;
  if (left <= 0) return { label: `overdue ${Math.floor(-left)}h`, cls: "sla-over" };
  if (left <= 4) return { label: `due in ${Math.ceil(left)}h`, cls: "sla-warn" };
  return { label: `due in ${Math.ceil(left)}h`, cls: "sla-ok" };
}

/* Full-width hero banner — rotating London / insurance images behind the headline. */
function HeroBanner() {
  const imgs = ["/shots/hero-1.jpg", "/shots/hero-2.jpg", "/shots/hero-3.jpg"];
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % imgs.length), 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line
  }, []);
  return (
    <header className="hero-banner">
      <div className="hero-bg">
        {imgs.map((src, idx) => <img key={src} src={src} alt="" className={idx === i ? "on" : ""} />)}
      </div>
      <div className="hero-scrim" />
      <div className="wrap hero-banner-inner">
        <Reveal><h1 className="onimg">Meet <span className="serif">Ava</span> — Jeen.ai's AI agent for insurance.</h1></Reveal>
        <Reveal delay={2}><p className="lead onimg">She handles insurance claims end to end — intake, triage, fraud &amp; vulnerability checks, and instant decisions. <b>Live at Albion Mutual.</b></p></Reveal>
        <Reveal delay={3}><div className="herocta">
          <a href="#/demo" className="btn grad"><Icon name="play" size={15} /> Try the live agent</a>
          <a href="#/how" className="btn onimg-ghost">See how it works</a>
        </div></Reveal>
        <Reveal delay={4}><div className="hero-ava-chip"><AvaAvatar size={30} online /><span>Ava just auto-paid a claim · <code>ALB-MOT-2026-001044</code></span></div></Reveal>
      </div>
    </header>
  );
}

/* ============================ OVERVIEW ============================ */
export function Overview() {
  return (
    <>
      <HeroBanner />

      <section className="section stripsection">
        <div className="wrap">
          <Reveal className="strip">
            {STATS.map((s) => <div className="cell" key={s.l}><div className="n gradtext">{s.n}</div><div className="l">{s.l}</div></div>)}
          </Reveal>
        </div>
      </section>

      <section className="section alt">
        <div className="wrap">
          <Reveal className="shead">
            <div className="eyebrow">The problem</div>
            <h2>Manual triage is slow, inconsistent and risky.</h2>
            <p className="sublead">Every First Notice of Loss is read and routed by hand. High-value, fraud-suspect and vulnerable-customer cases hide in the queue.</p>
          </Reveal>
          <div className="fgrid two">
            <Reveal className="fcard warn">
              <div className="fic red"><Icon name="alert" size={24} /></div><h3>Today, without an agent</h3>
              <ul>
                <li>Manual classification &amp; routing of <b>every</b> claim</li>
                <li>No consistent, auditable <b>fraud-risk scoring</b> at intake</li>
                <li><b>Vulnerable customers</b> identified late, if at all</li>
                <li>Slow first response erodes trust and breaches SLAs</li>
              </ul>
            </Reveal>
            <Reveal delay={1} className="fcard good">
              <div className="fic green"><Icon name="check" size={24} /></div><h3>With Ava, powered by Jeen.Ai</h3>
              <ul>
                <li><b>Straight-through</b> settlement of clean, low-value claims</li>
                <li>Adjusters focus only on claims that need <b>judgement</b></li>
                <li>Consistent fraud &amp; vulnerability flags from day one</li>
                <li>A defensible audit record of <b>every</b> decision</li>
              </ul>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <Reveal className="shead" style={{ textAlign: "center", margin: "0 auto 30px" }}>
            <div className="eyebrow" style={{ justifyContent: "center" }}>The agent at a glance</div>
            <h2 style={{ margin: "0 auto" }}>One workflow, end to end.</h2>
          </Reveal>
          <Reveal className="diagram-wrap">
            <img src="/shots/ava-diagram.png" alt="Ava — AI Intake Agent workflow: intake, AI agent with tools &amp; RAG, routing, Postgres and human-in-the-loop" />
          </Reveal>
          <Reveal delay={2} className="canvasshot">
            <img src="/shots/workflow-canvas.png" alt="The live Ava workflow on the n8n canvas — webhook intake, the Ava AI Agent with model, memory, Calculator, Wikipedia and Knowledge-Base (RAG) tools, decision routing, Postgres insert, claimant email and team handoff." />
            <p className="shotcap">The real workflow on our n8n canvas — exactly what we built and run. Ava (the AI Agent) sits at the centre with her model, memory and three tools; the chain to the right registers the claim, writes it to PostgreSQL, emails the claimant and hands off to the assigned team.</p>
          </Reveal>
        </div>
      </section>

      <section className="section alt">
        <div className="wrap">
          <Reveal className="shead">
            <div className="eyebrow">Capabilities</div>
            <h2>A complete, governed agent — not a chatbot.</h2>
          </Reveal>
          <div className="fgrid">
            {[
              ["ai", "lilac", "LLM decision step", "OpenAI returns schema-constrained triage: type, severity, fraud score with reasons, vulnerability flag and routing. Always machine-usable."],
              ["database", "green", "Real actions", "Writes the claim and assessment to PostgreSQL and sends a branded acknowledgement — not just a chat reply."],
              ["userCheck", "red", "Human-in-the-loop", "Complex, high-value or vulnerable claims pause for a named adjuster to approve or reject. Automation is bounded."],
              ["document", "amber", "Audit & compliance", "Every decision is logged with a reference and timestamp; vulnerable-customer detection supports FCA Consumer Duty."],
              ["bolt", "lilac", "Fast & live", "End-to-end execution in seconds, hosted on real infrastructure and testable right now."],
              ["layers", "green", "Jeen-ready", "A drop-in vertical agent designed to slot into the Jeen orchestration ecosystem."],
            ].map(([ic, c, t, d], i) => (
              <Reveal key={t} delay={(i % 3) + 1} className="fcard">
                <div className={`fic ${c}`}><Icon name={ic} size={24} /></div><h3>{t}</h3><p>{d}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

/* ============================ LIVE DEMO ============================ */
const STAGES = [
  ["Intake", "Receiving claim via n8n webhook"],
  ["AI triage", "LLM classifying & scoring (OpenAI)"],
  ["Record", "Writing claim to PostgreSQL"],
  ["Routing", "Applying governance rule"],
  ["Respond", "Returning the decision"],
];

function FormConsole() {
  const [form, setForm] = useState({ ...SCENARIOS[0].data });
  const [phase, setPhase] = useState("idle"); // idle | running | done | error
  const [stage, setStage] = useState(-1);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState("");
  const timer = useRef(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const fill = (s) => setForm({ ...s.data });

  async function submit(e) {
    e.preventDefault();
    setPhase("running"); setResult(null); setErr(""); setStage(0);
    let i = 0;
    timer.current = setInterval(() => { i = Math.min(i + 1, STAGES.length - 1); setStage(i); }, 850);
    try {
      const payload = { ...form, estimated_value: Number(form.estimated_value) };
      const r = await fetch(TRIAGE_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const d = await r.json();
      clearInterval(timer.current);
      if (!r.ok || d.ok === false || !d.routing) throw new Error(d.detail || d.error || "Agent did not return a decision");
      setStage(STAGES.length); setResult(d); setPhase("done");
    } catch (e2) { clearInterval(timer.current); setErr(String(e2.message || e2)); setPhase("error"); }
  }

  return (
        <div className="console">
          <div className="console-bar">
            <span className="dots"><i /><i /><i /></span>
            <span className="url">POST {TRIAGE_URL.replace("https://", "")}</span>
            <span className="live"><i /> agent online</span>
          </div>
          <div className="console-body">
            <div className="scenarios">
              {SCENARIOS.map((s) => (
                <button key={s.label} type="button" className="chip" onClick={() => fill(s)}>
                  <span className="dot" style={{ background: s.color }} />{s.label} · {s.data.policy_number}
                </button>
              ))}
            </div>
            <div className="playgrid">
              <form onSubmit={submit} autoComplete="off">
                <div className="two">
                  <div className="field"><label>Policy number</label><input value={form.policy_number} onChange={set("policy_number")} required /></div>
                  <div className="field"><label>Incident type</label><select value={form.incident_type} onChange={set("incident_type")}><option>Motor</option><option>Home</option><option>Travel</option><option>Liability</option></select></div>
                </div>
                <div className="two">
                  <div className="field"><label>Claimant name</label><input value={form.claimant_name} onChange={set("claimant_name")} required /></div>
                  <div className="field"><label>Claimant email</label><input type="email" value={form.claimant_email} onChange={set("claimant_email")} required /></div>
                </div>
                <div className="two">
                  <div className="field"><label>Incident date</label><input type="date" value={form.incident_date} onChange={set("incident_date")} required /></div>
                  <div className="field"><label>Estimated value (£)</label><input type="number" value={form.estimated_value} onChange={set("estimated_value")} required /></div>
                </div>
                <div className="field"><label>Description of incident</label><textarea value={form.description} onChange={set("description")} required /></div>
                <button className="runbtn" disabled={phase === "running"} type="submit">{phase === "running" ? "Agent running…" : <><Icon name="bolt" size={16} /> Run AI triage</>}</button>
              </form>

              <div className="result">
                {phase === "idle" && <div className="res-empty"><div className="big"><Icon name="ai" size={34} /></div><div>Pick a preset above (with real test data) and run the agent. The decision appears here.</div></div>}
                {phase === "running" && (
                  <div className="scanlines">
                    {STAGES.map(([k, d], i) => (
                      <div key={k} style={{ animationDelay: `${i * 0.05}s`, display: "flex", gap: 10, padding: "9px 0", color: i <= stage ? "#fff" : "#6d6385", alignItems: "center" }}>
                        <span style={{ width: 18 }}>{i < stage ? "✓" : i === stage ? <span className="spinner" style={{ width: 14, height: 14, margin: 0, borderWidth: 2 }} /> : "○"}</span>
                        <b style={{ fontWeight: 600 }}>{k}</b><span className="dim small">— {d}</span>
                      </div>
                    ))}
                  </div>
                )}
                {phase === "error" && <div className="res-empty"><div className="big"><Icon name="alert" size={32} /></div><div>Agent unreachable.<br /><span className="dim small">{err}</span></div></div>}
                {phase === "done" && result && <ResultCard d={result} />}
              </div>
            </div>
            <div className="demo-note">
              Test policy numbers: <code>ALB-MOT-441902</code>, <code>ALB-HOM-778145</code>, <code>ALB-MOT-902551</code> ·
              standalone n8n form: <a href={FORM_URL} target="_blank" rel="noreferrer">open live form ↗</a> · portal: <a href={PORTAL_URL} target="_blank" rel="noreferrer">↗</a>
            </div>
          </div>
        </div>
  );
}

/* ---- Ava: conversational intake agent ---- */
const GREETING = { role: "assistant", content: "Hi, I'm Ava — Albion Mutual's claims assistant. Tell me what happened and I'll take it from there." };

function ChatAgent() {
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [decision, setDecision] = useState(null);
  const scroller = useRef(null);
  const sid = useRef("sess-" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36));
  useEffect(() => { scroller.current?.scrollTo({ top: 9e9, behavior: "smooth" }); }, [messages, busy]);

  // Post a message to Ava and append her reply. `display` lets the bubble show
  // something friendlier than the raw content sent to the agent (used for attachments).
  async function push(content, display) {
    const next = [...messages, { role: "user", content, display }];
    setMessages(next); setBusy(true);
    try {
      const r = await fetch(CHAT_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ session_id: sid.current, messages: next.map(({ role, content }) => ({ role, content })).filter((m) => m !== GREETING || next.indexOf(m) > 0) }) });
      const d = await r.json();
      const reply = d.reply || "Sorry, I didn't catch that — could you rephrase?";
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
      if (d.ready && d.claim_ref) setDecision(d);
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", content: "I'm having trouble reaching the claims system right now. Please try again in a moment." }]);
    } finally { setBusy(false); }
  }
  function send(text) {
    const content = (text ?? input).trim();
    if (!content || busy) return;
    setInput("");
    push(content);
  }
  // Attachment: read the file, send it to OpenAI vision (via n8n), then feed the
  // extracted content into the conversation so Ava's triage uses the evidence.
  async function onAttach(e) {
    const file = e.target.files && e.target.files[0];
    if (e.target) e.target.value = "";
    if (!file || busy) return;
    setBusy(true);
    const dataUrl = await new Promise((res) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(file); });
    let summary = "";
    try {
      const r = await fetch(ATTACH_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ session_id: sid.current, filename: file.name, mime: file.type, image_base64: dataUrl }) });
      const d = await r.json();
      summary = (d && d.summary) || "";
    } catch (e2) { summary = ""; }
    setBusy(false);
    if (!summary) { setMessages((m) => [...m, { role: "assistant", content: "I couldn't read that attachment — please try another file, or just describe what it shows." }]); return; }
    // Sent to Ava (full context); shown to the user as a tidy chip + the read-out.
    push(`I've attached a file for my claim: ${file.name}. Here is what it shows: ${summary}`, { name: file.name, summary });
  }

  return (
    <div className="console">
      <div className="console-bar">
        <span className="dots"><i /><i /><i /></span>
        <span className="url">Ava · conversational intake agent</span>
        <span className="live"><i /> NLP agent online</span>
      </div>
      <div className="console-body">
        <div className="chatgrid">
          <div className="chatcol">
            <div className="ava-header">
              <AvaAvatar size={40} online />
              <div className="ava-meta"><b>Ava</b><span className="dim small">Jeen.ai assistant · usually replies instantly</span></div>
            </div>
            <div className="chatlog" ref={scroller}>
              {messages.map((m, i) => (
                <div key={i} className={`msg ${m.role}`}>
                  {m.role === "assistant" && <AvaAvatar size={30} />}
                  <div className="bubble">{m.display ? (<><span className="attach-chip"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 5, verticalAlign: "-2px" }}><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>{m.display.name}</span><div className="attach-read">Ava read: {m.display.summary}</div></>) : m.content}</div>
                </div>
              ))}
              {busy && <div className="msg assistant"><AvaAvatar size={30} /><div className="bubble typing"><span /><span /><span /></div></div>}
            </div>
            <form className="chatinput" onSubmit={(e) => { e.preventDefault(); send(); }}>
              <label className="attachbtn" title="Attach a photo or document">
                <input type="file" accept="image/*,.pdf" hidden onChange={onAttach} disabled={busy} />
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
              </label>
              <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Describe what happened, attach a photo, or answer Ava…" />
              <button className="runbtn" style={{ width: "auto", padding: "12px 20px", marginTop: 0 }} disabled={busy} type="submit">Send</button>
            </form>
          </div>
          <div className="result">
            {!decision && <div className="res-empty"><div className="big"><Icon name="chat" size={34} /></div><div>Your claim decision will appear here.</div></div>}
            {decision && <ResultCard d={decision} />}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---- Reusable claim intake (Ava chat + structured form tabs) ---- */
export function ClaimIntake() {
  const [tab, setTab] = useState("ava");
  return (
    <Reveal>
      <div className="tabs">
        <button className={`tab ${tab === "ava" ? "on" : ""}`} onClick={() => setTab("ava")}>Talk to Ava</button>
        <button className={`tab ${tab === "form" ? "on" : ""}`} onClick={() => setTab("form")}>Structured form</button>
      </div>
      {tab === "ava" ? <ChatAgent /> : <FormConsole />}
    </Reveal>
  );
}

/* ---- Demo: the live intake ---- */
export function Demo() {
  return (
    <section className="section">
      <div className="wrap">
        <Reveal className="shead">
          <div className="eyebrow">Live demo</div>
          <h2>Report a claim to Ava.</h2>
          <p className="sublead">Chat with Ava or use the form — she triages, decides and registers it live.</p>
        </Reveal>
        <ClaimIntake />
      </div>
    </section>
  );
}

function ResultCard({ d }) {
  const mc = meterColor(d.fraud_risk);
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW(Math.max(4, Math.min(100, d.fraud_risk))), 60); return () => clearTimeout(t); }, [d]);
  return (
    <div className="rescard">
      <div className="res-head">
        <div><div className="ref">{d.claim_ref}</div><div className="status">Status: {d.status}</div></div>
        <div className={`routebadge ${routeClass(d.routing)}`}>{(d.routing || "").replace("-", " ")}</div>
      </div>
      <div className="res-chips">
        <span className="rchip">{d.claim_type}</span>
        <span className="rchip">Severity: {d.severity}</span>
        <span className="rchip">£{Number(d.estimated_value || 0).toLocaleString()}</span>
        {d.vulnerable_flag && <span className="rchip vuln">⚑ Vulnerable customer</span>}
      </div>
      <div className="meter-wrap">
        <div className="meter-top"><span>Fraud risk</span><span style={{ color: mc, fontWeight: 700 }}>{d.fraud_risk}/100</span></div>
        <div className="meter"><div className="fill" style={{ width: `${w}%`, background: mc }} /></div>
        {d.fraud_reasons && <div className="dim small" style={{ marginTop: 7 }}>{d.fraud_reasons}</div>}
      </div>
      {d.vulnerable_flag && <div className="banner">⚑ <b>FCA Consumer Duty:</b> {d.vulnerable_reason}</div>}
      <div className="summary"><div className="lbl">AI triage summary</div>{d.ai_summary}</div>
      <div className="nextstep"><Icon name="arrow" size={16} /> <div><b>What happens next:</b> {d.next_step}</div></div>
      <div className="steps">
        <span className="on">Intake ✓</span><span className="on">AI triage ✓</span><span className="on">Recorded ✓</span>
        <span className="on">{d.decision === "accept" ? `Accepted → ${d.team || "Finance"} ✓` : d.decision === "decline" ? `Declined → ${d.team || "Legal"}` : `Referred → ${d.team || "review"}`}</span>
      </div>
    </div>
  );
}

/* The exact technical journey of one chat message (rendered on How It Works). */
const SEND_FLOW = [
  { n: "1", t: "You press Send", layer: "Browser · React", lc: "l-browser", d: "The chat form's onSubmit fires. React calls e.preventDefault(), appends your message to the messages array in state (so it shows instantly) and clears the input box.", code: "form.onSubmit → e.preventDefault()" },
  { n: "2", t: "The app calls the API", layer: "Browser · fetch", lc: "l-browser", d: "A POST request is sent with the whole conversation plus a session id, as JSON, over HTTPS.", code: 'fetch("…/webhook/claims-chat", { method:"POST", body: JSON.stringify({ session_id, messages }) })' },
  { n: "3", t: "Cloudflare tunnel", layer: "Network", lc: "l-net", d: "The request reaches n8n.navada-edge-server.uk on Cloudflare, which securely tunnels it to the self-hosted n8n on NAVADA Edge. No inbound ports are open on the host.", code: "Cloudflare edge → encrypted tunnel → n8n" },
  { n: "4", t: "n8n webhook trigger", layer: "n8n", lc: "l-n8n", d: "The POST /claims-chat node receives the JSON and starts Ava's workflow.", code: "POST /claims-chat" },
  { n: "5", t: "Build the transcript", layer: "n8n · Code", lc: "l-n8n", d: "A Code node turns the message history into a clean transcript for the agent to read.", code: null },
  { n: "6", t: "Ava reasons (LLM + tools + memory)", layer: "AI Agent", lc: "l-ai", d: "OpenAI reads the transcript with Ava's system prompt + guardrails. She can call her tools — Knowledge Base (pgvector RAG), Wikipedia, Calculator — and uses Postgres memory to recall the chat. She returns structured JSON.", code: "OpenAI + RAG + memory → { reply, ready, claim, triage }" },
  { n: "7", t: "Decision engine", layer: "n8n · Code + IF", lc: "l-n8n", d: "Not ready → Ava just replies with her next question. Ready → a deterministic rule decides accept / refer / decline: below the policy excess → decline (Legal); fraud ≥ 60 → refer to Legal; ≥ £5,000, high severity or vulnerable → refer to a Claims Adjuster; otherwise accept → Finance.", code: "ready ? decide(value, excess, fraud, vulnerable) : ask()" },
  { n: "8", t: "Record + log", layer: "PostgreSQL", lc: "l-data", d: "The claim and Ava's assessment are written to jeen.claims; the full conversation is logged to jeen.conversations.", code: "INSERT INTO jeen.claims …" },
  { n: "9", t: "Respond + notify", layer: "n8n → Network", lc: "l-net", d: "n8n returns the decision as JSON back through Cloudflare to your browser, and Ava emails the claimant and alerts the assigned team.", code: "{ ok:true, reply, claim_ref, decision, team, status, … }" },
  { n: "10", t: "The UI updates", layer: "Browser · React", lc: "l-browser", d: "React receives the JSON, renders Ava's reply as a chat bubble and — when the claim registers — animates the decision card into view.", code: "setMessages(…) · setDecision(…)" },
];

/* ============================ HOW IT WORKS ============================ */
export function HowItWorks() {
  return (
    <section className="section">
      <div className="wrap">
        <Reveal className="shead">
          <div className="eyebrow">Start a claim</div>
          <h2>Talk to Ava, or fill the form.</h2>
          <p className="sublead">Report a claim in seconds — then scroll to see exactly how it's handled, end to end.</p>
        </Reveal>
        <ClaimIntake />

        <Reveal className="shead" delay={1} style={{ marginTop: 64 }}>
          <div className="eyebrow">How it works</div>
          <h2>One agent. One workflow.</h2>
          <p className="sublead">Ava runs as a single n8n workflow that orchestrates data, the model and human oversight — from the first message to a recorded decision.</p>
        </Reveal>

        <div className="tlwrap">
          <div className="timeline">
            {WORKFLOW_STEPS.map((st, i) => (
              <Reveal key={st.n} delay={(i % 3) + 1} className="tlstep">
                <div className="tlrail"><div className="tlnum">{st.n}</div></div>
                <div className="tlcard">
                  <div className="tltop"><h3>{st.title}</h3><span className={`ptag ${st.tagClass}`}>{st.tag}</span></div>
                  <code className="tlnode">{st.node}</code>
                  <p>{st.what}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        <Reveal className="govnote" delay={1}>
          <b>Governed by design.</b> The model is scoped to one decision — it never settles, pays or rejects a claim. A deterministic rule decides <b>accept, refer or decline</b> and routes the claim to the right team — Claims Adjuster, Legal or Finance. Anything ≥ £5,000, high-fraud-risk or involving a vulnerable customer goes to a human; below-excess claims are declined with appeal rights. Every claim and every team action is written to PostgreSQL for a defensible audit trail.
        </Reveal>

        {/* The exact technical journey of one message */}
        <Reveal className="shead" delay={1} style={{ marginTop: 56 }}>
          <div className="eyebrow">Under the hood</div>
          <h2>What happens when you press “Send”.</h2>
          <p className="sublead">The exact path one message takes — from the click in your browser to Ava's reply.</p>
        </Reveal>
        <div className="flowsteps">
          {SEND_FLOW.map((s, i) => (
            <Reveal key={s.n} delay={(i % 3) + 1} className="flowstep">
              <div className="fs-num">{s.n}</div>
              <div className="fs-body">
                <div className="fs-top"><h4>{s.t}</h4><span className={`fs-layer ${s.lc}`}>{s.layer}</span></div>
                <p>{s.d}</p>
                {s.code && <code className="fs-code">{s.code}</code>}
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="proofband" delay={1}>
          <div className="proofcopy">
            <div className="eyebrow">Proof · live</div>
            <h2 style={{ fontSize: 28 }}>It actually runs.</h2>
            <p className="sublead">This isn't a mock-up. Every claim runs through the same governed sequence on our self-hosted n8n — and you can open the live workflow and watch it execute.</p>
            <a href={N8N_WORKFLOW_URL} target="_blank" rel="noreferrer" className="btn grad" onClick={() => window.dispatchEvent(new Event("ava-launch"))}><Icon name="gear" size={16} /> Open the live workflow ↗</a>
          </div>
          <div className="ava-runtime">
            <div className="rt-title"><AvaAvatar size={28} online /><b>Ava at runtime</b><span className="rt-live"><i /> live</span></div>
            {[
              "Reads the claimant's message in full context — she remembers the conversation (Postgres chat memory).",
              "Reaches for a tool when it helps — Calculator for sums, Wikipedia for general facts, the Knowledge Base (RAG) for Albion's own cover, excess and rules.",
              "Replies as strict, schema-constrained JSON — never free-form text the rest of the flow can't trust.",
              "A deterministic rule (not the model) decides accept · refer · decline and picks the team.",
              "Writes the claim to PostgreSQL with a sequential reference and a full audit trail.",
              "Emails the claimant, alerts the assigned team, and the claim moves down the queue.",
            ].map((t, i) => (
              <div className="rt-step" key={i} style={{ animationDelay: `${0.15 + i * 0.12}s` }}>
                <span className="rt-dot" /><span>{t}</span>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ============================ DATA & SECURITY ============================ */
const LIFECYCLE = [
  ["inbox", "Collect", "Minimal claim fields submitted via TLS"],
  ["ai", "Process", "LLM triage — text only, no training on data"],
  ["database", "Store", "Encrypted PostgreSQL record + audit log"],
  ["userCheck", "Decide", "Accept, refer or decline — routed to a team"],
  ["clock", "Retain / erase", "Policy-based retention; right-to-erasure"],
];
const COMPLIANCE = [
  ["scale", "lilac", "Lawful basis (UK GDPR)", "Processing rests on contract performance (handling the policyholder's claim) and legitimate interest (fraud prevention). Vulnerable-customer handling is grounded in FCA Consumer Duty."],
  ["document", "amber", "Data Processing Agreement", "As processor, the deployment ships with a DPA covering purpose limitation, sub-processors (OpenAI, hosting), security measures and breach notification timelines."],
  ["search", "red", "Subject Access Requests", "Each claim is keyed by reference and claimant identifiers, so a SAR can be fulfilled by a single indexed query returning all data and decisions held for a person."],
  ["clock", "green", "Retention & erasure", "Configurable retention windows with automated purge; right-to-erasure and rectification are supported at the record level without breaking the audit chain."],
  ["globe", "lilac", "Data residency & minimisation", "Only the fields needed for triage are processed; PII can be redacted before the model call, and hosting region is controllable via the deployment node."],
  ["shield", "red", "DPIA-ready", "Because the LLM cannot take an action and humans approve sensitive outcomes, the design is low-risk by construction and maps cleanly onto a Data Protection Impact Assessment."],
];

export function DataSecurity() {
  return (
    <section className="section">
      <div className="wrap">
        <Reveal className="shead">
          <div className="eyebrow">Data &amp; security</div>
          <h2>A clear data strategy, governed end to end.</h2>
          <p className="sublead">{PRODUCT.name} is built so that data protection and AI governance are structural, not bolted on. Here is exactly how data is handled.</p>
        </Reveal>

        <Reveal><div className="lifecycle">
          {LIFECYCLE.map(([ic, t, d], i) => (
            <React.Fragment key={t}>
              <div className="lcstep"><div className="lcic"><Icon name={ic} size={22} /></div><div className="lct">{t}</div><div className="lcd">{d}</div></div>
              {i < LIFECYCLE.length - 1 && <span className="parrow">→</span>}
            </React.Fragment>
          ))}
        </div></Reveal>

        <Reveal className="shead" delay={1} style={{ marginTop: 40 }}>
          <div className="eyebrow">Security architecture</div>
          <h2>Secrets, sandboxing and audit.</h2>
        </Reveal>
        <div className="fgrid">
          {SECURITY.map((s, i) => (
            <Reveal key={s.t} delay={(i % 3) + 1} className="fcard"><div className="fic"><Icon name={s.icon} size={24} /></div><h3>{s.t}</h3><p>{s.d}</p></Reveal>
          ))}
        </div>

        <Reveal className="shead" delay={1} style={{ marginTop: 40 }}>
          <div className="eyebrow">Decision governance</div>
          <h2>How decisions are made — and how rules change.</h2>
          <p className="sublead">In insurance, <i>who</i> decides and <i>how</i> matters. {PRODUCT.name} keeps the AI assistive and puts every outcome under an explicit, deterministic rule a person can read, review and change.</p>
        </Reveal>
        <Reveal className="govnote" delay={1}>
          <b>The model assists; it never decides.</b> Ava (the language model) only reads the claim and returns structured signals — claim type, severity, a fraud-risk score and an FCA vulnerability flag. The <b>accept / refer / decline</b> outcome is computed by a separate, deterministic rule: a small, explicit <b>JavaScript function in the n8n workflow</b> (a policy-excess table by claim type, then plain <code>if / else</code> conditions on value, fraud, vulnerability and severity). It calls no model and uses no randomness, so the <b>same claim always produces the same outcome</b> and the logic can be audited line by line.
          <br /><br />
          <b>Adding or changing a rule</b> means editing that function — e.g. a new policy excess, a new value threshold, or a new routing condition. The rule lives in version control (Git), so every change is diff-reviewed, attributed and reversible before it goes live — nothing is hidden inside a prompt, and no model retraining is involved. (Production next step: externalise the rule table so risk &amp; compliance can propose changes through formal review and sign-off.)
        </Reveal>

        <Reveal className="shead" delay={1} style={{ marginTop: 36 }}>
          <div className="eyebrow">Responsible &amp; ethical AI</div>
          <h2>AI used ethically on a sensitive process.</h2>
          <p className="sublead">Claims decisions affect people at vulnerable moments. These are the principles {PRODUCT.name} is built on.</p>
        </Reveal>
        <div className="fgrid">
          {ETHICS.map((s, i) => (
            <Reveal key={s.t} delay={(i % 3) + 1} className="fcard"><div className={`fic ${s.c}`}><Icon name={s.icon} size={24} /></div><h3>{s.t}</h3><p>{s.d}</p></Reveal>
          ))}
        </div>

        <Reveal className="shead" delay={1} style={{ marginTop: 40 }}>
          <div className="eyebrow">Compliance · UK GDPR / DPA 2018</div>
          <h2>Data protection &amp; subject rights.</h2>
        </Reveal>
        <div className="fgrid">
          {COMPLIANCE.map(([ic, c, t, d], i) => (
            <Reveal key={t} delay={(i % 3) + 1} className="fcard"><div className={`fic ${c}`}><Icon name={ic} size={24} /></div><h3>{t}</h3><p>{d}</p></Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================ ASSIGNMENT ============================ */
export function Assignment() {
  return (
    <section className="section">
      <div className="wrap">
        {/* Brief — split: narrative + a meta card */}
        <div className="briefgrid">
          <Reveal>
            <div className="eyebrow">{ASSIGNMENT.org}</div>
            <h2>The brief — and how this build answers it.</h2>
            <p className="sublead">{ASSIGNMENT.intro}</p>
          </Reveal>
          <Reveal delay={1} className="briefmeta">
            <div className="bm-row"><span className="bm-k">Role</span><span className="bm-v">AI Solution Engineer</span></div>
            <div className="bm-row"><span className="bm-k">Time box</span><span className="bm-v">4–5 hours</span></div>
            <div className="bm-row"><span className="bm-k">Platform</span><span className="bm-v">n8n · self-hosted</span></div>
            <div className="bm-row"><span className="bm-k">Status</span><span className="bm-v ok"><Icon name="check" size={14} /> Delivered + live</span></div>
          </Reveal>
        </div>

        <Reveal className="subhead"><h3 className="ah3">Deliverables</h3><span className="dim2">What the assignment asked for — all provided.</span></Reveal>
        <div className="fgrid">
          {ASSIGNMENT.deliverables.map((d, i) => (
            <Reveal key={d.t} delay={(i % 3) + 1} className="fcard delcard">
              <div className="dn-badge">{i + 1}</div>
              <h3>{d.t}</h3><p>{d.d}</p>
            </Reveal>
          ))}
        </div>

        <Reveal className="subhead" style={{ marginTop: 50 }}><h3 className="ah3">Requirements coverage</h3><span className="cov-pill"><Icon name="check" size={14} /> Every requirement met</span></Reveal>
        <div className="covgrid">
          {ASSIGNMENT.coverage.map((c, i) => (
            <Reveal key={c.req} delay={(i % 3) + 1} className="covcard">
              <div className="covtick"><Icon name="check" size={15} /></div>
              <div><div className="covreq">{c.req}</div><div className="covmet">{c.met}</div></div>
            </Reveal>
          ))}
        </div>

        <div className="briefgrid" style={{ marginTop: 50 }}>
          <Reveal className="fcard">
            <div className="fic amber"><Icon name="check" size={24} /></div><h3>What they wanted to see</h3>
            <ul>{ASSIGNMENT.wants.map((w) => <li key={w}>{w}</li>)}</ul>
          </Reveal>
          <Reveal delay={1} className="profilecard">
            <div className="profilerow">
              <div className="sp-avatar" style={{ width: 54, height: 54, fontSize: 22, borderRadius: 15 }}>{PROFILE.name.split("(")[0].trim()[0]}</div>
              <div><h3 style={{ margin: 0, fontSize: 18 }}>{PROFILE.name}</h3><div className="dim2 small">{PROFILE.role}</div></div>
            </div>
            <p>{PROFILE.blurb}</p>
            <div className="profilelinks">
              <a href={`mailto:${PROFILE.email}`} className="btn ghost sm">{PROFILE.email}</a>
              <a href={`https://${PROFILE.site}`} target="_blank" rel="noreferrer" className="btn ghost sm">{PROFILE.site}</a>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ============================ ADMIN ============================ */
// Lightweight, dependency-free MI charts (pure CSS/SVG) so the bundle stays small.
function Bars({ data }) {
  const max = Math.max(1, ...data.map((d) => d.v));
  return (
    <div className="bars">
      {data.map((d) => (
        <div className="barrow" key={d.k}>
          <span className="barlbl">{d.k}</span>
          <span className="bartrack"><i style={{ width: `${Math.round((d.v / max) * 100)}%`, background: d.c || "var(--lilac-deep)" }} /></span>
          <span className="barval">{d.v}</span>
        </div>
      ))}
    </div>
  );
}
// Vertical column chart for time series (claims per day).
function ColBars({ data }) {
  const max = Math.max(1, ...data.map((d) => d.v));
  return (
    <div className="colbars">
      {data.map((d, i) => (
        <div className="colbar" key={i} title={`${d.k}: ${d.v}`}>
          <span className="colval">{d.v || ""}</span>
          <i style={{ height: `${Math.max(2, Math.round((d.v / max) * 100))}%` }} />
          <span className="collbl">{d.k}</span>
        </div>
      ))}
    </div>
  );
}
// Management-information panel: a working business dashboard — KPIs, decisions,
// claims by type, fraud mix, claims-over-time, paid-out YTD, and a run-rate forecast.
// A period filter (all / 30d / 7d) scopes the operational charts; YTD is year-to-date.
function AdminCharts({ claims }) {
  const [period, setPeriod] = useState("all");
  const all = claims || [];
  const num = (x) => Number(x || 0);
  const parse = (c) => { const d = new Date(String(c.received || "").replace(" ", "T")); return isNaN(d) ? null : d; };
  const now = new Date();
  const yr = now.getFullYear();
  const days = period === "all" ? null : Number(period);
  const cutoff = days ? now.getTime() - days * 864e5 : 0;
  const cs = days ? all.filter((c) => { const d = parse(c); return d && d.getTime() >= cutoff; }) : all;
  const n = cs.length;
  const count = (f) => cs.filter(f).length;
  const sum = (f) => cs.filter(f).reduce((a, c) => a + num(c.estimated_value), 0);
  const decisionOf = (c) => c.decision || (["paid", "approved"].includes(c.status) ? "accept" : c.status === "declined" ? "decline" : c.status === "referred" ? "refer" : "—");
  const money = (v) => (v >= 1000 ? "£" + (v / 1000).toFixed(v >= 10000 ? 0 : 1) + "k" : "£" + Math.round(v));

  // KPIs — Paid out YTD is always year-to-date (status paid, this calendar year).
  const paidYtd = all.filter((c) => c.status === "paid" && (parse(c) ? parse(c).getFullYear() === yr : true)).reduce((a, c) => a + num(c.estimated_value), 0);
  const kpis = [
    { n, l: days ? `Claims · ${days}d` : "Total claims", c: "" },
    { n: count((c) => ["approved", "paid"].includes(c.status)), l: "Accepted / paid", c: "green" },
    { n: count((c) => c.status === "referred"), l: "In review", c: "amber" },
    { n: count((c) => c.status === "declined"), l: "Declined", c: "red" },
    { n: money(paidYtd), l: "Paid out YTD", c: "green" },
    { n: count((c) => c.vulnerable_flag), l: "Vulnerable", c: "lilac" },
  ];
  const decisions = [
    { k: "Accept", v: count((c) => decisionOf(c) === "accept"), c: "#1c9d83" },
    { k: "Refer", v: count((c) => decisionOf(c) === "refer"), c: "#e3a954" },
    { k: "Decline", v: count((c) => decisionOf(c) === "decline"), c: "#c55a4e" },
  ];
  const types = ["Motor", "Home", "Travel", "Liability"].map((t) => ({ k: t, v: count((c) => (c.claim_type || c.incident_type || "").toLowerCase().includes(t.toLowerCase())) }));
  const fraud = [
    { k: "Low <30", v: count((c) => num(c.fraud_risk) < 30), c: "#1c9d83" },
    { k: "Med 30–59", v: count((c) => num(c.fraud_risk) >= 30 && num(c.fraud_risk) < 60), c: "#e3a954" },
    { k: "High ≥60", v: count((c) => num(c.fraud_risk) >= 60), c: "#c55a4e" },
  ];
  const teams = ["Claims Adjuster", "Legal", "Finance"].map((t) => ({ k: t, v: count((c) => c.team === t) }));
  const hasTeam = cs.some((c) => c.team);
  const avgFraud = n ? Math.round(cs.reduce((a, c) => a + num(c.fraud_risk), 0) / n) : 0;

  // Claims over time — per-day counts for the last (period or 14) days.
  const span = days || 14;
  const byDay = [];
  for (let i = span - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 864e5);
    const v = all.filter((c) => { const p = parse(c); return p && p.toDateString() === d.toDateString(); }).length;
    byDay.push({ k: `${d.getDate()}/${d.getMonth() + 1}`, v });
  }

  // Management forecast — simple run-rate projection over a 30-day window.
  const win = 30;
  const inWin = all.filter((c) => { const p = parse(c); return p && p.getTime() >= now.getTime() - win * 864e5; });
  const perDay = inWin.length / win;
  const projMonthly = Math.round(perDay * 30);
  const acceptRate = inWin.length ? inWin.filter((c) => decisionOf(c) === "accept").length / inWin.length : 0;
  const avgVal = inWin.length ? inWin.reduce((a, c) => a + num(c.estimated_value), 0) / inWin.length : 0;
  const projPayout = projMonthly * acceptRate * avgVal;

  return (
    <>
      <div className="mi-toolbar">
        <span className="mi-period-l">Period</span>
        {[["all", "All time"], ["30", "Last 30 days"], ["7", "Last 7 days"]].map(([k, l]) => (
          <button key={k} className={`mi-period ${period === k ? "on" : ""}`} onClick={() => setPeriod(k)}>{l}</button>
        ))}
      </div>
      <div className="mi-kpis">{kpis.map((k) => <div className="astat" key={k.l}><div className={`an ${k.c}`}>{k.n}</div><div className="al">{k.l}</div></div>)}</div>
      <div className="mi-grid">
        <div className="mi-card mi-wide"><h4>Claims over time</h4><ColBars data={byDay} /></div>
        <div className="mi-card mi-forecast">
          <h4>Management forecast <span className="mi-tag">indicative</span></h4>
          <div className="moneyrow"><span>Run-rate / day</span><b>{perDay.toFixed(1)}</b></div>
          <div className="moneyrow"><span>Projected claims / month</span><b>{projMonthly}</b></div>
          <div className="moneyrow"><span>Accept rate</span><b>{Math.round(acceptRate * 100)}%</b></div>
          <div className="moneyrow"><span>Projected payout / month</span><b className="pos">{money(projPayout)}</b></div>
        </div>
        <div className="mi-card"><h4>Decisions</h4><Bars data={decisions} /></div>
        <div className="mi-card"><h4>Claims by type</h4><Bars data={types} /></div>
        <div className="mi-card"><h4>Fraud risk</h4><Bars data={fraud} /></div>
        {hasTeam && <div className="mi-card"><h4>Team workload</h4><Bars data={teams} /></div>}
        <div className="mi-card mi-money">
          <h4>Value &amp; risk</h4>
          <div className="moneyrow"><span>Total claimed{days ? ` (${days}d)` : ""}</span><b>{money(sum(() => true))}</b></div>
          <div className="moneyrow"><span>Paid out YTD</span><b className="pos">{money(paidYtd)}</b></div>
          <div className="moneyrow"><span>Avg claim value</span><b>{money(n ? sum(() => true) / n : 0)}</b></div>
          <div className="moneyrow"><span>Avg fraud score</span><b>{avgFraud}/100</b></div>
        </div>
      </div>
    </>
  );
}

export function Admin() {
  const [token, setToken] = useState(() => sessionStorage.getItem("jeen_admin_token") || "");
  const [user, setUser] = useState(() => sessionStorage.getItem("jeen_admin_user") || "");
  const [creds, setCreds] = useState({ username: "admin", password: "" });
  const [loginErr, setLoginErr] = useState("");
  const [claims, setClaims] = useState(null);
  const [convos, setConvos] = useState([]);
  const [openConvo, setOpenConvo] = useState("");
  const [sel, setSel] = useState(null);
  const [busy, setBusy] = useState(false);
  const [acting, setActing] = useState("");

  async function login(e) {
    e.preventDefault(); setLoginErr(""); setBusy(true);
    try {
      const r = await fetch(ADMIN_LOGIN_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(creds) });
      const d = await r.json();
      if (!d.ok) throw new Error(d.error || "Login failed");
      sessionStorage.setItem("jeen_admin_token", d.token); sessionStorage.setItem("jeen_admin_user", d.user);
      setToken(d.token); setUser(d.user);
    } catch (e2) { setLoginErr(String(e2.message || e2)); } finally { setBusy(false); }
  }
  function logout() { sessionStorage.removeItem("jeen_admin_token"); sessionStorage.removeItem("jeen_admin_user"); setToken(""); setUser(""); setClaims(null); }

  async function load() {
    if (!token) return; setBusy(true);
    try {
      const r = await fetch(`${CLAIMS_ADMIN_URL}?token=${encodeURIComponent(token)}`);
      const d = await r.json();
      setClaims(Array.isArray(d) ? d : []);
      const rc = await fetch(`${CONVOS_ADMIN_URL}?token=${encodeURIComponent(token)}`);
      const dc = await rc.json();
      setConvos(Array.isArray(dc) ? dc : []);
    } catch { setClaims([]); } finally { setBusy(false); }
  }
  useEffect(() => { if (token) load(); /* eslint-disable-next-line */ }, [token]);

  async function decide(claim_ref, decision) {
    setActing(claim_ref + decision);
    try {
      await fetch(DECISION_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, claim_ref, decision, notes: decision === "approve" ? "Approved via admin console" : "Rejected via admin console" }) });
      await load();
    } finally { setActing(""); }
  }

  if (!token) {
    return (
      <section className="section">
        <div className="wrap" style={{ maxWidth: 460 }}>
          <Reveal className="logincard">
            <div className="loginhead"><JeenLogo size={34} /><div><h2 style={{ fontSize: 24 }}>Admin console</h2><p className="dim2">Albion Mutual · claims operations</p></div></div>
            <form onSubmit={login}>
              <div className="lfield"><label>Username</label><input value={creds.username} onChange={(e) => setCreds({ ...creds, username: e.target.value })} /></div>
              <div className="lfield"><label>Password</label><input type="password" value={creds.password} onChange={(e) => setCreds({ ...creds, password: e.target.value })} placeholder="••••••••" /></div>
              {loginErr && <div className="loginerr">{loginErr}</div>}
              <button className="btn grad" style={{ width: "100%", justifyContent: "center", marginTop: 6 }} disabled={busy} type="submit">{busy ? "Signing in…" : "Sign in"}</button>
            </form>
            <div className="logindemo">Demo login — <b>admin</b> / <b>AlbionAdmin2026!</b> · authenticated against the live PostgreSQL <code>jeen.admin_users</code> table.</div>
          </Reveal>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="wrap">
        <div className="adminhead">
          <div><div className="eyebrow">Admin console · live MI</div><h2>Claims operations dashboard</h2><p className="sublead">Live management information straight from PostgreSQL — decisions, teams, fraud and value across every claim Ava has processed. Approve or reject anything in review.</p></div>
          <div className="adminuser">Signed in as <b>{user}</b><button className="btn ghost sm" onClick={load} disabled={busy} style={{ marginLeft: 12 }}>↻ Refresh</button><button className="btn ghost sm" onClick={logout} style={{ marginLeft: 8 }}>Sign out</button></div>
        </div>

        {claims && <AdminCharts claims={claims} />}

        <div className="tablewrap">
          <table className="dtable">
            <thead><tr><th>Claim ref</th><th>Claimant</th><th>Type</th><th>Value</th><th>Fraud</th><th>Vuln</th><th>Decision</th><th>Status</th><th>SLA</th><th>Action</th></tr></thead>
            <tbody>
              {claims === null && <tr><td colSpan="10" className="tcenter dim2">Loading…</td></tr>}
              {claims && claims.length === 0 && <tr><td colSpan="10" className="tcenter dim2">No claims yet — run the agent on the Live Demo page.</td></tr>}
              {claims && claims.map((c) => (
                <tr key={c.claim_ref} className="rowclick" onClick={() => setSel(c)}>
                  <td><code>{c.claim_ref}</code><div className="tsub">{c.received}</div></td>
                  <td>{c.claimant_name}<div className="tsub">{c.policy_number}</div></td>
                  <td>{c.claim_type}<div className="tsub">{c.severity}</div></td>
                  <td>£{Number(c.estimated_value || 0).toLocaleString()}</td>
                  <td><span className="frpill" style={{ color: c.fraud_risk >= 60 ? "#c55a4e" : c.fraud_risk >= 30 ? "#e3a954" : "#1c9d83" }}>{c.fraud_risk}</span></td>
                  <td>{c.vulnerable_flag ? <span className="vpill">⚑</span> : "—"}</td>
                  <td>{(() => { const dec = c.decision || (["paid", "approved"].includes(c.status) ? "accept" : c.status === "declined" ? "decline" : c.status === "referred" ? "refer" : "—"); const cls = dec === "accept" ? "route-auto" : dec === "decline" ? "route-fraud" : "route-adjuster"; return <span className={`tbadge ${cls}`}>{dec}{c.team ? ` · ${c.team}` : ""}</span>; })()}</td>
                  <td><span className={`spill s-${c.status}`}>{c.status}</span></td>
                  <td>{(() => { const s = slaInfo(c); return <span className={`slapill ${s.cls}`}>{s.label}</span>; })()}</td>
                  <td>
                    {c.status === "referred" ? (
                      <div className="actbtns">
                        <button className="ab approve" disabled={acting} onClick={(e) => { e.stopPropagation(); decide(c.claim_ref, "approve"); }}>{acting === c.claim_ref + "approve" ? "…" : "Approve"}</button>
                        <button className="ab reject" disabled={acting} onClick={(e) => { e.stopPropagation(); decide(c.claim_ref, "reject"); }}>{acting === c.claim_ref + "reject" ? "…" : "Reject"}</button>
                      </div>
                    ) : <span className="dim2 small">{c.adjuster_decision || "—"}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="dim2 small" style={{ marginTop: 14 }}>Human-in-the-loop: claims that are ≥ £5,000, fraud ≥ 60 or vulnerable are <b>referred</b> to a team. Approving/rejecting here writes back to PostgreSQL via the <code>/claims-decision</code> endpoint; teams also action their own queue in the <a href="#/team">Team Console</a>.</p>

        <div className="adminhead" style={{ marginTop: 50 }}>
          <div><div className="eyebrow">Conversation logs</div><h2 style={{ fontSize: 26 }}>Every chat with Ava</h2><p className="sublead">Full transcripts, logged to PostgreSQL per session.</p></div>
        </div>
        <div className="convlist">
          {convos.length === 0 && <p className="dim2 small">No conversations logged yet — talk to Ava on the Live Demo page.</p>}
          {convos.map((cv) => {
            let msgs = []; try { msgs = typeof cv.messages === "string" ? JSON.parse(cv.messages) : (cv.messages || []); } catch { msgs = []; }
            const open = openConvo === cv.session_id;
            return (
              <div className="convrow" key={cv.session_id}>
                <button className="convhead" onClick={() => setOpenConvo(open ? "" : cv.session_id)}>
                  <span><code>{cv.session_id}</code> <span className="dim2 small">· {cv.message_count} msgs · {cv.updated}{cv.claim_ref ? ` · ${cv.claim_ref}` : ""}</span></span>
                  <span>{open ? "▲" : "▼"}</span>
                </button>
                {open && (
                  <div className="convbody">
                    {msgs.map((m, i) => (
                      <div key={i} className={`cmsg ${m.role}`}><b>{m.role === "user" ? "Claimant" : "Ava"}:</b> {m.content}</div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {sel && <ClaimDrawer claim={sel} convo={convos.find((cv) => cv.claim_ref === sel.claim_ref)} onClose={() => setSel(null)} onDecide={decide} acting={acting} />}
    </section>
  );
}

function ClaimDrawer({ claim: c, convo, onClose, onDecide, acting }) {
  let msgs = [];
  if (convo) { try { msgs = typeof convo.messages === "string" ? JSON.parse(convo.messages) : (convo.messages || []); } catch { msgs = []; } }
  const Row = ({ k, v }) => v == null || v === "" ? null : <div className="drow"><span className="dk">{k}</span><span className="dv">{v}</span></div>;
  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <div>
            <code className="ref-l">{c.claim_ref}</code>
            <h3>{c.claimant_name} · {c.claim_type || c.incident_type} claim</h3>
          </div>
          <button className="drawer-x" onClick={onClose}>✕</button>
        </div>
        <div className="drawer-body">
          <div className="drawer-badges">
            <span className={`tbadge ${routeClass(c.routing)}`}>{(c.routing || "").replace("-", " ")}</span>
            <span className={`spill s-${c.status}`}>{c.status}</span>
            {c.vulnerable_flag && <span className="rchip vuln" style={{ background: "var(--lilac-soft)", color: "var(--lilac-deep)", border: "1px solid var(--lilac)" }}>⚑ Vulnerable</span>}
            <span className="frpill" style={{ color: c.fraud_risk >= 60 ? "#c55a4e" : c.fraud_risk >= 30 ? "#e3a954" : "#1c9d83", fontWeight: 800 }}>Fraud {c.fraud_risk}/100</span>
          </div>

          <h4 className="dsec">Customer &amp; claim</h4>
          <Row k="Claimant" v={c.claimant_name} />
          <Row k="Email" v={c.claimant_email} />
          <Row k="Policy number" v={c.policy_number} />
          <Row k="Incident type" v={c.incident_type} />
          <Row k="Incident date" v={c.incident_date} />
          <Row k="Estimated value" v={`£${Number(c.estimated_value || 0).toLocaleString()}`} />
          <Row k="Severity" v={c.severity} />
          <Row k="Received" v={c.received} />
          <div className="drow col"><span className="dk">Description</span><p className="dv">{c.description || "—"}</p></div>

          <h4 className="dsec">AI assessment</h4>
          <div className="drow col"><span className="dk">Triage summary</span><p className="dv">{c.ai_summary || "—"}</p></div>
          <Row k="Fraud reasons" v={c.fraud_reasons} />
          <Row k="Vulnerability" v={c.vulnerable_reason} />
          <Row k="Recommended next step" v={c.next_step} />
          {c.adjuster_decision && <Row k="Adjuster decision" v={c.adjuster_decision} />}
          {c.adjuster_notes && <Row k="Adjuster notes" v={c.adjuster_notes} />}

          <h4 className="dsec">Conversation with Ava {convo ? `· ${msgs.length} messages` : ""}</h4>
          {convo ? (
            <div className="drawer-convo">
              {msgs.map((m, i) => <div key={i} className={`cmsg ${m.role}`}><b>{m.role === "user" ? "Claimant" : "Ava"}:</b> {m.content}</div>)}
            </div>
          ) : <p className="dim2 small">No conversation linked (filed via form or before logging was enabled).</p>}
        </div>
        {c.status === "referred" && (
          <div className="drawer-foot">
            <button className="ab reject" disabled={acting} onClick={() => { onDecide(c.claim_ref, "reject"); onClose(); }}>Reject</button>
            <button className="ab approve" disabled={acting} onClick={() => { onDecide(c.claim_ref, "approve"); onClose(); }}>Approve claim</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================ CUSTOMER PORTAL (Clerk) ============================ */
function stageIndex(status) {
  if (["paid", "approved", "rejected", "declined", "auto-settled"].includes(status)) return 4;
  if (status === "referred" || status === "info-requested" || status === "pending-human-review") return 2; // submitted + triaged done, decision pending
  return 2;
}
function ClaimLifecycle({ status }) {
  const done = stageIndex(status);
  const rejected = status === "rejected";
  return (
    <div className="lifecycle lc-inline">
      {LIFECYCLE_STAGES.map((s, i) => {
        const state = i < done ? "done" : i === done ? "current" : "todo";
        const last = i === LIFECYCLE_STAGES.length - 1;
        return (
          <React.Fragment key={s.key}>
            <div className={`lcs ${state} ${last && rejected ? "rej" : ""}`}>
              <div className="lcs-dot">{i < done ? "✓" : i + 1}</div>
              <div className="lcs-lab">{last && rejected ? "Rejected" : s.label}</div>
              <div className="lcs-desc">{s.desc}</div>
            </div>
            {!last && <div className={`lcs-bar ${i < done ? "on" : ""}`} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function MyClaims({ email, name }) {
  const [claims, setClaims] = useState(null);
  useEffect(() => {
    if (!email) return;
    fetch(`${USER_CLAIMS_URL}?email=${encodeURIComponent(email)}`)
      .then((r) => r.json()).then((d) => setClaims(Array.isArray(d) ? d : [])).catch(() => setClaims([]));
  }, [email]);
  return (
    <>
      <Reveal className="shead">
        <div className="eyebrow">My account</div>
        <h2>Welcome{name ? `, ${name.split(" ")[0]}` : ""} — your claims</h2>
        <p className="sublead">Track exactly where each of your claims is in its lifecycle. Signed in as <b>{email}</b>.</p>
      </Reveal>
      {claims === null && <p className="dim2">Loading your claims…</p>}
      {claims && claims.length === 0 && (
        <Reveal className="fcard"><div className="fic"><Icon name="inbox" size={24} /></div><h3>No claims yet</h3><p>You haven't filed a claim under this email. Head to the Live Demo to talk to Ava and file one.</p><a href="#/demo" className="btn grad" style={{ marginTop: 14 }}>Talk to Ava →</a></Reveal>
      )}
      {claims && claims.map((c, i) => (
        <Reveal key={c.claim_ref} delay={(i % 3) + 1} className="claimcard">
          <div className="claimcard-head">
            <div><code className="ref-l">{c.claim_ref}</code> <span className="dim2 small">· {c.received}</span>
              <div className="claimcard-title">{c.claim_type || c.incident_type} claim · £{Number(c.estimated_value || 0).toLocaleString()}</div>
            </div>
            <span className={`tbadge ${routeClass(c.routing)}`}>{(c.routing || "").replace("-", " ")}</span>
          </div>
          <ClaimLifecycle status={c.status} />
          <div className="claimcard-foot">
            <span className={`spill s-${c.status}`}>{c.status}</span>
            <span className="dim2 small">{c.next_step}</span>
          </div>
        </Reveal>
      ))}
    </>
  );
}

function ClerkAccount() {
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress;
  return (
    <section className="section">
      <div className="wrap">
        <SignedOut>
          <div style={{ maxWidth: 440, margin: "0 auto" }}>
            <Reveal className="shead" ><div className="eyebrow" style={{ textAlign: "center" }}>Customer portal</div><h2 style={{ textAlign: "center" }}>Sign in to track your claims</h2></Reveal>
            <div style={{ display: "flex", justifyContent: "center" }}><SignIn routing="hash" /></div>
          </div>
        </SignedOut>
        <SignedIn>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}><UserButton afterSignOutUrl="/#/account" /></div>
          <MyClaims email={email} name={user?.fullName} />
        </SignedIn>
      </div>
    </section>
  );
}

function FallbackAccount() {
  const [email, setEmail] = useState("");
  const [active, setActive] = useState("");
  return (
    <section className="section">
      <div className="wrap">
        <Reveal className="shead">
          <div className="eyebrow">Customer portal</div>
          <h2>Track your claims</h2>
          <p className="sublead">Sign-in is powered by <b>Clerk</b> in production. Add a <code>VITE_CLERK_PUBLISHABLE_KEY</code> to enable full Clerk auth. For now, enter your email to view your claim lifecycle.</p>
        </Reveal>
        {!active ? (
          <Reveal className="logincard" >
            <form onSubmit={(e) => { e.preventDefault(); setActive(email); }}>
              <div className="lfield"><label>Your email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="demo@example.com" required /></div>
              <button className="btn grad" style={{ width: "100%", justifyContent: "center" }} type="submit">View my claims</button>
            </form>
            <div className="logindemo">Try <b>demo@example.com</b> — it has several claims with different lifecycle stages.</div>
          </Reveal>
        ) : <MyClaims email={active} name="" />}
      </div>
    </section>
  );
}

export function Account() { return CLERK_KEY ? <ClerkAccount /> : <FallbackAccount />; }

/* ============================ LIVE DATABASE ============================ */
/**
 * DatabasePage — embeds the live PostgreSQL system of record (via CloudBeaver,
 * served from NAVADA Edge through the Cloudflare tunnel) directly inside the app.
 * Demonstrates that the data is real and inspectable. Opens full-screen too.
 */
export function DatabasePage() {
  return (
    <section className="section">
      <div className="wrap">
        <Reveal className="shead">
          <div className="eyebrow">Live infrastructure</div>
          <h2>The live database.</h2>
          <p className="sublead">The real PostgreSQL system of record behind Ava — browsed live in CloudBeaver, served from NAVADA Edge over the Cloudflare tunnel. Open the <code>jeen</code> schema → <code>claims</code> to see every claim, plus the teams, audit trail, conversations and attachments.</p>
        </Reveal>
        <Reveal className="dbframe-bar">
          <span className="dim2 small">CloudBeaver · {DB_UI_URL.replace("https://", "")} · read/write web IDE</span>
          <a href={DB_UI_URL} target="_blank" rel="noreferrer" className="btn grad sm" onClick={() => window.dispatchEvent(new Event("ava-launch"))}>Open full screen ↗</a>
        </Reveal>
        <Reveal className="dbframe">
          <iframe src={DB_UI_URL} title="Live database (CloudBeaver)" loading="lazy" />
        </Reveal>
        <p className="dim2 small" style={{ marginTop: 12 }}>If the panel below is blank, your browser may block third-party frames — use <b>Open full screen</b>. Connections: <b>Albion Mutual — Claims</b> (navada_pipeline) and <b>Albion Mutual — RAG</b> (jeenrag).</p>
      </div>
    </section>
  );
}

/* ============================ TEAM CONSOLE ============================ */
/**
 * TeamConsole — the per-team workspace that lets human teams "plug into" the
 * agent's workflow without ever touching the n8n editor.
 *
 * WHAT: a team member (Claims Adjuster / Legal / Finance) signs in, sees ONLY
 *       the claims Ava routed to their queue, and takes the action that belongs
 *       to their team (approve, decline, clear fraud, uphold appeal, release
 *       payment, request info).
 * HOW:  POST /team-login authenticates against jeen.team_users and returns a
 *       token + the team name. GET /team-claims?team= lists that team's queue.
 *       POST /team-action updates the claim, writes an audit event, hands the
 *       claim to the next team, and triggers Ava to email the claimant.
 * WHY:  this is how a connected, multi-team claims workflow actually works — the
 *       claim moves between teams, each team acts in turn, and the customer is
 *       kept informed automatically. Approving here makes the claim leave this
 *       queue and appear in the next team's queue (e.g. Adjuster → Finance).
 */
export function TeamConsole() {
  const [token, setToken] = useState(() => sessionStorage.getItem("jeen_team_token") || "");
  const [team, setTeam] = useState(() => sessionStorage.getItem("jeen_team_team") || "");
  const [user, setUser] = useState(() => sessionStorage.getItem("jeen_team_user") || "");
  const [role, setRole] = useState(() => sessionStorage.getItem("jeen_team_role") || "");
  const [creds, setCreds] = useState({ username: "adjuster", password: "" });
  const [loginErr, setLoginErr] = useState("");
  const [claims, setClaims] = useState(null);
  const [busy, setBusy] = useState(false);
  const [acting, setActing] = useState("");

  // Role-based access: Finance (Lee) is the admin and sees every team's queue
  // with full actions; Adjuster and Legal each see only the work routed to them.
  const isAdmin = role === "admin";
  const ADMIN_ACTIONS = [
    { action: "approve", label: "Approve", tone: "good" },
    { action: "pay", label: "Pay", tone: "good" },
    { action: "clear-fraud", label: "Clear fraud", tone: "good" },
    { action: "appeal-uphold", label: "Uphold appeal", tone: "good" },
    { action: "request-info", label: "Request info", tone: "warn" },
    { action: "escalate", label: "Escalate", tone: "warn" },
    { action: "decline", label: "Decline", tone: "bad" },
  ];
  const cfg = isAdmin
    ? { actions: ADMIN_ACTIONS, desc: "Full access — every team's queue across the connected workflow. As admin you can take any action on any claim." }
    : (TEAMS.find((t) => t.team === team) || { actions: [], desc: "" });

  async function login(e) {
    e.preventDefault(); setLoginErr(""); setBusy(true);
    try {
      const r = await fetch(TEAM_LOGIN_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(creds) });
      const d = await r.json();
      if (!d.ok) throw new Error(d.error || "Login failed");
      sessionStorage.setItem("jeen_team_token", d.token);
      sessionStorage.setItem("jeen_team_team", d.team);
      sessionStorage.setItem("jeen_team_user", d.user);
      sessionStorage.setItem("jeen_team_role", d.role || "");
      setToken(d.token); setTeam(d.team); setUser(d.user); setRole(d.role || "");
    } catch (e2) { setLoginErr(String(e2.message || e2)); } finally { setBusy(false); }
  }
  function logout() {
    ["jeen_team_token", "jeen_team_team", "jeen_team_user", "jeen_team_role"].forEach((k) => sessionStorage.removeItem(k));
    setToken(""); setTeam(""); setUser(""); setRole(""); setClaims(null);
  }

  async function load() {
    if (!token) return; setBusy(true);
    try {
      // Admin sees every queue (fetch all teams and merge); a handler sees only their own.
      const teams = isAdmin ? TEAMS.map((t) => t.team) : [team];
      const results = await Promise.all(teams.map((tm) =>
        fetch(`${TEAM_CLAIMS_URL}?token=${encodeURIComponent(token)}&team=${encodeURIComponent(tm)}`).then((r) => r.json()).catch(() => [])
      ));
      const seen = new Set();
      const merged = results.flat().filter((c) => c && c.claim_ref && !seen.has(c.claim_ref) && seen.add(c.claim_ref));
      merged.sort((a, b) => (a.claim_ref < b.claim_ref ? 1 : -1));
      setClaims(merged);
    } catch { setClaims([]); } finally { setBusy(false); }
  }
  useEffect(() => { if (token) load(); /* eslint-disable-next-line */ }, [token]);

  async function act(claim_ref, action, label, claimTeam) {
    setActing(claim_ref + action);
    try {
      await fetch(TEAM_ACTION_URL, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, claim_ref, action, team: claimTeam || team, actor: user, note: `${label} via Team Console` }),
      });
      await load();
    } finally { setActing(""); }
  }

  /* ---- login screen: pick a team, then sign in ---- */
  if (!token) {
    return (
      <section className="section">
        <div className="wrap" style={{ maxWidth: 720 }}>
          <Reveal>
            <div className="eyebrow">Connected workflow · human teams</div>
            <h2>Team Console</h2>
            <p className="sublead">Ava routes every claim to the right team. Each team signs in here to action the work assigned to their queue — the claim then moves on to the next team automatically, and Ava keeps the claimant informed by email.</p>
          </Reveal>
          <Reveal delay={2} className="teamgrid">
            {TEAMS.map((t) => (
              <button key={t.team} className={`teamcard ${creds.username === t.login ? "sel" : ""}`} onClick={() => setCreds({ ...creds, username: t.login })}>
                <div className="teamcard-h"><b>{t.team}</b><span className="tc-mail">{t.email}</span></div>
                <p>{t.desc}</p>
                <div className="tc-acts">{t.actions.map((a) => <span key={a.action} className={`tc-act tone-${a.tone}`}>{a.label}</span>)}</div>
              </button>
            ))}
          </Reveal>
          <Reveal delay={3} className="logincard" style={{ maxWidth: 460, margin: "26px auto 0" }}>
            <div className="loginhead"><JeenLogo size={32} /><div><h2 style={{ fontSize: 22 }}>Sign in</h2><p className="dim2">Albion Mutual · team workspace</p></div></div>
            <form onSubmit={login}>
              <div className="lfield"><label>Team login</label><input value={creds.username} onChange={(e) => setCreds({ ...creds, username: e.target.value })} /></div>
              <div className="lfield"><label>Password</label><input type="password" value={creds.password} onChange={(e) => setCreds({ ...creds, password: e.target.value })} placeholder="••••••••" /></div>
              {loginErr && <div className="loginerr">{loginErr}</div>}
              <button className="btn grad" style={{ width: "100%", justifyContent: "center", marginTop: 6 }} disabled={busy} type="submit">{busy ? "Signing in…" : "Sign in"}</button>
            </form>
            <div className="logindemo">Demo logins — <b>adjuster</b> · <b>legal</b> · <b>finance</b> (admin · full access), password <b>TeamAlbion2026!</b> · authenticated against the live <code>jeen.team_users</code> table. Each role only sees the work routed to it; admin sees every queue.</div>
          </Reveal>
        </div>
      </section>
    );
  }

  /* ---- team queue ---- */
  return (
    <section className="section">
      <div className="wrap">
        <div className="adminhead">
          <div>
            <div className="eyebrow">Team Console · {isAdmin ? "Admin · all queues" : team}</div>
            <h2>{isAdmin ? "All claims" : `${team} queue`}{isAdmin && <span className="adminbadge">ADMIN</span>}</h2>
            <p className="sublead">{cfg.desc}</p>
          </div>
          <div className="adminuser">
            Signed in as <b>{user}</b>
            <a className="btn ghost sm" href={`${N8N_BASE}/workflow/JeenClaimsChat1/executions`} target="_blank" rel="noreferrer" style={{ marginLeft: 12 }}>View in n8n ↗</a>
            <button className="btn ghost sm" onClick={load} disabled={busy} style={{ marginLeft: 8 }}>↻ Refresh</button>
            <button className="btn ghost sm" onClick={logout} style={{ marginLeft: 8 }}>Sign out</button>
          </div>
        </div>

        <div className="tablewrap">
          <table className="dtable">
            <thead><tr><th>Claim ref</th><th>Claimant</th><th>Type</th><th>Value</th><th>Fraud</th>{isAdmin && <th>Team</th>}<th>Decision</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {claims === null && <tr><td colSpan={isAdmin ? 9 : 8} className="tcenter dim2">Loading…</td></tr>}
              {claims && claims.length === 0 && <tr><td colSpan={isAdmin ? 9 : 8} className="tcenter dim2">{isAdmin ? "No claims in any queue yet — run the agent on the Live Demo page." : `Nothing in this queue right now. When Ava routes a claim to ${team}, it appears here.`}</td></tr>}
              {claims && claims.map((c) => (
                <tr key={c.claim_ref}>
                  <td><code>{c.claim_ref}</code><div className="tsub">{c.received}</div></td>
                  <td>{c.claimant_name}<div className="tsub">{c.claimant_email}</div></td>
                  <td>{c.claim_type}<div className="tsub">{c.incident_type} · {c.severity}</div></td>
                  <td>£{Number(c.estimated_value || 0).toLocaleString()}{c.payment_ref && <div className="tsub">{c.payment_ref}</div>}</td>
                  <td><span className="frpill" style={{ color: meterColor(c.fraud_risk) }}>{c.fraud_risk}</span></td>
                  {isAdmin && <td><span className="tbadge route-adjuster">{c.team}</span></td>}
                  <td><span className={`tbadge ${c.decision === "accept" ? "route-auto" : c.decision === "decline" ? "route-fraud" : "route-adjuster"}`}>{c.decision || "—"}</span></td>
                  <td><span className={`spill s-${c.status}`}>{c.status}</span></td>
                  <td>
                    <div className="actbtns">
                      {cfg.actions.map((a) => (
                        <button key={a.action} className={`ab tone-${a.tone}`} disabled={!!acting} onClick={() => act(c.claim_ref, a.action, a.label, c.team)}>
                          {acting === c.claim_ref + a.action ? "…" : a.label}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="dim2 small" style={{ marginTop: 14 }}>
          Each action writes the new status to PostgreSQL, appends to the <code>jeen.claim_events</code> audit trail, hands the claim to the next team, and triggers Ava to email the claimant. Approve a claim here and watch it leave this queue and appear in <b>Finance</b> — the claim navigating the connected workflow end to end.
        </p>
      </div>
    </section>
  );
}

/* ============================ OBSERVABILITY ============================ */
/**
 * ObservabilityPage — surfaces the real monitoring stack: n8n exposes Prometheus
 * metrics at /metrics, Prometheus scrapes them, and Grafana visualises them.
 * The page explains what's monitored and opens the live Grafana dashboard.
 */
export function ObservabilityPage() {
  const monitors = [
    ["activity", "Workflow execution duration", "p95 latency of every Ava run, from the n8n workflow histogram"],
    ["chip", "CPU & memory", "n8n process CPU, resident memory and Node heap over time"],
    ["clock", "Event-loop lag", "p50/p90/p99 event-loop delay — early warning of saturation"],
    ["globe", "HTTP throughput", "requests/sec by status code across the agent's endpoints"],
    ["database", "Cache hit rate", "RAG / response cache effectiveness (hits vs misses)"],
    ["shield", "Liveness", "open file descriptors, uptime and instance health"],
  ];
  return (
    <section className="section">
      <div className="wrap">
        <Reveal className="shead">
          <div className="eyebrow">Observability · live</div>
          <h2>Monitoring the agent in production.</h2>
          <p className="sublead">Ava's engine emits <b>Prometheus metrics</b> from n8n; <b>Prometheus</b> scrapes them every 30s and <b>Grafana</b> visualises them. This is the same stack you'd run in production to watch latency, errors and load.</p>
        </Reveal>
        <Reveal className="pipeline-band">
          <span className="pipe-node">n8n <code>/metrics</code></span><span className="pipe-arrow">→</span>
          <span className="pipe-node">Prometheus <span className="dim2">(scrape 30s)</span></span><span className="pipe-arrow">→</span>
          <span className="pipe-node">Grafana <span className="dim2">(dashboards)</span></span>
        </Reveal>
        <div className="fgrid">
          {monitors.map(([ic, t, d], i) => (
            <Reveal key={t} delay={(i % 3) + 1} className="fcard"><div className="fic"><Icon name={ic} size={24} /></div><h3>{t}</h3><p>{d}</p></Reveal>
          ))}
        </div>
        <Reveal className="dbframe-bar" style={{ marginTop: 24 }}>
          <span className="dim2 small">Grafana · grafana.navada-edge-server.uk/d/ava-n8n-obs</span>
          <a href={GRAFANA_URL} target="_blank" rel="noreferrer" className="btn grad sm" onClick={() => window.dispatchEvent(new Event("ava-launch"))}>Open the live dashboard ↗</a>
        </Reveal>
        <Reveal className="dbframe">
          <iframe src={`${GRAFANA_URL}?kiosk&theme=light&refresh=30s`} title="Ava / n8n observability (Grafana)" loading="lazy" />
        </Reveal>
        <p className="dim2 small" style={{ marginTop: 10 }}>If the panel is blank it's the access gate — use <b>Open the live dashboard</b>. Metrics: <code>n8n_workflow_execution_duration_seconds</code>, <code>n8n_process_*</code>, <code>n8n_nodejs_eventloop_lag_*</code>, <code>n8n_http_request_duration_seconds</code>, <code>n8n_cache_*</code>.</p>
      </div>
    </section>
  );
}

/* ============================ PRESENTATION ============================ */
const SLIDES = [
  {
    render: () => (<>
      <div className="eyebrow">Jeen · Solution Engineer</div>
      <h2><span className="serif">{PRODUCT.name}</span> — Jeen.ai's AI agent for insurance</h2>
      <p className="big-lead">{PRODUCT.positioning}</p>
      <ul><li>Conversational intake → triage → accept / refer / decline → payment</li><li>Live on self-hosted n8n + OpenAI + PostgreSQL, deployed via Cloudflare</li><li>Deployed at {PRODUCT.customer}, a UK insurer — reviewer-testable right now</li></ul>
    </>),
  },
  {
    render: () => (<>
      <div className="eyebrow">Slide 1 · Customer &amp; Problem</div>
      <h2>Claims triage is manual, slow and risky</h2>
      <div className="scols">
        <div><h4>Who</h4><ul><li>UK general insurer, ~400k policies</li><li>FCA-regulated; adjuster, legal &amp; finance teams</li></ul></div>
        <div><h4>Why now</h4><ul><li>Claims volume up, headcount flat</li><li>Fraud &amp; Consumer-Duty scrutiny rising</li><li>Hand-offs between teams stall &amp; breach SLA</li></ul></div>
      </div>
    </>),
  },
  {
    render: () => (<>
      <div className="eyebrow">Slide 2 · Why this use case</div>
      <h2>Highest-leverage place to put an agent</h2>
      <div className="scols">
        <div><h4>Pain</h4><ul><li>Manual classification &amp; routing</li><li>No fraud scoring at intake</li><li>Vulnerability missed</li><li>Lost, stalled hand-offs</li></ul></div>
        <div><h4>Value</h4><ul><li>Instant, consistent triage &amp; decision</li><li>Humans focus on judgement calls</li><li>Connected teams, full audit trail</li><li>Consumer-Duty ready</li></ul></div>
      </div>
    </>),
  },
  {
    render: () => (<>
      <div className="eyebrow">Slide 3 · Agent Workflow Overview</div>
      <h2>Intake → triage → decision → teams → settle</h2>
      <p className="big-lead">Conversational intake → <b>LLM triage</b> → Postgres system of record → <b>deterministic decision</b> → <b>human team approval</b> → email + payment. One governed pipeline, end to end.</p>
      <div className="scols">
        <div><h4>Where the LLM is used</h4><ul>
          <li>One step — claim triage → strict JSON: type, severity, fraud 0–100, vulnerability, summary</li>
          <li>A real agent: Postgres memory + 3 assistive tools (Calculator, Wikipedia, Albion KB via <b>RAG / pgvector</b>)</li>
          <li>Guardrails: claims-only, never invents facts — and never settles, pays or declines</li>
        </ul></div>
        <div><h4>Systems / data &amp; human approval</h4><ul>
          <li>n8n · OpenAI GPT-4o-mini · PostgreSQL 17 · Zoho SMTP · Cloudflare + Tailscale</li>
          <li>Human approves every sensitive claim — ≥ £5k, fraud ≥ 60, vulnerable, declines</li>
          <li>Finance releases every payment — in the role-based Team Console, full audit trail</li>
        </ul></div>
      </div>
    </>),
  },
  {
    render: () => (<>
      <div className="eyebrow">Slide 4 · Decision engine</div>
      <h2>Every claim: accept · refer · decline</h2>
      <ul>
        <li><b>Deterministic rule</b> (not the LLM): policy excess, value, fraud, vulnerability, severity</li>
        <li><b>Accept</b> → Finance releases payment (simulated, with a payment reference)</li>
        <li><b>Refer</b> → Claims Adjuster (≥ £5k / high / vulnerable) or Legal (suspected fraud)</li>
        <li><b>Decline</b> → below the policy excess → Legal; claimant can appeal within 14 days</li>
        <li>Standardised refs: <code>ALB-MOT-2026-00xxxx</code> · payments <code>PAY-2026-00xxxx</code></li>
      </ul>
    </>),
  },
  {
    render: () => (<>
      <div className="eyebrow">Slide 5 · Connected multi-team workflow</div>
      <h2>Teams collaborate inside the agent</h2>
      <div className="scols">
        <div><h4>Role-based teams</h4><ul><li>Claims Adjuster — referrals</li><li>Legal — fraud, declines &amp; appeals</li><li>Finance — payments (admin: all queues)</li></ul></div>
        <div><h4>How they connect</h4><ul><li>Ava emails the claimant at every stage</li><li>Ava alerts the assigned team by email</li><li>Each action moves the claim to the next team</li><li>Every step in a Postgres audit trail</li></ul></div>
      </div>
    </>),
  },
  {
    render: () => (<>
      <div className="eyebrow">Slide 6 · Governance &amp; fit</div>
      <h2>Production-grade, by construction</h2>
      <ul>
        <li>LLM is scoped to one decision — it cannot settle, pay or reject alone</li>
        <li>Explicit, inspectable rules; human-in-the-loop on every sensitive claim</li>
        <li>Full audit trail; UK GDPR / DPA / SAR ready; FCA Consumer Duty</li>
        <li>Self-hosted n8n via Cloudflare + Tailscale; a drop-in vertical agent for Jeen</li>
      </ul>
    </>),
  },
  {
    render: () => (<>
      <div className="eyebrow">Artefacts · Deliverables</div>
      <h2>Everything the brief asks for — downloadable</h2>
      <div className="scols">
        <div><h4>Exported workflow (n8n)</h4><ul>
          <li><a className="slink" href="/artefacts/ava-claims-agent.n8n.json" download>Ava — AI Agent: chat · memory · RAG ↓</a></li>
          <li><a className="slink" href="/artefacts/claims-triage.n8n.json" download>Claims triage flow (FNOL) ↓</a></li>
          <li><a className="slink" href="/shots/workflow-canvas.png" target="_blank" rel="noreferrer">Full workflow — screenshot ↗</a></li>
          <li><a className="slink" href="/shots/workflow-execution.png" target="_blank" rel="noreferrer">Successful run — screenshot ↗</a></li>
        </ul></div>
        <div><h4>Dataset &amp; live</h4><ul>
          <li><a className="slink" href="/artefacts/sample-claims.json" download>Sample claims dataset — 5 scenarios ↓</a></li>
          <li><a className="slink" href="https://n8n.navada-edge-server.uk/workflow/JeenClaimsChat1" target="_blank" rel="noreferrer">Live agent in n8n ↗</a></li>
          <li><a className="slink" href="#/demo">Talk to Ava now →</a></li>
        </ul></div>
      </div>
    </>),
  },
];

export function Presentation() {
  const [i, setI] = useState(0);
  const next = () => setI((x) => Math.min(x + 1, SLIDES.length - 1));
  const prev = () => setI((x) => Math.max(x - 1, 0));
  useEffect(() => {
    const on = (e) => {
      if (["ArrowRight", " "].includes(e.key)) next();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "Escape") window.location.hash = "#/overview";
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, []);
  return (
    <div className="present">
      <button className="present-exit" onClick={() => (window.location.hash = "#/overview")}>✕</button>
      <div className="present-stage">
        <Mesh />
        <div className="slide-c" key={i}>{SLIDES[i].render()}</div>
      </div>
      <div className="present-bar">
        <div className="brand" style={{ color: "#fff" }}><JeenLogo size={26} /> {PRODUCT.name}</div>
        <div className="dots">{SLIDES.map((_, x) => <b key={x} className={x === i ? "on" : ""} onClick={() => setI(x)} />)}</div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="pbtn" onClick={prev} disabled={i === 0}>← Prev</button>
          <button className="pbtn" onClick={next} disabled={i === SLIDES.length - 1}>Next →</button>
        </div>
      </div>
    </div>
  );
}
