#!/usr/bin/env python3
from pathlib import Path
import json
import sys

ROOT = Path.cwd()

required_files = [
    "worker/src/pm_intake.ts",
    "worker/src/index.ts",
    "worker/src/flow_policy.ts",
    "worker/test_support/code_monkeys_pm_intake_offline_smoke.ts",
    "worker/test_support/code_monkeys_pm_intake_live_smoke.ts",
    "worker/test_support/code_monkeys_pm_intake_policy_unit.ts",
]

missing = [p for p in required_files if not (ROOT / p).exists()]
if missing:
    print(json.dumps({"ok": False, "error": "missing files", "missing": missing}, indent=2))
    sys.exit(1)

pm = (ROOT / "worker/src/pm_intake.ts").read_text(encoding="utf-8")
index = (ROOT / "worker/src/index.ts").read_text(encoding="utf-8")
policy = (ROOT / "worker/src/flow_policy.ts").read_text(encoding="utf-8")
offline = (ROOT / "worker/test_support/code_monkeys_pm_intake_offline_smoke.ts").read_text(encoding="utf-8")
live = (ROOT / "worker/test_support/code_monkeys_pm_intake_live_smoke.ts").read_text(encoding="utf-8")

checks = [
    ("route mounted", "/v1/pm/intake" in index and "handlePmIntakeRequest" in index),
    ("PM only", 'role !== "PM_AI"' in pm and "PM_INTAKE_ROLE_FORBIDDEN" in pm),
    ("uses handoff context", "generated_pm_handoff_context.json" in pm and "loadPMHandoffContextEntry" in pm),
    ("validates handoff record", "validateHandoffRecord" in pm and "science_to_code_handoff.v0.1" in pm),
    ("validates code flow", "validateCodeFlowManifest" in pm and "code_flow" in pm),
    ("preserves forbidden claims", "forbidden_claims" in pm and "Hard Forbidden Claims" in pm),
    ("preserves uncertainty", "uncertainty" in pm),
    ("preserves share hash", "share_packet_hash" in pm),
    ("writes pm intake artifacts", '"pm_dossier"' in pm and '"pm_gate_definition"' in pm),
    ("does not write science route", "/v1/science/" not in pm),
    ("idempotency conflict", "PM_INTAKE_IDEMPOTENCY_CONFLICT" in pm),
    ("no spec/task generation", "not a specification" in pm and "Do not issue Coder tasks" in pm),
    ("policy slots", "pm_dossier" in policy and "pm_gate_definition" in policy),
    ("offline all role denial", "deniedRoles" in offline and "SCIENCE_EXECUTOR_AI" in offline and "HUMAN" in offline),
    ("offline no science writes", "PM intake must not add Science artifacts" in offline),
    ("offline no specs/tasks", "PM intake must not create specification" in offline and "PM intake must not create tasks" in offline),
    ("live conflict test", "changed PM intake payload conflicts" in live),
    ("diagnostic labels", "NOT SEALED-TEST CERTIFIED" in pm and "not promotable" in pm),
]

forbidden = [
    "BYPASS_AUTH",
    "SKIP_AUDIT",
    "SKIP_HUMAN_APPROVAL",
    "production ready",
    "sealed-test certified",
    "promotable status",
    "/v1/science/share",
]

failures = [name for name, ok in checks if not ok]
violations = []
for path in ["worker/src/pm_intake.ts", "worker/test_support/code_monkeys_pm_intake_offline_smoke.ts", "worker/test_support/code_monkeys_pm_intake_live_smoke.ts"]:
    text = (ROOT / path).read_text(encoding="utf-8")
    for phrase in forbidden:
        if phrase in text:
            violations.append([path, phrase])

if failures or violations:
    print(json.dumps({"ok": False, "result": "FAIL", "failures": failures, "violations": violations}, indent=2))
    sys.exit(1)

print(json.dumps({"ok": True, "result": "PASS", "checks": [name for name, _ in checks]}, indent=2))
