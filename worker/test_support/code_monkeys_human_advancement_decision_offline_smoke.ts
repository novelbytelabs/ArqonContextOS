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
function seed(verdict = "AUDITOR_REVIEW_PASS"): { flowId: string; reviewId: string; reviewPath: string } {
  files.clear(); writes.length = 0; writeCount = 0;
  const flowId = "FLOW-2026-8282"; const reviewId = `REVIEW-001-${verdict}`; const reviewPath = `governance/context/auditor_helper_execution_review/${reviewId}.json`;
  const reviewArtifact = { artifact_id:"ART-REVIEW-001", artifact_type:"helper_execution_review", title:"Auditor Review", role:"AUDITOR_AI", created_at:"2026-01-01T00:00:00.000Z", source_path:"governance/flows/FLOW-2026-8282/artifacts/ART-REVIEW-001.md", source_sha:"sha-review" };
  files.set("governance/context/generated_auditor_helper_execution_review_context.json", JSON.stringify({ schema_version:"auditor_helper_execution_review_context_index.v0.1", project:"ArqonZero", updated_at:"2026-01-01T00:00:00.000Z", entries:[{ auditor_helper_execution_review_id:reviewId, helper_execution_report_id:"REPORT-001", helper_execution_intake_id:"INTAKE-001", code_flow_id:flowId, share_id:"SHARE-001", share_packet_hash:"sharehash", review_verdict:verdict, evidence_level:"SUPPORTED_DIAGNOSTIC", uncertainty:"diagnostic only", auditor_helper_execution_review_record_path:reviewPath, created_at:"2026-01-01T00:00:00.000Z" }] }));
  files.set(reviewPath, JSON.stringify({ schema_version:"auditor_helper_execution_review_context.v0.1", official_artifact:true, project:"ArqonZero", auditor_helper_execution_review_id:reviewId, idempotency_key:"review-key-001", created_at:"2026-01-01T00:00:00.000Z", created_by_role:"AUDITOR_AI", review_verdict:verdict, findings:["diagnostic review only"], source_helper_execution_report:{ helper_execution_report_id:"REPORT-001", helper_execution_report_record_path:"governance/context/helper_execution_report/REPORT-001.json", helper_execution_intake_id:"INTAKE-001", coder_handoff_id:"HANDOFF-001", implementation_bundle_id:"IMPL-001", code_flow_id:flowId, share_id:"SHARE-001", science_flow_id:"SCIENCE-001", share_packet_hash:"sharehash", helper_execution_report_payload_hash:"report-hash", evidence_level:"SUPPORTED_DIAGNOSTIC", uncertainty:"diagnostic only", source_artifacts:["SRC-001"], resolved_source_artifacts:[{ artifact_id:"SRC-001", artifact_type:"audit_report", title:"Audit", role:"SCIENCE_AUDITOR_AI", created_at:"2026-01-01T00:00:00.000Z", source_path:"source.md", source_sha:"sha-source" }], allowed_claims:["diagnostic only"], forbidden_claims:["no certification"] }, output_artifacts:{ helper_execution_review:reviewArtifact }, submitted_payload_hash:"review-payload-hash", auditor_helper_execution_review_record_path:reviewPath, generated_auditor_helper_execution_review_context_path:"governance/context/generated_auditor_helper_execution_review_context.json", required_status_labels:labels }));
  files.set(`governance/flows/${flowId}/flow_manifest.json`, JSON.stringify({ schema_version:"flow_manifest.v0.3", official_artifact:true, project:"ArqonZero", flow_id:flowId, name:"code-flow", type:"code_flow", title:"Code Flow", summary:"", status:"active", current_gate:"DRAFT", created_at:"2026-01-01T00:00:00.000Z", created_by_role:"PM_AI", updated_at:"2026-01-01T00:00:00.000Z", updated_by_role:"PM_AI", required_status_labels:labels, artifacts:[reviewArtifact], history:[] }));
  files.set("governance/flows/flow_index.json", JSON.stringify({ schema_version:"flow_index.v0.3", project:"ArqonZero", updated_at:"2026-01-01T00:00:00.000Z", flows:[{ flow_id:flowId, name:"code-flow", type:"code_flow", title:"Code Flow", status:"active", current_gate:"DRAFT", created_at:"2026-01-01T00:00:00.000Z", updated_at:"2026-01-01T00:00:00.000Z", source_path:`governance/flows/${flowId}/flow_manifest.json` }] }));
  return { flowId, reviewId, reviewPath };
}
async function main(): Promise<void> {
  const { flowId, reviewId, reviewPath } = seed();
  const noAuth = await post("/v1/human/advancement-decision", "NONE", {}); assert(noAuth.status === 401, "no-auth denied");
  for (const r of ["PM","CODER","HELPER","AUDITOR"] as const) {
    const denied = await post("/v1/human/advancement-decision", r, { auditor_helper_execution_review_id:reviewId, idempotency_key:"denied-0001", decision_title:"Denied", decision_summary:"Denied", decision_outcome:"advance", required_next_action:"Proceed to next bounded planning stage." });
    assert(denied.status === 403, `${r} denied`);
  }
  const raw = await post(`/v1/flows/${flowId}/artifacts`, "HUMAN", { artifact_type:"human_advancement_decision", title:"Raw Decision", body:"raw generic human_advancement_decision must be route-only" });
  assert(raw.status === 403 && raw.body.error.code === "FLOW_ARTIFACT_ROUTE_REQUIRED", "raw generic human_advancement_decision must be route-only");
  const payload = { auditor_helper_execution_review_id:reviewId, idempotency_key:"decision-ok-0001", decision_title:"Human Advancement Decision OK", decision_summary:"Human reviewed the diagnostic evidence and allows the next bounded planning stage.", decision_outcome:"advance", required_next_action:"Proceed to the next bounded PM planning stage.", unresolved_blockers:[], findings:["No unresolved blocker declared."] };
  const success = await post("/v1/human/advancement-decision", "HUMAN", payload); assert(success.status === 201, `success ${success.status} ${JSON.stringify(success.body)}`);
  assert(success.body.human_advancement_decision.output_artifacts.human_advancement_decision.artifact_type === "human_advancement_decision", "decision artifact");
  const replay = await post("/v1/human/advancement-decision", "HUMAN", payload); assert(replay.status === 200 && replay.body.idempotent_replay, "idempotent replay");
  const conflict = await post("/v1/human/advancement-decision", "HUMAN", { ...payload, decision_summary:"changed" }); assert(conflict.status === 409 && conflict.body.error.code === "HUMAN_ADVANCEMENT_DECISION_IDEMPOTENCY_CONFLICT", "conflict");
  const badClaim = await post("/v1/human/advancement-decision", "HUMAN", { ...payload, idempotency_key:"bad-claim-0001", decision_title:"approved for release" }); assert(badClaim.status === 409 && badClaim.body.error.code === "HUMAN_ADVANCEMENT_DECISION_FORBIDDEN_CLAIM_INCLUDED", "forbidden claim");
  const secret = await post("/v1/human/advancement-decision", "HUMAN", { ...payload, idempotency_key:"secret-0001", decision_summary:"Authorization: Bearer abc" }); assert(secret.status === 409 && secret.body.error.code === "HUMAN_ADVANCEMENT_DECISION_SECRET_MATERIAL_FORBIDDEN", "secret");
  const blockers = await post("/v1/human/advancement-decision", "HUMAN", { ...payload, idempotency_key:"blockers-0001", unresolved_blockers:["blocking issue"] }); assert(blockers.status === 409 && blockers.body.error.code === "HUMAN_ADVANCEMENT_DECISION_UNRESOLVED_BLOCKERS_PRESENT", "advance with blockers denied");
  const blockedSeed = seed("BLOCKED");
  const nonPass = await post("/v1/human/advancement-decision", "HUMAN", { auditor_helper_execution_review_id:blockedSeed.reviewId, idempotency_key:"non-pass-0001", decision_title:"Advance blocked review", decision_summary:"Diagnostic decision only.", decision_outcome:"advance", required_next_action:"Proceed to next bounded planning stage.", unresolved_blockers:[] });
  assert(nonPass.status === 409 && nonPass.body.error.code === "HUMAN_ADVANCEMENT_DECISION_AUDITOR_REVIEW_NOT_PASS", "advance requires pass");
  const requireRevision = await post("/v1/human/advancement-decision", "HUMAN", { auditor_helper_execution_review_id:blockedSeed.reviewId, idempotency_key:"revision-0001", decision_title:"Require revision", decision_summary:"Human requires bounded revision.", decision_outcome:"require_revision", required_next_action:"Prepare bounded remediation.", unresolved_blockers:["auditor review blocked"] });
  assert(requireRevision.status === 201, "require_revision allowed on blocked review");
  const roleSeed = seed();
  const record = JSON.parse(files.get(roleSeed.reviewPath) || "{}"); record.output_artifacts.helper_execution_review.role = "HELPER_AI"; files.set(roleSeed.reviewPath, JSON.stringify(record));
  const role = await post("/v1/human/advancement-decision", "HUMAN", { ...payload, auditor_helper_execution_review_id: roleSeed.reviewId, idempotency_key:"role-0001" }); assert(role.status === 409 && role.body.error.code === "HUMAN_ADVANCEMENT_DECISION_REVIEW_ARTIFACT_TYPE_MISMATCH", "embedded review role mismatch");
  assert(!writes.some(p => p.includes("promotion_decision") || p.includes("deployment") || p.includes("certification")), "no promotion/deployment/certification artifacts");
  console.log(JSON.stringify({ ok:true, no_auth_status:noAuth.status, success_status:success.status, replay_status:replay.status, conflict_status:conflict.status, bad_claim_status:badClaim.status, secret_status:secret.status, blockers_status:blockers.status, non_pass_status:nonPass.status, require_revision_status:requireRevision.status, role_status:role.status }, null, 2));
}
main().catch(e => { console.error(e); process.exitCode = 1; });
