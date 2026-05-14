declare const process: { exitCode?: number };

import { FLOW_ARTIFACT_SLOTS, ROLE_FLOW_ARTIFACTS, validateFlowArtifactRole } from "../src/flow_policy.js";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

try {
  assert(FLOW_ARTIFACT_SLOTS.code_flow.includes("pm_dossier"), "code_flow must allow pm_dossier");
  assert(FLOW_ARTIFACT_SLOTS.code_flow.includes("pm_gate_definition"), "code_flow must allow pm_gate_definition");
  assert(ROLE_FLOW_ARTIFACTS.code_flow.PM_AI?.includes("pm_dossier") === true, "PM_AI must write pm_dossier");
  assert(ROLE_FLOW_ARTIFACTS.code_flow.PM_AI?.includes("pm_gate_definition") === true, "PM_AI must write pm_gate_definition");
  assert(validateFlowArtifactRole("code_flow", "CODER_AI", "pm_dossier") !== null, "CODER_AI must not write pm_dossier");
  assert(validateFlowArtifactRole("code_flow", "HELPER_AI", "pm_gate_definition") !== null, "HELPER_AI must not write pm_gate_definition");
  assert(validateFlowArtifactRole("science_flow", "PM_AI", "pm_dossier") !== null, "PM intake artifacts must not be science_flow artifacts");
  console.log(JSON.stringify({ ok: true }, null, 2));
} catch (err) {
  console.error(err);
  process.exitCode = 1;
}

export {};
