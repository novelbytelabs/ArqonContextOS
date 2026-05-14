declare const process: {
  exitCode?: number;
};

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

function auth(role: keyof typeof tokens): string {
  return `Bearer ${tokens[role]}`;
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

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function body(label: string): string {
  return `${label}\n\nREQUIRES_HUMAN_REVIEW\ndevelopment diagnostic only\nNOT SEALED-TEST CERTIFIED\nnot promotable\n`;
}

async function writeScience(path: string, role: keyof typeof tokens, requestBody: Record<string, unknown>, status = 201): Promise<any> {
  const result = await requestJson(path, {
    method: "POST",
    headers: { authorization: auth(role) },
    body: JSON.stringify(requestBody)
  });
  assert(result.status === status, `${path} as ${role} expected ${status}, got ${result.status}: ${JSON.stringify(result.body)}`);
  return result.body;
}

async function main(): Promise<void> {
  const results: string[] = [];
  const record = (message: string): void => {
    results.push(`PASS ${message}`);
  };

  const noAuthShare = await requestJson("/v1/science/share", {
    method: "POST",
    body: JSON.stringify({ flow_ref: "FLOW-NOPE", idempotency_key: "share-key-0001", body: "no auth" })
  });
  assert(noAuthShare.status === 401, `share must require auth first, got ${noAuthShare.status}`);
  record("share requires auth before processing");

  const research = await writeScience("/v1/science/research", "EXPLORER_AI", {
    name: "share-integration-001",
    title: "Share Integration 001",
    summary: "Offline share integration smoke.",
    artifact_title: "Research dossier",
    body: body("research_dossier")
  });
  const flowId = research.flow_id as string;
  const researchArtifactId = research.artifact.artifact_id as string;
  const flowIdValue = flowId as string;
  record("research created science_flow");

  const shareTooEarly = await requestJson("/v1/science/share", {
    method: "POST",
    headers: { authorization: auth("HUMAN") },
    body: JSON.stringify({
      flow_ref: flowId,
      idempotency_key: "share-too-early-0001",
      evidence_level: "SUPPORTED_DIAGNOSTIC",
      uncertainty: "audit incomplete",
      source_artifacts: [researchArtifactId],
      allowed_claims: ["diagnostic claim"],
      forbidden_claims: ["certified claim"],
      body: body("premature share")
    })
  });
  assert(shareTooEarly.status === 409, `share before preconditions should fail 409, got ${shareTooEarly.status}`);
  assert(shareTooEarly.body.error.code === "SCIENCE_SHARE_PRECONDITION_FAILED", "expected precondition failure");
  record("share preconditions enforced");

  await writeScience("/v1/science/hypothesize", "HYPOTHESIZER_AI", {
    flow_ref: flowId,
    artifact_title: "Hypothesis card",
    body: body("hypothesis_card")
  });
  await writeScience("/v1/science/design-experiment", "DESIGNER_AI", {
    flow_ref: flowId,
    artifact_title: "Experiment protocol",
    body: body("experiment_protocol")
  });
  await writeScience("/v1/science/execute-experiment", "SCIENCE_EXECUTOR_AI", {
    flow_ref: flowId,
    artifact_title: "Execution report",
    body: body("execution_report")
  });
  const audit = await writeScience("/v1/science/audit-experiment", "SCIENCE_AUDITOR_AI", {
    flow_ref: flowId,
    artifact_title: "Audit report",
    body: body("audit_report")
  });
  const finding = await writeScience("/v1/science/record-finding", "SCIENCE_AUDITOR_AI", {
    flow_ref: flowId,
    artifact_type: "negative_finding_record",
    artifact_title: "Negative finding record",
    body: body("negative_finding_record")
  });
  record("science route evidence chain written including alternate finding variant");

  const designerIterate = await writeScience("/v1/science/iterate", "DESIGNER_AI", {
    flow_ref: flowId,
    artifact_type: "revised_experiment_protocol",
    artifact_title: "Revised experiment protocol",
    body: body("revised_experiment_protocol")
  });
  assert(designerIterate.artifact.artifact_type === "revised_experiment_protocol", "designer iterate should write revised_experiment_protocol");
  record("DESIGNER_AI iterate branch covered");

  const shareRecommendation = await requestJson(`/v1/flows/${flowId}/artifacts`, {
    method: "POST",
    headers: { authorization: auth("SCIENCE_AUDITOR_AI"), "content-type": "application/json" },
    body: JSON.stringify({
      artifact_type: "share_recommendation",
      title: "Share recommendation",
      body: body("share_recommendation")
    })
  });
  assert(shareRecommendation.status === 201, `share_recommendation expected 201, got ${shareRecommendation.status}: ${JSON.stringify(shareRecommendation.body)}`);
  const shareRecommendationArtifactId = shareRecommendation.body.artifact.artifact_id as string;
  record("SCIENCE_AUDITOR_AI wrote share_recommendation");

  const auditorShare = await requestJson("/v1/science/share", {
    method: "POST",
    headers: { authorization: auth("SCIENCE_AUDITOR_AI"), "content-type": "application/json" },
    body: JSON.stringify({
      flow_ref: flowId,
      idempotency_key: "share-key-deny-auditor-0001",
      evidence_level: "SUPPORTED_DIAGNOSTIC",
      uncertainty: "none",
      source_artifacts: [audit.artifact.artifact_id, finding.artifact.artifact_id, shareRecommendationArtifactId],
      allowed_claims: ["diagnostic"],
      forbidden_claims: ["certified"],
      human_identity: "Mike",
      body: body("auditor spoof")
    })
  });
  assert(auditorShare.status === 403, `SCIENCE_AUDITOR_AI must not share, got ${auditorShare.status}`);
  assert(auditorShare.body.error.code === "SCIENCE_SHARE_HUMAN_REQUIRED", "expected HUMAN required");
  record("SCIENCE_AUDITOR_AI cannot create share_packet even with human_identity body");

  const helperShare = await requestJson("/v1/science/share", {
    method: "POST",
    headers: { authorization: auth("HELPER_AI"), "content-type": "application/json" },
    body: JSON.stringify({
      flow_ref: flowId,
      idempotency_key: "share-key-deny-helper-0001",
      evidence_level: "SUPPORTED_DIAGNOSTIC",
      uncertainty: "none",
      source_artifacts: [audit.artifact.artifact_id, finding.artifact.artifact_id, shareRecommendationArtifactId],
      allowed_claims: ["diagnostic"],
      forbidden_claims: ["certified"],
      human_identity: "Mike",
      body: body("helper spoof")
    })
  });
  assert(helperShare.status === 403, `HELPER_AI must not share, got ${helperShare.status}`);
  record("non-HUMAN human_identity spoof denied");

  const sharePayload = {
    flow_ref: flowId,
    idempotency_key: "share-key-success-0001",
    evidence_level: "SUPPORTED_DIAGNOSTIC",
    uncertainty: "development diagnostic evidence only; not certified for sealed testing",
    source_artifacts: [audit.artifact.artifact_id, finding.artifact.artifact_id, shareRecommendationArtifactId],
    allowed_claims: ["Routes are development-smoked and audit-reviewed as diagnostic evidence."],
    forbidden_claims: ["Do not claim sealed-test certification.", "Do not claim production readiness."],
    human_identity: "spoofed ignored body field",
    body: body("Human-approved share packet")
  };
  const share = await requestJson("/v1/science/share", {
    method: "POST",
    headers: { authorization: auth("HUMAN"), "content-type": "application/json" },
    body: JSON.stringify(sharePayload)
  });
  assert(share.status === 201, `HUMAN share expected 201, got ${share.status}: ${JSON.stringify(share.body)}`);
  assert(share.body.share.human_authority === "server_authenticated_human", "share must use server-derived human authority");
  assert(share.body.share.share_packet_hash, "share hash required");
  record("HUMAN created official share_packet");

  const duplicate = await requestJson("/v1/science/share", {
    method: "POST",
    headers: { authorization: auth("HUMAN"), "content-type": "application/json" },
    body: JSON.stringify(sharePayload)
  });
  assert(duplicate.status === 200, `duplicate share expected 200, got ${duplicate.status}: ${JSON.stringify(duplicate.body)}`);
  assert(duplicate.body.idempotent_replay === true, "duplicate share must return idempotent replay");
  assert(duplicate.body.share.share_id === share.body.share.share_id, "duplicate share id mismatch");
  record("idempotency prevents duplicate share packet/context");

  const contextIndexRaw = files.get("governance/context/generated_pm_share_context.json");
  assert(typeof contextIndexRaw === "string", "PM generated context index was not written");
  const contextIndex = JSON.parse(contextIndexRaw as string);
  assert(contextIndex.entries.length === 1, `expected one PM context entry after replay, got ${contextIndex.entries.length}`);
  record("PM context update is idempotent");

  const messagePath = share.body.share.pm_message_path as string;
  assert(files.has(messagePath), `PM message not written: ${messagePath}`);
  record("PM notification written");

  const outboxRaw = files.get(share.body.share.outbox_path as string);
  assert(typeof outboxRaw === "string", "outbox was not written");
  const outbox = JSON.parse(outboxRaw as string);
  assert(outbox.status === "complete", `outbox should be complete, got ${outbox.status}`);
  record("recoverable outbox completed");

  const genericShare = await requestJson(`/v1/flows/${flowIdValue}/artifacts`, {
    method: "POST",
    headers: { authorization: auth("HUMAN"), "content-type": "application/json" },
    body: JSON.stringify({
      artifact_type: "share_packet",
      title: "Generic share_packet still blocked",
      body: body("generic blocked")
    })
  });
  assert(genericShare.status === 403, `generic share_packet must remain blocked, got ${genericShare.status}`);
  assert(genericShare.body.error.code === "SCIENCE_SHARE_ROUTE_REQUIRED", "expected generic share route required");
  record("generic share_packet remains blocked");

  console.log(JSON.stringify({
    ok: true,
    flow_id: flowId,
    share_id: share.body.share.share_id,
    share_hash: share.body.share.share_packet_hash,
    results,
    written_paths: [...files.keys()].sort()
  }, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});

export {};
