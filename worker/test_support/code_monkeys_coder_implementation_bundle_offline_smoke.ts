declare const process: { exitCode?: number };

/*
End-to-end offline smoke for Code Monkeys Coder Implementation Bundle 001.
Builds Science -> Share -> PM Handoff -> PM Intake -> PM Specify -> PM Plan -> PM Tasking -> Coder Work Plan -> Coder Tasks -> Implementation Bundle through the local Worker with an in-memory RepoStore.
*/

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
function auth(role: TokenRole): string { return `Bearer ${tokens[role]}`; }
function assert(condition: boolean, message: string): void { if (!condition) throw new Error(message); }
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

async function buildCoderTasks(): Promise<{ coderTasksId: string; codeFlowId: string; scienceFlowId: string }> {
  const research = await requestJson("/v1/science/research", { method: "POST", headers: { authorization: auth("EXPLORER_AI") }, body: JSON.stringify({ name: "implementation-bundle-science-001", title: "Implementation Bundle Science Flow", summary: "offline", artifact_title: "Research dossier", body: body("research_dossier") }) });
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
  const share = await requestJson("/v1/science/share", { method: "POST", headers: { authorization: auth("HUMAN"), "content-type": "application/json" }, body: JSON.stringify({ flow_ref: scienceFlowId, idempotency_key: "implementation-bundle-share-0001", evidence_level: "SUPPORTED_DIAGNOSTIC", uncertainty: "development diagnostic only", source_artifacts: [auditArtifact, findingArtifact, recommendation.body.artifact.artifact_id], allowed_claims: ["Diagnostic science share may inform implementation bundle proposal."], forbidden_claims: ["Do not claim certification.", "Do not claim production readiness."], body: body("Human approved share") }) });
  assert(share.status === 201, "share should pass");
  const handoff = await requestJson("/v1/pm/handoff", { method: "POST", headers: { authorization: auth("PM_AI"), "content-type": "application/json" }, body: JSON.stringify({ share_id: share.body.share.share_id, idempotency_key: "implementation-bundle-handoff-0001", code_flow_name: "implementation-bundle-code-flow-001", code_flow_title: "Code Flow for Implementation Bundle", pm_notes: "Preserve boundary." }) });
  assert(handoff.status === 201, "handoff should pass");
  const intake = await requestJson("/v1/pm/intake", { method: "POST", headers: { authorization: auth("PM_AI"), "content-type": "application/json" }, body: JSON.stringify({ handoff_id: handoff.body.handoff.handoff_id, idempotency_key: "implementation-bundle-intake-0001", pm_notes: "Intake for implementation bundle." }) });
  assert(intake.status === 201, "intake should pass");
  const specify = await requestJson("/v1/pm/specify", { method: "POST", headers: { authorization: auth("PM_AI"), "content-type": "application/json" }, body: JSON.stringify({ intake_id: intake.body.intake.intake_id, idempotency_key: "implementation-bundle-specify-0001", specification_title: "Implementation Bundle Upstream Specification", specification_body: "Specification candidate for implementation bundle proposal. Do not authorize execution in this stage." }) });
  assert(specify.status === 201, "specify should pass");
  const plan = await requestJson("/v1/pm/plan", { method: "POST", headers: { authorization: auth("PM_AI"), "content-type": "application/json" }, body: JSON.stringify({ specification_id: specify.body.specification.specification_id, idempotency_key: "implementation-bundle-plan-0001", plan_title: "Implementation Bundle Upstream Plan", plan_body: "Plan phases and gates. Do not create Coder handoff or Helper execution." }) });
  assert(plan.status === 201, "plan should pass");
  const tasking = await requestJson("/v1/pm/tasking", { method: "POST", headers: { authorization: auth("PM_AI"), "content-type": "application/json" }, body: JSON.stringify({ plan_id: plan.body.plan.plan_id, idempotency_key: "implementation-bundle-tasking-0001", tasking_title: "Implementation Bundle PM Tasking", tasking_body: "Prepare Coder work plan, task decomposition, and implementation bundle proposal. No execution is authorized by this artifact." }) });
  assert(tasking.status === 201, "tasking should pass");
  const workPlan = await requestJson("/v1/coder/work-plan", { method: "POST", headers: { authorization: auth("CODER_AI"), "content-type": "application/json" }, body: JSON.stringify({ tasking_id: tasking.body.tasking.tasking_id, idempotency_key: "implementation-bundle-work-plan-0001", work_plan_title: "Implementation Bundle Work Plan", work_plan_body: "Interpret PM tasking into engineering plan. Do not create patches. Do not authorize Helper execution." }) });
  assert(workPlan.status === 201, "work plan should pass");
  const tasks = await requestJson("/v1/coder/tasks", { method: "POST", headers: { authorization: auth("CODER_AI"), "content-type": "application/json" }, body: JSON.stringify({ coder_work_plan_id: workPlan.body.coder_work_plan.coder_work_plan_id, idempotency_key: "implementation-bundle-tasks-0001", tasks_title: "Implementation Bundle Tasks", tasks_body: "Task 1: create implementation proposal. Task 2: list files and tests. Task 3: preserve evidence boundaries. Do not authorize Helper execution." }) });
  assert(tasks.status === 201, `tasks should pass: ${JSON.stringify(tasks.body)}`);
  return { coderTasksId: tasks.body.coder_tasks.coder_tasks_id, codeFlowId: handoff.body.handoff.code_flow.flow_id, scienceFlowId };
}

