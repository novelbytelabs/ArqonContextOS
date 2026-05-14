#!/usr/bin/env python3
from pathlib import Path
import sys

ROOT = Path.cwd()

SEARCH_ROOTS = [
    ROOT / "worker/src",
    ROOT / "worker/test_support",
]

FORBIDDEN = [
    "Executor AI / Helper-Codex",
    "allow execution report from Helper",
    "BYPASS_AUTH",
    "SKIP_AUDIT",
    "SKIP_HUMAN_APPROVAL",
    "sealed-test certified",
    "production ready",
    "promotable status",
]

violations = []
for root in SEARCH_ROOTS:
    if not root.exists():
        continue
    for path in root.rglob("*"):
        if not path.is_file():
            continue
        if path.name == "science_monkeys_v01_routes_tripwire.py":
            continue
        text = path.read_text(encoding="utf-8", errors="ignore")
        for phrase in FORBIDDEN:
            if phrase in text:
                violations.append((str(path.relative_to(ROOT)), phrase))

if violations:
    print("TRIPWIRE FAIL")
    for path, phrase in violations:
        print(f"- {path}: {phrase}")
    sys.exit(1)

print("TRIPWIRE PASS")
