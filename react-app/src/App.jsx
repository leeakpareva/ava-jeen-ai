/**
 * App.jsx — SHELL: routing, navigation, side panel, footer
 * ----------------------------------------------------------------------------
 * This file is the application frame. It owns:
 *   • JeenLogo()      — the brand mark as inline SVG (the three Jeen tiles).
 *   • useHashRoute()  — a tiny router: reads the URL hash (#/demo etc.) and
 *                       re-renders when it changes. No react-router needed.
 *   • Reveal()        — wraps children and fades/slides them in on scroll
 *                       (IntersectionObserver) for the motion you see.
 *   • Mesh()          — the animated gradient blobs behind the hero.
 *   • Nav + SidePanel — a minimal top bar (logo · Try it live · hamburger);
 *                       the hamburger opens a collapsible off-canvas menu so
 *                       the header never gets crowded. Clerk sign-out lives
 *                       at the bottom of the panel.
 *   • Footer          — NAVADA Edge + builder details.
 *   • App()           — picks which page component to render for the route.
 * The actual page content lives in pages.jsx.
 * ----------------------------------------------------------------------------
 */
import React, { useState, useEffect, useRef } from "react";
import { PRODUCT, PROFILE, NAVADA, N8N_WORKFLOW_URL } from "./data.js";
import { Icon } from "./icons.jsx";
import { useClerk, useUser, SignedIn, SignedOut } from "@clerk/clerk-react";
import { Overview, Demo, HowItWorks, DataSecurity, Assignment, Admin, Account, Presentation } from "./pages.jsx";

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

/* ---------- Jeen logo (the real mark) ---------- */
export function JeenLogo({ size = 30 }) {
  return (
    <svg className="jlogo" width={size} height={size} viewBox="0 0 100 100" fill="none" aria-label="Jeen">
      <rect x="8" y="22" width="38" height="60" rx="8" fill="#d6a6e5" />
      <rect x="56" y="6" width="38" height="44" rx="9" fill="#c55a4e" />
      <rect x="56" y="60" width="32" height="30" rx="8" fill="#e3a954" />
    </svg>
  );
}

/* ---------- hooks ---------- */
// Minimal client-side router. The "page" is just the URL hash:
//   #/demo -> "demo", #/admin -> "admin", empty -> "overview".
// We listen for the browser's `hashchange` event and re-render on change.
export function useHashRoute() {
  const get = () => (window.location.hash.replace("#/", "") || "overview");
  const [route, setRoute] = useState(get);
  useEffect(() => {
    const on = () => { setRoute(get()); window.scrollTo({ top: 0 }); }; // scroll to top on nav
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return route;
}

// Scroll-reveal wrapper: starts hidden (.reveal) and adds .in once the element
// scrolls into view (IntersectionObserver), which CSS animates into place.
// `delay` (1..5) staggers groups of cards; `as` lets you pick the tag.
export function Reveal({ children, delay = 0, className = "", as: Tag = "div" }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add("in"); io.unobserve(el); } }, // reveal once, then stop watching
      { threshold: 0.12 }
    );
    if (el) io.observe(el);
    return () => io.disconnect();
  }, []);
  return <Tag ref={ref} className={`reveal ${delay ? "d" + delay : ""} ${className}`}>{children}</Tag>;
}

export function Mesh() {
  return <div className="mesh" aria-hidden><span className="blob b1" /><span className="blob b2" /><span className="blob b3" /></div>;
}

const NAV = [
  ["overview", "Overview", "Product overview"],
  ["demo", "Ava", "Talk to the agent"],
  ["how", "How It Works", "The workflow, explained"],
  ["security", "Data & Security", "Governance, GDPR, DPA"],
  ["account", "My Claims", "Customer portal"],
  ["admin", "Admin", "Operations console"],
  ["assignment", "Assignment", "The Jeen brief"],
  ["present", "Present", "Interactive deck"],
];

