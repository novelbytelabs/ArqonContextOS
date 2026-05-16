export {};

import { ROLE_FLOW_ARTIFACTS, FLOW_ARTIFACT_SLOTS } from "../src/flow_policy.js";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function main(): void {
  assert(FLOW_ARTIFACT_SLOTS.code_flow.includes("human_advancement_decision"), "code_flow must include human_advancement_decision slot");
  assert(ROLE_FLOW_ARTIFACTS.code_flow.HUMAN?.includes("human_advancement_decision") === true, "HUMAN owns human_advancement_decision");
  assert(ROLE_FLOW_ARTIFACTS.code_flow.PM_AI?.includes("human_advancement_decision") !== true, "PM_AI must not own human_advancement_decision");
  assert(ROLE_FLOW_ARTIFACTS.code_flow.CODER_AI?.includes("human_advancement_decision") !== true, "CODER_AI must not own human_advancement_decision");
  assert(ROLE_FLOW_ARTIFACTS.code_flow.HELPER_AI?.includes("human_advancement_decision") !== true, "HELPER_AI must not own human_advancement_decision");
  assert(ROLE_FLOW_ARTIFACTS.code_flow.AUDITOR_AI?.includes("human_advancement_decision") !== true, "AUDITOR_AI must not own human_advancement_decision");
  console.log(JSON.stringify({ ok: true, result: "PASS" }, null, 2));
}

try { main(); } catch (err) { console.error(err); process.exitCode = 1; }
