/**
 * main.jsx — APP ENTRY POINT
 * ----------------------------------------------------------------------------
 * This is the first file the browser runs. Vite injects it via index.html.
 * Its only jobs are:
 *   1. Mount the React <App/> into the <div id="root"> in index.html.
 *   2. OPTIONALLY wrap the app in Clerk's <ClerkProvider> so the customer
 *      login (the "My Claims" portal) works.
 *
 * Why the conditional ClerkProvider?
 *   Clerk needs a publishable key (VITE_CLERK_PUBLISHABLE_KEY, set in .env).
 *   If that key is present we wrap the app so Clerk hooks/components work.
 *   If it's absent (e.g. a fresh checkout), we render the app WITHOUT Clerk
 *   so it still runs — the portal falls back to a simple email lookup.
 * ----------------------------------------------------------------------------
 */
import React from "react";
import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import App from "./App.jsx";
import "./styles.css";

// Public Clerk key from the environment (undefined => fallback login).
const KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const app = <App />;

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {KEY ? <ClerkProvider publishableKey={KEY} afterSignOutUrl="/#/account">{app}</ClerkProvider> : app}
  </React.StrictMode>
);
