"""Generates the importable n8n workflow JSON files in ../workflows.

Run:  python scripts/build_workflows.py
Edit the constants below, re-run, and re-import into n8n.
"""

import json
import uuid
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "workflows"

# Which LLMs score the leads. The primary is tried first (3 attempts); if it still fails,
# the fallback, ideally a different company, gets the identical prompt.
# Change a line, then run scripts/deploy.py.
LLM_PROVIDER = "gemini"     # "gemini" | "anthropic" | "openai" | "groq"
FALLBACK_PROVIDER = "groq"  # a different provider, so one outage can't take out both

PROVIDERS = {
    "gemini": {
        "label": "Gemini",
        "model": "gemini-flash-lite-latest",  # most free-tier headroom
        "url": "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
        "headers": [],
        "auth": "httpHeaderAuth",
        "auth_hint": "Header Auth: name x-goog-api-key, value = your AI Studio key",
    },
    "groq": {
        "label": "Groq",
        "model": "openai/gpt-oss-120b",
        "url": "https://api.groq.com/openai/v1/chat/completions",
        "headers": [],
        "auth": "httpBearerAuth",
        "auth_hint": "Bearer Auth: token = your Groq API key (console.groq.com)",
    },
    "anthropic": {
        "label": "Claude",
        "model": "claude-sonnet-5",
        "url": "https://api.anthropic.com/v1/messages",
        "headers": [{"name": "anthropic-version", "value": "2023-06-01"}],
        "auth": "httpHeaderAuth",
        "auth_hint": "Header Auth: name x-api-key, value = your Anthropic key",
    },
    "openai": {
        "label": "OpenAI",
        "model": "gpt-5-mini",
        "url": "https://api.openai.com/v1/chat/completions",
        "headers": [],
        "auth": "httpBearerAuth",
        "auth_hint": "Bearer Auth: token = your OpenAI key",
    },
}
LLM = PROVIDERS[LLM_PROVIDER]
FALLBACK = PROVIDERS[FALLBACK_PROVIDER]

HOT_THRESHOLD = 70
SHEET_ID = "1Ptu8lmNgfvG2bHISGSuv4GwFNxQkgWH3yEFNJ39xSN4"
ALERT_EMAIL = "musayyib.ahmed@gmail.com"  # where workflow-failure alerts are emailed

# Fixed IDs so re-imports overwrite instead of duplicating, and the error workflow can be linked.
MAIN_WORKFLOW_ID = "VntLeadQualAgnt1"
ERROR_WORKFLOW_ID = "VntErrorHandler1"


def nid():
    return str(uuid.uuid4())


def node(name, type_, version, pos, params, **extra):
    return {"parameters": params, "id": nid(), "name": name, "type": type_,
            "typeVersion": version, "position": list(pos), **extra}


def sticky(content, pos, w, h, color):
    return node(f"Note {nid()[:6]}", "n8n-nodes-base.stickyNote", 1, pos,
                {"content": content, "width": w, "height": h, "color": color})


def code(name, pos, js, **extra):
    return node(name, "n8n-nodes-base.code", 2, pos, {"jsCode": js.strip()}, **extra)


# --------------------------------------------------------------------------
# JavaScript for the Code nodes
# --------------------------------------------------------------------------

VALIDATE_JS = r"""
// Validate and normalize the inbound form payload.
const b = $input.first().json.body ?? {};
const required = ['first_name', 'last_name', 'email', 'company', 'website', 'job_title', 'company_size', 'timeline'];
const errors = required.filter((k) => !String(b[k] ?? '').trim()).map((k) => `${k} is required`);

const email = String(b.email ?? '').trim().toLowerCase();
if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('email is invalid');

const website = String(b.website ?? '').trim().toLowerCase()
  .replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '');

const FREE_DOMAINS = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'aol.com', 'proton.me', 'protonmail.com'];
const emailDomain = email.split('@')[1] ?? '';

const leadId = 'VNT-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();

return [{
  json: {
    valid: errors.length === 0,
    errors,
    lead_id: leadId,
    first_name: String(b.first_name ?? '').trim(),
    last_name: String(b.last_name ?? '').trim(),
    full_name: `${String(b.first_name ?? '').trim()} ${String(b.last_name ?? '').trim()}`.trim(),
    email,
    email_domain: emailDomain,
    is_free_email: FREE_DOMAINS.includes(emailDomain),
    domain_matches_website: emailDomain !== '' && website.endsWith(emailDomain),
    company: String(b.company ?? '').trim(),
    website,
    job_title: String(b.job_title ?? '').trim(),
    company_size: b.company_size ?? '',
    crm: b.crm ?? 'Not specified',
    timeline: b.timeline ?? '',
    message: String(b.message ?? '').trim(),
    source: b.source ?? 'unknown',
    submitted_at: b.submitted_at ?? new Date().toISOString(),
  },
}];
"""

