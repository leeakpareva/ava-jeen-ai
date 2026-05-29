import json, os, re

base = os.path.join(os.path.dirname(__file__), "..")
html = open(os.path.join(base, "webapp", "index.html"), encoding="utf-8").read()

# n8n-hosted variant: the portal and the triage API live on the same n8n origin,
# so the frontend calls the webhook path directly (no Pages Function proxy).
html = html.replace('fetch("/api/triage"', 'fetch("/webhook/claims-triage"')

wf = {
  "id": "JeenClaimsPortal1",
  "name": "Albion Mutual — Claims Portal (hosted UI)",
  "active": False,
  "nodes": [
    {
      "parameters": {"httpMethod": "GET", "path": "claims-portal",
                     "responseMode": "responseNode", "options": {}},
      "id": "p1000000-0000-0000-0000-000000000001",
      "name": "GET /claims-portal",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [0, 300],
      "webhookId": "claims-portal-albion"
    },
    {
      "parameters": {
        "respondWith": "text",
        "responseBody": html,
        "options": {"responseHeaders": {"entries": [
          {"name": "Content-Type", "value": "text/html; charset=utf-8"}
        ]}}
      },
      "id": "p1000000-0000-0000-0000-000000000002",
      "name": "Serve Portal HTML",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1.1,
      "position": [260, 300]
    }
  ],
  "connections": {
    "GET /claims-portal": {"main": [[{"node": "Serve Portal HTML", "type": "main", "index": 0}]]}
  },
  "settings": {"executionOrder": "v1"},
  "pinData": {}
}

out = os.path.join(base, "workflow", "claims-portal.json")
json.dump(wf, open(out, "w", encoding="utf-8"), ensure_ascii=False)
print("wrote", out, "| html bytes:", len(html))
