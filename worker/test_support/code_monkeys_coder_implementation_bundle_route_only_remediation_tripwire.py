#!/usr/bin/env python3
from pathlib import Path
import json, sys
R=Path.cwd()
need=["worker/src/flows.ts","worker/src/coder_implementation_bundle.ts","worker/test_support/code_monkeys_coder_implementation_bundle_route_only_remediation_offline_smoke.ts"]
miss=[p for p in need if not (R/p).exists()]
if miss:
  print(json.dumps({"ok":False,"missing":miss},indent=2)); sys.exit(1)
flows=(R/"worker/src/flows.ts").read_text()
impl=(R/"worker/src/coder_implementation_bundle.ts").read_text()
smoke=(R/"worker/test_support/code_monkeys_coder_implementation_bundle_route_only_remediation_offline_smoke.ts").read_text()
checks=[
("route-only set", ("ROUTE_ONLY_CODE_ARTIFACTS" in flows or "ROUTE_ONLY_ARTIFACTS" in flows) and '"implementation_bundle"' in flows),
("generic blocked", "FLOW_ARTIFACT_ROUTE_REQUIRED" in flows and "!options.routeScoped" in flows),
("internal writer", "writeRouteScopedFlowArtifact" in flows),
("route uses internal writer", "writeRouteScopedFlowArtifact" in impl and "handleFlowsRequest" not in impl),
("dual-field mismatch", "Coder tasks context fields conflict" in impl and "CODER_IMPLEMENTATION_BUNDLE_TASKS_CONTEXT_MISMATCH" in impl),
("source sha", "CODER_IMPLEMENTATION_BUNDLE_TASKS_ARTIFACT_SHA_MISMATCH" in impl and "actual.source_sha !== expected.source_sha" in impl),
("bad existing record", "CODER_IMPLEMENTATION_BUNDLE_EXISTING_RECORD_INVALID" in impl),
("raw bypass test", "FLOW_ARTIFACT_ROUTE_REQUIRED" in smoke and "raw CODER implementation_bundle must be blocked" in smoke),
("required labels", all(x in (R/"docs/04_flows_and_spec_kit/CODE_MONKEYS_CODER_IMPLEMENTATION_BUNDLE_ROUTE_ONLY_REMEDIATION_001.md").read_text() for x in ["REQUIRES_HUMAN_REVIEW","development diagnostic only","NOT SEALED-TEST CERTIFIED","not promotable"])),
]
bad=[n for n,o in checks if not o]
print(json.dumps({"ok":not bad,"result":"PASS" if not bad else "FAIL","failures":bad,"checks":[n for n,_ in checks]},indent=2))
sys.exit(1 if bad else 0)