EXTRACT_JS = r"""
// Turn the fetched homepage HTML into compact plain text for the LLM.
const lead = $('Validate & Normalize').first().json;
const res = $input.first().json;
const html = typeof res.data === 'string' ? res.data : '';

const pick = (re) => (html.match(re)?.[1] ?? '').replace(/\s+/g, ' ').trim();
const title = pick(/<title[^>]*>([\s\S]*?)<\/title>/i);
const description = pick(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)
  || pick(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']*)["']/i);

const text = html
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;|&#160;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ')
  .trim()
  .slice(0, 6000);

return [{
  json: {
    ...lead,
    website_reachable: text.length > 200,
    site_title: title,
    site_description: description,
    site_text: text,
  },
}];
"""

BUILD_REQUEST_JS = r"""
// Build the LLM request. Every provider is forced into the same JSON schema, so downstream nodes never change.
const lead = $input.first().json;

const system = `You are a senior SDR qualifying inbound demo requests for Vantora, a revenue-intelligence platform for B2B sales teams.

Ideal customer profile (ICP):
- B2B SaaS or technology companies with 51 to 5,000 employees
- Buyer roles: CRO, VP/Head/Director of Sales, Revenue Operations, Sales Operations; founders/CEOs at companies under 200 people
- Already on a CRM (Salesforce or HubSpot is the strongest fit)
- Buying timeline within the current quarter

Negative signals: personal/free email domains, students or job seekers, agencies pitching services, B2C or local brick-and-mortar businesses, companies under 10 employees, email domain not matching the company website.

Scoring rubric: 70-100 = Hot (route to sales now), 40-69 = Warm (nurture), 0-39 = Cold (disqualify). The tier must match the score.

Score strictly and ground every claim in the provided data. If the website could not be read, say so and rely on the form data only. Never invent facts about the company.`;

const user = `Qualify this inbound lead.

FORM SUBMISSION
- Name: ${lead.full_name}
- Job title: ${lead.job_title}
- Work email: ${lead.email} (free email provider: ${lead.is_free_email}; domain matches website: ${lead.domain_matches_website})
- Company: ${lead.company}
- Website: ${lead.website}
- Company size (self-reported): ${lead.company_size}
- Current CRM: ${lead.crm}
- Timeline: ${lead.timeline}
- What they want to solve: ${lead.message || '(left blank)'}

COMPANY WEBSITE (${lead.website_reachable ? 'fetched successfully' : 'COULD NOT BE READ'})
- Title: ${lead.site_title || 'n/a'}
- Meta description: ${lead.site_description || 'n/a'}
- Homepage text: ${lead.site_text || 'n/a'}

Also draft a short, personal first-touch email from "Alex Morgan, Solutions Engineer at Vantora" that references one specific detail about their company or goal. Under 120 words, plain text, no placeholders, end by proposing two time slots this week.`;

const schema = {
  type: 'object',
  properties: {
    icp_score: { type: 'integer', minimum: 0, maximum: 100, description: 'Overall fit with the ICP, 0-100' },
    tier: { type: 'string', enum: ['Hot', 'Warm', 'Cold'] },
    fit_summary: { type: 'string', description: 'One sentence explaining the score' },
    industry: { type: 'string' },
    business_model: { type: 'string', enum: ['B2B', 'B2C', 'B2B2C', 'Unknown'] },
    buying_signals: { type: 'array', items: { type: 'string' }, maxItems: 4 },
    risks: { type: 'array', items: { type: 'string' }, maxItems: 4 },
    recommended_action: { type: 'string', description: 'Next step for the sales team' },
    email_subject: { type: 'string' },
    email_body: { type: 'string' },
  },
  required: ['icp_score', 'tier', 'fit_summary', 'industry', 'business_model', 'buying_signals', 'risks', 'recommended_action', 'email_subject', 'email_body'],
};

const TARGETS = {
  primary: { provider: '__PROVIDER__', model: '__MODEL__' },
  fallback: { provider: '__FB_PROVIDER__', model: '__FB_MODEL__' },
};
// Remove schema keywords a provider's structured-output dialect doesn't accept.
const strip = (obj, keys) => JSON.parse(JSON.stringify(obj, (k, v) => (keys.includes(k) ? undefined : v)));

function bodyFor({ provider, model }) {
  if (provider === 'gemini') {
    return {
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: user }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
        // Gemini's OpenAPI-style schema: uppercase type names, no numeric bounds.
        responseSchema: JSON.parse(JSON.stringify(strip(schema, ['minimum', 'maximum']),
          (k, v) => (k === 'type' && typeof v === 'string' ? v.toUpperCase() : v))),
      },
    };
  }
  if (provider === 'openai') {
    return {
      model,
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
      response_format: {
        type: 'json_schema',
        json_schema: { name: 'score_lead', strict: true, schema: { ...strip(schema, ['minimum', 'maximum', 'maxItems']), additionalProperties: false } },
      },
    };
  }
  if (provider === 'groq') {
    // JSON mode works across every Groq model; the schema travels in the system prompt.
    return {
      model,
      temperature: 0.2,
      max_completion_tokens: 2048,
      messages: [
        { role: 'system', content: `${system}\n\nRespond with one JSON object only, matching this JSON schema exactly:\n${JSON.stringify(schema)}` },
        { role: 'user', content: user },
      ],
      response_format: { type: 'json_object' },
    };
  }
  return {
    model,
    max_tokens: 1500,
    system,
    messages: [{ role: 'user', content: user }],
    tools: [{ name: 'score_lead', description: 'Record the qualification result for this inbound lead.', input_schema: schema }],
    tool_choice: { type: 'tool', name: 'score_lead' },
  };
}

return [{ json: { ...lead, request_body: bodyFor(TARGETS.primary), fallback_body: bodyFor(TARGETS.fallback) } }];
""".replace("__PROVIDER__", LLM_PROVIDER).replace("__MODEL__", LLM["model"]) \
   .replace("__FB_PROVIDER__", FALLBACK_PROVIDER).replace("__FB_MODEL__", FALLBACK["model"])

