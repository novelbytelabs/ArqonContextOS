export {};

import { ROLE_FLOW_ARTIFACTS, FLOW_ARTIFACT_SLOTS } from "../src/flow_policy.js";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function main(): void {
  for (const artifact of ["execution_report", "command_log", "evidence_manifest"]) {
    assert(FLOW_ARTIFACT_SLOTS.code_flow.includes(artifact), `code_flow must include ${artifact}`);
    assert(ROLE_FLOW_ARTIFACTS.code_flow.HELPER_AI?.includes(artifact) === true, `HELPER owns ${artifact}`);
    assert(ROLE_FLOW_ARTIFACTS.code_flow.CODER_AI?.includes(artifact) !== true, `CODER must not own ${artifact}`);
    assert(ROLE_FLOW_ARTIFACTS.code_flow.PM_AI?.includes(artifact) !== true, `PM must not own ${artifact}`);
  }
  console.log(JSON.stringify({ ok: true, result: "PASS" }, null, 2));
}

try { main(); } catch (err) { console.error(err); process.exitCode = 1; }
