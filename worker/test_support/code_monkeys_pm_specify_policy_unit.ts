declare const process: { exitCode?: number };

import { FLOW_ARTIFACT_SLOTS, ROLE_FLOW_ARTIFACTS, validateFlowArtifactRole } from "../src/flow_policy.js";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

try {
  assert(FLOW_ARTIFACT_SLOTS.code_flow.includes("specification"), "code_flow must allow specification");
  assert(ROLE_FLOW_ARTIFACTS.code_flow.PM_AI?.includes("specification") === true, "PM_AI must write specification");
  assert(validateFlowArtifactRole("code_flow", "CODER_AI", "specification") !== null, "CODER_AI must not write specification");
  assert(validateFlowArtifactRole("code_flow", "HELPER_AI", "specification") !== null, "HELPER_AI must not write specification");
  assert(validateFlowArtifactRole("science_flow", "PM_AI", "specification") !== null, "PM specification must not be a science_flow artifact");
  console.log(JSON.stringify({ ok: true }, null, 2));
} catch (err) {
  console.error(err);
  process.exitCode = 1;
}
