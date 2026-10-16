"""Fires sample leads at the n8n webhook for dry runs before recording.

Run:  python scripts/send_test_leads.py            (all leads)
      python scripts/send_test_leads.py hot        (one lead by key)
      python scripts/send_test_leads.py --url http://localhost:5678/webhook-test/lead-intake

Leads are sent 20s apart by default to stay under the Gemini free-tier rate limit
(override with --delay 0).
"""

import json
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone

URL = "http://localhost:5678/webhook/lead-intake"

# Names and people are fictional. Websites are public company homepages used only
# so the enrichment step has real HTML to read.
LEADS = {
    "hot": {
        "first_name": "Priya", "last_name": "Nair", "email": "priya.nair@posthog.com",
        "company": "PostHog", "website": "posthog.com", "job_title": "VP Revenue Operations",
        "company_size": "201–1,000", "crm": "HubSpot", "timeline": "This quarter",
        "message": "Our forecast misses by ~20% every quarter and reps track deals in spreadsheets.",
    },
    "warm": {
        "first_name": "Daniel", "last_name": "Okafor", "email": "daniel@cal.com",
        "company": "Cal.com", "website": "cal.com", "job_title": "Founder",
        "company_size": "11–50", "crm": "Other", "timeline": "Next 3–6 months",
        "message": "Exploring options as we build out our first sales team.",
    },
    "cold": {
        "first_name": "Sara", "last_name": "Malik", "email": "sara.bakes@gmail.com",
        "company": "Sweet Crumb Bakery", "website": "sweetcrumbbakery-demo.com", "job_title": "Owner",
        "company_size": "1–10", "crm": "None yet", "timeline": "Just exploring",
        "message": "Looking for something to track catering orders.",
    },
    "invalid": {"first_name": "", "email": "not-an-email"},
}


def send(key, url):
    payload = {**LEADS[key], "consent": True, "source": "test_script",
               "submitted_at": datetime.now(timezone.utc).isoformat()}
    req = urllib.request.Request(url, data=json.dumps(payload).encode(),
                                 headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            print(f"[{key:>7}] {r.status} {r.read().decode()}")
    except urllib.error.HTTPError as e:
        print(f"[{key:>7}] {e.code} {e.read().decode()}")
    except urllib.error.URLError as e:
        print(f"[{key:>7}] could not reach {url}: {e.reason}")


if __name__ == "__main__":
    args = sys.argv[1:]
    url, delay = URL, 20.0
    if "--url" in args:
        i = args.index("--url")
        url = args[i + 1]
        del args[i:i + 2]
    if "--delay" in args:
        i = args.index("--delay")
        delay = float(args[i + 1])
        del args[i:i + 2]
    keys = args or ["hot", "warm", "cold"]
    for n, k in enumerate(keys):
        if n:
            time.sleep(delay)
        send(k, url)
