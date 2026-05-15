#!/usr/bin/env python3
from __future__ import annotations
import argparse, json, re, sys
from pathlib import Path

DEFAULT_SCAN_DIRS = ["worker/test_support", "docs/03_commands_and_runbooks", "docs/04_flows_and_spec_kit", ".github/workflows"]
CRITICAL_PATTERNS = [
    re.compile(r"\btmp/flow-core-smoke-dist\b"),
    re.compile(r"\bpython3\s+tmp/"),
    re.compile(r"\bnode(?:\s+--[^\n]+)?\s+tmp/"),
    re.compile(r"\bunzip\b[^\n]*\btmp/"),
    re.compile(r"\brsync\b[^\n]*\btmp/"),
    re.compile(r"\btmp/<[^>]+>"),
]
ALLOW_CONTEXT = ["tmp/ is scratch", "`tmp/` is scratch", "tmp is scratch", "do not depend on tmp", "never required", "forbidden", "non-critical", "legacy tmp", "critical tmp references", "check_no_tmp_critical_paths", "scratch only"]
IGNORE_PARTS = {".git", "node_modules", "runtime", "tmp", "temps"}
ALLOWED_FILES = {
    "docs/01_monkeyos_doctrine/OPERATIONAL_WORKSPACE_POLICY_001.md",
    "worker/test_support/check_no_tmp_critical_paths_selftest.py",
}
TEXT_SUFFIXES = {".md", ".ts", ".js", ".py", ".yml", ".yaml", ".json", ".sh", ".txt"}

def is_ignored(path: Path) -> bool:
    return any(part in IGNORE_PARTS for part in path.parts)
def is_allowed_context(line: str) -> bool:
    low = line.lower()
    return any(marker in low for marker in ALLOW_CONTEXT)
def iter_files(root: Path, scan_dirs: list[str]) -> list[Path]:
    files = []
    for rel in scan_dirs:
        base = root / rel
        if base.is_file():
            files.append(base); continue
        if not base.exists(): continue
        for path in base.rglob("*"):
            if path.is_file() and path.suffix in TEXT_SUFFIXES and not is_ignored(path.relative_to(root)):
                files.append(path)
    for readme in root.glob("README*"):
        if readme.is_file():
            files.append(readme)
    return sorted(set(files))
def check(root: Path, scan_dirs: list[str]) -> dict:
    violations = []
    for path in iter_files(root, scan_dirs):
        rel = path.relative_to(root).as_posix()
        if rel in ALLOWED_FILES: continue
        try: lines = path.read_text(encoding="utf-8").splitlines()
        except UnicodeDecodeError: continue
        for lineno, line in enumerate(lines, start=1):
            if "tmp/" not in line: continue
            if is_allowed_context(line): continue
            for pattern in CRITICAL_PATTERNS:
                if pattern.search(line):
                    violations.append({"path": rel, "line": lineno, "pattern": pattern.pattern, "text": line.strip()[:240]})
                    break
    return {"ok": not violations, "violations": violations}
def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("root", nargs="?", default=".")
    parser.add_argument("--scan", action="append", default=None)
    args = parser.parse_args()
    root = Path(args.root).resolve()
    scan_dirs = args.scan if args.scan else DEFAULT_SCAN_DIRS
    result = check(root, scan_dirs)
    result["result"] = "PASS" if result["ok"] else "FAIL"
    result["scan_dirs"] = scan_dirs
    print(json.dumps(result, indent=2))
    sys.exit(0 if result["ok"] else 1)
if __name__ == "__main__":
    main()
