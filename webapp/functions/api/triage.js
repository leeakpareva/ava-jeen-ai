// Cloudflare Pages Function — proxies the claim to the n8n triage webhook (server-side, no CORS).
export async function onRequestPost(context) {
  const { request, env } = context;
  const N8N_URL = env.N8N_TRIAGE_URL || "https://n8n.navada-edge-server.uk/webhook/claims-triage";
  try {
    const payload = await request.json();
    const r = await fetch(N8N_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const text = await r.text();
    // n8n returns JSON; pass it straight through
    return new Response(text, {
      status: r.ok ? 200 : 502,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: "Agent unavailable", detail: String(err) }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
