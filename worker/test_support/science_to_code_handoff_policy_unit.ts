declare const process: { exitCode?: number };

import { FLOW_ARTIFACT_SLOTS, ROLE_FLOW_ARTIFACTS, validateFlowArtifactRole } from "../src/flow_policy.js";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

try {
  assert(FLOW_ARTIFACT_SLOTS.code_flow.includes("handoff_intake"), "code_flow must allow handoff_intake");
  assert(FLOW_ARTIFACT_SLOTS.code_flow.includes("dossier_seed"), "code_flow must allow dossier_seed");
  assert(ROLE_FLOW_ARTIFACTS.code_flow.PM_AI?.includes("handoff_intake") === true, "PM_AI must write handoff_intake");
  assert(ROLE_FLOW_ARTIFACTS.code_flow.PM_AI?.includes("dossier_seed") === true, "PM_AI must write dossier_seed");
  assert(validateFlowArtifactRole("code_flow", "HELPER_AI", "handoff_intake") !== null, "HELPER_AI must not write handoff_intake");
  assert(validateFlowArtifactRole("code_flow", "CODER_AI", "dossier_seed") !== null, "CODER_AI must not write dossier_seed");
  assert(validateFlowArtifactRole("science_flow", "PM_AI", "handoff_intake") !== null, "PM handoff artifacts must not be science_flow artifacts");
  console.log(JSON.stringify({ ok: true, checks: ["PM_AI can write handoff_intake on code_flow", "PM_AI can write dossier_seed on code_flow", "non-PM roles cannot write PM handoff artifacts", "handoff artifacts are not science_flow artifacts"] }, null, 2));
} catch (err) {
  console.error(err);
  process.exitCode = 1;
}