PARSE_JS = r"""
// Normalize whichever provider answered (primary or fallback) and merge the verdict onto the lead.
const lead = $('Build AI Request').first().json;
const res = $input.first().json;

let s, provider, model, inputTokens = 0, outputTokens = 0;
if (res.candidates) {
  const cand = res.candidates[0];
  const text = (cand?.content?.parts ?? []).filter((p) => !p.thought).map((p) => p.text ?? '').join('');
  if (!text) throw new Error(`Gemini returned no content (reason: ${cand?.finishReason ?? res.promptFeedback?.blockReason ?? 'unknown'})`);
  s = JSON.parse(text);
  provider = 'gemini';
  model = res.modelVersion;
  inputTokens = res.usageMetadata?.promptTokenCount ?? 0;
  outputTokens = res.usageMetadata?.candidatesTokenCount ?? 0;
} else if (res.choices) {
  const text = res.choices[0]?.message?.content;
  if (!text) throw new Error(`Model returned no content (finish_reason: ${res.choices[0]?.finish_reason})`);
  s = JSON.parse(text);
  provider = res.x_groq ? 'groq' : 'openai';
  model = res.model;
  inputTokens = res.usage?.prompt_tokens ?? 0;
  outputTokens = res.usage?.completion_tokens ?? 0;
} else {
  const call = (res.content ?? []).find((c) => c.type === 'tool_use' && c.name === 'score_lead');
  if (!call) throw new Error(`Claude returned no score_lead tool call (stop_reason: ${res.stop_reason})`);
  s = call.input;
  provider = 'anthropic';
  model = res.model;
  inputTokens = res.usage?.input_tokens ?? 0;
  outputTokens = res.usage?.output_tokens ?? 0;
}

const { request_body, fallback_body, site_text, ...rest } = lead;
const score = Math.max(0, Math.min(100, Math.round(Number(s.icp_score) || 0)));
const list = (v) => (Array.isArray(v) ? v.join('; ') : String(v ?? ''));

return [{
  json: {
    ...rest,
    icp_score: score,
    tier: score >= __HOT__ ? 'Hot' : score >= 40 ? 'Warm' : 'Cold',  // routing threshold is the source of truth
    fit_summary: s.fit_summary,
    industry: s.industry,
    business_model: s.business_model,
    buying_signals: list(s.buying_signals),
    risks: list(s.risks),
    recommended_action: s.recommended_action,
    email_subject: s.email_subject,
    email_body: s.email_body,
    llm_provider: provider,
    model,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    scored_at: new Date().toISOString(),
  },
}];
""".replace("__HOT__", str(HOT_THRESHOLD))

