#!/usr/bin/env python3
"""Append an event to governance/context/context_ledger.jsonl."""
from __future__ import annotations
import argparse, json
from datetime import datetime, timezone
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
LEDGER = ROOT / "governance" / "context" / "context_ledger.jsonl"
STATUS = ["REQUIRES_HUMAN_REVIEW", "development diagnostic only", "NOT SEALED-TEST CERTIFIED", "not promotable"]

def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--event", required=True)
    parser.add_argument("--actor", required=True)
    parser.add_argument("--summary", required=True)
    parser.add_argument("--run-id", default="")
    args = parser.parse_args()
    LEDGER.parent.mkdir(parents=True, exist_ok=True)
    row = {"ts":datetime.now(timezone.utc).isoformat(),"event":args.event,"actor":args.actor,"run_id":args.run_id,"summary":args.summary,"status":STATUS}
    with LEDGER.open("a", encoding="utf-8") as f: f.write(json.dumps(row, sort_keys=True) + "\n")
    print(f"Appended event to {LEDGER}")
if __name__ == "__main__": main()
