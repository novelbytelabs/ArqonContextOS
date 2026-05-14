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

async function buildApprovedScienceShare(suffix: string): Promise<{ flowId: string; shareId: string; shareHash: string }> {
  const research = await writeScience("/v1/science/research", "EXPLORER_AI", {
    name: `handoff-science-${suffix}`,
    title: "Science to Code Handoff Offline Science Flow",
    summary: "Offline science flow for handoff smoke.",
    artifact_title: "Research dossier",
    body: body("research_dossier")
  });
  const flowId = research.flow_id as string;

  await writeScience("/v1/science/hypothesize", "HYPOTHESIZER_AI", { flow_ref: flowId, artifact_title: "Hypothesis", body: body("hypothesis_card") });
  await writeScience("/v1/science/design-experiment", "DESIGNER_AI", { flow_ref: flowId, artifact_title: "Protocol", body: body("experiment_protocol") });
  await writeScience("/v1/science/execute-experiment", "SCIENCE_EXECUTOR_AI", { flow_ref: flowId, artifact_title: "Execution", body: body("execution_report") });
  const audit = await writeScience("/v1/science/audit-experiment", "SCIENCE_AUDITOR_AI", { flow_ref: flowId, artifact_title: "Audit", body: body("audit_report") });
  const finding = await writeScience("/v1/science/record-finding", "SCIENCE_AUDITOR_AI", { flow_ref: flowId, artifact_type: "finding_boundary_record", artifact_title: "Finding boundary", body: body("finding_boundary_record") });

  const recommendation = await requestJson(`/v1/flows/${flowId}/artifacts`, {
    method: "POST",
    headers: { authorization: auth("SCIENCE_AUDITOR_AI"), "content-type": "application/json" },
    body: JSON.stringify({ artifact_type: "share_recommendation", title: "Share recommendation", body: body("share_recommendation") })
  });
  assert(recommendation.status === 201, `share recommendation failed: ${recommendation.status}`);

  const share = await requestJson("/v1/science/share", {
    method: "POST",
    headers: { authorization: auth("HUMAN"), "content-type": "application/json" },
    body: JSON.stringify({
      flow_ref: flowId,
      idempotency_key: `share-${suffix}`,
      evidence_level: "SUPPORTED_DIAGNOSTIC",
      uncertainty: "development diagnostic only",
      source_artifacts: [audit.artifact.artifact_id, finding.artifact.artifact_id, recommendation.body.artifact.artifact_id],
      allowed_claims: ["Diagnostic science share may seed PM context."],
      forbidden_claims: ["Do not claim certification.", "Do not claim production readiness."],
      body: body("Human approved share")
    })
  });
  assert(share.status === 201, `share failed: ${share.status}: ${JSON.stringify(share.body)}`);
  return { flowId, shareId: share.body.share.share_id, shareHash: share.body.share.share_packet_hash };
}

