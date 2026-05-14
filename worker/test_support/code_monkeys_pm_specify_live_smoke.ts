declare const process: { env: Record<string, string | undefined>; exitCode?: number };

const WORKER_URL = (process.env.WORKER_URL || "https://arqon-contextos-broker.sonarum.workers.dev").replace(/\/+$/, "");

const TOKEN_ENV: Record<string, string> = {
  PM_AI: "BROKER_KEY_PM",
  CODER_AI: "BROKER_KEY_CODER",
  AUDITOR_AI: "BROKER_KEY_AUDITOR",
  HELPER_AI: "BROKER_KEY_HELPER",
  EXPLORER_AI: "BROKER_KEY_EXPLORER",
  HYPOTHESIZER_AI: "BROKER_KEY_HYPOTHESIZER",
  DESIGNER_AI: "BROKER_KEY_DESIGNER",
  SCIENCE_AUDITOR_AI: "BROKER_KEY_SCIENCE_AUDITOR",
  SCIENCE_EXECUTOR_AI: "BROKER_KEY_SCIENCE_EXECUTOR",
  HUMAN: "BROKER_KEY_HUMAN"
};
type Role = keyof typeof TOKEN_ENV;

function token(role: Role): string {
  const envName = TOKEN_ENV[role];
  const value = process.env[envName];
  if (!value) throw new Error(`Missing token env var: ${envName}`);
  return value;
}
function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}
async function req(name: string, method: string, path: string, role: Role | undefined, request_body: unknown, expected_status: number, expected_error?: string): Promise<any> {
  const headers = new Headers();
  if (role) headers.set("authorization", `Bearer ${token(role)}`);
  if (request_body !== undefined) headers.set("content-type", "application/json");
  const response = await fetch(`${WORKER_URL}${path}`, { method, headers, body: request_body !== undefined ? JSON.stringify(request_body) : undefined });
  const text = await response.text();
  let body: any = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  assert(response.status === expected_status, `${name}: expected ${expected_status}, got ${response.status}: ${text}`);
  if (expected_error) assert(body?.error?.code === expected_error, `${name}: expected ${expected_error}, got ${body?.error?.code}`);
  return { name, status: response.status, ok: response.ok, response_body: body, authorization: role ? "Bearer REDACTED" : "none" };
}
function body(label: string): string {
  return `${label}\n\nREQUIRES_HUMAN_REVIEW\ndevelopment diagnostic only\nNOT SEALED-TEST CERTIFIED\nnot promotable\n`;
}

