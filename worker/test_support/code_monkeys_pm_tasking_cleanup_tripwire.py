#!/usr/bin/env python3
from pathlib import Path
import json
import sys

ROOT = Path.cwd()
required = [
    "worker/src/index.ts",
    "worker/src/flow_policy.ts",
    "worker/test_support/code_monkeys_pm_tasking_cleanup_offline_smoke.ts",
    "worker/test_support/code_monkeys_pm_tasking_cleanup_tripwire.py",
    "docs/04_flows_and_spec_kit/CODE_MONKEYS_PM_TASKING_CLEANUP_001.md",
]
missing = [p for p in required if not (ROOT / p).exists()]
if missing:
    print(json.dumps({"ok": False, "result": "FAIL", "missing": missing}, indent=2))
    sys.exit(1)

index = (ROOT / "worker/src/index.ts").read_text(encoding="utf-8")
policy = (ROOT / "worker/src/flow_policy.ts").read_text(encoding="utf-8")
offline = (ROOT / "worker/test_support/code_monkeys_pm_tasking_cleanup_offline_smoke.ts").read_text(encoding="utf-8")
doc = (ROOT / "docs/04_flows_and_spec_kit/CODE_MONKEYS_PM_TASKING_CLEANUP_001.md").read_text(encoding="utf-8")

checks = [
    ("old pm_tasks import removed", 'handlePmTasksRequest' not in index),
    ("old pm_tasks source import removed", '"./pm_tasks"' not in index),
    ("old pm_tasks handler call removed", 'return handlePmTasksRequest' not in index),
    ("retired route explicit", 'PM_TASKS_ROUTE_RETIRED_USE_PM_TASKING' in index),
    ("pm tasking route remains", '/v1/pm/tasking' in index and 'handlePmTaskingRequest' in index),
    ("PM owns pm_tasking", 'PM_AI: ["pm_dossier", "constitution", "specification", "plan", "pm_tasking"' in policy),
    ("PM does not own generic tasks", 'PM_AI: ["pm_dossier", "constitution", "specification", "plan", "pm_tasking", "pm_spec", "pm_gate_definition", "handoff_intake", "dossier_seed"]' in policy),
    ("Coder owns implementation decomposition", 'CODER_AI: ["tasks", "coder_work_plan", "coder_tasks", "implementation_bundle", "coder_patch_bundle", "coder_handoff"]' in policy),
    ("offline checks retired route", 'PM_TASKS_ROUTE_RETIRED_USE_PM_TASKING' in offline and '/v1/pm/tasks' in offline),
    ("doc labels", all(label in doc for label in [
        "REQUIRES_HUMAN_REVIEW",
        "development diagnostic only",
        "NOT SEALED-TEST CERTIFIED",
        "not promotable"
    ])),
]
failures = [name for name, ok in checks if not ok]
if failures:
    print(json.dumps({"ok": False, "result": "FAIL", "failures": failures}, indent=2))
    sys.exit(1)

print(json.dumps({"ok": True, "result": "PASS", "checks": [name for name, _ in checks]}, indent=2))
