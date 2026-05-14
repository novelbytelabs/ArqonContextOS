declare const process: { exitCode?: number };

import { handleWorkerFetch } from "../src/index.js";
import type { Env, ProjectConfig } from "../src/types.js";
import type { RepoStore, RepoFileRef, RepoWriteResult } from "../src/repo_store.js";

const baseUrl = "https://offline.local";
const env: Env = {
  BROKER_VERSION: "test",
  DEFAULT_BRANCH: "main",
  GITHUB_APP_ID: "test-app",
  GITHUB_APP_INSTALLATION_ID: "test-installation",
  GITHUB_APP_PRIVATE_KEY: "test-private-key",
  BROKER_KEY_PM: "pm-token",
  BROKER_KEY_CODER: "coder-token",
  BROKER_KEY_AUDITOR: "auditor-token",
  BROKER_KEY_HELPER: "helper-token",
  BROKER_KEY_EXPLORER: "explorer-token",
  BROKER_KEY_HYPOTHESIZER: "hypothesizer-token",
  BROKER_KEY_DESIGNER: "designer-token",
  BROKER_KEY_SCIENCE_AUDITOR: "science-auditor-token",
  BROKER_KEY_SCIENCE_EXECUTOR: "science-executor-token",
  BROKER_KEY_HUMAN: "human-token"
};

const files = new Map<string, string>();
const writeCounts = new Map<string, number>();
const memoryStore: RepoStore = {
  async fetchFile(_env: Env, _project: ProjectConfig, path: string): Promise<RepoFileRef> {
    const content = files.get(path);
    if (content === undefined) throw new Error(`GitHub file fetch failed for ${path}: 404 offline missing`);
    return { path, sha: `sha-${path}-${writeCounts.get(path) || 0}`, content };
  },
  async writeFile(_env: Env, _project: ProjectConfig, path: string, content: string, _message: string): Promise<RepoWriteResult> {
    files.set(path, content);
    writeCounts.set(path, (writeCounts.get(path) || 0) + 1);
    return { path, sha: `sha-${path}-${writeCounts.get(path)}` };
  }
};

const tokens = {
  PM_AI: env.BROKER_KEY_PM,
  CODER_AI: env.BROKER_KEY_CODER,
  AUDITOR_AI: env.BROKER_KEY_AUDITOR,
  HELPER_AI: env.BROKER_KEY_HELPER,
  EXPLORER_AI: env.BROKER_KEY_EXPLORER,
  HYPOTHESIZER_AI: env.BROKER_KEY_HYPOTHESIZER,
  DESIGNER_AI: env.BROKER_KEY_DESIGNER,
  SCIENCE_AUDITOR_AI: env.BROKER_KEY_SCIENCE_AUDITOR,
  SCIENCE_EXECUTOR_AI: env.BROKER_KEY_SCIENCE_EXECUTOR,
  HUMAN: env.BROKER_KEY_HUMAN
};
type TokenRole = keyof typeof tokens;

function auth(role: TokenRole): string {
  return `Bearer ${tokens[role]}`;
}
function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}
async function requestJson(path: string, init: RequestInit = {}): Promise<{ status: number; body: any }> {
  const headers = new Headers(init.headers || {});
  if (init.body && !headers.has("content-type")) headers.set("content-type", "application/json");
  const response = await handleWorkerFetch(new Request(`${baseUrl}${path}`, { ...init, headers }), env, { flowRepoStore: memoryStore });
  const text = await response.text();
  let body: any = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  return { status: response.status, body };
}
function body(label: string): string {
  return `${label}\n\nREQUIRES_HUMAN_REVIEW\ndevelopment diagnostic only\nNOT SEALED-TEST CERTIFIED\nnot promotable\n`;
}