function PanelUser({ onClose }) {
  const { signOut } = useClerk();
  const { user } = useUser();
  return (
    <div className="sp-user">
      <SignedIn>
        <div className="sp-userinfo">
          <div className="sp-avatar">{(user?.firstName || user?.primaryEmailAddress?.emailAddress || "U")[0].toUpperCase()}</div>
          <div className="sp-umeta"><b>{user?.fullName || "My account"}</b><span className="dim2 small">{user?.primaryEmailAddress?.emailAddress}</span></div>
        </div>
        <button className="btn ghost sm sp-signout" onClick={() => { onClose(); signOut(); }}><Icon name="logout" size={16} /> Sign out</button>
      </SignedIn>
      <SignedOut>
        <a href="#/account" className="btn grad sm" style={{ width: "100%", justifyContent: "center" }} onClick={onClose}>Sign in to your portal</a>
      </SignedOut>
    </div>
  );
}

function SidePanel({ open, route, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <>
      <div className={`panel-overlay ${open ? "show" : ""}`} onClick={onClose} />
      <aside className={`sidepanel ${open ? "open" : ""}`}>
        <div className="sp-head">
          <span className="brand"><JeenLogo size={26} /><span className="pname">{PRODUCT.name}<small>{PRODUCT.sub}</small></span></span>
          <button className="drawer-x" onClick={onClose} aria-label="Close menu">✕</button>
        </div>
        <nav className="sp-nav">
          {NAV.map(([k, l, d], i) => (
            <React.Fragment key={k}>
              <a href={`#/${k}`} className={`sp-link ${route === k ? "active" : ""}`} onClick={onClose}>
                <span className="sp-l">{l}</span><span className="sp-d">{d}</span>
              </a>
              {i === 0 && (
                <a href={N8N_WORKFLOW_URL} target="_blank" rel="noreferrer" className="sp-link sp-ext" onClick={onClose}>
                  <span className="sp-l"><Icon name="gear" size={15} /> Live n8n workflow</span><span className="sp-d">Open the agent in n8n ↗</span>
                </a>
              )}
            </React.Fragment>
          ))}
        </nav>
        {CLERK_KEY && <PanelUser onClose={onClose} />}
      </aside>
    </>
  );
}

function Nav({ route }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <nav>
        <div className="wrap navrow">
          <a href="#/overview" className="brand">
            <JeenLogo size={30} />
            <span className="pname">{PRODUCT.name}<small>{PRODUCT.sub}</small></span>
          </a>
          <div className="navright-min">
            <a href="#/demo" className="btn grad sm">Try it live</a>
            <button className="hamb" onClick={() => setOpen(true)} aria-label="Open menu"><Icon name="menu" size={22} /></button>
          </div>
        </div>
      </nav>
      <SidePanel open={open} route={route} onClose={() => setOpen(false)} />
    </>
  );
}

function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="footgrid">
          <div>
            <div className="footbrand"><JeenLogo size={28} /> {PRODUCT.name}</div>
            <p className="foottag">{PRODUCT.tagline} A proof of concept built for the {PRODUCT.parent} ecosystem.</p>
          </div>
          <div>
            <h5>Product</h5>
            <a href="#/overview">Overview</a><a href="#/demo">Live demo</a>
            <a href="#/how">How it works</a><a href="#/security">Data &amp; security</a>
          </div>
          <div>
            <h5>NAVADA Edge</h5>
            <p>{NAVADA.tagline}</p>
            <a href={`https://${NAVADA.site}`} target="_blank" rel="noreferrer">{NAVADA.site}</a>
            <a href="https://navada-lab.space" target="_blank" rel="noreferrer">navada-lab.space</a>
          </div>
          <div>
            <h5>Built by</h5>
            <p>{PROFILE.name}</p>
            <p style={{ color: "#9a90b3", fontSize: 12.5 }}>{PROFILE.role}</p>
            <a href={`mailto:${PROFILE.email}`}>{PROFILE.email}</a>
            <a href={`https://${PROFILE.github}`} target="_blank" rel="noreferrer">{PROFILE.github}</a>
          </div>
        </div>
        <div className="footbottom">
          <span>© 2026 {PROFILE.name} · {PRODUCT.name} PoC · built on NAVADA Edge</span>
          <span className="mks"><JeenLogo size={16} /> powered by the {PRODUCT.parent} platform — AI on your terms</span>
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  const route = useHashRoute();
  if (route === "present") return <Presentation />;
  const Page = { overview: Overview, demo: Demo, how: HowItWorks, security: DataSecurity, admin: Admin, account: Account, assignment: Assignment }[route] || Overview;
  return (
    <>
      <Nav route={route} />
      <main className="page" key={route}><Page /></main>
      <Footer />
    </>
  );
}
