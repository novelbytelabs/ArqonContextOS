#!/usr/bin/env python3
from pathlib import Path
import json
import re
import sys

ROOT = Path.cwd()
flows_path = ROOT / "worker/src/flows.ts"
smoke_path = ROOT / "worker/test_support/code_monkeys_post_human_advancement_boundary_hardening_offline_smoke.ts"
doc_path = ROOT / "docs/04_flows_and_spec_kit/POST_HUMAN_ADVANCEMENT_BOUNDARY_HARDENING_001.md"

missing = [str(p.relative_to(ROOT)) for p in [flows_path, smoke_path, doc_path] if not p.exists()]
if missing:
    print(json.dumps({"ok": False, "result": "FAIL", "missing": missing}, indent=2))
    sys.exit(1)

flows = flows_path.read_text(encoding="utf-8")
smoke = smoke_path.read_text(encoding="utf-8")
doc = doc_path.read_text(encoding="utf-8")

def route_only_on_code_flow(artifact: str) -> bool:
    # Match a normal object entry, allowing whitespace and trailing comma.
    pattern = re.compile(
        rf"(^|\n)\s*{re.escape(artifact)}\s*:\s*\[\s*[\"']code_flow[\"']\s*\]\s*,?",
        re.MULTILINE,
    )
    return pattern.search(flows) is not None

checks = []
for artifact in ["human_decision", "advancement_approval", "promotion_decision", "human_advancement_decision"]:
    checks.append((f"{artifact} route-only in flows", route_only_on_code_flow(artifact)))
    checks.append((f"{artifact} covered in smoke", artifact in smoke))

checks.extend([
    ("route-only error asserted", "FLOW_ARTIFACT_ROUTE_REQUIRED" in smoke),
    ("science regression asserted", "science execution_report should remain writable" in smoke and "science raw_result_index should remain writable" in smoke),
    ("no promotion/cert/deploy scope", "no certification" in doc and "no deployment" in doc and "no promotion" in doc),
    ("required labels", all(label in doc for label in ["REQUIRES_HUMAN_REVIEW", "development diagnostic only", "NOT SEALED-TEST CERTIFIED", "not promotable"])),
])

failures = [name for name, ok in checks if not ok]
print(json.dumps({
    "ok": not failures,
    "result": "PASS" if not failures else "FAIL",
    "failures": failures,
    "checks": [{"name": name, "ok": ok} for name, ok in checks],
}, indent=2))
sys.exit(1 if failures else 0)
