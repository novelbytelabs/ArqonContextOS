export {};

import { handleWorkerFetch } from "../src/index.js";
import type { Env, ProjectConfig } from "../src/types.js";
import type { RepoStore, RepoFileRef, RepoWriteResult } from "../src/repo_store.js";

const labels = ["REQUIRES_HUMAN_REVIEW", "development diagnostic only", "NOT SEALED-TEST CERTIFIED", "not promotable"];
const env: Env = {
  BROKER_VERSION: "test", DEFAULT_BRANCH: "main", GITHUB_APP_ID: "x", GITHUB_APP_INSTALLATION_ID: "x", GITHUB_APP_PRIVATE_KEY: "x",
  BROKER_KEY_PM: "pm-token", BROKER_KEY_CODER: "coder-token", BROKER_KEY_AUDITOR: "auditor-token", BROKER_KEY_HELPER: "helper-token",
  BROKER_KEY_EXPLORER: "explorer-token", BROKER_KEY_HYPOTHESIZER: "hypothesizer-token", BROKER_KEY_DESIGNER: "designer-token",
  BROKER_KEY_SCIENCE_AUDITOR: "science-auditor-token", BROKER_KEY_SCIENCE_EXECUTOR: "science-executor-token", BROKER_KEY_HUMAN: "human-token"
};
const files = new Map<string,string>(); const writes: string[] = []; let writeCount = 0;
const store: RepoStore = {
  async fetchFile(_e: Env, _p: ProjectConfig, path: string): Promise<RepoFileRef> {
    const content = files.get(path); if (content === undefined) throw new Error(`GitHub file fetch failed for ${path}: 404 offline missing`);
    return { path, sha: `sha-${path}`, content };
  },
  async writeFile(_e: Env, _p: ProjectConfig, path: string, content: string, _m: string): Promise<RepoWriteResult> {
    files.set(path, content); writes.push(path); writeCount += 1; return { path, sha: `sha-write-${writeCount}` };
  }
};
function assert(c: boolean, m: string): void { if (!c) throw new Error(m); }
function token(role: "PM"|"CODER"|"HELPER"|"NONE"): string { return role==="PM"?env.BROKER_KEY_PM:role==="CODER"?env.BROKER_KEY_CODER:role==="HELPER"?env.BROKER_KEY_HELPER:""; }
async function post(path: string, role: "PM"|"CODER"|"HELPER"|"NONE", body: unknown): Promise<{status:number; body:any}> {
  const headers = new Headers({"content-type":"application/json"}); if (role !== "NONE") headers.set("authorization", `Bearer ${token(role)}`);
  const res = await handleWorkerFetch(new Request(`https://offline.local${path}`, { method:"POST", headers, body: JSON.stringify(body)}), env, { flowRepoStore: store });
  const text = await res.text(); let parsed:any=null; try { parsed=text?JSON.parse(text):null; } catch { parsed=text; } return { status: res.status, body: parsed };
}
function seed(): { flowId: string; intakeId: string; intakePath: string } {
  const flowId = "FLOW-2026-6262"; const intakeId = "INTAKE-HELPER-001"; const intakePath = "governance/context/helper_execution_intake/INTAKE-HELPER-001.json";
  const intakeArtifact = { artifact_id:"ART-HELPER-INTAKE-001", artifact_type:"helper_execution_intake", title:"Helper Intake", role:"HELPER_AI", created_at:"2026-01-01T00:00:00.000Z", source_path:"governance/flows/FLOW-2026-6262/artifacts/ART-HELPER-INTAKE-001.md", source_sha:"sha-intake" };
  files.set("governance/context/generated_helper_execution_intake_context.json", JSON.stringify({ schema_version:"helper_execution_intake_context_index.v0.1", project:"ArqonZero", updated_at:"2026-01-01T00:00:00.000Z", entries:[{ helper_execution_intake_id:intakeId, coder_handoff_id:"HANDOFF-001", implementation_bundle_id:"IMPL-001", coder_tasks_id:"TASKS-001", code_flow_id:flowId, share_id:"SHARE-001", science_flow_id:"SCIENCE-001", share_packet_hash:"sharehash", evidence_level:"SUPPORTED_DIAGNOSTIC", uncertainty:"diagnostic only", helper_execution_intake_record_path:intakePath, created_at:"2026-01-01T00:00:00.000Z" }] }));
  files.set(intakePath, JSON.stringify({ schema_version:"helper_execution_intake_context.v0.1", official_artifact:true, project:"ArqonZero", helper_execution_intake_id:intakeId, idempotency_key:"intake-key-001", created_at:"2026-01-01T00:00:00.000Z", created_by_role:"HELPER_AI", source_coder_handoff:{ coder_handoff_id:"HANDOFF-001", coder_handoff_record_path:"governance/context/coder_handoff/HANDOFF-001.json", implementation_bundle_id:"IMPL-001", coder_tasks_id:"TASKS-001", coder_work_plan_id:"WP-001", tasking_id:"TASKING-001", code_flow_id:flowId, plan_id:"PLAN-001", specification_id:"SPEC-001", intake_id:"PM-INTAKE-001", pm_handoff_id:"PM-HANDOFF-001", share_id:"SHARE-001", science_flow_id:"SCIENCE-001", share_packet_hash:"sharehash", handoff_payload_hash:"pm-hash", intake_payload_hash:"pm-intake-hash", specification_payload_hash:"spec-hash", plan_payload_hash:"plan-hash", tasking_payload_hash:"tasking-hash", coder_work_plan_payload_hash:"wp-hash", coder_tasks_payload_hash:"tasks-hash", implementation_bundle_payload_hash:"impl-hash", coder_handoff_payload_hash:"handoff-hash", evidence_level:"SUPPORTED_DIAGNOSTIC", uncertainty:"diagnostic only", source_artifacts:["SRC-001"], resolved_source_artifacts:[{ artifact_id:"SRC-001", artifact_type:"audit_report", title:"Audit", role:"SCIENCE_AUDITOR_AI", created_at:"2026-01-01T00:00:00.000Z", source_path:"source.md", source_sha:"sha-source" }], allowed_claims:["diagnostic only"], forbidden_claims:["no certification"] }, output_artifacts:{ helper_execution_intake:intakeArtifact }, submitted_payload_hash:"intake-payload-hash", helper_execution_intake_record_path:intakePath, generated_helper_execution_intake_context_path:"governance/context/generated_helper_execution_intake_context.json", required_status_labels:labels }));
  files.set(`governance/flows/${flowId}/flow_manifest.json`, JSON.stringify({ schema_version:"flow_manifest.v0.3", official_artifact:true, project:"ArqonZero", flow_id:flowId, name:"code-flow", type:"code_flow", title:"Code Flow", summary:"", status:"active", current_gate:"DRAFT", created_at:"2026-01-01T00:00:00.000Z", created_by_role:"PM_AI", updated_at:"2026-01-01T00:00:00.000Z", updated_by_role:"PM_AI", required_status_labels:labels, artifacts:[intakeArtifact], history:[] }));
  files.set("governance/flows/flow_index.json", JSON.stringify({ schema_version:"flow_index.v0.3", project:"ArqonZero", updated_at:"2026-01-01T00:00:00.000Z", flows:[{ flow_id:flowId, name:"code-flow", type:"code_flow", title:"Code Flow", status:"active", current_gate:"DRAFT", created_at:"2026-01-01T00:00:00.000Z", updated_at:"2026-01-01T00:00:00.000Z", source_path:`governance/flows/${flowId}/flow_manifest.json` }] }));
  return { flowId, intakeId, intakePath };
}
async function main(): Promise<void> {
  const { flowId, intakeId, intakePath } = seed();
  const noAuth = await post("/v1/helper/execution-report", "NONE", {}); assert(noAuth.status === 401, "no-auth denied");
  for (const r of ["PM","CODER"] as const) { const denied = await post("/v1/helper/execution-report", r, { helper_execution_intake_id:intakeId, idempotency_key:"denied-0001", execution_title:"Denied", execution_summary:"denied", commands:[{command:"pwd",purpose:"check",result:"PASS",exit_code:0}] }); assert(denied.status === 403, `${r} denied`); }
  for (const artifact_type of ["execution_report","command_log","evidence_manifest"]) {
    const raw = await post(`/v1/flows/${flowId}/artifacts`, "HELPER", { artifact_type, title:"Raw", body:`raw generic ${artifact_type} must be route-only` });
    assert(raw.status === 403 && raw.body.error.code === "FLOW_ARTIFACT_ROUTE_REQUIRED", `raw generic ${artifact_type} must be route-only`);
  }
  const payload = { helper_execution_intake_id:intakeId, idempotency_key:"report-ok-0001", execution_title:"Helper Execution Report OK", execution_summary:"Executed scoped validation commands only.", commands:[{ command:"pwd", purpose:"confirm repo path", result:"PASS", exit_code:0, stdout_excerpt:"/repo", stderr_excerpt:"" }] };
  const success = await post("/v1/helper/execution-report", "HELPER", payload); assert(success.status === 201, `success ${success.status} ${JSON.stringify(success.body)}`);
  assert(success.body.helper_execution_report.output_artifacts.execution_report.artifact_type === "execution_report", "execution_report artifact");
  assert(success.body.helper_execution_report.output_artifacts.command_log.artifact_type === "command_log", "command_log artifact");
  assert(success.body.helper_execution_report.output_artifacts.evidence_manifest.artifact_type === "evidence_manifest", "evidence_manifest artifact");
  const replay = await post("/v1/helper/execution-report", "HELPER", payload); assert(replay.status === 200 && replay.body.idempotent_replay, "idempotent replay");
  const conflict = await post("/v1/helper/execution-report", "HELPER", { ...payload, execution_summary:"changed" }); assert(conflict.status === 409 && conflict.body.error.code === "HELPER_EXECUTION_REPORT_IDEMPOTENCY_CONFLICT", "conflict");
  const badTitle = await post("/v1/helper/execution-report", "HELPER", { ...payload, idempotency_key:"bad-title-0001", execution_title:"approved for release" }); assert(badTitle.status === 409 && badTitle.body.error.code === "HELPER_EXECUTION_REPORT_FORBIDDEN_CLAIM_INCLUDED", "bad title");
  const badSummary = await post("/v1/helper/execution-report", "HELPER", { ...payload, idempotency_key:"bad-summary-0001", execution_summary:"deployment complete" }); assert(badSummary.status === 409 && badSummary.body.error.code === "HELPER_EXECUTION_REPORT_FORBIDDEN_CLAIM_INCLUDED", "bad summary");
  const badCommand = await post("/v1/helper/execution-report", "HELPER", { ...payload, idempotency_key:"bad-command-0001", commands:[{ command:"deploy now", purpose:"check", result:"PASS", exit_code:0, stdout_excerpt:"/repo", stderr_excerpt:"" }] }); assert(badCommand.status === 409 && badCommand.body.error.code === "HELPER_EXECUTION_REPORT_FORBIDDEN_CLAIM_INCLUDED", "bad command");
  const badPurpose = await post("/v1/helper/execution-report", "HELPER", { ...payload, idempotency_key:"bad-purpose-0001", commands:[{ command:"pwd", purpose:"certification complete", result:"PASS", exit_code:0, stdout_excerpt:"/repo", stderr_excerpt:"" }] }); assert(badPurpose.status === 409 && badPurpose.body.error.code === "HELPER_EXECUTION_REPORT_FORBIDDEN_CLAIM_INCLUDED", "bad purpose");
  const badStdout = await post("/v1/helper/execution-report", "HELPER", { ...payload, idempotency_key:"bad-stdout-0001", commands:[{ command:"pwd", purpose:"check", result:"PASS", exit_code:0, stdout_excerpt:"approved for release", stderr_excerpt:"" }] }); assert(badStdout.status === 409 && badStdout.body.error.code === "HELPER_EXECUTION_REPORT_FORBIDDEN_CLAIM_INCLUDED", "bad stdout");
  const badStderr = await post("/v1/helper/execution-report", "HELPER", { ...payload, idempotency_key:"bad-stderr-0001", commands:[{ command:"pwd", purpose:"check", result:"PASS", exit_code:0, stdout_excerpt:"/repo", stderr_excerpt:"production ready" }] }); assert(badStderr.status === 409 && badStderr.body.error.code === "HELPER_EXECUTION_REPORT_FORBIDDEN_CLAIM_INCLUDED", "bad stderr");
  const secretStdout = await post("/v1/helper/execution-report", "HELPER", { ...payload, idempotency_key:"secret-stdout-0001", commands:[{ command:"pwd", purpose:"check", result:"PASS", exit_code:0, stdout_excerpt:"Authorization: Bearer secret", stderr_excerpt:"" }] }); assert(secretStdout.status === 409 && secretStdout.body.error.code === "HELPER_EXECUTION_REPORT_SECRET_MATERIAL_FORBIDDEN", "secret stdout");
  const secretStderr = await post("/v1/helper/execution-report", "HELPER", { ...payload, idempotency_key:"secret-stderr-0001", commands:[{ command:"pwd", purpose:"check", result:"PASS", exit_code:0, stdout_excerpt:"/repo", stderr_excerpt:"BEGIN PRIVATE KEY" }] }); assert(secretStderr.status === 409 && secretStderr.body.error.code === "HELPER_EXECUTION_REPORT_SECRET_MATERIAL_FORBIDDEN", "secret stderr");
  const scienceFlowId = "FLOW-2026-SCIENCE";
  files.set(`governance/flows/${scienceFlowId}/flow_manifest.json`, JSON.stringify({ schema_version:"flow_manifest.v0.3", official_artifact:true, project:"ArqonZero", flow_id:scienceFlowId, name:"science-flow", type:"science_flow", title:"Science Flow", summary:"", status:"active", current_gate:"DRAFT", created_at:"2026-01-01T00:00:00.000Z", created_by_role:"EXPLORER_AI", updated_at:"2026-01-01T00:00:00.000Z", updated_by_role:"EXPLORER_AI", required_status_labels:labels, artifacts:[], history:[] }));
  const flowIndex = JSON.parse(files.get("governance/flows/flow_index.json") || "{}");
  flowIndex.flows = Array.isArray(flowIndex.flows) ? flowIndex.flows : [];
  flowIndex.flows.push({ flow_id:scienceFlowId, name:"science-flow", type:"science_flow", title:"Science Flow", status:"active", current_gate:"DRAFT", created_at:"2026-01-01T00:00:00.000Z", updated_at:"2026-01-01T00:00:00.000Z", source_path:`governance/flows/${scienceFlowId}/flow_manifest.json` });
  files.set("governance/flows/flow_index.json", JSON.stringify(flowIndex));
  const scienceWrite = await handleWorkerFetch(new Request(`https://offline.local/v1/flows/${scienceFlowId}/artifacts`, { method:"POST", headers:new Headers({ "content-type":"application/json", authorization:`Bearer ${env.BROKER_KEY_SCIENCE_EXECUTOR}` }), body:JSON.stringify({ artifact_type:"execution_report", title:"Science Execution", body:"science executor raw execution_report should not be route-only blocked" }) }), env, { flowRepoStore: store });
  const scienceText = await scienceWrite.text(); const scienceBody = scienceText ? JSON.parse(scienceText) : null;
  assert(scienceWrite.status === 201, `science execution_report should succeed, got ${scienceWrite.status} ${JSON.stringify(scienceBody)}`);
  const scienceRawResult = await handleWorkerFetch(new Request(`https://offline.local/v1/flows/${scienceFlowId}/artifacts`, { method:"POST", headers:new Headers({ "content-type":"application/json", authorization:`Bearer ${env.BROKER_KEY_SCIENCE_EXECUTOR}` }), body:JSON.stringify({ artifact_type:"raw_result_index", title:"Raw Result Index", body:"science raw_result_index should succeed" }) }), env, { flowRepoStore: store });
  const scienceRawText = await scienceRawResult.text(); const scienceRawBody = scienceRawText ? JSON.parse(scienceRawText) : null;
  assert(scienceRawResult.status === 201, `science raw_result_index should succeed, got ${scienceRawResult.status} ${JSON.stringify(scienceRawBody)}`);
  const record = JSON.parse(files.get(intakePath) || "{}"); record.output_artifacts.helper_execution_intake.source_sha = "wrong"; files.set(intakePath, JSON.stringify(record));
  const sha = await post("/v1/helper/execution-report", "HELPER", { ...payload, idempotency_key:"sha-0001" }); assert(sha.status === 409 && sha.body.error.code === "HELPER_EXECUTION_REPORT_INTAKE_ARTIFACT_SHA_MISMATCH", "sha mismatch");
  console.log(JSON.stringify({ ok:true, no_auth_status:noAuth.status, success_status:success.status, replay_status:replay.status, conflict_status:conflict.status, bad_title_status:badTitle.status, bad_summary_status:badSummary.status, bad_command_status:badCommand.status, bad_purpose_status:badPurpose.status, bad_stdout_status:badStdout.status, bad_stderr_status:badStderr.status, secret_stdout_status:secretStdout.status, secret_stderr_status:secretStderr.status, science_execution_report_status:scienceWrite.status, science_raw_result_index_status:scienceRawResult.status, sha_status:sha.status, wrote_artifacts:writes.filter(p=>p.includes("/artifacts/")).length }, null, 2));
}
main().catch(e => { console.error(e); process.exitCode = 1; });
