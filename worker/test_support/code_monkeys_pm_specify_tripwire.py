#!/usr/bin/env python3
from pathlib import Path
import json
import sys

ROOT = Path.cwd()
REQUIRED = [
    "worker/src/pm_specify.ts",
    "worker/src/index.ts",
    "worker/test_support/code_monkeys_pm_specify_offline_smoke.ts",
    "worker/test_support/code_monkeys_pm_specify_live_smoke.ts",
    "worker/test_support/code_monkeys_pm_specify_policy_unit.ts",
]
missing = [p for p in REQUIRED if not (ROOT / p).exists()]
if missing:
    print(json.dumps({"ok": False, "missing": missing}, indent=2))
    sys.exit(1)

pm = (ROOT / "worker/src/pm_specify.ts").read_text(encoding="utf-8")
index = (ROOT / "worker/src/index.ts").read_text(encoding="utf-8")
offline = (ROOT / "worker/test_support/code_monkeys_pm_specify_offline_smoke.ts").read_text(encoding="utf-8")
live = (ROOT / "worker/test_support/code_monkeys_pm_specify_live_smoke.ts").read_text(encoding="utf-8")

checks = [
    ("route mounted", "/v1/pm/specify" in index and "handlePmSpecifyRequest" in index),
    ("PM only", 'role !== "PM_AI"' in pm and "PM_SPECIFY_ROLE_FORBIDDEN" in pm),
    ("uses intake context", "generated_pm_intake_context.json" in pm and "loadPMIntakeContextEntry" in pm),
    ("validates intake record", "validateIntakeRecord" in pm and "code_monkeys_pm_intake.v0.1" in pm),
    ("validates intake artifacts", "validateExpectedIntakeArtifact" in pm and "PM_SPECIFY_INTAKE_ARTIFACT_TYPE_MISMATCH" in pm),
    ("writes only specification artifact", '"specification"' in pm and '"plan"' not in pm and '"tasks"' not in pm),
    ("idempotency conflict", "PM_SPECIFY_IDEMPOTENCY_CONFLICT" in pm),
    ("forbidden promotion marker rejected", "PM_SPECIFY_FORBIDDEN_CLAIM_INCLUDED" in pm),
    ("broad promotion validator", "normalizeClaimText" in pm and "approvedForRelease" in pm and "releaseReady" in pm and "readyForProduction" in pm and "productionReadiness" in pm and "productReady" in pm),
    ("no science route call", "/v1/science/" not in pm),
    ("diagnostic labels", "REQUIRES_HUMAN_REVIEW" in pm and "NOT SEALED-TEST CERTIFIED" in pm and "not promotable" in pm),
    ("offline all-role denial", "deniedRoles" in offline and "SCIENCE_EXECUTOR_AI" in offline and "HUMAN" in offline),
    ("offline no science artifacts", "PM specify must not add Science artifacts" in offline),
    ("offline no plan/tasks", "PM specify must not create plan" in offline and "PM specify must not create tasks" in offline),
    ("live conflict and promotion tests", "changed PM specify payload conflicts" in live and "blockedPromotionBodies" in live and "This specification is certified." in live and "This is release-ready." in live),
]
failures = [name for name, ok in checks if not ok]
if failures:
    print(json.dumps({"ok": False, "result": "FAIL", "failures": failures}, indent=2))
    sys.exit(1)
print(json.dumps({"ok": True, "result": "PASS", "checks": [name for name, _ in checks]}, indent=2))