async function buildPmIntake(): Promise<{ intakeId: string; codeFlowId: string; scienceFlowId: string }> {
  const research = await requestJson("/v1/science/research", { method: "POST", headers: { authorization: auth("EXPLORER_AI") }, body: JSON.stringify({ name: "pm-specify-science-001", title: "PM Specify Science Flow", summary: "offline", artifact_title: "Research dossier", body: body("research_dossier") }) });
  assert(research.status === 201, "research should pass");
  const scienceFlowId = research.body.flow_id;
  const steps: Array<[string, TokenRole, Record<string, unknown>]> = [
    ["/v1/science/hypothesize", "HYPOTHESIZER_AI", { flow_ref: scienceFlowId, artifact_title: "Hypothesis", body: body("hypothesis_card") }],
    ["/v1/science/design-experiment", "DESIGNER_AI", { flow_ref: scienceFlowId, artifact_title: "Protocol", body: body("experiment_protocol") }],
    ["/v1/science/execute-experiment", "SCIENCE_EXECUTOR_AI", { flow_ref: scienceFlowId, artifact_title: "Execution", body: body("execution_report") }],
    ["/v1/science/audit-experiment", "SCIENCE_AUDITOR_AI", { flow_ref: scienceFlowId, artifact_title: "Audit", body: body("audit_report") }],
    ["/v1/science/record-finding", "SCIENCE_AUDITOR_AI", { flow_ref: scienceFlowId, artifact_type: "finding_record", artifact_title: "Finding", body: body("finding_record") }]
  ];
  let auditArtifact = "";
  let findingArtifact = "";
  for (const [path, role, payload] of steps) {
    const res = await requestJson(path, { method: "POST", headers: { authorization: auth(role) }, body: JSON.stringify(payload) });
    assert(res.status === 201, `${path} should pass`);
    if (path.includes("audit")) auditArtifact = res.body.artifact.artifact_id;
    if (path.includes("record-finding")) findingArtifact = res.body.artifact.artifact_id;
  }
  const recommendation = await requestJson(`/v1/flows/${scienceFlowId}/artifacts`, { method: "POST", headers: { authorization: auth("SCIENCE_AUDITOR_AI"), "content-type": "application/json" }, body: JSON.stringify({ artifact_type: "share_recommendation", title: "Share recommendation", body: body("share_recommendation") }) });
  assert(recommendation.status === 201, "recommendation should pass");
  const share = await requestJson("/v1/science/share", { method: "POST", headers: { authorization: auth("HUMAN"), "content-type": "application/json" }, body: JSON.stringify({ flow_ref: scienceFlowId, idempotency_key: "pm-specify-share-0001", evidence_level: "SUPPORTED_DIAGNOSTIC", uncertainty: "development diagnostic only", source_artifacts: [auditArtifact, findingArtifact, recommendation.body.artifact.artifact_id], allowed_claims: ["Diagnostic science share may inform PM specification."], forbidden_claims: ["Do not claim certification.", "Do not claim production readiness."], body: body("Human approved share") }) });
  assert(share.status === 201, "share should pass");
  const handoff = await requestJson("/v1/pm/handoff", { method: "POST", headers: { authorization: auth("PM_AI"), "content-type": "application/json" }, body: JSON.stringify({ share_id: share.body.share.share_id, idempotency_key: "pm-specify-handoff-0001", code_flow_name: "pm-specify-code-flow-001", code_flow_title: "Code Flow for PM Specify", pm_notes: "Preserve boundary." }) });
  assert(handoff.status === 201, "handoff should pass");
  const intake = await requestJson("/v1/pm/intake", { method: "POST", headers: { authorization: auth("PM_AI"), "content-type": "application/json" }, body: JSON.stringify({ handoff_id: handoff.body.handoff.handoff_id, idempotency_key: "pm-specify-intake-0001", pm_notes: "Intake for specification." }) });
  assert(intake.status === 201, "intake should pass");
  return { intakeId: intake.body.intake.intake_id, codeFlowId: handoff.body.handoff.code_flow.flow_id, scienceFlowId };
}

