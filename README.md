# Inbound Lead Qualification & Enrichment Agent

**Demo project built on sample data.** A B2B "Book a demo" form sends each lead to n8n. The workflow reads the company's website and asks an LLM (Gemini by default; Claude or OpenAI with a one-line switch) to score the lead against the ideal customer profile (ICP). Hot leads go to the CRM sheet with a personalized Gmail draft ready for the rep. All other leads go to a nurture list. Any failure sends an alert email.

```
Form ──► Webhook ──► Validate ──► Respond 200 ──► Fetch website ──► Extract text ──► Build AI request
                        │                                                                  │
                        └─► Respond 400 (invalid)                                          ▼
                                                        Gemini · Score Lead (schema-enforced JSON, 3x retry)
                                                                   │ on failure
                                                                   └──► Groq · Fallback Model (different provider)
                                                                                   │
                                                                           ICP score ≥ 70?
                                                              yes ┌────────────────┴───────────┐ no
                                                   Sheets "Hot Leads" + Gmail draft        Sheets "Nurture"
Any error ──► Error Trigger ──► Gmail alert email
```

## Folder
| Path | What it is |
|---|---|
| `frontend/` | "Vantora" demo-request page (fictional brand): React + Tailwind (Vite), designed in Magic Patterns. Posts JSON to the webhook (`src/utils/submitDemoRequest.ts`) and shows the n8n lead ID on success. Rebuild with `cd frontend && npm install && npm run build`; nginx serves `frontend/dist`. |
| `form/index.html` | Earlier single-file version of the form, kept for reference. |
| `workflows/lead-qualification-agent.json` | Main n8n workflow. |
| `workflows/error-handler.json` | Error workflow (alert email). |
| `scripts/build_workflows.py` | Regenerates both JSON files. The LLM provider, threshold, sheet ID and alert email are set at the top. |
| `scripts/deploy.py` | Rebuilds, imports, publishes and restarts n8n. Keeps the credentials, sheet ID and disabled nodes already set in the UI. |
| `scripts/send_test_leads.py` | Sends hot, warm, cold or invalid sample leads, 20 s apart. |
| `scripts/inspect_executions.js` | Prints the latest runs with per-node status and the AI verdict. |
| `docker-compose.yml` | Runs n8n on :5678 and the form on :8088. |

## Setup

**New here? Read [SETUP.md](SETUP.md)** — the full walkthrough: what every node does, the
prerequisites, first-time setup step by step, the data contract and a troubleshooting table.
The short version follows.

### Quick version (about 30 min the first time)

### 1. Start the stack
```bash
docker compose up -d
```
- n8n: http://localhost:5678 (create the owner account)
- Form: http://localhost:8088

### 2. Deploy the workflows
```bash
python scripts/deploy.py
```
Both workflows have fixed IDs, so deploying again updates them in place. The error handler is already linked. **Refresh any open n8n tab after a deploy**; saving from a stale tab overwrites the new version.

### 3. Credentials (create once in n8n)
| Node | Credential | How |
|---|---|---|
| Gemini · Score Lead | **Header Auth**: name `x-goog-api-key`, value = your Gemini API key | aistudio.google.com → Get API key (free tier) |
| Groq · Fallback Model | **Bearer Auth**: token = your Groq API key | console.groq.com → API Keys (free tier) |
| CRM · Add Hot Lead, Nurture List | **Google Sheets OAuth2** | One Google Cloud OAuth client with the Sheets and Gmail APIs enabled, your account added as a test user. Redirect URL = `http://localhost:5678/rest/oauth2-credential/callback` |
| Gmail · Draft Outreach | **Gmail OAuth2** | Same client ID and secret. After connecting, right-click the node → Activate, then run `deploy.py` so the error handler's Gmail alert gets the same account. |

**Switching the AI models:** set `LLM_PROVIDER` and `FALLBACK_PROVIDER` in `scripts/build_workflows.py` to `"gemini"`, `"groq"`, `"anthropic"` or `"openai"`, run `deploy.py`, then attach the matching credential. The prompt, output schema and routing stay the same.

### 4. Google Sheet
Create a sheet with two tabs, **Hot Leads** and **Nurture**. In cell A1 of each tab, paste the formula below, then copy row 1 and paste it back as values only (Ctrl+Shift+V):
```
=SPLIT("Lead ID,Submitted At,Name,Email,Job Title,Company,Website,Company Size,CRM,Timeline,ICP Score,Tier,Industry,Fit Summary,Buying Signals,Risks,Recommended Action", ",")
```
Set `SHEET_ID` in `build_workflows.py`, or pick the sheet in both Sheets nodes.

### 5. Test
```bash
python scripts/send_test_leads.py
```
Expected result: the hot lead (about 90+) lands in Hot Leads with a Gmail draft, and the warm (about 50–69) and cold (about 0–10) leads land in Nurture. Scores vary a little between runs. Tiers: 70–100 Hot, 40–69 Warm, 0–39 Cold.

## Video script (60–90 s, 1080p, OBS)
| Time | Screen | Voiceover / caption |
|---|---|---|
| 0–6s | Title card | "Inbound leads qualified in seconds, with no manual research." |
| 6–15s | Architecture diagram | "Form → n8n → website enrichment → AI scoring → CRM + personalized email draft." |
| 15–30s | Form at localhost:8088, filled with the **hot** lead | "A VP of RevOps requests a demo…" → submit → success screen with Reference ID |
| 30–45s | n8n **Executions** tab, open the run | Nodes light up green. Zoom in on the AI output: score, signals, risks |
| 45–60s | Google Sheet → Gmail drafts | "The lead lands in the CRM, and a personalized first email is already drafted for the rep." |
| 60–70s | Submit the **cold** lead (gmail.com, bakery) | "Poor-fit leads are routed to nurture automatically." |
| 70–80s | Canvas: the fallback model branch, then the alert email in the inbox | "If the AI provider goes down, a backup model takes over, and the team gets an alert email." |
| 80–90s | End card | Stack: n8n · Gemini / Claude / OpenAI · Google Sheets · Gmail |

**Tips:** on the Gemini free tier the first request after a pause can take 20+ seconds (a cold start), and later ones take 1–3 seconds. Run `python scripts/send_test_leads.py warm` about a minute before recording to warm it up, then clear those rows from the sheet. Dry-run 2–3 times first, clear the sheet before recording, hide your bookmarks bar, zoom the browser to 110%, and speed up any wait in the edit.

## Portfolio images
1. The full n8n canvas (sticky-note sections visible) at 1440p or higher.
2. The architecture diagram above, redrawn in Excalidraw.
3. The filled Hot Leads sheet and a Gmail draft side by side.