async function main(): Promise<void> {
  const results: string[] = [];
  const record = (message: string): void => {
    results.push(`PASS ${message}`);
  };
  const suffix = "001";

  const noAuth = await requestJson("/v1/pm/handoff", { method: "POST", body: JSON.stringify({ share_id: "none", idempotency_key: "handoff-noauth-0001" }) });
  assert(noAuth.status === 401, `no-auth handoff must fail 401, got ${noAuth.status}`);
  record("handoff requires auth");

  const share = await buildApprovedScienceShare(suffix);
  record("approved science share created");

  const helperDenied = await requestJson("/v1/pm/handoff", {
    method: "POST",
    headers: { authorization: auth("HELPER_AI"), "content-type": "application/json" },
    body: JSON.stringify({ share_id: share.shareId, idempotency_key: "handoff-helper-deny-0001" })
  });
  assert(helperDenied.status === 403, `HELPER_AI handoff must fail 403, got ${helperDenied.status}`);
  assert(helperDenied.body.error.code === "PM_HANDOFF_ROLE_FORBIDDEN", "expected PM handoff role forbidden");
  record("non-PM role denied");

  const missing = await requestJson("/v1/pm/handoff", {
    method: "POST",
    headers: { authorization: auth("PM_AI"), "content-type": "application/json" },
    body: JSON.stringify({ share_id: "missing-share", idempotency_key: "handoff-missing-0001" })
  });
  assert(missing.status === 404, `missing share must fail 404, got ${missing.status}`);
  record("missing share context denied");

  const handoffPayload = {
    share_id: share.shareId,
    idempotency_key: "handoff-success-0001",
    code_flow_name: "handoff-code-flow-001",
    code_flow_title: "Code Flow from Science Share",
    pm_notes: "Carry into PM context only. Preserve uncertainty and forbidden claims."
  };

  const handoff = await requestJson("/v1/pm/handoff", {
    method: "POST",
    headers: { authorization: auth("PM_AI"), "content-type": "application/json" },
    body: JSON.stringify(handoffPayload)
  });
  assert(handoff.status === 201, `PM handoff expected 201, got ${handoff.status}: ${JSON.stringify(handoff.body)}`);
  assert(handoff.body.handoff.source_share.share_packet_hash === share.shareHash, "share hash not preserved");
  assert(handoff.body.handoff.source_share.forbidden_claims.length === 2, "forbidden claims not preserved");
  assert(handoff.body.handoff.output_artifacts.handoff_intake.artifact_type === "handoff_intake", "handoff intake artifact missing");
  assert(handoff.body.handoff.output_artifacts.dossier_seed.artifact_type === "dossier_seed", "dossier seed artifact missing");
  record("PM handoff created code_flow and PM artifacts");

  const scienceManifestBefore = JSON.parse(files.get(`governance/flows/${share.flowId}/flow_manifest.json`) || "{}");
  const scienceArtifactCountBefore = scienceManifestBefore.artifacts.length;

  const duplicate = await requestJson("/v1/pm/handoff", {
    method: "POST",
    headers: { authorization: auth("PM_AI"), "content-type": "application/json" },
    body: JSON.stringify(handoffPayload)
  });
  assert(duplicate.status === 200, `duplicate handoff expected 200, got ${duplicate.status}`);
  assert(duplicate.body.idempotent_replay === true, "duplicate handoff should be idempotent replay");
  record("PM handoff idempotency replay works");

  const conflict = await requestJson("/v1/pm/handoff", {
    method: "POST",
    headers: { authorization: auth("PM_AI"), "content-type": "application/json" },
    body: JSON.stringify({ ...handoffPayload, pm_notes: "Changed notes with same idempotency key." })
  });
  assert(conflict.status === 409, `handoff conflict expected 409, got ${conflict.status}`);
  assert(conflict.body.error.code === "PM_HANDOFF_IDEMPOTENCY_CONFLICT", "expected PM_HANDOFF_IDEMPOTENCY_CONFLICT");
  record("same handoff idempotency key with changed payload denied");

  const scienceManifestAfter = JSON.parse(files.get(`governance/flows/${share.flowId}/flow_manifest.json`) || "{}");
  assert(scienceManifestAfter.artifacts.length === scienceArtifactCountBefore, "PM handoff must not add Science artifacts");
  record("handoff did not write new Science artifacts");

  const handoffIndex = JSON.parse(files.get("governance/context/generated_pm_handoff_context.json") || "{}");
  assert(handoffIndex.entries.length === 1, "generated PM handoff context index should have one entry");
  record("generated PM handoff context updated");

  const codeManifest = JSON.parse(files.get(`governance/flows/${handoff.body.handoff.code_flow.flow_id}/flow_manifest.json`) || "{}");
  const codeTypes = new Set(codeManifest.artifacts.map((artifact: { artifact_type: string }) => artifact.artifact_type));
  assert(codeTypes.has("handoff_intake"), "code flow missing handoff_intake");
  assert(codeTypes.has("dossier_seed"), "code flow missing dossier_seed");
  record("code_flow contains handoff intake and dossier seed");

  const handoffRecordPath = handoff.body.handoff.handoff_record_path as string;
  const handoffRecord = JSON.parse(files.get(handoffRecordPath) || "{}");
  assert(handoffRecord.source_share.forbidden_claims.includes("Do not claim certification."), "handoff record lost forbidden claims");
  assert(handoffRecord.required_status_labels.includes("NOT SEALED-TEST CERTIFIED"), "handoff record lost required labels");
  record("handoff record preserves claim boundary");

  console.log(JSON.stringify({ ok: true, share, handoff_id: handoff.body.handoff.handoff_id, code_flow_id: handoff.body.handoff.code_flow.flow_id, results, written_paths: [...files.keys()].sort() }, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