async function main(): Promise<void> {
  const suffix = String(Date.now()).slice(-10);
  const transcript: any[] = [];
  transcript.push(await req("no-auth PM specify denied", "POST", "/v1/pm/specify", undefined, { intake_id: "none", idempotency_key: `spec-noauth-${suffix}` }, 401, "UNAUTHORIZED"));

  transcript.push(await req("create science flow", "POST", "/v1/science/research", "EXPLORER_AI", { name: `pm-specify-science-${suffix}`, title: "PM Specify Live Smoke", summary: "live", artifact_title: "Research dossier", body: body("research_dossier") }, 201));
  const scienceFlowId = transcript.at(-1).response_body.flow_id;
  const steps: Array<[string, string, Role, Record<string, unknown>]> = [
    ["hypothesize", "/v1/science/hypothesize", "HYPOTHESIZER_AI", { flow_ref: scienceFlowId, artifact_title: "Hypothesis", body: body("hypothesis_card") }],
    ["design", "/v1/science/design-experiment", "DESIGNER_AI", { flow_ref: scienceFlowId, artifact_title: "Protocol", body: body("experiment_protocol") }],
    ["execute", "/v1/science/execute-experiment", "SCIENCE_EXECUTOR_AI", { flow_ref: scienceFlowId, artifact_title: "Execution", body: body("execution_report") }],
    ["audit", "/v1/science/audit-experiment", "SCIENCE_AUDITOR_AI", { flow_ref: scienceFlowId, artifact_title: "Audit", body: body("audit_report") }],
    ["finding", "/v1/science/record-finding", "SCIENCE_AUDITOR_AI", { flow_ref: scienceFlowId, artifact_type: "finding_record", artifact_title: "Finding", body: body("finding_record") }]
  ];
  let auditArtifact = "";
  let findingArtifact = "";
  for (const [name, path, role, payload] of steps) {
    transcript.push(await req(name, "POST", path, role, payload, 201));
    if (name === "audit") auditArtifact = transcript.at(-1).response_body.artifact.artifact_id;
    if (name === "finding") findingArtifact = transcript.at(-1).response_body.artifact.artifact_id;
  }
  transcript.push(await req("share recommendation", "POST", `/v1/flows/${encodeURIComponent(scienceFlowId)}/artifacts`, "SCIENCE_AUDITOR_AI", { artifact_type: "share_recommendation", title: "Share recommendation", body: body("share_recommendation") }, 201));
  const recommendationArtifact = transcript.at(-1).response_body.artifact.artifact_id;

  transcript.push(await req("Human share", "POST", "/v1/science/share", "HUMAN", { flow_ref: scienceFlowId, idempotency_key: `share-${suffix}`, evidence_level: "SUPPORTED_DIAGNOSTIC", uncertainty: "development diagnostic only", source_artifacts: [auditArtifact, findingArtifact, recommendationArtifact], allowed_claims: ["Diagnostic science share may inform PM specification."], forbidden_claims: ["Do not claim certification.", "Do not claim production readiness."], body: body("Human approved share") }, 201));
  const shareId = transcript.at(-1).response_body.share.share_id;

  transcript.push(await req("PM handoff", "POST", "/v1/pm/handoff", "PM_AI", { share_id: shareId, idempotency_key: `handoff-${suffix}`, code_flow_name: `pm-specify-code-${suffix}`, code_flow_title: "PM Specify Code Flow", pm_notes: "Preserve boundary." }, 201));
  const handoffId = transcript.at(-1).response_body.handoff.handoff_id;
  const codeFlowId = transcript.at(-1).response_body.handoff.code_flow.flow_id;

  transcript.push(await req("PM intake", "POST", "/v1/pm/intake", "PM_AI", { handoff_id: handoffId, idempotency_key: `intake-${suffix}`, pm_notes: "Prepare guarded spec." }, 201));
  const intakeId = transcript.at(-1).response_body.intake.intake_id;

  const deniedRoles: Role[] = ["CODER_AI", "AUDITOR_AI", "HELPER_AI", "EXPLORER_AI", "HYPOTHESIZER_AI", "DESIGNER_AI", "SCIENCE_AUDITOR_AI", "SCIENCE_EXECUTOR_AI", "HUMAN"];
  for (const role of deniedRoles) {
    transcript.push(await req(`deny ${role}`, "POST", "/v1/pm/specify", role, { intake_id: intakeId, idempotency_key: `spec-deny-${role}-${suffix}`, specification_title: "Denied", specification_body: "Denied body." }, 403, "PM_SPECIFY_ROLE_FORBIDDEN"));
  }

  const payload = { intake_id: intakeId, idempotency_key: `spec-${suffix}`, specification_title: "PM Specify 001 Candidate Specification", specification_body: "Create a guarded PM specification candidate. Do not create plans or tasks in this stage." };
  transcript.push(await req("PM specify succeeds", "POST", "/v1/pm/specify", "PM_AI", payload, 201));
  const spec = transcript.at(-1).response_body.specification;
  assert(spec.output_artifacts.specification.artifact_type === "specification", "missing specification artifact");
  assert(spec.source_intake.forbidden_claims.length === 2, "forbidden claims not preserved");
  assert(spec.source_intake.share_packet_hash, "share hash not preserved");

  transcript.push(await req("duplicate PM specify idempotent", "POST", "/v1/pm/specify", "PM_AI", payload, 200));
  assert(transcript.at(-1).response_body.idempotent_replay === true, "duplicate should replay");

  transcript.push(await req("changed PM specify payload conflicts", "POST", "/v1/pm/specify", "PM_AI", { ...payload, specification_body: "Changed body with same key." }, 409, "PM_SPECIFY_IDEMPOTENCY_CONFLICT"));
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
    transcript.push(await req(`promotion language denied ${idx}`, "POST", "/v1/pm/specify", "PM_AI", { intake_id: intakeId, idempotency_key: `spec-bad-${idx}-${suffix}`, specification_title: "Forbidden Promotion Probe", specification_body: specificationBody }, 409, "PM_SPECIFY_FORBIDDEN_CLAIM_INCLUDED"));
  }

  console.log(JSON.stringify({ ok: true, worker_url: WORKER_URL, science_flow_id: scienceFlowId, share_id: shareId, handoff_id: handoffId, intake_id: intakeId, code_flow_id: codeFlowId, specification_id: spec.specification_id, transcripts: transcript }, null, 2));
}
main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});

export {};
