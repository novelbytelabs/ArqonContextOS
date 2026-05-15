#!/usr/bin/env python3
from pathlib import Path
import json
import sys

ROOT = Path.cwd()
REQUIRED = [
    "worker/src/pm_tasking.ts",
    "worker/src/index.ts",
    "worker/src/flow_policy.ts",
    "worker/test_support/code_monkeys_pm_tasking_offline_smoke.ts",
    "worker/test_support/code_monkeys_pm_tasking_live_smoke.ts",
    "worker/test_support/code_monkeys_pm_tasking_policy_unit.ts",
]
missing = [p for p in REQUIRED if not (ROOT / p).exists()]
if missing:
    print(json.dumps({"ok": False, "missing": missing}, indent=2))
    sys.exit(1)

pm = (ROOT / "worker/src/pm_tasking.ts").read_text(encoding="utf-8")
index = (ROOT / "worker/src/index.ts").read_text(encoding="utf-8")
policy = (ROOT / "worker/src/flow_policy.ts").read_text(encoding="utf-8")
offline = (ROOT / "worker/test_support/code_monkeys_pm_tasking_offline_smoke.ts").read_text(encoding="utf-8")
live = (ROOT / "worker/test_support/code_monkeys_pm_tasking_live_smoke.ts").read_text(encoding="utf-8")

checks = [
    ("route mounted", "/v1/pm/tasking" in index and "handlePmTaskingRequest" in index),
    ("PM only", 'role !== "PM_AI"' in pm and "PM_TASKING_ROLE_FORBIDDEN" in pm),
    ("uses plan context", "generated_pm_plan_context.json" in pm and "loadPMPlanContextEntry" in pm),
    ("validates plan record", "validatePlanRecord" in pm and "pm_plan_context.v0.1" in pm),
    ("validates plan artifact", "validateExpectedPlanArtifact" in pm and "PM_TASKING_PLAN_ARTIFACT_TYPE_MISMATCH" in pm),
    ("writes pm_tasking only", '"pm_tasking"' in pm and '"coder_handoff"' not in pm and '"execution_report"' not in pm),
    ("idempotency", "PM_TASKING_IDEMPOTENCY_CONFLICT" in pm),
    ("promotion guard", "PM_TASKING_FORBIDDEN_CLAIM_INCLUDED" in pm and "makeWordPattern" in pm and "makePackedPattern" in pm),
    ("implementation authority guard", "PM_TASKING_IMPLEMENTATION_AUTHORITY_FORBIDDEN" in pm and "coder may begin" in pm and "helper may execute" in pm),
    ("no science route", "/v1/science/" not in pm),
    ("diagnostic labels", "REQUIRES_HUMAN_REVIEW" in pm and "NOT SEALED-TEST CERTIFIED" in pm and "not promotable" in pm),
    ("policy PM owns pm_tasking", '"pm_tasking"' in policy and 'PM_AI: ["pm_dossier", "constitution", "specification", "plan", "pm_tasking"' in policy),
    ("policy PM not generic tasks", 'PM_AI: ["pm_dossier", "constitution", "specification", "plan", "pm_tasking", "pm_spec", "pm_gate_definition", "handoff_intake", "dossier_seed"]' in policy),
    ("policy Coder owns implementation tasks", 'CODER_AI: ["tasks", "coder_work_plan", "coder_tasks", "implementation_bundle", "coder_patch_bundle", "coder_handoff"]' in policy),
    ("offline denial", "deniedRoles" in offline and "SCIENCE_EXECUTOR_AI" in offline and "HUMAN" in offline),
    ("offline no downstream", "PM tasking must not create coder_handoff" in offline and "PM tasking must not create Helper execution" in offline),
    ("live conflict guards", "changed PM tasking payload conflicts" in live and "implementation authority denied" in live),
]
failures = [name for name, ok in checks if not ok]
if failures:
    print(json.dumps({"ok": False, "result": "FAIL", "failures": failures}, indent=2))
    sys.exit(1)
print(json.dumps({"ok": True, "result": "PASS", "checks": [name for name, _ in checks]}, indent=2))
