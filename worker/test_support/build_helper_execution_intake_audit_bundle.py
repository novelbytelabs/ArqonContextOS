#!/usr/bin/env python3
from pathlib import Path
import hashlib, json, subprocess, zipfile
FILES=["worker/src/helper_execution_intake.ts","worker/src/coder_handoff.ts","worker/src/index.ts","worker/src/flows.ts","worker/src/flow_policy.ts","worker/test_support/code_monkeys_helper_execution_intake_policy_unit.ts","worker/test_support/code_monkeys_helper_execution_intake_offline_smoke.ts","worker/test_support/code_monkeys_helper_execution_intake_live_smoke.ts","worker/test_support/code_monkeys_helper_execution_intake_tripwire.py","worker/test_support/build_helper_execution_intake_audit_bundle.py","worker/test_support/compile_smoke_runtime.py","worker/test_support/check_no_tmp_critical_paths.py","openapi/arqon_contextos.openapi.yaml","docs/04_flows_and_spec_kit/HELPER_EXECUTION_INTAKE_001.md","docs/04_flows_and_spec_kit/HELPER_EXECUTION_INTAKE_001_EVIDENCE.md","docs/01_monkeyos_doctrine/HELPER_BOUNDED_MICRO_EDIT_POLICY_001.md"]
LABELS=["REQUIRES_HUMAN_REVIEW","development diagnostic only","NOT SEALED-TEST CERTIFIED","not promotable"]
def run(a): return subprocess.run(a,check=True,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE).stdout.strip()
def sha(p):
 h=hashlib.sha256();
 with p.open('rb') as f:
  for c in iter(lambda:f.read(1024*1024),b''): h.update(c)
 return h.hexdigest()
def main():
 root=Path.cwd(); commit=run(["git","rev-parse","HEAD"]); missing=[p for p in FILES if not (root/p).is_file()]
 if missing: raise SystemExit(json.dumps({"ok":False,"missing":missing},indent=2))
 rec=[{"path":p,"bytes":(root/p).stat().st_size,"sha256":sha(root/p)} for p in FILES]
 out=root/"temps"/f"helper_execution_intake_audit_bundle_{commit[:12]}.zip"; out.parent.mkdir(exist_ok=True)
 manifest={"schema_version":"helper_execution_intake_audit_bundle.v0.1","commit":commit,"purpose":"verify Helper Execution Intake 001 boundary without command execution","required_status_labels":LABELS,"files":rec}
 with zipfile.ZipFile(out,"w",zipfile.ZIP_DEFLATED) as z:
  z.writestr("AUDIT_BUNDLE_MANIFEST.json", json.dumps(manifest, indent=2) + "\n")
  for r in rec: z.write(root/r["path"],r["path"])
 print(json.dumps({"ok":True,"bundle_path":str(out),"bundle_sha256":sha(out),"file_count":len(rec)},indent=2))
if __name__=="__main__": main()
