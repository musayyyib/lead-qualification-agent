"""Rebuilds the workflows and deploys them to the running n8n container
without losing anything configured in the UI.

For each node it carries over from the live workflow: attached credentials,
the disabled flag, and the Google Sheets document. Then it imports, publishes
and restarts n8n.

Run:  python scripts/deploy.py
"""

import json
import os
import subprocess
import sys
import tempfile
import time
import urllib.request
from urllib.parse import urlparse
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONTAINER = "vantora-n8n"
ENV = {**os.environ, "MSYS_NO_PATHCONV": "1"}  # stop Git Bash rewriting container paths


def sh(*args, capture=True):
    r = subprocess.run(args, capture_output=capture, text=True, encoding="utf-8", env=ENV)
    if r.returncode != 0:
        sys.exit(f"command failed: {' '.join(args)}\n{r.stdout}\n{r.stderr}")
    return r.stdout


def live_workflow(wf_id):
    sh("docker", "exec", CONTAINER, "n8n", "export:workflow", f"--id={wf_id}", "--output=/tmp/live.json")
    data = json.loads(sh("docker", "exec", CONTAINER, "cat", "/tmp/live.json"))
    return data[0] if isinstance(data, list) else data


def merge(generated, live, pool):
    live_nodes = {n["name"]: n for n in live["nodes"]}
    for node in generated["nodes"]:
        old = live_nodes.get(node["name"])
        if not old:
            continue
        if old.get("credentials"):
            node["credentials"] = old["credentials"]
        if old.get("disabled"):
            node["disabled"] = True
        doc = old.get("parameters", {}).get("documentId")
        if node["type"] == "n8n-nodes-base.googleSheets" and doc and doc.get("value"):
            node["parameters"]["documentId"] = doc

    # New HTTP nodes (e.g. a fallback model) borrow the credential of a node calling the same API host.
    host = lambda n: urlparse(n.get("parameters", {}).get("url", "").lstrip("=")).netloc
    for node in generated["nodes"]:
        if node.get("credentials") or node["type"] != "n8n-nodes-base.httpRequest" or not host(node):
            continue
        donor = next((n for n in generated["nodes"] if n.get("credentials") and host(n) == host(node)), None)
        if donor:
            node["credentials"] = donor["credentials"]

    # Any node still without credentials borrows one of the same node type from either workflow
    # (e.g. the error handler's Gmail alert reuses the Gmail account connected on the draft node).
    for node in generated["nodes"]:
        if not node.get("credentials") and node["type"] in pool:
            node["credentials"] = pool[node["type"]]
    return generated


def deploy(fname, live, pool):
    generated = json.loads((ROOT / "workflows" / fname).read_text(encoding="utf-8"))
    wf = merge(generated, live[generated["id"]], pool)
    with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False, encoding="utf-8") as f:
        json.dump(wf, f, ensure_ascii=False)
    sh("docker", "cp", f.name, f"{CONTAINER}:/tmp/deploy.json")
    os.unlink(f.name)
    sh("docker", "exec", CONTAINER, "n8n", "import:workflow", "--input=/tmp/deploy.json")
    sh("docker", "exec", CONTAINER, "n8n", "publish:workflow", f"--id={wf['id']}")
    kept = [n["name"] for n in wf["nodes"] if n.get("credentials")]
    off = [n["name"] for n in wf["nodes"] if n.get("disabled")]
    print(f"deployed {wf['name']}\n  credentials kept: {', '.join(kept) or 'none'}\n  disabled: {', '.join(off) or 'none'}")


if __name__ == "__main__":
    sh(sys.executable, str(ROOT / "scripts" / "build_workflows.py"))
    files = ["error-handler.json", "lead-qualification-agent.json"]
    ids = [json.loads((ROOT / "workflows" / f).read_text(encoding="utf-8"))["id"] for f in files]
    live = {i: live_workflow(i) for i in ids}
    pool = {n["type"]: n["credentials"] for wf in live.values() for n in wf["nodes"]
            if n.get("credentials") and n["type"] != "n8n-nodes-base.httpRequest"}
    for f in files:
        deploy(f, live, pool)
    restarted_at = str(int(time.time()) - 1)  # only read log lines written after this restart
    sh("docker", "restart", CONTAINER)
    # Healthy is not enough: webhooks register a few seconds later, when the workflow activates.
    main_name = json.loads((ROOT / "workflows" / files[-1]).read_text(encoding="utf-8"))["name"]
    for _ in range(60):
        logs = subprocess.run(["docker", "logs", "--since", restarted_at, CONTAINER], capture_output=True,
                              text=True, encoding="utf-8", errors="replace", env=ENV)
        if f'Activated workflow "{main_name}"' in logs.stdout + logs.stderr:
            print("n8n restarted, workflow active, webhook ready")
            break
        time.sleep(2)
    else:
        print("warning: n8n did not report the workflow as active within 2 minutes; check `docker logs vantora-n8n`")
