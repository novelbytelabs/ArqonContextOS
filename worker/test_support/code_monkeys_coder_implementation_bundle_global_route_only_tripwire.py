#!/usr/bin/env python3
from pathlib import Path
import json
import sys

ROOT = Path.cwd()
required = [
  "worker/src/flows.ts",
  "worker/test_support/code_monkeys_coder_implementation_bundle_global_route_only_offline_smoke.ts",
  "docs/04_flows_and_spec_kit/CODE_MONKEYS_CODER_IMPLEMENTATION_BUNDLE_GLOBAL_ROUTE_ONLY_REMEDIATION_002.md",
  "docs/01_monkeyos_doctrine/AUDITOR_PANEL_MODE_001.md",
  "docs/01_monkeyos_doctrine/MDASH_IMPACT_ON_MONKEYOS_001.md",
  "docs/09_benchmarks/CYBERGYM_BENCHMARK_TRACK_001.md"
]
missing = [p for p in required if not (ROOT / p).exists()]
if missing:
    print(json.dumps({"ok": False, "result": "FAIL", "missing": missing}, indent=2))
    sys.exit(1)

flows = (ROOT / "worker/src/flows.ts").read_text(encoding="utf-8")
smoke = (ROOT / "worker/test_support/code_monkeys_coder_implementation_bundle_global_route_only_offline_smoke.ts").read_text(encoding="utf-8")
route_doc = (ROOT / "docs/04_flows_and_spec_kit/CODE_MONKEYS_CODER_IMPLEMENTATION_BUNDLE_GLOBAL_ROUTE_ONLY_REMEDIATION_002.md").read_text(encoding="utf-8")
auditor_doc = (ROOT / "docs/01_monkeyos_doctrine/AUDITOR_PANEL_MODE_001.md").read_text(encoding="utf-8")
mdash_doc = (ROOT / "docs/01_monkeyos_doctrine/MDASH_IMPACT_ON_MONKEYOS_001.md").read_text(encoding="utf-8")
cybergym_doc = (ROOT / "docs/09_benchmarks/CYBERGYM_BENCHMARK_TRACK_001.md").read_text(encoding="utf-8")

checks = [
  ("global route-only set", "ROUTE_ONLY_ARTIFACTS" in flows and '"implementation_bundle"' in flows),
  ("no code-flow-only route-only condition", 'manifest.type === "code_flow" && ROUTE_ONLY_ARTIFACTS.has(artifactType)' not in flows),
  ("generic route-only check exists", "ROUTE_ONLY_ARTIFACTS.has(artifactType) && !options.routeScoped" in flows),
  ("route-required error exists", "FLOW_ARTIFACT_ROUTE_REQUIRED" in flows),
  ("smoke tests code_flow", '"code_flow"' in smoke and "FLOW-2026-9998" in smoke),
  ("smoke tests governance_flow", '"governance_flow"' in smoke and "FLOW-2026-9999" in smoke),
  ("smoke expects governance route-required", "governance_flow CODER expected FLOW_ARTIFACT_ROUTE_REQUIRED" in smoke),
  ("status labels", all(label in route_doc for label in ["REQUIRES_HUMAN_REVIEW", "development diagnostic only", "NOT SEALED-TEST CERTIFIED", "not promotable"])),
  ("auditor panel doc", "Primary Auditor" in auditor_doc and "Bypass Auditor" in auditor_doc and "Boundary Judge" in auditor_doc),
  ("MDASH doc", "Boundary Prover" in mdash_doc and "The harness is the product" in mdash_doc),
  ("CyberGym doc", "CyberGym Benchmark Track 001" in cybergym_doc)
]
failures = [name for name, ok in checks if not ok]
print(json.dumps({"ok": not failures, "result": "PASS" if not failures else "FAIL", "failures": failures, "checks": [name for name, _ in checks]}, indent=2))
sys.exit(1 if failures else 0)
