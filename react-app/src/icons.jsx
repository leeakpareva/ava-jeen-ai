/**
 * icons.jsx — VECTOR ICON SET
 * ----------------------------------------------------------------------------
 * A tiny in-house icon library so the product uses crisp, consistent line
 * icons instead of emojis (more professional, and they inherit colour).
 *
 * How it works:
 *   • `P` maps a name -> the inner SVG paths for that icon (24x24 grid).
 *   • <Icon name="database" /> renders those paths inside a stroked <svg>.
 *   • stroke="currentColor" means the icon takes the text colour of its
 *     parent — so a `.fic.red` tile makes its icon terracotta, etc.
 * Add a new icon by adding one entry to `P`.
 * ----------------------------------------------------------------------------
 */
import React from "react";

// name -> SVG path elements. All drawn on a 24x24 canvas, stroke not fill.
const P = {
  ai: <><rect x="6" y="6" width="12" height="12" rx="2.5" /><rect x="9.5" y="9.5" width="5" height="5" rx="1" /><path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3" /></>,
  dot: <circle cx="12" cy="12" r="3.4" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  logout: <><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" /><path d="M10 17l-5-5 5-5M5 12h12" /></>,
  database: <><ellipse cx="12" cy="5" rx="7" ry="3" /><path d="M5 5v14c0 1.7 3.1 3 7 3s7-1.3 7-3V5" /><path d="M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3" /></>,
  userCheck: <><circle cx="9" cy="8" r="4" /><path d="M2 21c0-3.9 3.1-7 7-7 1.4 0 2.7.4 3.8 1.1" /><path d="M16 17l2 2 4-4" /></>,
  shield: <><path d="M12 3l8 3v5c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6z" /><path d="M9 12l2 2 4-4" /></>,
  bolt: <path d="M13 2L4 14h7l-1 8 9-12h-7z" />,
  layers: <><path d="M12 2l9 5-9 5-9-5z" /><path d="M3 12l9 5 9-5" /><path d="M3 17l9 5 9-5" /></>,
  lock: <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
  cube: <><path d="M12 2l9 5v10l-9 5-9-5V7z" /><path d="M3 7l9 5 9-5M12 12v10" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18" /></>,
  document: <><path d="M6 2h8l4 4v16H6z" /><path d="M14 2v4h4M9 13h6M9 17h5" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  inbox: <><path d="M3 13h5l1.5 3h5L16 13h5" /><path d="M5 5h14l2 8v6H3v-6z" /></>,
  chat: <path d="M21 11.5a8 8 0 0 1-11.6 7.1L4 20l1.4-5.4A8 8 0 1 1 21 11.5z" />,
  alert: <><path d="M12 3l9.5 16.5H2.5z" /><path d="M12 9v5M12 17.5h.01" /></>,
  gear: <><circle cx="12" cy="12" r="3.2" /><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.2 5.2l2.1 2.1M16.7 16.7l2.1 2.1M18.8 5.2l-2.1 2.1M7.3 16.7l-2.1 2.1" /></>,
  play: <path d="M7 5l12 7-12 7z" />,
  check: <path d="M5 13l4 4 10-11" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  scale: <><path d="M12 3v18M6 21h12M8 6h8" /><path d="M8 6l-3.5 7a3 3 0 0 0 7 0zM16 6l3.5 7a3 3 0 0 1-7 0z" /></>,
  flag: <path d="M5 21V4h12l-2.5 4L17 12H5" />,
  rocket: <><path d="M12 3c3 1 5 4 5 8l-2.5 2.5h-5L7 11c0-4 2-7 5-8z" /><circle cx="12" cy="9" r="1.4" /><path d="M9.5 16C8 17 7.5 19 7.5 20.5 9 20.5 11 20 12 18.5" /></>,
};

// Ava's avatar — a friendly assistant face in the Jeen gradient. Used in the
// chat and hero so the product feels like talking to someone, not a text box.
export function AvaAvatar({ size = 48, online = false }) {
  return (
    <span style={{ position: "relative", display: "inline-flex", width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-label="Ava">
        <defs>
          <linearGradient id="ava-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#d6a6e5" /><stop offset="55%" stopColor="#c55a4e" /><stop offset="100%" stopColor="#e3a954" />
          </linearGradient>
        </defs>
        <circle cx="32" cy="33" r="29" fill="url(#ava-g)" />
        <circle cx="32" cy="9" r="2.6" fill="#fff" />
        <path d="M32 11.5V18" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
        <circle cx="32" cy="31" r="19" fill="#fff" opacity="0.97" />
        <circle cx="25.5" cy="29" r="2.9" fill="#2a1f33" />
        <circle cx="38.5" cy="29" r="2.9" fill="#2a1f33" />
        <path d="M25 37 Q32 43 39 37" stroke="#2a1f33" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      </svg>
      {online && <span style={{ position: "absolute", right: 0, bottom: 1, width: size * 0.26, height: size * 0.26, borderRadius: "50%", background: "#1c9d83", border: "2px solid #fff" }} />}
    </span>
  );
}

export function Icon({ name, size = 22, className = "", strokeWidth = 1.7 }) {
  return (
    <svg className={`ic ${className}`} width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {P[name] || P.dot}
    </svg>
  );
}
