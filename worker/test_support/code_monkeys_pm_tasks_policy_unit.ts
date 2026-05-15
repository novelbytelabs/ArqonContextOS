declare const process: { exitCode?: number };

import { FLOW_ARTIFACT_SLOTS, ROLE_FLOW_ARTIFACTS, validateFlowArtifactRole } from "../src/flow_policy.js";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

try {
  assert(FLOW_ARTIFACT_SLOTS.code_flow.includes("tasks"), "code_flow must allow tasks");
  assert(ROLE_FLOW_ARTIFACTS.code_flow.PM_AI?.includes("tasks") === true, "PM_AI must write tasks");
  assert(validateFlowArtifactRole("code_flow", "CODER_AI", "tasks") !== null, "CODER_AI must not write PM tasks");
  assert(validateFlowArtifactRole("code_flow", "HELPER_AI", "tasks") !== null, "HELPER_AI must not write tasks");
  assert(validateFlowArtifactRole("science_flow", "PM_AI", "tasks") !== null, "PM tasks must not be a science_flow artifact");
  console.log(JSON.stringify({ ok: true }, null, 2));
} catch (err) {
  console.error(err);
  process.exitCode = 1;
}