ERROR_FORMAT_JS = r"""
// Shape the n8n error payload into a readable alert email.
const e = $input.first().json;
const exec = e.execution ?? {};
const wf = e.workflow ?? {};
return [{
  json: {
    subject: `[Alert] ${wf.name ?? 'Workflow'} failed at "${exec.lastNodeExecuted ?? 'unknown node'}"`,
    body: [
      `Workflow:  ${wf.name ?? 'unknown'}`,
      `Failed at: ${exec.lastNodeExecuted ?? 'n/a'}`,
      `Error:     ${exec.error?.message ?? 'n/a'}`,
      `Execution: ${exec.url ?? exec.id ?? 'n/a'}`,
      `Time:      ${new Date().toISOString()}`,
      '',
      'The lead was received and stored in the execution log; re-run it from n8n once the issue is fixed.',
    ].join('\n'),
  },
}];
"""


# --------------------------------------------------------------------------
# Main workflow
# --------------------------------------------------------------------------

SHEET_COLUMNS = {
    "Lead ID": "={{ $json.lead_id }}",
    "Submitted At": "={{ $json.submitted_at }}",
    "Name": "={{ $json.full_name }}",
    "Email": "={{ $json.email }}",
    "Job Title": "={{ $json.job_title }}",
    "Company": "={{ $json.company }}",
    "Website": "={{ $json.website }}",
    "Company Size": "={{ $json.company_size }}",
    "CRM": "={{ $json.crm }}",
    "Timeline": "={{ $json.timeline }}",
    "ICP Score": "={{ $json.icp_score }}",
    "Tier": "={{ $json.tier }}",
    "Industry": "={{ $json.industry }}",
    "Fit Summary": "={{ $json.fit_summary }}",
    "Buying Signals": "={{ $json.buying_signals }}",
    "Risks": "={{ $json.risks }}",
    "Recommended Action": "={{ $json.recommended_action }}",
}


def sheet_node(name, tab, pos):
    schema = [{"id": c, "displayName": c, "required": False, "defaultMatch": False,
               "display": True, "type": "string", "canBeUsedToMatch": True}
              for c in SHEET_COLUMNS]
    return node(name, "n8n-nodes-base.googleSheets", 4.5, pos, {
        "operation": "append",
        "documentId": {"__rl": True, "value": SHEET_ID, "mode": "id"},
        "sheetName": {"__rl": True, "value": tab, "mode": "name"},
        "columns": {"mappingMode": "defineBelow", "value": SHEET_COLUMNS,
                    "matchingColumns": [], "schema": schema},
        "options": {},
    })


LLM_NODE = f"{LLM['label']} · Score Lead"
LLM_FALLBACK_NODE = f"{FALLBACK['label']} · Fallback Model"


def llm_node(name, pos, cfg, body_field, **extra):
    # Both bodies are built in Build AI Request; the fallback is fed by the primary's
    # error output, so it reads its body from there rather than from $json.
    return node(name, "n8n-nodes-base.httpRequest", 4.2, pos, {
        "method": "POST",
        "url": cfg["url"].format(model=cfg["model"]),
        "authentication": "genericCredentialType",
        "genericAuthType": cfg["auth"],
        "sendHeaders": True,
        "headerParameters": {"parameters": [
            *cfg["headers"],
            {"name": "content-type", "value": "application/json"},
        ]},
        "sendBody": True,
        "specifyBody": "json",
        "jsonBody": f"={{{{ JSON.stringify($('Build AI Request').first().json.{body_field}) }}}}",
        "options": {"timeout": 45000},
    }, retryOnFail=True, maxTries=3, waitBetweenTries=5000, notes=cfg["auth_hint"], **extra)


