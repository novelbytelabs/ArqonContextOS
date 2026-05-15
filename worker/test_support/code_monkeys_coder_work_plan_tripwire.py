#!/usr/bin/env python3
from pathlib import Path
import json, sys
ROOT = Path.cwd()
required = [
    "worker/src/coder_work_plan.ts", "worker/src/index.ts", "worker/src/flow_policy.ts",
    "worker/test_support/code_monkeys_coder_work_plan_offline_smoke.ts",
    "worker/test_support/code_monkeys_coder_work_plan_live_smoke.ts",
    "worker/test_support/code_monkeys_coder_work_plan_policy_unit.ts",
]
missing = [p for p in required if not (ROOT / p).exists()]
if missing:
    print(json.dumps({"ok": False, "result": "FAIL", "missing": missing}, indent=2)); sys.exit(1)
source = (ROOT / "worker/src/coder_work_plan.ts").read_text()
index = (ROOT / "worker/src/index.ts").read_text()
policy = (ROOT / "worker/src/flow_policy.ts").read_text()
offline = (ROOT / "worker/test_support/code_monkeys_coder_work_plan_offline_smoke.ts").read_text()
live = (ROOT / "worker/test_support/code_monkeys_coder_work_plan_live_smoke.ts").read_text()
checks = [
    ("route mounted", "/v1/coder/work-plan" in index and "handleCoderWorkPlanRequest" in index),
    ("Coder only", 'role !== "CODER_AI"' in source and "CODER_WORK_PLAN_ROLE_FORBIDDEN" in source),
    ("uses PM tasking context", "generated_pm_tasking_context.json" in source and "loadTaskingEntry" in source),
    ("validates tasking record", "validateTaskingRecord" in source and "pm_tasking_context.v0.1" in source),
    ("validates pm_tasking artifact", "validateManifest" in source and "CODER_WORK_PLAN_TASKING_ARTIFACT_TYPE_MISMATCH" in source),
    ("writes only coder_work_plan", '"coder_work_plan"' in source and '"implementation_bundle"' not in source and '"coder_handoff"' not in source and '"execution_report"' not in source),
    ("idempotency", "CODER_WORK_PLAN_IDEMPOTENCY_CONFLICT" in source),
    ("promotion guard", "CODER_WORK_PLAN_FORBIDDEN_CLAIM_INCLUDED" in source and "approved for release" in source),
    ("execution authority guard", "CODER_WORK_PLAN_EXECUTION_AUTHORITY_FORBIDDEN" in source and "helper may execute" in source and "apply the patch" in source),
    ("no science route", "/v1/science/" not in source),
    ("diagnostic labels", "REQUIRES_HUMAN_REVIEW" in source and "NOT SEALED-TEST CERTIFIED" in source and "not promotable" in source),
    ("policy Coder owns coder_work_plan", 'CODER_AI: ["tasks", "coder_work_plan", "coder_tasks", "implementation_bundle", "coder_patch_bundle", "coder_handoff"]' in policy),
    ("policy PM not coder_work_plan", 'PM_AI: ["pm_dossier", "constitution", "specification", "plan", "pm_tasking"' in policy),
    ("offline denial", "deniedRoles" in offline and "PM_AI" in offline and "HELPER_AI" in offline and "HUMAN" in offline),
    ("offline no downstream", "Coder work plan must not create implementation_bundle" in offline and "Coder work plan must not create coder_handoff" in offline and "Coder work plan must not create Helper execution" in offline),
    ("live conflict guards", "changed Coder work plan payload conflicts" in live and "execution authority denied" in live),
]
failures = [name for name, ok in checks if not ok]
if failures:
    print(json.dumps({"ok": False, "result": "FAIL", "failures": failures}, indent=2)); sys.exit(1)
print(json.dumps({"ok": True, "result": "PASS", "checks": [name for name, _ in checks]}, indent=2))
