# Setup & Walkthrough — Inbound Lead Qualification Agent

Everything needed to understand what this project does and to run it from scratch on a new
machine. Budget **30–45 minutes** the first time; almost all of it is creating API keys and
Google credentials, not writing code.

> **What it is:** a demo/portfolio build on sample data. A B2B "Book a demo" form posts each
> lead to n8n. The workflow reads the lead's company website, asks an LLM to score the lead
> against an ideal customer profile (ICP), then routes it: hot leads land in a CRM sheet with a
> personalized Gmail draft waiting for the rep; everyone else goes to a nurture list. Any
> failure emails an alert.

---

## 1. How the flow works

### The big picture

```
┌─────────────┐   HTTP POST (JSON)   ┌──────────────────────────────────────┐
│ Demo form   │ ───────────────────► │ n8n  ·  Lead Qualification Agent     │
│ :8088       │ ◄─────────────────── │ :5678  /webhook/lead-intake          │
└─────────────┘   { lead_id } 200    └──────────────────────────────────────┘
                                            │              │           │
                                            ▼              ▼           ▼
                                     Google Sheet     Gmail draft   Alert email
                                   (Hot Leads /       (hot leads     (on any
                                      Nurture)          only)        failure)
```

### Node by node

The numbers match the four sticky-note sections on the n8n canvas.

**1 · Intake & validation**

| Node | What happens |
|---|---|
| `Demo Request Webhook` | `POST /webhook/lead-intake`. Response mode is "using Respond to Webhook node", CORS open to `*`. |
| `Validate & Normalize` | Checks the 8 required fields and the email format. Normalizes the website (strips `https://`, `www.`, any path), lowercases the email, flags free email domains (gmail, yahoo, …) and whether the email domain matches the website. Mints a lead ID like `VNT-M1K2J3-A9F2`. |
| `Payload Valid?` | `true` → the happy path; `false` → `Respond 400 · Invalid` with the list of errors. |
| `Respond 200 · Received` | Answers the form **immediately** with `{ status: "received", lead_id }`. The form never waits on the LLM — everything after this runs in the background. |

**2 · Enrichment**

| Node | What happens |
|---|---|
| `Fetch Company Website` | `GET https://<website>`, 10 s timeout, follows up to 5 redirects, custom User-Agent. On error it **continues** (`alwaysOutputData`) instead of failing the run. |
| `Extract Website Text` | Strips `<script>`/`<style>`/tags/entities, collapses whitespace, truncates to 6,000 chars. Pulls out `<title>` and the meta/OG description. Sets `website_reachable` (true when > 200 chars of text survived). |

**3 · AI qualification**

| Node | What happens |
|---|---|
| `Build AI Request` | Builds the system prompt (the ICP + rubric + anti-hallucination rules), the user prompt (form fields + website text), and the output JSON schema. Then it emits **two** request bodies — `request_body` for the primary provider and `fallback_body` for the backup — each in that provider's own structured-output dialect (Gemini `responseSchema`, OpenAI `json_schema`, Groq JSON-mode, Claude forced tool call). |
| `Gemini · Score Lead` | The primary model. 45 s timeout, **retries 3×** with 5 s between tries. Output 0 = success, output 1 = error. |
| `Groq · Fallback Model` | Wired to the primary's **error output**, so it only fires when the primary has failed all 3 attempts. It is a deliberately different company, so one provider's outage can't take out both. Gets the identical prompt. |
| `Parse AI Verdict` | Accepts any of the four response shapes, normalizes to one flat object, clamps the score to 0–100, and **recomputes the tier from the routing threshold** so tier and routing can never disagree. Joins the signal/risk arrays into strings for the sheet and records the provider, model and token counts. |

**4 · Routing & actions**

| Node | What happens |
|---|---|
| `ICP Score ≥ 70?` | `true` → both hot-lead nodes; `false` → nurture. |
| `CRM · Add Hot Lead` | Appends a row to the **Hot Leads** tab (17 columns). |
| `Gmail · Draft Outreach` | Creates a Gmail **draft** (not a send) addressed to the lead, using the subject and body the model wrote. |
| `Nurture List` | Appends the same 17 columns to the **Nurture** tab. |

**Error handling** — the main workflow's `errorWorkflow` setting points at `Vantora · Error Handler`
(`On Workflow Error` → `Format Alert` → `Gmail · Email Alert`). Any unhandled failure in any node
emails the failing node name, the error message and the execution link.

### Scoring rubric

| Score | Tier | Routing |
|---|---|---|
| 70–100 | Hot | Hot Leads sheet + Gmail draft |
| 40–69 | Warm | Nurture sheet |
| 0–39 | Cold | Nurture sheet |