def build_main():
    X = 0
    Y = 300
    step = 240

    nodes = [
        sticky("## 1 · Intake & validation\nWebhook receives the demo request, validates it, and answers the form instantly.",
               (X - 40, Y - 200), 760, 520, 7),
        sticky("## 2 · Enrichment\nFetch the company homepage and reduce it to clean text. Unreachable sites fall through gracefully.",
               (X + step * 3 - 40, Y - 200), 520, 520, 5),
        sticky(f"## 3 · AI qualification ({LLM['label']})\nSchema-enforced JSON verdict: ICP score, tier, signals, risks and a first-touch email. Retries 3x, then hands the same prompt to a second provider ({FALLBACK['label']}) if the primary is down. Providers are swappable (Gemini / Groq / Claude / OpenAI).",
               (X + step * 5 - 40, Y - 200), 760, 520, 6),
        sticky("## 4 · Routing & actions\nScore ≥ 70: CRM row + personalized Gmail draft for the sales rep. Otherwise: nurture list.",
               (X + step * 8 - 40, Y - 200), 760, 760, 4),

        node("Demo Request Webhook", "n8n-nodes-base.webhook", 2, (X, Y), {
            "httpMethod": "POST",
            "path": "lead-intake",
            "responseMode": "responseNode",
            "options": {"allowedOrigins": "*"},
        }, webhookId=nid()),
        code("Validate & Normalize", (X + step, Y), VALIDATE_JS),
        node("Payload Valid?", "n8n-nodes-base.if", 2, (X + step * 2, Y), {
            "conditions": {
                "options": {"caseSensitive": True, "leftValue": "", "typeValidation": "strict"},
                "conditions": [{"id": nid(), "leftValue": "={{ $json.valid }}", "rightValue": True,
                                "operator": {"type": "boolean", "operation": "true", "singleValue": True}}],
                "combinator": "and",
            },
            "options": {},
        }),
        node("Respond 400 · Invalid", "n8n-nodes-base.respondToWebhook", 1.1, (X + step * 3, Y + 200), {
            "respondWith": "json",
            "responseBody": "={{ { status: 'invalid', errors: $json.errors } }}",
            "options": {"responseCode": 400},
        }),
        node("Respond 200 · Received", "n8n-nodes-base.respondToWebhook", 1.1, (X + step * 3, Y), {
            "respondWith": "json",
            "responseBody": "={{ { status: 'received', lead_id: $json.lead_id } }}",
            "options": {"responseCode": 200},
        }),
        node("Fetch Company Website", "n8n-nodes-base.httpRequest", 4.2, (X + step * 4, Y), {
            "url": "=https://{{ $('Validate & Normalize').first().json.website }}",
            "sendHeaders": True,
            "headerParameters": {"parameters": [
                {"name": "User-Agent", "value": "Mozilla/5.0 (compatible; VantoraLeadBot/1.0)"},
                {"name": "Accept", "value": "text/html"},
            ]},
            "options": {
                "timeout": 10000,
                "redirect": {"redirect": {"followRedirects": True, "maxRedirects": 5}},
                "response": {"response": {"responseFormat": "text", "outputPropertyName": "data"}},
            },
        }, onError="continueRegularOutput", alwaysOutputData=True),
        code("Extract Website Text", (X + step * 5, Y), EXTRACT_JS),
        code("Build AI Request", (X + step * 6, Y), BUILD_REQUEST_JS),
        llm_node(LLM_NODE, (X + step * 7, Y), LLM, "request_body", onError="continueErrorOutput"),
        llm_node(LLM_FALLBACK_NODE, (X + step * 7, Y + 220), FALLBACK, "fallback_body"),
        code("Parse AI Verdict", (X + step * 8, Y), PARSE_JS),
        node(f"ICP Score ≥ {HOT_THRESHOLD}?", "n8n-nodes-base.if", 2, (X + step * 9, Y), {
            "conditions": {
                "options": {"caseSensitive": True, "leftValue": "", "typeValidation": "strict"},
                "conditions": [{"id": nid(), "leftValue": "={{ $json.icp_score }}", "rightValue": HOT_THRESHOLD,
                                "operator": {"type": "number", "operation": "gte"}}],
                "combinator": "and",
            },
            "options": {},
        }),
        sheet_node("CRM · Add Hot Lead", "Hot Leads", (X + step * 10, Y - 60)),
        node("Gmail · Draft Outreach", "n8n-nodes-base.gmail", 2.1, (X + step * 10, Y + 140), {
            "resource": "draft",
            "subject": "={{ $json.email_subject }}",
            "emailType": "text",
            "message": "={{ $json.email_body }}",
            "options": {"sendTo": "={{ $json.email }}"},
        }),
        sheet_node("Nurture List", "Nurture", (X + step * 10, Y + 380)),
    ]

    by = {n["name"]: n for n in nodes}
    link = lambda *targets: [[{"node": t, "type": "main", "index": 0} for t in targets]]

    connections = {
        "Demo Request Webhook": {"main": link("Validate & Normalize")},
        "Validate & Normalize": {"main": link("Payload Valid?")},
        "Payload Valid?": {"main": [
            [{"node": "Respond 200 · Received", "type": "main", "index": 0}],
            [{"node": "Respond 400 · Invalid", "type": "main", "index": 0}],
        ]},
        "Respond 200 · Received": {"main": link("Fetch Company Website")},
        "Fetch Company Website": {"main": link("Extract Website Text")},
        "Extract Website Text": {"main": link("Build AI Request")},
        "Build AI Request": {"main": link(LLM_NODE)},
        LLM_NODE: {"main": [  # output 0 = success, output 1 = error -> fallback model
            [{"node": "Parse AI Verdict", "type": "main", "index": 0}],
            [{"node": LLM_FALLBACK_NODE, "type": "main", "index": 0}],
        ]},
        LLM_FALLBACK_NODE: {"main": link("Parse AI Verdict")},
        "Parse AI Verdict": {"main": link(f"ICP Score ≥ {HOT_THRESHOLD}?")},
        f"ICP Score ≥ {HOT_THRESHOLD}?": {"main": [
            [{"node": n, "type": "main", "index": 0}
             for n in ("CRM · Add Hot Lead", "Gmail · Draft Outreach")],
            [{"node": "Nurture List", "type": "main", "index": 0}],
        ]},
    }
    for src in connections:
        assert src in by, src

    return {
        "id": MAIN_WORKFLOW_ID,
        "name": "Vantora · Inbound Lead Qualification Agent",
        "nodes": nodes,
        "connections": connections,
        "active": False,
        "settings": {"executionOrder": "v1", "saveManualExecutions": True,
                     "errorWorkflow": ERROR_WORKFLOW_ID},
        "pinData": {},
        "meta": {"templateCredsSetupCompleted": False},
    }


