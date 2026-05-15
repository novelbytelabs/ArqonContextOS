#!/usr/bin/env python3
from pathlib import Path
import json
import sys

ROOT = Path.cwd()
REQUIRED = [
    "worker/src/coder_implementation_bundle.ts",
    "worker/src/index.ts",
    "worker/src/flow_policy.ts",
    "worker/test_support/code_monkeys_coder_implementation_bundle_offline_smoke.ts",
    "worker/test_support/code_monkeys_coder_implementation_bundle_live_smoke.ts",
    "worker/test_support/code_monkeys_coder_implementation_bundle_policy_unit.ts",
]
missing = [p for p in REQUIRED if not (ROOT / p).exists()]
if missing:
    print(json.dumps({"ok": False, "result": "FAIL", "missing": missing}, indent=2))
    sys.exit(1)

source = (ROOT / "worker/src/coder_implementation_bundle.ts").read_text(encoding="utf-8")
index = (ROOT / "worker/src/index.ts").read_text(encoding="utf-8")
policy = (ROOT / "worker/src/flow_policy.ts").read_text(encoding="utf-8")
offline = (ROOT / "worker/test_support/code_monkeys_coder_implementation_bundle_offline_smoke.ts").read_text(encoding="utf-8")
live = (ROOT / "worker/test_support/code_monkeys_coder_implementation_bundle_live_smoke.ts").read_text(encoding="utf-8")
openapi = (ROOT / "openapi/arqon_contextos.openapi.yaml").read_text(encoding="utf-8") if (ROOT / "openapi/arqon_contextos.openapi.yaml").exists() else ""

checks = [
    ("route mounted", "/v1/coder/implementation-bundle" in index and "handleCoderImplementationBundleRequest" in index),
    ("Coder only", 'role !== "CODER_AI"' in source and "CODER_IMPLEMENTATION_BUNDLE_ROLE_FORBIDDEN" in source),
    ("uses Coder tasks context", "generated_coder_tasks_context.json" in source and "loadCoderTasksContextEntry" in source),
    ("validates tasks record", "validateCoderTasksRecord" in source and "coder_tasks_context.v0.1" in source),
    ("validates coder_tasks artifact", "validateExpectedCoderTasksArtifact" in source and "CODER_IMPLEMENTATION_BUNDLE_TASKS_ARTIFACT_TYPE_MISMATCH" in source),
    ("requires coder_tasks not generic tasks", 'actual.artifact_type !== "coder_tasks"' in source and '"tasks"' not in source),
    ("writes implementation_bundle only", '"implementation_bundle"' in source and '"coder_handoff"' not in source and '"execution_report"' not in source),
    ("idempotency", "CODER_IMPLEMENTATION_BUNDLE_IDEMPOTENCY_CONFLICT" in source),
    ("promotion guard", "CODER_IMPLEMENTATION_BUNDLE_FORBIDDEN_CLAIM_INCLUDED" in source and "approved for release" in source),
    ("execution authority guard", "CODER_IMPLEMENTATION_BUNDLE_EXECUTION_AUTHORITY_FORBIDDEN" in source and "helper may execute" in source and "apply the patch" in source),
    ("no science route", "/v1/science/" not in source),
    ("diagnostic labels", "REQUIRES_HUMAN_REVIEW" in source and "NOT SEALED-TEST CERTIFIED" in source and "not promotable" in source),
    ("policy Coder owns implementation_bundle", 'CODER_AI: ["tasks", "coder_work_plan", "coder_tasks", "implementation_bundle"' in policy),
    ("policy PM not implementation_bundle", 'PM_AI: ["pm_dossier", "constitution", "specification", "plan", "pm_tasking"' in policy),
    ("offline denial", "deniedRoles" in offline and "PM_AI" in offline and "HELPER_AI" in offline and "HUMAN" in offline),
    ("offline no downstream", "Implementation bundle must not create coder_handoff" in offline and "Implementation bundle must not create Helper execution" in offline),
    ("live conflict guards", "changed implementation bundle payload conflicts" in live and "execution authority denied" in live),
    ("openapi route present", "\n  /v1/coder/implementation-bundle:" in openapi),
]
failures = [name for name, ok in checks if not ok]
if failures:
    print(json.dumps({"ok": False, "result": "FAIL", "failures": failures}, indent=2))
    sys.exit(1)

print(json.dumps({"ok": True, "result": "PASS", "checks": [name for name, _ in checks]}, indent=2))
