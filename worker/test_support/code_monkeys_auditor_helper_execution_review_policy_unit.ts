export {};

import { ROLE_FLOW_ARTIFACTS, FLOW_ARTIFACT_SLOTS } from "../src/flow_policy.js";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function main(): void {
  assert(FLOW_ARTIFACT_SLOTS.code_flow.includes("helper_execution_review"), "code_flow must include helper_execution_review slot");
  assert(ROLE_FLOW_ARTIFACTS.code_flow.AUDITOR_AI?.includes("helper_execution_review") === true, "AUDITOR_AI owns helper_execution_review");
  assert(ROLE_FLOW_ARTIFACTS.code_flow.HELPER_AI?.includes("helper_execution_review") !== true, "HELPER_AI must not own helper_execution_review");
  assert(ROLE_FLOW_ARTIFACTS.code_flow.PM_AI?.includes("helper_execution_review") !== true, "PM_AI must not own helper_execution_review");
  assert(ROLE_FLOW_ARTIFACTS.code_flow.CODER_AI?.includes("helper_execution_review") !== true, "CODER_AI must not own helper_execution_review");
  console.log(JSON.stringify({ ok: true, result: "PASS" }, null, 2));
}

try { main(); } catch (err) { console.error(err); process.exitCode = 1; }
