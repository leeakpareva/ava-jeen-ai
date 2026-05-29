import json, os, sys, urllib.request

API_KEY = os.environ.get("OPENAI_API_KEY", "").strip()
if not API_KEY:
    sys.exit("OPENAI_API_KEY not set in env")

SYSTEM = (
 "You are the claims triage assistant for Albion Mutual, a UK general insurer regulated by the FCA. "
 "Analyse the FNOL and return a structured triage decision. Score fraud_risk 0-100, raising it for "
 "inconsistent dates, vague/contradictory descriptions, recently incepted policies, round-number high "
 "values, or pressure to settle fast. Set vulnerable_flag=true under FCA Consumer Duty for bereavement, "
 "serious illness, disability, mental-health distress or financial hardship. routing: 'auto-settle' only "
 "for clearly low-risk low-value non-vulnerable claims; 'adjuster' for high value or vulnerable customers; "
 "'SIU-fraud' if fraud_risk is high."
)

SCHEMA = {
  "type":"object","additionalProperties":False,
  "required":["claim_type","severity","estimated_value","fraud_risk","fraud_reasons","vulnerable_flag","vulnerable_reason","routing","ai_summary"],
  "properties":{
    "claim_type":{"type":"string","enum":["Motor","Home","Travel","Liability","Other"]},
    "severity":{"type":"string","enum":["Low","Medium","High"]},
    "estimated_value":{"type":"number"},
    "fraud_risk":{"type":"integer"},
    "fraud_reasons":{"type":"string"},
    "vulnerable_flag":{"type":"boolean"},
    "vulnerable_reason":{"type":"string"},
    "routing":{"type":"string","enum":["auto-settle","adjuster","SIU-fraud"]},
    "ai_summary":{"type":"string"}
  }
}

claims = json.load(open(os.path.join(os.path.dirname(__file__),"..","dataset","sample-claims.json")))

def triage(c):
    user = (f"Policy Number: {c['Policy Number']}\nClaimant: {c['Claimant Name']}\n"
            f"Incident Type: {c['Incident Type']}\nIncident Date: {c['Incident Date']}\n"
            f"Estimated Value (GBP): {c['Estimated Value (GBP)']}\nDescription: {c['Description of Incident']}")
    body = {
      "model":"gpt-4o-mini","temperature":0.2,
      "messages":[{"role":"system","content":SYSTEM},{"role":"user","content":user}],
      "response_format":{"type":"json_schema","json_schema":{"name":"triage","strict":True,"schema":SCHEMA}}
    }
    req = urllib.request.Request("https://api.openai.com/v1/chat/completions",
        data=json.dumps(body).encode(), method="POST",
        headers={"Authorization":f"Bearer {API_KEY}","Content-Type":"application/json"})
    with urllib.request.urlopen(req, timeout=60) as r:
        out = json.load(r)
    return json.loads(out["choices"][0]["message"]["content"])

print(f"{'SCENARIO':<34} {'route':<11} {'fraud':>5} {'vuln':>5}  summary")
print("-"*120)
for c in claims:
    t = triage(c)
    print(f"{c['scenario']:<34} {t['routing']:<11} {t['fraud_risk']:>5} {str(t['vulnerable_flag']):>5}  {t['ai_summary'][:60]}")