def build_error():
    nodes = [
        sticky("## Error handler\nAny failure in the lead workflow emails an alert with the failing node, error and execution link.",
               (-40, 100), 700, 380, 3),
        node("On Workflow Error", "n8n-nodes-base.errorTrigger", 1, (0, 300), {}),
        code("Format Alert", (240, 300), ERROR_FORMAT_JS),
        node("Gmail · Email Alert", "n8n-nodes-base.gmail", 2.1, (480, 300), {
            "sendTo": ALERT_EMAIL,
            "subject": "={{ $json.subject }}",
            "emailType": "text",
            "message": "={{ $json.body }}",
            "options": {"appendAttribution": False},
        }),
    ]
    return {
        "id": ERROR_WORKFLOW_ID,
        "name": "Vantora · Error Handler",
        "nodes": nodes,
        "connections": {
            "On Workflow Error": {"main": [[{"node": "Format Alert", "type": "main", "index": 0}]]},
            "Format Alert": {"main": [[{"node": "Gmail · Email Alert", "type": "main", "index": 0}]]},
        },
        "active": False,
        "settings": {"executionOrder": "v1"},
        "pinData": {},
    }


if __name__ == "__main__":
    OUT.mkdir(exist_ok=True)
    for fname, wf in (("lead-qualification-agent.json", build_main()),
                      ("error-handler.json", build_error())):
        (OUT / fname).write_text(json.dumps(wf, indent=2, ensure_ascii=False), encoding="utf-8")
        print(f"wrote workflows/{fname} ({len(wf['nodes'])} nodes)")
