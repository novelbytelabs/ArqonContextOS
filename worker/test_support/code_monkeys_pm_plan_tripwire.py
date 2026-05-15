#!/usr/bin/env python3
from pathlib import Path
import json, sys
root=Path.cwd()
req=["worker/src/pm_plan.ts","worker/src/index.ts","worker/test_support/code_monkeys_pm_plan_offline_smoke.ts","worker/test_support/code_monkeys_pm_plan_live_smoke.ts","worker/test_support/code_monkeys_pm_plan_policy_unit.ts"]
missing=[p for p in req if not (root/p).exists()]
if missing: print(json.dumps({"ok":False,"missing":missing},indent=2)); sys.exit(1)
pm=(root/"worker/src/pm_plan.ts").read_text(); idx=(root/"worker/src/index.ts").read_text(); off=(root/"worker/test_support/code_monkeys_pm_plan_offline_smoke.ts").read_text(); live=(root/"worker/test_support/code_monkeys_pm_plan_live_smoke.ts").read_text()
checks=[("route mounted","/v1/pm/plan" in idx and "handlePmPlanRequest" in idx),("PM only",'role !== "PM_AI"' in pm and "PM_PLAN_ROLE_FORBIDDEN" in pm),("spec context","generated_pm_specification_context.json" in pm and "loadSpecEntry" in pm),("validates spec","validateSpecRecord" in pm and "pm_specification_context.v0.1" in pm),("spec artifact validation","PM_PLAN_SPECIFICATION_ARTIFACT_TYPE_MISMATCH" in pm and "PM_PLAN_SPECIFICATION_ARTIFACT_SOURCE_MISMATCH" in pm),("writes plan only",'"plan"' in pm and '"tasks"' not in pm and '"coder_handoff"' not in pm),("idempotency","PM_PLAN_IDEMPOTENCY_CONFLICT" in pm),("promotion guard","PM_PLAN_FORBIDDEN_CLAIM_INCLUDED" in pm and "approved for release" in pm),("no science route","/v1/science/" not in pm),("diagnostic labels",all(x in pm for x in ["REQUIRES_HUMAN_REVIEW","development diagnostic only","NOT SEALED-TEST CERTIFIED","not promotable"])),("offline denial", "PM_PLAN_ROLE_FORBIDDEN" in off and "HUMAN" in off),("offline no downstream", "PM plan must not create tasks" in off and "PM plan must not create coder_handoff" in off),("live smoke markers", "PM_PLAN_SPECIFICATION_ID" in live and "PM_PLAN_IDEMPOTENCY_CONFLICT" in live)]
fail=[n for n,ok in checks if not ok]
if fail: print(json.dumps({"ok":False,"result":"FAIL","failures":fail},indent=2)); sys.exit(1)
print(json.dumps({"ok":True,"result":"PASS","checks":[n for n,_ in checks]},indent=2))
