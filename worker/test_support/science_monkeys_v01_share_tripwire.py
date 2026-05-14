#!/usr/bin/env python3
from pathlib import Path
import sys

ROOT = Path.cwd()
SEARCH_ROOTS = [ROOT / "worker/src", ROOT / "worker/test_support"]

FORBIDDEN = [
    "SCIENCE_SHARE_NOT_IMPLEMENTED",
    "BYPASS_AUTH",
    "SKIP_AUDIT",
    "SKIP_HUMAN_APPROVAL",
    "sealed-test certified",
    "production ready",
    "promotable status",
    "human_identity grants authority",
]

violations = []
for root in SEARCH_ROOTS:
    if not root.exists():
        continue
    for path in root.rglob("*"):
        if not path.is_file():
            continue
        if path.name in {
            "science_monkeys_v01_share_tripwire.py",
            "science_monkeys_v01_routes_tripwire.py",
            "science_monkeys_v01_routes_live_smoke.ts",
        }:
            continue
        text = path.read_text(encoding="utf-8", errors="ignore")
        for phrase in FORBIDDEN:
            if phrase in text:
                violations.append((str(path.relative_to(ROOT)), phrase))

science = (ROOT / "worker/src/science.ts").read_text(encoding="utf-8")
share = (ROOT / "worker/src/science_share.ts").read_text(encoding="utf-8")
index = (ROOT / "worker/src/index.ts").read_text(encoding="utf-8")

required_pairs = [
    ("worker/src/science.ts", science, "const role = requireRole(request, env);"),
    ("worker/src/science.ts", science, "handleScienceShare(request, env, role, repoStore)"),
    ("worker/src/science_share.ts", share, 'human_authority: "server_authenticated_human"'),
    ("worker/src/science_share.ts", share, "SCIENCE_SHARE_HUMAN_REQUIRED"),
    ("worker/src/science_share.ts", share, "idempotent_replay"),
    ("worker/src/science_share.ts", share, "governance/context/generated_pm_share_context.json"),
    ("worker/src/science_share.ts", share, "governance/outbox/science_share"),
    ("worker/src/index.ts", index, "BROKER_KEY_CONFIGURATION_INVALID"),
    ("worker/src/index.ts", index, "validateBrokerKeyUniqueness"),
]
for filename, text, marker in required_pairs:
    if marker not in text:
        violations.append((filename, f"missing marker: {marker}"))

if violations:
    print("TRIPWIRE FAIL")
    for path, phrase in violations:
        print(f"- {path}: {phrase}")
    sys.exit(1)

print("TRIPWIRE PASS")
