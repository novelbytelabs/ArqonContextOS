#!/usr/bin/env python3
from pathlib import Path
import json
import sys

ROOT = Path.cwd()
required_files = [
    "worker/src/pm_handoff.ts",
    "worker/src/index.ts",
    "worker/src/flow_policy.ts",
    "worker/test_support/science_to_code_handoff_offline_smoke.ts",
    "worker/test_support/science_to_code_handoff_live_smoke.ts",
    "worker/test_support/science_to_code_handoff_policy_unit.ts",
]

missing = [p for p in required_files if not (ROOT / p).exists()]
if missing:
    print(json.dumps({"ok": False, "error": "missing files", "missing": missing}, indent=2))
    sys.exit(1)

pm = (ROOT / "worker/src/pm_handoff.ts").read_text(encoding="utf-8")
index = (ROOT / "worker/src/index.ts").read_text(encoding="utf-8")
policy = (ROOT / "worker/src/flow_policy.ts").read_text(encoding="utf-8")
offline = (ROOT / "worker/test_support/science_to_code_handoff_offline_smoke.ts").read_text(encoding="utf-8")
live = (ROOT / "worker/test_support/science_to_code_handoff_live_smoke.ts").read_text(encoding="utf-8")

checks = [
    ("route mounted", "/v1/pm/handoff" in index and "handlePmHandoffRequest" in index),
    ("PM only", 'role !== "PM_AI"' in pm and "PM_HANDOFF_ROLE_FORBIDDEN" in pm),
    ("reads generated PM share context", "generated_pm_share_context.json" in pm),
    ("validates share record", "validateShareRecord" in pm and "server_authenticated_human" in pm),
    ("preserves forbidden claims", "forbidden_claims" in pm and "Hard Forbidden Claims" in pm),
    ("preserves uncertainty", "uncertainty" in pm),
    ("preserves share hash", "share_packet_hash" in pm),
    ("writes code artifacts", "handoff_intake" in pm and "dossier_seed" in pm),
    ("does not write science route", "/v1/science/" not in pm),
    ("handoff idempotency conflict", "PM_HANDOFF_IDEMPOTENCY_CONFLICT" in pm),
    ("code policy slots", "handoff_intake" in policy and "dossier_seed" in policy),
    ("offline non-PM deny", "HELPER_AI" in offline and "PM_HANDOFF_ROLE_FORBIDDEN" in offline),
    ("offline no science writes", "PM handoff must not add Science artifacts" in offline),
    ("live conflict test", "changed PM handoff payload conflicts" in live),
    ("diagnostic labels", "NOT SEALED-TEST CERTIFIED" in pm and "not promotable" in pm),
]

forbidden = ["BYPASS_AUTH", "SKIP_AUDIT", "SKIP_HUMAN_APPROVAL", "production ready", "sealed-test certified", "promotable status"]
failures = [name for name, ok in checks if not ok]
violations = []
for path in ["worker/src/pm_handoff.ts", "worker/test_support/science_to_code_handoff_offline_smoke.ts", "worker/test_support/science_to_code_handoff_live_smoke.ts"]:
    text = (ROOT / path).read_text(encoding="utf-8")
    for phrase in forbidden:
        if phrase in text:
            violations.append([path, phrase])

if failures or violations:
    print(json.dumps({"ok": False, "result": "FAIL", "failures": failures, "violations": violations}, indent=2))
    sys.exit(1)

print(json.dumps({"ok": True, "result": "PASS", "checks": [name for name, _ in checks]}, indent=2))
