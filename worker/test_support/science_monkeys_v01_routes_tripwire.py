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

DEFINITION_MARKERS = (
    "FORBIDDEN",
    "forbidden",
    "forbidden =",
    "forbidden:",
    "forbidden_claim",
    "promotion:",
    "/\\b",
    '"/\\b',
    "'/\\b",
    "checks.append",
)

def is_definition_context(line: str) -> bool:
    return any(marker in line for marker in DEFINITION_MARKERS)

for root in SEARCH_ROOTS:
    if not root.exists():
        continue
    for path in root.rglob("*"):
        if not path.is_file():
            continue
        if path.name.endswith("tripwire.py"):
            continue
        text = path.read_text(encoding="utf-8", errors="ignore")
        for lineno, line in enumerate(text.splitlines(), start=1):
            for phrase in FORBIDDEN:
                if phrase in line and not is_definition_context(line):
                    violations.append((f"{path.relative_to(ROOT)}:{lineno}", phrase))

if violations:
    print("TRIPWIRE FAIL")
    for path, phrase in violations:
        print(f"- {path}: {phrase}")
    sys.exit(1)

print("TRIPWIRE PASS")