The ICP the model scores against (B2B SaaS, 51–5,000 employees, revenue/sales leadership, already
on a CRM, buying this quarter — minus free-email, agency, B2C and sub-10-employee signals) lives in
the `system` prompt inside `BUILD_REQUEST_JS` in `scripts/build_workflows.py`. Edit it there, not
in the n8n UI, or the next deploy overwrites your change.

---

## 2. Prerequisites

| Need | Why | Notes |
|---|---|---|
| **Docker Desktop** (running) | runs n8n + the form's nginx | `docker compose version` must work |
| **Python 3.9+** | the build/deploy/test scripts | standard library only, no `pip install` |
| **Node.js 18+** | only if you want to rebuild the frontend | `frontend/dist` is already committed, so this is optional |
| **A Gemini API key** | primary scoring model | [aistudio.google.com](https://aistudio.google.com) → Get API key, free tier |
| **A Groq API key** | fallback model | [console.groq.com](https://console.groq.com) → API Keys, free tier |
| **A Google account** | Sheets + Gmail nodes | you'll create one OAuth client for both |

Ports **5678** (n8n) and **8088** (form) must be free.

---

## 3. First-time setup

### Step 1 — start the stack

```bash
docker compose up -d
```

- n8n → <http://localhost:5678> — create the owner account (local only, any email/password)
- Form → <http://localhost:8088>

### Step 2 — generate the workflow JSON

```bash
python scripts/build_workflows.py
```

This writes `workflows/lead-qualification-agent.json` and `workflows/error-handler.json`. That
folder is mounted read-only into the container at `/workflows`, so n8n can import straight from it.

### Step 3 — import the two workflows (first time only)

```bash
docker exec vantora-n8n n8n import:workflow --input=/workflows/error-handler.json
docker exec vantora-n8n n8n import:workflow --input=/workflows/lead-qualification-agent.json
```

Or, in the n8n UI: **Workflows → ⋯ → Import from File**, once per JSON file.

> Import the error handler **first** — the main workflow references it by ID.
>
> Don't use `scripts/deploy.py` for this first import. It reads the *live* workflow out of n8n
> before writing (to preserve the credentials you attach in the UI), so it needs both workflows to
> exist already. From step 7 onward it's the only command you need.

Both workflows have fixed IDs (`VntLeadQualAgnt1`, `VntErrorHandler1`), so every later import
updates them in place instead of creating duplicates.

### Step 4 — create the credentials in n8n

In n8n: **Credentials → Create credential**, then open each node and select it.

| Node | Credential type | Values |
|---|---|---|
| `Gemini · Score Lead` | **Header Auth** | Name `x-goog-api-key`, Value = your AI Studio key |
| `Groq · Fallback Model` | **Bearer Auth** | Token = your Groq API key |
| `CRM · Add Hot Lead`, `Nurture List` | **Google Sheets OAuth2** | client ID + secret from your Google Cloud OAuth client |
| `Gmail · Draft Outreach`, `Gmail · Email Alert` | **Gmail OAuth2** | the same client ID + secret |

Creating the Google OAuth client, once:

1. [console.cloud.google.com](https://console.cloud.google.com) → new project.
2. **APIs & Services → Library** → enable **Google Sheets API** and **Gmail API**.
3. **OAuth consent screen** → External → add your own Google account under **Test users**.
4. **Credentials → Create credentials → OAuth client ID → Web application**.
5. Authorized redirect URI — exactly:
   `http://localhost:5678/rest/oauth2-credential/callback`
6. Paste the client ID and secret into both n8n credentials and click **Connect my account**.

### Step 5 — create the Google Sheet

Create one spreadsheet with two tabs named exactly **`Hot Leads`** and **`Nurture`**.

In cell **A1 of each tab**, paste this, press Enter, then select row 1, copy it, and paste it back
over itself as **values only** (`Ctrl+Shift+V`) so the headers become plain text:

```
=SPLIT("Lead ID,Submitted At,Name,Email,Job Title,Company,Website,Company Size,CRM,Timeline,ICP Score,Tier,Industry,Fit Summary,Buying Signals,Risks,Recommended Action", ",")
```

Then take the sheet ID out of its URL —
`https://docs.google.com/spreadsheets/d/`**`THIS_PART`**`/edit` — and either:

- set `SHEET_ID` in `scripts/build_workflows.py` (recommended; survives rebuilds), **or**
- pick the sheet by hand in both Google Sheets nodes (`deploy.py` preserves that choice).

### Step 6 — activate

Open the main workflow and toggle **Active** (top right). The webhook only answers on
`/webhook/lead-intake` while the workflow is active; while you're editing in the UI, the test URL
is `/webhook-test/lead-intake` and only fires once per **Execute workflow** click.

### Step 7 — point the scripts and the form at the right email / sheet, then redeploy

Set `ALERT_EMAIL` in `scripts/build_workflows.py` to the inbox that should receive failure alerts,
then:

```bash
python scripts/deploy.py
```

From here on, this one command is the whole deploy loop: it rebuilds the JSON, carries over every
credential, disabled flag and sheet selection from the live workflows, imports, publishes, restarts
n8n, and waits until the log confirms the webhook is registered again.

> **Refresh any open n8n browser tab after a deploy.** Saving from a stale tab overwrites the
> version you just deployed.

---

## 4. Verify it works

```bash
python scripts/send_test_leads.py
```

Sends a hot, a warm and a cold sample lead, 20 s apart (the gap keeps the Gemini free tier happy).

| Lead | Expected score | Expected destination |
|---|---|---|
| `hot` — VP RevOps at a B2B SaaS, HubSpot, this quarter | ~90+ | **Hot Leads** row + a Gmail draft |
| `warm` — founder at an 11–50 company, 3–6 months out | ~50–69 | **Nurture** row |
| `cold` — bakery owner on a gmail.com address | ~0–10 | **Nurture** row |
| `invalid` — blank name, malformed email | — | HTTP 400 with the field errors, nothing downstream |

Scores drift a few points between runs; the tier boundaries are what matter.

Other ways to run it:

```bash
python scripts/send_test_leads.py hot              # one lead
python scripts/send_test_leads.py hot cold --delay 0
python scripts/send_test_leads.py invalid          # should return 400
python scripts/send_test_leads.py --url http://localhost:5678/webhook-test/lead-intake
```

Then check: **n8n → Executions** (every node green), the Google Sheet, and Gmail → Drafts.

For a dense text view of the last few runs — per-node status plus the full AI verdict, tokens and
the drafted email:

```bash
docker cp scripts/inspect_executions.js vantora-n8n:/tmp/inspect.js
docker exec -w /usr/local/lib/node_modules/n8n vantora-n8n node /tmp/inspect.js 3
```

Or submit a lead through the real form at <http://localhost:8088> — the success screen shows the
`lead_id` that n8n assigned, which you can then find in the sheet.

---

## 5. Configuration reference

Everything configurable lives at the top of **`scripts/build_workflows.py`**. Change a value, run
`python scripts/deploy.py`, done.

| Constant | Default | Meaning |
|---|---|---|
| `LLM_PROVIDER` | `"gemini"` | Primary scoring model: `gemini` \| `anthropic` \| `openai` \| `groq` |
| `FALLBACK_PROVIDER` | `"groq"` | Backup model — keep it a *different* company |
| `HOT_THRESHOLD` | `70` | Score at or above which a lead is Hot and routes to the CRM. Renames the IF node and drives the tier calculation. |
| `SHEET_ID` | a demo sheet | Target spreadsheet for both Sheets nodes |
| `ALERT_EMAIL` | — | Where workflow-failure alerts are emailed |
| `PROVIDERS[...]["model"]` | per provider | Exact model ID per provider |
| `MAIN_WORKFLOW_ID` / `ERROR_WORKFLOW_ID` | fixed strings | Don't change these — they're why re-imports update instead of duplicate |

**Swapping providers** takes one line. Set `LLM_PROVIDER = "anthropic"`, run `deploy.py`, attach the
matching credential (each provider's auth hint is written into the node's Notes), and that's it —
the prompt, the output schema and all downstream routing are untouched, because `Build AI Request`
translates the schema per provider and `Parse AI Verdict` already understands all four response
shapes.

**The form's webhook URL** resolves in this order (`frontend/src/utils/submitDemoRequest.ts`):

1. `?webhook=https://…` in the page URL — handy for a one-off demo against a hosted n8n
2. `VITE_WEBHOOK_URL` at build time
3. `http://localhost:5678/webhook/lead-intake`

Rebuilding the form after a change:

```bash
cd frontend
npm install
npm run build        # writes frontend/dist, which nginx serves on :8088
```

---

## 6. Repo layout

| Path | What it is |
|---|---|
| `frontend/` | The "Vantora" demo-request page (fictional brand) — React + Tailwind on Vite, designed in Magic Patterns. nginx serves the committed `frontend/dist`. |
| `frontend/src/utils/submitDemoRequest.ts` | Builds the payload and posts it to the webhook |
| `form/index.html` | The earlier single-file version of the form, kept for reference |
| `workflows/*.json` | **Generated** — n8n import files. Don't hand-edit; edit the builder. |
| `scripts/build_workflows.py` | The real source of truth: prompts, schema, nodes, wiring, config |
| `scripts/deploy.py` | Rebuild → merge live credentials → import → publish → restart → wait for the webhook |
| `scripts/send_test_leads.py` | Fires hot / warm / cold / invalid sample leads at the webhook |
| `scripts/inspect_executions.js` | Reads n8n's SQLite DB and prints recent runs + the AI verdict |
| `docker-compose.yml` | n8n on `:5678`, the form on `:8088`, a named volume for n8n data |
| `e5a974e9-…/` + `.zip` | The original untouched Magic Patterns export; `frontend/` is the working copy |
| `README.md` | Project overview plus the demo-video script and portfolio shot list |

**Data persistence:** everything you configure in n8n (account, credentials, executions) lives in
the `n8n_data` Docker volume, not in this repo. `docker compose down` keeps it;
`docker compose down -v` **deletes it** and you start over from step 1.

---

## 7. Data contract

**Request** — `POST /webhook/lead-intake`, `Content-Type: application/json`

```json
{
  "first_name": "Priya",
  "last_name": "Nair",
  "email": "priya.nair@posthog.com",
  "company": "PostHog",
  "website": "posthog.com",
  "job_title": "VP Revenue Operations",
  "company_size": "201–1,000",
  "timeline": "This quarter",
  "crm": "HubSpot",
  "message": "Our forecast misses by ~20% every quarter.",
  "consent": true,
  "source": "website_demo_form",
  "submitted_at": "2026-10-16T09:12:04.000Z"
}
```

Required: `first_name`, `last_name`, `email`, `company`, `website`, `job_title`, `company_size`,
`timeline`. Optional: `crm` (defaults to `"Not specified"`), `message`, `consent`, `source`,
`page_url`, `submitted_at` (defaults to now).

**Responses**

```json
200  { "status": "received", "lead_id": "VNT-M1K2J3-A9F2" }
400  { "status": "invalid",  "errors": ["first_name is required", "email is invalid"] }
```

**Sheet row** — 17 columns, identical on both tabs:

`Lead ID · Submitted At · Name · Email · Job Title · Company · Website · Company Size · CRM ·
Timeline · ICP Score · Tier · Industry · Fit Summary · Buying Signals · Risks · Recommended Action`

The model also returns `email_subject`, `email_body`, `business_model`, plus the provider/model/token
counts — those go to the Gmail draft and the execution log rather than the sheet.

---

## 8. Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `error during connect … dockerDesktopLinuxEngine` | Docker Desktop isn't running. Start it and retry. |
| `deploy.py` fails on `export:workflow … not found` | The workflows aren't in n8n yet. Do step 3 (plain `import:workflow`) first. |
| Webhook returns **404** | The workflow isn't **Active**, or you're hitting `/webhook/` while testing from the editor (that needs `/webhook-test/`). |
| Form shows a submit error, n8n shows nothing | Wrong URL or a CORS block. Check the browser console; the webhook sets `allowedOrigins: *`, so a mismatch usually means the URL is wrong or n8n is still restarting. |
| First AI call takes 20+ seconds | Gemini free-tier cold start. Later calls run in 1–3 s. Send one warm-up lead before a demo. |
| `429` / rate limit on the AI node | Free-tier limit. Keep the 20 s gap in `send_test_leads.py`, or switch `LLM_PROVIDER`. |
| The fallback model fires every time | The primary's credential is wrong or its key is out of quota. Open the failed `Score Lead` node in the execution to read the provider's actual error. |
| `Parse AI Verdict` throws "returned no content" | The model was cut off or blocked. Check `finishReason` in the previous node's output. |
| Sheets node: "The resource you are requesting could not be found" | Tab name mismatch — they must be exactly `Hot Leads` and `Nurture` — or the sheet isn't shared with the connected Google account. |
| Gmail node fails with insufficient permissions | Gmail API not enabled on the Cloud project, or the credential was connected before it was. Re-enable, then reconnect the credential. |
| No alert email on a failure | `Gmail · Email Alert` has no credential. Connect Gmail on the draft node, then run `deploy.py` — it copies that account onto the error handler's Gmail node. |
| A change you made in the n8n UI vanished | Expected. `deploy.py` regenerates from `build_workflows.py`; only credentials, disabled flags and the Sheets document selection are carried over. Make the change in the builder. |
| Edits don't show up after a deploy | A stale browser tab saved over them. Refresh n8n after every deploy. |
