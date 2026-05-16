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
function token(role: "PM"|"CODER"|"HELPER"|"AUDITOR"|"HUMAN"|"NONE"): string { return role==="PM"?env.BROKER_KEY_PM:role==="CODER"?env.BROKER_KEY_CODER:role==="HELPER"?env.BROKER_KEY_HELPER:role==="AUDITOR"?env.BROKER_KEY_AUDITOR:role==="HUMAN"?env.BROKER_KEY_HUMAN:""; }
async function post(path: string, role: "PM"|"CODER"|"HELPER"|"AUDITOR"|"HUMAN"|"NONE", body: unknown): Promise<{status:number; body:any}> {
  const headers = new Headers({"content-type":"application/json"}); if (role !== "NONE") headers.set("authorization", `Bearer ${token(role)}`);
  const res = await handleWorkerFetch(new Request(`https://offline.local${path}`, { method:"POST", headers, body: JSON.stringify(body)}), env, { flowRepoStore: store });
  const text = await res.text(); let parsed:any=null; try { parsed=text?JSON.parse(text):null; } catch { parsed=text; } return { status: res.status, body: parsed };
}
function seed(): { flowId: string; reportId: string; reportPath: string } {
  const flowId = "FLOW-2026-7272"; const reportId = "REPORT-HELPER-001"; const reportPath = "governance/context/helper_execution_report/REPORT-HELPER-001.json";
  const executionReport = { artifact_id:"ART-EXEC-001", artifact_type:"execution_report", title:"Execution Report", role:"HELPER_AI", created_at:"2026-01-01T00:00:00.000Z", source_path:"governance/flows/FLOW-2026-7272/artifacts/ART-EXEC-001.md", source_sha:"sha-exec" };
  const commandLog = { artifact_id:"ART-CMD-001", artifact_type:"command_log", title:"Command Log", role:"HELPER_AI", created_at:"2026-01-01T00:00:00.000Z", source_path:"governance/flows/FLOW-2026-7272/artifacts/ART-CMD-001.md", source_sha:"sha-cmd" };
  const evidenceManifest = { artifact_id:"ART-EVID-001", artifact_type:"evidence_manifest", title:"Evidence Manifest", role:"HELPER_AI", created_at:"2026-01-01T00:00:00.000Z", source_path:"governance/flows/FLOW-2026-7272/artifacts/ART-EVID-001.md", source_sha:"sha-evid" };
  files.set("governance/context/generated_helper_execution_report_context.json", JSON.stringify({ schema_version:"helper_execution_report_context_index.v0.1", project:"ArqonZero", updated_at:"2026-01-01T00:00:00.000Z", entries:[{ helper_execution_report_id:reportId, helper_execution_intake_id:"INTAKE-001", coder_handoff_id:"HANDOFF-001", code_flow_id:flowId, share_id:"SHARE-001", share_packet_hash:"sharehash", evidence_level:"SUPPORTED_DIAGNOSTIC", uncertainty:"diagnostic only", helper_execution_report_record_path:reportPath, created_at:"2026-01-01T00:00:00.000Z" }] }));
  files.set(reportPath, JSON.stringify({ schema_version:"helper_execution_report_context.v0.1", official_artifact:true, project:"ArqonZero", helper_execution_report_id:reportId, idempotency_key:"report-key-001", created_at:"2026-01-01T00:00:00.000Z", created_by_role:"HELPER_AI", source_helper_execution_intake:{ helper_execution_intake_id:"INTAKE-001", helper_execution_intake_record_path:"governance/context/helper_execution_intake/INTAKE-001.json", coder_handoff_id:"HANDOFF-001", implementation_bundle_id:"IMPL-001", code_flow_id:flowId, share_id:"SHARE-001", science_flow_id:"SCIENCE-001", share_packet_hash:"sharehash", helper_execution_report_payload_hash:"report-hash", evidence_level:"SUPPORTED_DIAGNOSTIC", uncertainty:"diagnostic only", source_artifacts:["SRC-001"], resolved_source_artifacts:[{ artifact_id:"SRC-001", artifact_type:"audit_report", title:"Audit", role:"SCIENCE_AUDITOR_AI", created_at:"2026-01-01T00:00:00.000Z", source_path:"source.md", source_sha:"sha-source" }], allowed_claims:["diagnostic only"], forbidden_claims:["no certification"] }, command_count:1, commands:[{ command:"pwd", purpose:"check", result:"PASS", exit_code:0 }], output_artifacts:{ execution_report:executionReport, command_log:commandLog, evidence_manifest:evidenceManifest }, submitted_payload_hash:"report-payload-hash", helper_execution_report_record_path:reportPath, generated_helper_execution_report_context_path:"governance/context/generated_helper_execution_report_context.json", required_status_labels:labels }));
  files.set(`governance/flows/${flowId}/flow_manifest.json`, JSON.stringify({ schema_version:"flow_manifest.v0.3", official_artifact:true, project:"ArqonZero", flow_id:flowId, name:"code-flow", type:"code_flow", title:"Code Flow", summary:"", status:"active", current_gate:"DRAFT", created_at:"2026-01-01T00:00:00.000Z", created_by_role:"PM_AI", updated_at:"2026-01-01T00:00:00.000Z", updated_by_role:"PM_AI", required_status_labels:labels, artifacts:[executionReport, commandLog, evidenceManifest], history:[] }));
  files.set("governance/flows/flow_index.json", JSON.stringify({ schema_version:"flow_index.v0.3", project:"ArqonZero", updated_at:"2026-01-01T00:00:00.000Z", flows:[{ flow_id:flowId, name:"code-flow", type:"code_flow", title:"Code Flow", status:"active", current_gate:"DRAFT", created_at:"2026-01-01T00:00:00.000Z", updated_at:"2026-01-01T00:00:00.000Z", source_path:`governance/flows/${flowId}/flow_manifest.json` }] }));
  return { flowId, reportId, reportPath };
}
async function main(): Promise<void> {
  const { flowId, reportId, reportPath } = seed();
  const noAuth = await post("/v1/auditor/helper-execution-review", "NONE", {}); assert(noAuth.status === 401, "no-auth denied");
  for (const r of ["PM","CODER","HELPER","HUMAN"] as const) {
    const denied = await post("/v1/auditor/helper-execution-review", r, { helper_execution_report_id:reportId, idempotency_key:"denied-0001", review_title:"Denied", review_summary:"denied", review_verdict:"AUDITOR_REVIEW_PASS" });
    assert(denied.status === 403, `${r} denied`);
  }
  const raw = await post(`/v1/flows/${flowId}/artifacts`, "AUDITOR", { artifact_type:"helper_execution_review", title:"Raw Review", body:"raw generic helper_execution_review must be route-only" });
  assert(raw.status === 403 && raw.body.error.code === "FLOW_ARTIFACT_ROUTE_REQUIRED", "raw generic helper_execution_review must be route-only");
  const payload = { helper_execution_report_id:reportId, idempotency_key:"review-ok-0001", review_title:"Auditor Helper Review OK", review_summary:"Reviewed diagnostic Helper evidence.", review_verdict:"AUDITOR_REVIEW_PASS", findings:["command evidence matches diagnostic scope"] };
  const success = await post("/v1/auditor/helper-execution-review", "AUDITOR", payload); assert(success.status === 201, `success ${success.status} ${JSON.stringify(success.body)}`);
  assert(success.body.auditor_helper_execution_review.output_artifacts.helper_execution_review.artifact_type === "helper_execution_review", "helper_execution_review artifact");
  const replay = await post("/v1/auditor/helper-execution-review", "AUDITOR", payload); assert(replay.status === 200 && replay.body.idempotent_replay, "idempotent replay");
  const conflict = await post("/v1/auditor/helper-execution-review", "AUDITOR", { ...payload, review_summary:"changed" }); assert(conflict.status === 409 && conflict.body.error.code === "AUDITOR_HELPER_EXECUTION_REVIEW_IDEMPOTENCY_CONFLICT", "conflict");
  const badTitle = await post("/v1/auditor/helper-execution-review", "AUDITOR", { ...payload, idempotency_key:"bad-title-0001", review_title:"approved for release" }); assert(badTitle.status === 409 && badTitle.body.error.code === "AUDITOR_HELPER_EXECUTION_REVIEW_FORBIDDEN_CLAIM_INCLUDED", "bad title");
  const badFinding = await post("/v1/auditor/helper-execution-review", "AUDITOR", { ...payload, idempotency_key:"bad-finding-0001", findings:["deployment complete"] }); assert(badFinding.status === 409 && badFinding.body.error.code === "AUDITOR_HELPER_EXECUTION_REVIEW_FORBIDDEN_CLAIM_INCLUDED", "bad finding");
  const secretSummary = await post("/v1/auditor/helper-execution-review", "AUDITOR", { ...payload, idempotency_key:"secret-summary-0001", review_summary:"Authorization: Bearer abc" }); assert(secretSummary.status === 409 && secretSummary.body.error.code === "AUDITOR_HELPER_EXECUTION_REVIEW_SECRET_MATERIAL_FORBIDDEN", "secret summary");
  const secretFinding = await post("/v1/auditor/helper-execution-review", "AUDITOR", { ...payload, idempotency_key:"secret-finding-0001", findings:["token=abc"] }); assert(secretFinding.status === 409 && secretFinding.body.error.code === "AUDITOR_HELPER_EXECUTION_REVIEW_SECRET_MATERIAL_FORBIDDEN", "secret finding");
  const badVerdict = await post("/v1/auditor/helper-execution-review", "AUDITOR", { ...payload, idempotency_key:"bad-verdict-0001", review_verdict:"HUMAN_ADVANCEMENT_APPROVED" }); assert(badVerdict.status === 400, "bad verdict enum rejected");
  seed();
  const executionRoleRecord = JSON.parse(files.get(reportPath) || "{}"); executionRoleRecord.output_artifacts.execution_report.role = "AUDITOR_AI"; files.set(reportPath, JSON.stringify(executionRoleRecord));
  const executionRole = await post("/v1/auditor/helper-execution-review", "AUDITOR", { ...payload, idempotency_key:"execution-role-0001" }); assert(executionRole.status === 409 && executionRole.body.error.code === "AUDITOR_HELPER_EXECUTION_REVIEW_ARTIFACT_TYPE_MISMATCH", "execution_report embedded role mismatch");
  seed();
  const commandRoleRecord = JSON.parse(files.get(reportPath) || "{}"); commandRoleRecord.output_artifacts.command_log.role = "AUDITOR_AI"; files.set(reportPath, JSON.stringify(commandRoleRecord));
  const commandRole = await post("/v1/auditor/helper-execution-review", "AUDITOR", { ...payload, idempotency_key:"command-role-0001" }); assert(commandRole.status === 409 && commandRole.body.error.code === "AUDITOR_HELPER_EXECUTION_REVIEW_ARTIFACT_TYPE_MISMATCH", "command_log embedded role mismatch");
  seed();
  const evidenceRoleRecord = JSON.parse(files.get(reportPath) || "{}"); evidenceRoleRecord.output_artifacts.evidence_manifest.role = "AUDITOR_AI"; files.set(reportPath, JSON.stringify(evidenceRoleRecord));
  const evidenceRole = await post("/v1/auditor/helper-execution-review", "AUDITOR", { ...payload, idempotency_key:"evidence-role-0001" }); assert(evidenceRole.status === 409 && evidenceRole.body.error.code === "AUDITOR_HELPER_EXECUTION_REVIEW_ARTIFACT_TYPE_MISMATCH", "evidence_manifest embedded role mismatch");
  seed();
  const record = JSON.parse(files.get(reportPath) || "{}"); record.output_artifacts.execution_report.source_sha = "wrong"; files.set(reportPath, JSON.stringify(record));
  const sha = await post("/v1/auditor/helper-execution-review", "AUDITOR", { ...payload, idempotency_key:"sha-0001" }); assert(sha.status === 409 && sha.body.error.code === "AUDITOR_HELPER_EXECUTION_REVIEW_ARTIFACT_SHA_MISMATCH", "sha mismatch");
  assert(!writes.some(p => p.includes("human_decision") || p.includes("advancement_approval") || p.includes("promotion_decision")), "no Human/promotion artifacts");
  console.log(JSON.stringify({ ok:true, no_auth_status:noAuth.status, success_status:success.status, replay_status:replay.status, conflict_status:conflict.status, bad_title_status:badTitle.status, bad_finding_status:badFinding.status, secret_summary_status:secretSummary.status, secret_finding_status:secretFinding.status, execution_role_status:executionRole.status, command_role_status:commandRole.status, evidence_role_status:evidenceRole.status, sha_status:sha.status }, null, 2));
}
main().catch(e => { console.error(e); process.exitCode = 1; });
