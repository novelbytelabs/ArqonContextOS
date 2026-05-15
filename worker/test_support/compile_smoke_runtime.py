#!/usr/bin/env python3
from __future__ import annotations
import json, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
WORKER = ROOT / "worker"
EXPECTED = ROOT / "runtime/flow-core-smoke-dist/src/index.js"

def main() -> None:
    result = subprocess.run(["npx", "tsc", "-p", "tsconfig.smoke.json"], cwd=WORKER, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if result.returncode != 0:
        print(json.dumps({"ok": False, "result": "FAIL", "command": "cd worker && npx tsc -p tsconfig.smoke.json", "stdout": result.stdout, "stderr": result.stderr}, indent=2))
        sys.exit(result.returncode)
    if not EXPECTED.exists():
        print(json.dumps({"ok": False, "result": "FAIL", "error": "Expected smoke output missing", "expected": str(EXPECTED.relative_to(ROOT))}, indent=2))
        sys.exit(1)
    print(json.dumps({"ok": True, "result": "PASS", "command": "cd worker && npx tsc -p tsconfig.smoke.json", "expected": str(EXPECTED.relative_to(ROOT))}, indent=2))
if __name__ == "__main__":
    main()
