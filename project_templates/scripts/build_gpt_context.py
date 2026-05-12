#!/usr/bin/env python3
"""Build role-specific GPT context files for a project repo.

Run from project repo root:

    python3 scripts/build_gpt_context.py
"""
from __future__ import annotations
import hashlib, json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONTEXT_DIR = ROOT / "governance" / "context"
LEDGER_PATH = CONTEXT_DIR / "context_ledger.jsonl"
STATUS_LABELS = ["REQUIRES_HUMAN_REVIEW", "development diagnostic only", "NOT SEALED-TEST CERTIFIED", "not promotable"]

def sha256_file(path: Path) -> str:
    return "sha256:" + hashlib.sha256(path.read_bytes()).hexdigest()

def read_recent_ledger(limit: int = 25) -> list[dict]:
    if not LEDGER_PATH.exists(): return []
    events = []
    for line in LEDGER_PATH.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line: continue
        try: events.append(json.loads(line))
        except json.JSONDecodeError: events.append({"event":"UNPARSEABLE_LEDGER_LINE","raw":line})
    return events[-limit:]

def list_open_runs() -> list[dict]:
    runs_dir = ROOT / "governance" / "runs"
    if not runs_dir.exists(): return []
    runs = []
    for run_dir in sorted(p for p in runs_dir.iterdir() if p.is_dir()):
        manifest = run_dir / "run_manifest.json"
        if manifest.exists():
            try: runs.append(json.loads(manifest.read_text(encoding="utf-8")))
            except json.JSONDecodeError: runs.append({"run_id":run_dir.name,"status":"INVALID_MANIFEST"})
        else:
            runs.append({"run_id":run_dir.name,"status":"NO_MANIFEST"})
    return runs

ROLE_BOUNDARIES = {
    "PM_AI": {"allowed":["write PM specs","create runs","define gates","write task packets"],"forbidden":["write implementation code","certify","promote"]},
    "CODER_AI": {"allowed":["write patch bundles","write docs/tests under PM scope","write Helper handoff"],"forbidden":["define final gates","audit","promote"]},
    "AUDITOR_AI": {"allowed":["audit evidence","write audit reports","check claims"],"forbidden":["patch implementation","relax gates","promote"]},
}

def write_json(path: Path, payload: dict) -> None:
    path.write_text(json.dumps(payload, indent=2, sort_keys=True, ensure_ascii=False) + "\n", encoding="utf-8")

def main() -> None:
    CONTEXT_DIR.mkdir(parents=True, exist_ok=True)
    generated_at = datetime.now(timezone.utc).isoformat()
    snapshot = {"project":"ArqonZero","generated_at":generated_at,"current_phase":"governance-loop-diagnostic","status_labels":STATUS_LABELS,"recent_events":read_recent_ledger(),"open_runs":list_open_runs(),"next_recommended_actions":["Use PM AI to define next scoped task.","Use Coder AI after PM spec exists.","Use Helper/Codex for execution evidence.","Use Auditor AI for independent verification."]}
    write_json(CONTEXT_DIR / "current_context_snapshot.json", snapshot)
    role_files = {}
    for role, filename in [("PM_AI","pm_gpt_context.json"),("CODER_AI","coder_gpt_context.json"),("AUDITOR_AI","auditor_gpt_context.json")]:
        payload = {"project":snapshot["project"],"role":role,"generated_at":generated_at,"status_labels":STATUS_LABELS,"snapshot":snapshot,"role_boundaries":ROLE_BOUNDARIES[role]}
        path = CONTEXT_DIR / filename
        write_json(path, payload)
        role_files[role] = {"path":str(path.relative_to(ROOT)),"sha256":sha256_file(path)}
    manifest = {"project":snapshot["project"],"generated_at":generated_at,"status_labels":STATUS_LABELS,"snapshot":{"path":"governance/context/current_context_snapshot.json","sha256":sha256_file(CONTEXT_DIR / "current_context_snapshot.json")},"role_contexts":role_files}
    write_json(CONTEXT_DIR / "context_manifest.json", manifest)
    print(json.dumps(manifest, indent=2, sort_keys=True))

if __name__ == "__main__": main()
