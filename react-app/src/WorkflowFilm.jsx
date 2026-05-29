/**
 * WorkflowFilm.jsx — ANIMATED WORKFLOW (Remotion composition)
 * ----------------------------------------------------------------------------
 * A Remotion "video" rendered live in the browser (via @remotion/player on the
 * How It Works page). It re-draws the real Ava n8n canvas and animates a claim
 * flowing through it, so reviewers can SEE the agent working.
 *
 * How Remotion works: the player advances a frame counter. `useCurrentFrame()`
 * gives the current frame; we compute every visual from that number, so the
 * animation is deterministic and loopable.
 *
 * Data structures below:
 *   • N        — every node's box position/label/colour (matches the n8n canvas)
 *   • EDGES    — the solid connections between nodes
 *   • SUBEDGES — the dashed Model/Parser sub-node links into the agent
 *   • SEG      — pulse "travel" segments with start/end frames (the moving dot)
 *   • LIT      — the frame at which each node lights up
 *   • WF_DURATION — total frames in one loop (215 @ 30fps ≈ 7s)
 * Timing tip: to speed up / slow down, scale the numbers in SEG + LIT.
 * ----------------------------------------------------------------------------
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { Icon } from "./icons.jsx";

// Ava workflow node layout (1120 x 480 stage), matching the live n8n canvas.
// Each node: x,y (top-left), w,h, label, sub (node type), icon, c (accent colour).
const N = {
  post:       { x: 26,  y: 208, w: 132, h: 56, label: "POST /claims-chat", sub: "Webhook", icon: "bolt", c: "#9a5fc0" },
  transcript: { x: 184, y: 208, w: 126, h: 56, label: "Build Transcript", sub: "Code", icon: "document", c: "#e3a954" },
  agent:      { x: 338, y: 196, w: 168, h: 80, label: "Ava — AI Intake Agent", sub: "AI Agent", icon: "ai", c: "#9a5fc0", big: true },
  model:      { x: 344, y: 344, w: 128, h: 44, label: "OpenAI Chat Model", sub: "Model", icon: "ai", c: "#8a8696" },
  schema:     { x: 488, y: 344, w: 124, h: 44, label: "Intake Schema", sub: "Parser", icon: "document", c: "#8a8696" },
  ready:      { x: 540, y: 208, w: 128, h: 56, label: "Ready to register?", sub: "IF", icon: "arrow", c: "#1c9d83" },
  buildclaim: { x: 700, y: 98,  w: 128, h: 54, label: "Build Claim Record", sub: "Set", icon: "document", c: "#9a5fc0" },
  insert:     { x: 858, y: 98,  w: 130, h: 54, label: "Insert → Postgres", sub: "Insert", icon: "database", c: "#3d6098" },
  respond:    { x: 1006, y: 98, w: 96,  h: 54, label: "Respond", sub: "Registered", icon: "check", c: "#1c9d83" },
  cont:       { x: 700, y: 210, w: 128, h: 50, label: "Respond · Continue", sub: "Response", icon: "arrow", c: "#9a5fc0" },
  buildlog:   { x: 700, y: 342, w: 120, h: 50, label: "Build Log", sub: "Code", icon: "document", c: "#e3a954" },
  logconv:    { x: 858, y: 342, w: 130, h: 50, label: "Log Conversation", sub: "Postgres", icon: "database", c: "#3d6098" },
};
const C = (k) => ({ x: N[k].x + N[k].w / 2, y: N[k].y + N[k].h / 2 });

const EDGES = [
  ["post", "transcript"], ["transcript", "agent"], ["agent", "ready"],
  ["ready", "buildclaim"], ["buildclaim", "insert"], ["insert", "respond"],
  ["ready", "cont"], ["agent", "buildlog"], ["buildlog", "logconv"],
];
const SUBEDGES = [["model", "agent"], ["schema", "agent"]];

// snappy timeline (~7s loop @30fps)
const SEG = [
  { a: "post", b: "transcript", s: 8, e: 26 },
  { a: "transcript", b: "agent", s: 26, e: 48 },
  { a: "agent", b: "ready", s: 96, e: 116 },
  { a: "ready", b: "buildclaim", s: 118, e: 138 },
  { a: "buildclaim", b: "insert", s: 138, e: 158 },
  { a: "insert", b: "respond", s: 158, e: 180 },
  { a: "agent", b: "buildlog", s: 96, e: 116 },
  { a: "buildlog", b: "logconv", s: 118, e: 138 },
];
const LIT = { post: 6, transcript: 26, agent: 48, ready: 116, buildclaim: 138, insert: 158, respond: 180, cont: 9999, buildlog: 116, logconv: 138, model: 48, schema: 48 };

export const WF_DURATION = 215;

function Node({ k, frame, fps }) {
  const n = N[k];
  const litFrame = LIT[k] ?? 9999;
  const isLit = frame >= litFrame;
  const pop = litFrame === 9999 ? 1 : spring({ frame: frame - litFrame, fps, config: { damping: 14, stiffness: 130 }, durationInFrames: 14 });
  const scale = 0.92 + 0.08 * Math.min(1, Math.max(0, pop));
  const thinking = k === "agent" && frame >= 48 && frame < 96;
  const glow = thinking ? 0.5 + 0.5 * Math.sin(frame / 5) : 0;
  return (
    <div style={{
      position: "absolute", left: n.x, top: n.y, width: n.w, height: n.h,
      background: "#fff", borderRadius: 13, border: `1.5px solid ${isLit ? n.c : "#e7e0ee"}`,
      boxShadow: thinking ? `0 0 ${14 + glow * 16}px rgba(154,95,192,${0.3 + glow * 0.35})` : isLit ? "0 8px 20px rgba(60,30,80,.13)" : "0 2px 6px rgba(40,20,55,.05)",
      transform: `scale(${scale})`, opacity: isLit ? 1 : 0.5,
      display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "flex-start",
      gap: 3, padding: "0 11px", overflow: "hidden",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, width: "100%" }}>
        <span style={{ color: n.c, display: "flex", flex: "0 0 auto" }}><Icon name={n.icon} size={n.big ? 15 : 13} /></span>
        <span style={{ fontWeight: 700, fontSize: n.big ? 12 : 10.5, lineHeight: 1.15, color: "#1a1722", overflow: "hidden", textOverflow: "ellipsis" }}>{n.label}</span>
      </div>
      <span style={{ fontSize: 8.5, color: "#938c9e", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", paddingLeft: 19 }}>
        {thinking ? "analysing…" : n.sub}
      </span>
    </div>
  );
}

export function WorkflowFilm() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: "linear-gradient(135deg,#fbf8fd,#f4eef8)", fontFamily: "Inter, sans-serif" }}>
      <svg width="1120" height="480" style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="lit" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#9a5fc0" /><stop offset="100%" stopColor="#e3a954" /></linearGradient>
        </defs>
        {SUBEDGES.map(([a, b], i) => {
          const p = C(a), q = C(b);
          return <path key={"s" + i} d={`M${p.x},${N[a].y} C${p.x},${p.y - 50} ${q.x},${q.y + 70} ${q.x},${N[b].y + N[b].h}`} stroke="#cfc6dc" strokeWidth="1.5" strokeDasharray="4 4" fill="none" />;
        })}
        {EDGES.map(([a, b], i) => {
          const p = C(a), q = C(b);
          const seg = SEG.find((s) => s.a === a && s.b === b);
          const passed = seg && frame >= seg.e;
          return <path key={i} d={`M${p.x},${p.y} C${(p.x + q.x) / 2},${p.y} ${(p.x + q.x) / 2},${q.y} ${q.x},${q.y}`} stroke={passed ? "url(#lit)" : "#d4cce0"} strokeWidth={passed ? 2.4 : 1.6} fill="none" />;
        })}
        {SEG.filter((s) => frame >= s.s && frame <= s.e).map((s, i) => {
          const p = C(s.a), q = C(s.b);
          const t = interpolate(frame, [s.s, s.e], [0, 1]);
          const mx = (p.x + q.x) / 2;
          const x = (1 - t) * (1 - t) * p.x + 2 * (1 - t) * t * mx + t * t * q.x;
          const y = (1 - t) * (1 - t) * p.y + 2 * (1 - t) * t * (t < 0.5 ? p.y : q.y) + t * t * q.y;
          return <g key={"p" + i}><circle cx={x} cy={y} r="8" fill="#e3a954" opacity="0.25" /><circle cx={x} cy={y} r="4" fill="#9a5fc0" /></g>;
        })}
      </svg>

      {Object.keys(N).map((k) => <Node key={k} k={k} frame={frame} fps={fps} />)}

      <div style={{ position: "absolute", left: 24, bottom: 14, fontSize: 12, color: "#574f60", fontWeight: 600 }}>
        {frame < 48 ? "① Claim received — building transcript" : frame < 96 ? "② Ava (LLM agent) classifies, scores fraud & decides routing" : frame < 140 ? "③ Recording to PostgreSQL + logging the conversation" : "④ Decision returned · sensitive claims await human approval"}
      </div>
    </AbsoluteFill>
  );
}