async function main(): Promise<void> {
  const noAuth = await requestJson("/v1/pm/specify", { method: "POST", body: JSON.stringify({ intake_id: "none", idempotency_key: "spec-noauth-0001" }) });
  assert(noAuth.status === 401, "PM specify requires auth");

  const context = await buildPmIntake();
  const deniedRoles: TokenRole[] = ["CODER_AI", "AUDITOR_AI", "HELPER_AI", "EXPLORER_AI", "HYPOTHESIZER_AI", "DESIGNER_AI", "SCIENCE_AUDITOR_AI", "SCIENCE_EXECUTOR_AI", "HUMAN"];
  for (const role of deniedRoles) {
    const denied = await requestJson("/v1/pm/specify", { method: "POST", headers: { authorization: auth(role), "content-type": "application/json" }, body: JSON.stringify({ intake_id: context.intakeId, idempotency_key: `spec-deny-${role}`, specification_title: "Denied", specification_body: "Should be denied." }) });
    assert(denied.status === 403, `${role} must be denied`);
    assert(denied.body.error.code === "PM_SPECIFY_ROLE_FORBIDDEN", `${role} expected PM_SPECIFY_ROLE_FORBIDDEN`);
  }

  const scienceManifestBefore = JSON.parse(files.get(`governance/flows/${context.scienceFlowId}/flow_manifest.json`) || "{}");
  const scienceArtifactCountBefore = scienceManifestBefore.artifacts.length;
  const payload = { intake_id: context.intakeId, idempotency_key: "pm-specify-success-0001", specification_title: "PM Specify 001 Candidate Specification", specification_body: "Define a guarded specification candidate from PM intake. Do not create plans or tasks in this stage." };

  const spec = await requestJson("/v1/pm/specify", { method: "POST", headers: { authorization: auth("PM_AI"), "content-type": "application/json" }, body: JSON.stringify(payload) });
  assert(spec.status === 201, `PM specify should pass: ${JSON.stringify(spec.body)}`);
  assert(spec.body.specification.output_artifacts.specification.artifact_type === "specification", "specification artifact missing");
  assert(spec.body.specification.source_intake.forbidden_claims.length === 2, "forbidden claims not preserved");

  const duplicate = await requestJson("/v1/pm/specify", { method: "POST", headers: { authorization: auth("PM_AI"), "content-type": "application/json" }, body: JSON.stringify(payload) });
  assert(duplicate.status === 200 && duplicate.body.idempotent_replay === true, "duplicate PM specify should replay");

  const conflict = await requestJson("/v1/pm/specify", { method: "POST", headers: { authorization: auth("PM_AI"), "content-type": "application/json" }, body: JSON.stringify({ ...payload, specification_body: "Changed spec body with same key." }) });
  assert(conflict.status === 409 && conflict.body.error.code === "PM_SPECIFY_IDEMPOTENCY_CONFLICT", "changed payload should conflict");

  const blockedPromotionBodies = [
    "This specification is certified.",
    "This specification claims certification.",
    "This specification is production-ready.",
    "This specification is ready for production.",
    "This is a product-ready requirement.",
    "This is promotable.",
    "This is approved for release.",
    "This is release-ready."
  ];
  for (const [idx, specificationBody] of blockedPromotionBodies.entries()) {
    const forbidden = await requestJson("/v1/pm/specify", { method: "POST", headers: { authorization: auth("PM_AI"), "content-type": "application/json" }, body: JSON.stringify({ intake_id: context.intakeId, idempotency_key: `pm-specify-forbidden-${idx}-0001`, specification_title: "Forbidden Promotion Probe", specification_body: specificationBody }) });
    assert(forbidden.status === 409, `${specificationBody} should fail with 409`);
    assert(forbidden.body.error.code === "PM_SPECIFY_FORBIDDEN_CLAIM_INCLUDED", `${specificationBody} should return PM_SPECIFY_FORBIDDEN_CLAIM_INCLUDED`);
  }

  const scienceManifestAfter = JSON.parse(files.get(`governance/flows/${context.scienceFlowId}/flow_manifest.json`) || "{}");
  assert(scienceManifestAfter.artifacts.length === scienceArtifactCountBefore, "PM specify must not add Science artifacts");

  const codeManifest = JSON.parse(files.get(`governance/flows/${context.codeFlowId}/flow_manifest.json`) || "{}");
  const artifactTypes = new Set(codeManifest.artifacts.map((artifact: { artifact_type: string }) => artifact.artifact_type));
  assert(artifactTypes.has("specification"), "code flow missing specification");
  assert(!artifactTypes.has("plan"), "PM specify must not create plan");
  assert(!artifactTypes.has("tasks"), "PM specify must not create tasks");

  const index = JSON.parse(files.get("governance/context/generated_pm_specification_context.json") || "{}");
  assert(index.entries.length === 1, "generated PM specification context should have one entry");

  console.log(JSON.stringify({ ok: true, intake_id: context.intakeId, specification_id: spec.body.specification.specification_id, code_flow_id: context.codeFlowId }, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});

export {};
