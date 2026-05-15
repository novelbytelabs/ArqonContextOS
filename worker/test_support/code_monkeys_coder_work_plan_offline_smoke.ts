declare const process: { exitCode?: number };
import { handleWorkerFetch } from "../src/index.js";
import type { Env, ProjectConfig } from "../src/types.js";
import type { RepoStore, RepoFileRef, RepoWriteResult } from "../src/repo_store.js";

const baseUrl = "https://offline.local";
const env: Env = {
  BROKER_VERSION: "test", DEFAULT_BRANCH: "main", GITHUB_APP_ID: "test-app", GITHUB_APP_INSTALLATION_ID: "test-installation", GITHUB_APP_PRIVATE_KEY: "test-private-key",
  BROKER_KEY_PM: "pm-token", BROKER_KEY_CODER: "coder-token", BROKER_KEY_AUDITOR: "auditor-token", BROKER_KEY_HELPER: "helper-token",
  BROKER_KEY_EXPLORER: "explorer-token", BROKER_KEY_HYPOTHESIZER: "hypothesizer-token", BROKER_KEY_DESIGNER: "designer-token",
  BROKER_KEY_SCIENCE_AUDITOR: "science-auditor-token", BROKER_KEY_SCIENCE_EXECUTOR: "science-executor-token", BROKER_KEY_HUMAN: "human-token"
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
    files.set(path, content); writeCounts.set(path, (writeCounts.get(path) || 0) + 1); return { path, sha: `sha-${path}-${writeCounts.get(path)}` };
  }
};
const tokens = { PM_AI: env.BROKER_KEY_PM, CODER_AI: env.BROKER_KEY_CODER, AUDITOR_AI: env.BROKER_KEY_AUDITOR, HELPER_AI: env.BROKER_KEY_HELPER, EXPLORER_AI: env.BROKER_KEY_EXPLORER, HYPOTHESIZER_AI: env.BROKER_KEY_HYPOTHESIZER, DESIGNER_AI: env.BROKER_KEY_DESIGNER, SCIENCE_AUDITOR_AI: env.BROKER_KEY_SCIENCE_AUDITOR, SCIENCE_EXECUTOR_AI: env.BROKER_KEY_SCIENCE_EXECUTOR, HUMAN: env.BROKER_KEY_HUMAN };
type TokenRole = keyof typeof tokens;
function auth(role: TokenRole): string { return `Bearer ${tokens[role]}`; }
function assert(condition: boolean, message: string): void { if (!condition) throw new Error(message); }
async function requestJson(path: string, init: RequestInit = {}): Promise<{ status: number; body: any }> {
  const headers = new Headers(init.headers || {}); if (init.body && !headers.has("content-type")) headers.set("content-type", "application/json");
  const response = await handleWorkerFetch(new Request(`${baseUrl}${path}`, { ...init, headers }), env, { flowRepoStore: memoryStore });
  const text = await response.text(); let body: any = null; try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  return { status: response.status, body };
}
function seed(): { taskingId: string; codeFlowId: string; scienceFlowId: string } {
  const codeFlowId = "FLOW-2026-9001"; const scienceFlowId = "FLOW-2026-9002"; const taskingId = "TASKING-001";
  const pmTasking = { artifact_id: "ART-PM-TASKING-001", artifact_type: "pm_tasking", title: "PM Tasking", role: "PM_AI", created_at: "2026-01-01T00:00:00.000Z", source_path: `governance/flows/${codeFlowId}/artifacts/ART-PM-TASKING-001.md`, source_sha: "sha-tasking" };
  const manifest = { schema_version: "flow_manifest.v0.3", official_artifact: true, project: "ArqonZero", flow_id: codeFlowId, name: "code-flow", type: "code_flow", title: "Code Flow", summary: "Seed", status: "OPEN", current_gate: "PLAN_READY", created_at: "2026-01-01T00:00:00.000Z", created_by_role: "PM_AI", updated_at: "2026-01-01T00:00:00.000Z", updated_by_role: "PM_AI", required_status_labels: ["REQUIRES_HUMAN_REVIEW", "development diagnostic only", "NOT SEALED-TEST CERTIFIED", "not promotable"], artifacts: [pmTasking], history: [] };
  const record = { schema_version: "pm_tasking_context.v0.1", official_artifact: true, project: "ArqonZero", tasking_id: taskingId, idempotency_key: "seed-tasking", created_at: "2026-01-01T00:00:00.000Z", created_by_role: "PM_AI", source_plan: { plan_id: "PLAN-001", pm_plan_record_path: "governance/context/pm_plan/PLAN-001.json", code_flow_id: codeFlowId, specification_id: "SPEC-001", intake_id: "INTAKE-001", handoff_id: "HANDOFF-001", share_id: "SHARE-001", science_flow_id: scienceFlowId, share_packet_hash: "share-hash", submitted_share_payload_hash: "share-payload-hash", handoff_payload_hash: "handoff-hash", intake_payload_hash: "intake-hash", specification_payload_hash: "spec-hash", plan_payload_hash: "plan-hash", evidence_level: "SUPPORTED_DIAGNOSTIC", uncertainty: "development diagnostic only", source_artifacts: ["ART-AUDIT", "ART-FINDING", "ART-RECOMMEND"], resolved_source_artifacts: [{ artifact_id: "ART-AUDIT", artifact_type: "audit_report", title: "Audit", role: "SCIENCE_AUDITOR_AI", created_at: "2026-01-01T00:00:00.000Z", source_path: "audit.md", source_sha: "sha-audit" }], allowed_claims: ["diagnostic only"], forbidden_claims: ["Do not claim certification.", "Do not claim production readiness."] }, output_artifacts: { pm_tasking: pmTasking }, submitted_payload_hash: "tasking-payload-hash", pm_tasking_record_path: `governance/context/pm_tasking/${taskingId}.json`, generated_pm_tasking_context_path: "governance/context/generated_pm_tasking_context.json", required_status_labels: ["REQUIRES_HUMAN_REVIEW", "development diagnostic only", "NOT SEALED-TEST CERTIFIED", "not promotable"] };
  const index = { schema_version: "pm_tasking_context_index.v0.1", project: "ArqonZero", updated_at: "2026-01-01T00:00:00.000Z", entries: [{ tasking_id: taskingId, plan_id: "PLAN-001", specification_id: "SPEC-001", intake_id: "INTAKE-001", handoff_id: "HANDOFF-001", code_flow_id: codeFlowId, share_id: "SHARE-001", science_flow_id: scienceFlowId, share_packet_hash: "share-hash", evidence_level: "SUPPORTED_DIAGNOSTIC", uncertainty: "development diagnostic only", pm_tasking_record_path: record.pm_tasking_record_path, created_at: record.created_at }] };
  files.set(`governance/flows/${codeFlowId}/flow_manifest.json`, JSON.stringify(manifest, null, 2));
  files.set(record.pm_tasking_record_path, JSON.stringify(record, null, 2));
  files.set("governance/context/generated_pm_tasking_context.json", JSON.stringify(index, null, 2));
  files.set(`governance/flows/${scienceFlowId}/flow_manifest.json`, JSON.stringify({ ...manifest, flow_id: scienceFlowId, type: "science_flow", artifacts: [] }, null, 2));
  return { taskingId, codeFlowId, scienceFlowId };
}
async function main(): Promise<void> {
  const context = seed();
  const noAuth = await requestJson("/v1/coder/work-plan", { method: "POST", body: JSON.stringify({ tasking_id: context.taskingId, idempotency_key: "noauth-0001" }) });
  assert(noAuth.status === 401, "Coder work plan requires auth");
  const deniedRoles: TokenRole[] = ["PM_AI", "AUDITOR_AI", "HELPER_AI", "EXPLORER_AI", "HYPOTHESIZER_AI", "DESIGNER_AI", "SCIENCE_AUDITOR_AI", "SCIENCE_EXECUTOR_AI", "HUMAN"];
  for (const role of deniedRoles) {
    const denied = await requestJson("/v1/coder/work-plan", { method: "POST", headers: { authorization: auth(role), "content-type": "application/json" }, body: JSON.stringify({ tasking_id: context.taskingId, idempotency_key: `deny-${role}-0001`, work_plan_title: "Denied", work_plan_body: "Should be denied." }) });
    assert(denied.status === 403, `${role} must be denied`);
    assert(denied.body.error.code === "CODER_WORK_PLAN_ROLE_FORBIDDEN", `${role} expected CODER_WORK_PLAN_ROLE_FORBIDDEN`);
  }
  const payload = { tasking_id: context.taskingId, idempotency_key: "coder-work-plan-success-0001", work_plan_title: "Coder Work Plan 001 Candidate", work_plan_body: "Interpret the PM tasking into engineering steps, dependencies, and risk checks. Return a proposal only. Do not create patches. Do not authorize Helper execution." };
  const workPlan = await requestJson("/v1/coder/work-plan", { method: "POST", headers: { authorization: auth("CODER_AI"), "content-type": "application/json" }, body: JSON.stringify(payload) });
  assert(workPlan.status === 201, `Coder work plan should pass: ${JSON.stringify(workPlan.body)}`);
  assert(workPlan.body.coder_work_plan.output_artifacts.coder_work_plan.artifact_type === "coder_work_plan", "coder_work_plan artifact missing");
  const duplicate = await requestJson("/v1/coder/work-plan", { method: "POST", headers: { authorization: auth("CODER_AI"), "content-type": "application/json" }, body: JSON.stringify(payload) });
  assert(duplicate.status === 200 && duplicate.body.idempotent_replay === true, "duplicate Coder work plan should replay");
  const conflict = await requestJson("/v1/coder/work-plan", { method: "POST", headers: { authorization: auth("CODER_AI"), "content-type": "application/json" }, body: JSON.stringify({ ...payload, work_plan_body: "Changed work plan body with same key." }) });
  assert(conflict.status === 409 && conflict.body.error.code === "CODER_WORK_PLAN_IDEMPOTENCY_CONFLICT", "changed payload should conflict");
  const promotion = await requestJson("/v1/coder/work-plan", { method: "POST", headers: { authorization: auth("CODER_AI"), "content-type": "application/json" }, body: JSON.stringify({ tasking_id: context.taskingId, idempotency_key: "promotion-0001", work_plan_title: "Bad", work_plan_body: "This is approved for release." }) });
  assert(promotion.status === 409 && promotion.body.error.code === "CODER_WORK_PLAN_FORBIDDEN_CLAIM_INCLUDED", "promotion language should fail");
  const execution = await requestJson("/v1/coder/work-plan", { method: "POST", headers: { authorization: auth("CODER_AI"), "content-type": "application/json" }, body: JSON.stringify({ tasking_id: context.taskingId, idempotency_key: "execution-0001", work_plan_title: "Bad", work_plan_body: "Helper may execute now." }) });
  assert(execution.status === 409 && execution.body.error.code === "CODER_WORK_PLAN_EXECUTION_AUTHORITY_FORBIDDEN", "execution authority should fail");
  const codeManifest = JSON.parse(files.get(`governance/flows/${context.codeFlowId}/flow_manifest.json`) || "{}");
  const artifactTypes = new Set(codeManifest.artifacts.map((artifact: { artifact_type: string }) => artifact.artifact_type));
  assert(artifactTypes.has("coder_work_plan"), "code flow missing coder_work_plan");
  assert(!artifactTypes.has("implementation_bundle"), "Coder work plan must not create implementation_bundle");
  assert(!artifactTypes.has("coder_handoff"), "Coder work plan must not create coder_handoff");
  assert(!artifactTypes.has("execution_report"), "Coder work plan must not create Helper execution");
  const scienceManifest = JSON.parse(files.get(`governance/flows/${context.scienceFlowId}/flow_manifest.json`) || "{}");
  assert(scienceManifest.artifacts.length === 0, "Coder work plan must not mutate Science flow");
  console.log(JSON.stringify({ ok: true, tasking_id: context.taskingId, coder_work_plan_id: workPlan.body.coder_work_plan.coder_work_plan_id, code_flow_id: context.codeFlowId }, null, 2));
}
main().catch(err => { console.error(err); process.exitCode = 1; });
