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
  PROFILE, NAVADA, ASSIGNMENT, SECURITY, PRODUCT,
  CHAT_URL, ADMIN_LOGIN_URL, CLAIMS_ADMIN_URL, DECISION_URL,
  USER_LOGIN_URL, USER_CLAIMS_URL, CONVOS_ADMIN_URL, N8N_WORKFLOW_URL, LIFECYCLE_STAGES,
} from "./data.js";

const routeClass = (r) => (r === "auto-settle" || r === "auto-pay" ? "route-auto" : r === "SIU-fraud" ? "route-fraud" : "route-adjuster");
const meterColor = (v) => (v >= 60 ? "#c55a4e" : v >= 30 ? "#e3a954" : "#1c9d83");

// SLA: pending-human-review claims must be actioned within SLA_HOURS of receipt.
const SLA_HOURS = 24;
function slaInfo(c) {
  if (c.status !== "pending-human-review") return { label: "—", cls: "sla-na" };
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

  async function send(text) {
    const content = (text ?? input).trim();
    if (!content || busy) return;
    const next = [...messages, { role: "user", content }];
    setMessages(next); setInput(""); setBusy(true);
    try {
      const r = await fetch(CHAT_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ session_id: sid.current, messages: next.filter((m) => m !== GREETING || next.indexOf(m) > 0) }) });
      const d = await r.json();
      const reply = d.reply || "Sorry, I didn't catch that — could you rephrase?";
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
      if (d.ready && d.claim_ref) setDecision(d);
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", content: "I'm having trouble reaching the claims system right now. Please try again in a moment." }]);
    } finally { setBusy(false); }
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
                  <div className="bubble">{m.content}</div>
                </div>
              ))}
              {busy && <div className="msg assistant"><AvaAvatar size={30} /><div className="bubble typing"><span /><span /><span /></div></div>}
            </div>
            <form className="chatinput" onSubmit={(e) => { e.preventDefault(); send(); }}>
              <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Describe what happened, or answer Ava…" />
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
        <span className={d.routing === "auto-settle" ? "on" : ""}>{d.routing === "auto-settle" ? "Auto-settled ✓" : "Awaiting adjuster"}</span>
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
  { n: "7", t: "Decision & routing rule", layer: "n8n · IF", lc: "l-n8n", d: "Not ready → Ava just replies with her next question. Ready → a deterministic rule routes it: ≥ £5,000, complex, high fraud-risk or vulnerable → human adjuster; otherwise auto-settle.", code: "ready ? route(value, fraud, vulnerable) : ask()" },
  { n: "8", t: "Record + log", layer: "PostgreSQL", lc: "l-data", d: "The claim and Ava's assessment are written to jeen.claims; the full conversation is logged to jeen.conversations.", code: "INSERT INTO jeen.claims …" },
  { n: "9", t: "Respond", layer: "n8n → Network", lc: "l-net", d: "n8n returns the decision as JSON back through Cloudflare to your browser.", code: "{ ok:true, reply, claim_ref, routing, … }" },
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
          <b>Governed by design.</b> The model is scoped to one decision — it never settles or rejects a claim. A deterministic rule routes anything complex, ≥ £5,000, high-fraud-risk or vulnerable to a human adjuster; everything else auto-settles. Every claim and decision is written to PostgreSQL for a defensible audit trail.
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
            <p className="sublead">A real end-to-end execution on our self-hosted n8n — every node green, including the human-in-the-loop branch. Open it and watch it run.</p>
            <a href={N8N_WORKFLOW_URL} target="_blank" rel="noreferrer" className="btn grad"><Icon name="gear" size={16} /> Open the live workflow ↗</a>
          </div>
          <div className="frame">
            <div className="frame-bar"><i /><i /><i /><span className="fu">n8n.navada-edge-server.uk · Ava — Conversational Intake Agent</span></div>
            <img src="/shots/ava-workflow.png" alt="The Ava AI agent workflow in n8n" />
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
  ["userCheck", "Decide", "Auto-settle or human review"],
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

  const stat = (f) => (claims || []).filter(f).length;
  const stats = claims ? [
    { n: claims.length, l: "Total claims", c: "" },
    { n: stat((c) => c.status === "auto-settled"), l: "Auto-settled", c: "green" },
    { n: stat((c) => c.status === "pending-human-review"), l: "Pending review", c: "amber" },
    { n: stat((c) => c.vulnerable_flag), l: "Vulnerable flagged", c: "lilac" },
    { n: stat((c) => slaInfo(c).cls === "sla-over"), l: "SLA overdue", c: "red" },
  ] : [];

  return (
    <section className="section">
      <div className="wrap">
        <div className="adminhead">
          <div><div className="eyebrow">Admin console · live backend</div><h2>Claims operations</h2><p className="sublead">Every claim the agent has processed — straight from PostgreSQL. Approve or reject anything pending human review.</p></div>
          <div className="adminuser">Signed in as <b>{user}</b><button className="btn ghost sm" onClick={load} disabled={busy} style={{ marginLeft: 12 }}>↻ Refresh</button><button className="btn ghost sm" onClick={logout} style={{ marginLeft: 8 }}>Sign out</button></div>
        </div>

        <div className="adminstats">
          {stats.map((s) => <div className="astat" key={s.l}><div className={`an ${s.c}`}>{s.n}</div><div className="al">{s.l}</div></div>)}
        </div>

        <div className="tablewrap">
          <table className="dtable">
            <thead><tr><th>Claim ref</th><th>Claimant</th><th>Type</th><th>Value</th><th>Fraud</th><th>Vuln</th><th>Routing</th><th>Status</th><th>SLA</th><th>Action</th></tr></thead>
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
                  <td><span className={`tbadge ${routeClass(c.routing)}`}>{(c.routing || "").replace("-", " ")}</span></td>
                  <td><span className={`spill s-${c.status}`}>{c.status}</span></td>
                  <td>{(() => { const s = slaInfo(c); return <span className={`slapill ${s.cls}`}>{s.label}</span>; })()}</td>
                  <td>
                    {c.status === "pending-human-review" ? (
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
        <p className="dim2 small" style={{ marginTop: 14 }}>Human-in-the-loop: claims that are complex, ≥ £5,000, fraud ≥ 60 or vulnerable land here as <b>pending-human-review</b>. Approving/rejecting writes back to PostgreSQL via the <code>/claims-decision</code> endpoint.</p>

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
        {c.status === "pending-human-review" && (
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
  if (status === "auto-settled" || status === "approved" || status === "rejected") return 4;
  if (status === "pending-human-review") return 2; // submitted + triaged done, decision pending
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

/* ============================ PRESENTATION ============================ */
const SLIDES = [
  {
    render: () => (<>
      <div className="eyebrow">Jeen · Solution Engineer</div>
      <h2><span className="serif">{PRODUCT.name}</span> — governed AI claims triage</h2>
      <p className="big-lead">{PRODUCT.positioning}</p>
      <ul><li>Built live on self-hosted n8n + OpenAI + PostgreSQL</li><li>Customer example: {PRODUCT.customer}, a UK insurer</li><li>Reviewer-testable — try it during this demo</li></ul>
    </>),
  },
  {
    render: () => (<>
      <div className="eyebrow">Slide 1 · Customer &amp; Problem</div>
      <h2>Claims triage is manual, slow and risky</h2>
      <div className="scols">
        <div><h4>Who</h4><ul><li>UK general insurer, ~400k policies</li><li>FCA-regulated, adjuster team</li></ul></div>
        <div><h4>Why now</h4><ul><li>Claims volume up, headcount flat</li><li>Consumer Duty scrutiny rising</li></ul></div>
      </div>
    </>),
  },
  {
    render: () => (<>
      <div className="eyebrow">Slide 2 · Why this use case</div>
      <h2>Highest-leverage place to put an agent</h2>
      <div className="scols">
        <div><h4>Pain</h4><ul><li>Manual classification &amp; routing</li><li>No fraud scoring at intake</li><li>Vulnerability missed</li></ul></div>
        <div><h4>Value</h4><ul><li>Straight-through clean claims</li><li>Adjusters focus on judgement</li><li>Audited, Consumer-Duty ready</li></ul></div>
      </div>
    </>),
  },
  {
    render: () => (<>
      <div className="eyebrow">Slide 3 · Workflow overview</div>
      <h2>Data → model → human oversight</h2>
      <ul>
        <li><b>LLM decision:</b> classify, score fraud, flag vulnerability, route</li>
        <li><b>Action:</b> write to PostgreSQL + acknowledge claimant</li>
        <li><b>Human-in-the-loop:</b> adjuster approves every sensitive claim</li>
        <li><b>Hosting:</b> self-hosted n8n via Cloudflare — live</li>
      </ul>
    </>),
  },
  {
    render: () => (<>
      <div className="eyebrow">Slide 4 · Governance &amp; fit</div>
      <h2>Production-grade, by construction</h2>
      <ul>
        <li>LLM is sandboxed to a decision — it cannot act alone</li>
        <li>Explicit, inspectable routing rule for human review</li>
        <li>Full audit trail; UK GDPR / DPA / SAR ready</li>
        <li>A drop-in vertical agent for the Jeen ecosystem</li>
      </ul>
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
