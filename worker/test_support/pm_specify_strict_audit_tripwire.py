#!/usr/bin/env python3
import json
import shutil
import sys
import tempfile
from pathlib import Path

REQUIRED = [
    "worker/src/pm_specify.ts",
    "worker/src/index.ts",
    "worker/src/flow_policy.ts",
    "worker/src/pm_intake.ts",
    "worker/test_support/code_monkeys_pm_specify_offline_smoke.ts",
    "worker/test_support/code_monkeys_pm_specify_live_smoke.ts",
    "worker/test_support/build_pm_specify_audit_bundle.py",
    "openapi/arqon_contextos.openapi.yaml",
]
BROAD_MARKERS = [
    "normalizeClaimText",
    "sealedTestCertified",
    "certification",
    "productionReady",
    "productionReadiness",
    "readyForProduction",
    "productReady",
    "promotableStatus",
    "approvedForRelease",
    "releaseReady",
]



def fail(msg, details=None):
    print(json.dumps({"ok": False, "result": "FAIL", "error": msg, "details": details or []}, indent=2))
    sys.exit(1)


def read(root, rel):
    p = root / rel
    if not p.exists():
        fail("missing required file", [rel])
    return p.read_text(encoding="utf-8", errors="ignore")


def main():
    if len(sys.argv) != 2:
        fail("usage: python3 worker/test_support/pm_specify_strict_audit_tripwire.py /path/to/root")
    src = Path(sys.argv[1]).resolve()
    with tempfile.TemporaryDirectory(prefix="pm-specify-strict-") as td:
        root = Path(td) / "sut"
        shutil.copytree(src, root)
        data = {rel: read(root, rel) for rel in REQUIRED}
        pm = data["worker/src/pm_specify.ts"]
        index = data["worker/src/index.ts"]
        offline = data["worker/test_support/code_monkeys_pm_specify_offline_smoke.ts"]
        live = data["worker/test_support/code_monkeys_pm_specify_live_smoke.ts"]
        builder = data["worker/test_support/build_pm_specify_audit_bundle.py"]
        openapi = data["openapi/arqon_contextos.openapi.yaml"]
        checks = [
            ("route mounted", "/v1/pm/specify" in index and "handlePmSpecifyRequest" in index),
            ("PM only", 'role !== "PM_AI"' in pm and "PM_SPECIFY_ROLE_FORBIDDEN" in pm),
            ("auth before body", pm.find("const role = requireRole(request, env);") < pm.find("const body = await readJsonBody(request);")),
            ("uses intake context", "generated_pm_intake_context.json" in pm and "loadPMIntakeContextEntry" in pm),
            ("validates intake", "code_monkeys_pm_intake.v0.1" in pm and "validateIntakeRecord" in pm),
            ("spec only", '"specification"' in pm and '"plan"' not in pm and '"tasks"' not in pm),
            ("idempotency conflict", "PM_SPECIFY_IDEMPOTENCY_CONFLICT" in pm),
            ("no science route", "/v1/science/" not in pm),
            ("diagnostic labels", all(x in pm for x in ["REQUIRES_HUMAN_REVIEW", "development diagnostic only", "NOT SEALED-TEST CERTIFIED", "not promotable"])),
            ("broad promotion validator", all(marker in pm for marker in BROAD_MARKERS) and "forbiddenPatterns" in pm and "new RegExp" in pm),
            ("offline broad probes", "blockedPromotionBodies" in offline and "production-ready" in offline and "approved for release" in offline and "release-ready" in offline),
            ("live broad probes", "blockedPromotionBodies" in live and "production-ready" in live and "approved for release" in live and "release-ready" in live),
            ("openapi", "/v1/pm/specify:" in openapi),
            ("bundle includes report and strict tripwire", "CODE_MONKEYS_PM_SPECIFY_001_PM_REPORT.md" in builder and "pm_specify_strict_audit_tripwire.py" in builder),
        ]
        failures = [name for name, ok in checks if not ok]
        if failures:
            fail("strict checks failed", failures)
        print(json.dumps({"ok": True, "result": "PASS", "checks": [name for name, _ in checks]}, indent=2))


if __name__ == "__main__":
    main()