async function main(): Promise<void> {
  const noAuth = await requestJson("/v1/coder/implementation-bundle", { method: "POST", body: JSON.stringify({ coder_tasks_id: "none", idempotency_key: "implementation-bundle-noauth-0001" }) });
  assert(noAuth.status === 401, "Implementation bundle requires auth");

  const context = await buildCoderTasks();
  const deniedRoles: TokenRole[] = ["PM_AI", "AUDITOR_AI", "HELPER_AI", "EXPLORER_AI", "HYPOTHESIZER_AI", "DESIGNER_AI", "SCIENCE_AUDITOR_AI", "SCIENCE_EXECUTOR_AI", "HUMAN"];
  for (const role of deniedRoles) {
    const denied = await requestJson("/v1/coder/implementation-bundle", { method: "POST", headers: { authorization: auth(role), "content-type": "application/json" }, body: JSON.stringify({ coder_tasks_id: context.coderTasksId, idempotency_key: `implementation-bundle-deny-${role}`, bundle_title: "Denied", bundle_body: "Should be denied." }) });
    assert(denied.status === 403, `${role} must be denied`);
    assert(denied.body.error.code === "CODER_IMPLEMENTATION_BUNDLE_ROLE_FORBIDDEN", `${role} expected CODER_IMPLEMENTATION_BUNDLE_ROLE_FORBIDDEN`);
  }

  const scienceManifestBefore = JSON.parse(files.get(`governance/flows/${context.scienceFlowId}/flow_manifest.json`) || "{}");
  const scienceArtifactCountBefore = scienceManifestBefore.artifacts.length;
  const payload = { coder_tasks_id: context.coderTasksId, idempotency_key: "implementation-bundle-success-0001", bundle_title: "Implementation Bundle 001 Candidate", bundle_body: "Implementation proposal only. Include intended files, patch strategy, unit tests, integration tests, end-to-end tests, regression tests, adversarial tests, rollback plan, and evidence requirements. Do not tell Helper to run. Do not authorize execution." };

  const bundle = await requestJson("/v1/coder/implementation-bundle", { method: "POST", headers: { authorization: auth("CODER_AI"), "content-type": "application/json" }, body: JSON.stringify(payload) });
  assert(bundle.status === 201, `Implementation bundle should pass: ${JSON.stringify(bundle.body)}`);
  assert(bundle.body.implementation_bundle.output_artifacts.implementation_bundle.artifact_type === "implementation_bundle", "implementation_bundle artifact missing");
  assert(bundle.body.implementation_bundle.source_coder_tasks.forbidden_claims.length === 2, "forbidden claims not preserved");

  const duplicate = await requestJson("/v1/coder/implementation-bundle", { method: "POST", headers: { authorization: auth("CODER_AI"), "content-type": "application/json" }, body: JSON.stringify(payload) });
  assert(duplicate.status === 200 && duplicate.body.idempotent_replay === true, "duplicate implementation bundle should replay");

  const conflict = await requestJson("/v1/coder/implementation-bundle", { method: "POST", headers: { authorization: auth("CODER_AI"), "content-type": "application/json" }, body: JSON.stringify({ ...payload, bundle_body: "Changed bundle body with same key." }) });
  assert(conflict.status === 409 && conflict.body.error.code === "CODER_IMPLEMENTATION_BUNDLE_IDEMPOTENCY_CONFLICT", "changed payload should conflict");

  const promotion = await requestJson("/v1/coder/implementation-bundle", { method: "POST", headers: { authorization: auth("CODER_AI"), "content-type": "application/json" }, body: JSON.stringify({ coder_tasks_id: context.coderTasksId, idempotency_key: "implementation-bundle-promotion-0001", bundle_title: "Bad Bundle", bundle_body: "This is approved for release." }) });
  assert(promotion.status === 409 && promotion.body.error.code === "CODER_IMPLEMENTATION_BUNDLE_FORBIDDEN_CLAIM_INCLUDED", "promotion language should fail");

  const execution = await requestJson("/v1/coder/implementation-bundle", { method: "POST", headers: { authorization: auth("CODER_AI"), "content-type": "application/json" }, body: JSON.stringify({ coder_tasks_id: context.coderTasksId, idempotency_key: "implementation-bundle-execution-0001", bundle_title: "Bad Bundle", bundle_body: "Helper may execute now." }) });
  assert(execution.status === 409 && execution.body.error.code === "CODER_IMPLEMENTATION_BUNDLE_EXECUTION_AUTHORITY_FORBIDDEN", "execution authority should fail");

  const scienceManifestAfter = JSON.parse(files.get(`governance/flows/${context.scienceFlowId}/flow_manifest.json`) || "{}");
  assert(scienceManifestAfter.artifacts.length === scienceArtifactCountBefore, "Implementation bundle must not add Science artifacts");

  const codeManifest = JSON.parse(files.get(`governance/flows/${context.codeFlowId}/flow_manifest.json`) || "{}");
  const artifactTypes = new Set(codeManifest.artifacts.map((artifact: { artifact_type: string }) => artifact.artifact_type));
  assert(artifactTypes.has("implementation_bundle"), "code flow missing implementation_bundle");
  assert(!artifactTypes.has("coder_handoff"), "Implementation bundle must not create coder_handoff");
  assert(!artifactTypes.has("execution_report"), "Implementation bundle must not create Helper execution");

  const index = JSON.parse(files.get("governance/context/generated_coder_implementation_bundle_context.json") || "{}");
  assert(index.entries.length === 1, "generated implementation bundle context should have one entry");
  console.log(JSON.stringify({ ok: true, coder_tasks_id: context.coderTasksId, implementation_bundle_id: bundle.body.implementation_bundle.implementation_bundle_id, code_flow_id: context.codeFlowId }, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
