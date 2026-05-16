#!/usr/bin/env python3
from pathlib import Path
import json
import re
import sys

ROOT = Path.cwd()
flows_path = ROOT / "worker/src/flows.ts"
smoke_path = ROOT / "worker/test_support/code_monkeys_human_authority_cross_flow_hardening_offline_smoke.ts"
doc_path = ROOT / "docs/04_flows_and_spec_kit/HUMAN_AUTHORITY_CROSS_FLOW_HARDENING_001.md"

missing = [str(p.relative_to(ROOT)) for p in [flows_path, smoke_path, doc_path] if not p.exists()]
if missing:
    print(json.dumps({"ok": False, "result": "FAIL", "missing": missing}, indent=2))
    sys.exit(1)

flows = flows_path.read_text(encoding="utf-8")
smoke = smoke_path.read_text(encoding="utf-8")
doc = doc_path.read_text(encoding="utf-8")

def route_only_flows(artifact: str) -> set[str]:
    pattern = re.compile(rf"(^|\n)\s*{re.escape(artifact)}\s*:\s*\[([^\]]*)\]\s*,?", re.MULTILINE)
    match = pattern.search(flows)
    if not match:
        return set()
    return set(re.findall(r'["\']([a-z_]+)["\']', match.group(2)))

expected = {
    "human_decision": {"science_flow", "code_flow", "audit_flow", "governance_flow"},
    "advancement_approval": {"science_flow", "code_flow", "audit_flow", "governance_flow"},
    "promotion_decision": {"code_flow", "governance_flow"},
    "human_advancement_decision": {"code_flow"},
}

checks = []
for artifact, flows_expected in expected.items():
    actual = route_only_flows(artifact)
    checks.append((f"{artifact} route-only flows", actual == flows_expected))
    checks.append((f"{artifact} covered in smoke", artifact in smoke))

checks.extend([
    ("route-only error asserted", "FLOW_ARTIFACT_ROUTE_REQUIRED" in smoke),
    ("science executor regression asserted", "science execution_report should remain writable" in smoke and "science raw_result_index should remain writable" in smoke),
    ("no promotion/cert/deploy scope", "no certification" in doc and "no deployment" in doc and "no promotion" in doc),
    ("required labels", all(label in doc for label in ["REQUIRES_HUMAN_REVIEW", "development diagnostic only", "NOT SEALED-TEST CERTIFIED", "not promotable"])),
])

failures = [name for name, ok in checks if not ok]
print(json.dumps({
    "ok": not failures,
    "result": "PASS" if not failures else "FAIL",
    "failures": failures,
    "route_only_flows": {artifact: sorted(route_only_flows(artifact)) for artifact in expected},
    "checks": [{"name": name, "ok": ok} for name, ok in checks],
}, indent=2))
sys.exit(1 if failures else 0)
