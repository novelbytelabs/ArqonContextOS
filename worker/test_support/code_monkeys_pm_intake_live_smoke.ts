declare const process: { env: Record<string, string | undefined>; exitCode?: number };

/*
Live deployed smoke for Code Monkeys PM Intake 001.
Covers no-auth, all non-PM denial, PM success, replay, conflict, and non-laundering fields.
*/

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
type Scenario = { name: string; method: string; path: string; role?: Role; request_body?: unknown; expected_status?: number; expected_error?: string };
const scienceSharePath = `${"/v1/science"}/share`;

function token(role: Role): string {
  const envName = TOKEN_ENV[role];
  const value = process.env[envName];
  if (!value) throw new Error(`Missing token env var: ${envName}`);
  return value;
}

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

async function requestScenario(scenario: Scenario): Promise<any> {
  const headers = new Headers();
  if (scenario.role) headers.set("authorization", `Bearer ${token(scenario.role)}`);
  if (scenario.request_body !== undefined) headers.set("content-type", "application/json");
  const response = await fetch(`${WORKER_URL}${scenario.path}`, { method: scenario.method, headers, body: scenario.request_body !== undefined ? JSON.stringify(scenario.request_body) : undefined });
  const text = await response.text();
  let body: any = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (scenario.expected_status !== undefined) assert(response.status === scenario.expected_status, `${scenario.name}: expected ${scenario.expected_status}, got ${response.status}: ${text}`);
  if (scenario.expected_error) assert(body?.error?.code === scenario.expected_error, `${scenario.name}: expected ${scenario.expected_error}, got ${body?.error?.code}`);
  return { ...scenario, status: response.status, ok: response.ok, response_body: body, authorization: scenario.role ? "Bearer REDACTED" : "none" };
}

function body(label: string): string {
  return `${label}\n\nREQUIRES_HUMAN_REVIEW\ndevelopment diagnostic only\nNOT SEALED-TEST CERTIFIED\nnot promotable\n`;
}

async function main(): Promise<void> {
  const suffix = String(Date.now()).slice(-10);
  const transcripts: any[] = [];

  transcripts.push(await requestScenario({ name: "1 no-auth PM intake denied", method: "POST", path: "/v1/pm/intake", request_body: { handoff_id: "none", idempotency_key: `intake-noauth-${suffix}` }, expected_status: 401, expected_error: "UNAUTHORIZED" }));

  transcripts.push(await requestScenario({ name: "2 create science flow", method: "POST", path: "/v1/science/research", role: "EXPLORER_AI", request_body: { name: `pm-intake-science-${suffix}`, title: "PM Intake Live Smoke", summary: "Live PM intake smoke.", artifact_title: "Research dossier", body: body("research_dossier") }, expected_status: 201 }));
  const scienceFlowId = transcripts.at(-1).response_body.flow_id;

  const steps: Array<[string, Role, Record<string, unknown>]> = [
    ["/v1/science/hypothesize", "HYPOTHESIZER_AI", { flow_ref: scienceFlowId, artifact_title: "Hypothesis", body: body("hypothesis_card") }],
    ["/v1/science/design-experiment", "DESIGNER_AI", { flow_ref: scienceFlowId, artifact_title: "Protocol", body: body("experiment_protocol") }],
    ["/v1/science/execute-experiment", "SCIENCE_EXECUTOR_AI", { flow_ref: scienceFlowId, artifact_title: "Execution", body: body("execution_report") }],
    ["/v1/science/audit-experiment", "SCIENCE_AUDITOR_AI", { flow_ref: scienceFlowId, artifact_title: "Audit", body: body("audit_report") }],
    ["/v1/science/record-finding", "SCIENCE_AUDITOR_AI", { flow_ref: scienceFlowId, artifact_type: "finding_record", artifact_title: "Finding", body: body("finding_record") }]
  ];
  let auditArtifact = "";
  let findingArtifact = "";
  for (const [path, role, payload] of steps) {
    transcripts.push(await requestScenario({ name: path, method: "POST", path, role, request_body: payload, expected_status: 201 }));
    if (path.includes("audit")) auditArtifact = transcripts.at(-1).response_body.artifact.artifact_id;
    if (path.includes("record-finding")) findingArtifact = transcripts.at(-1).response_body.artifact.artifact_id;
  }

  transcripts.push(await requestScenario({ name: "share recommendation", method: "POST", path: `/v1/flows/${encodeURIComponent(scienceFlowId)}/artifacts`, role: "SCIENCE_AUDITOR_AI", request_body: { artifact_type: "share_recommendation", title: "Share recommendation", body: body("share_recommendation") }, expected_status: 201 }));
  const recommendationArtifact = transcripts.at(-1).response_body.artifact.artifact_id;

  transcripts.push(await requestScenario({ name: "Human share", method: "POST", path: scienceSharePath, role: "HUMAN", request_body: { flow_ref: scienceFlowId, idempotency_key: `share-${suffix}`, evidence_level: "SUPPORTED_DIAGNOSTIC", uncertainty: "development diagnostic only", source_artifacts: [auditArtifact, findingArtifact, recommendationArtifact], allowed_claims: ["Diagnostic science share may inform PM intake."], forbidden_claims: ["Do not claim certification.", "Do not claim production readiness."], body: body("Human approved share") }, expected_status: 201 }));
  const shareId = transcripts.at(-1).response_body.share.share_id;

  transcripts.push(await requestScenario({ name: "PM handoff", method: "POST", path: "/v1/pm/handoff", role: "PM_AI", request_body: { share_id: shareId, idempotency_key: `handoff-${suffix}`, code_flow_name: `pm-intake-code-${suffix}`, code_flow_title: "PM Intake Code Flow", pm_notes: "Preserve boundary." }, expected_status: 201 }));
  const handoffId = transcripts.at(-1).response_body.handoff.handoff_id;
  const codeFlowId = transcripts.at(-1).response_body.handoff.code_flow.flow_id;

  const deniedRoles: Role[] = ["CODER_AI", "AUDITOR_AI", "HELPER_AI", "EXPLORER_AI", "HYPOTHESIZER_AI", "DESIGNER_AI", "SCIENCE_AUDITOR_AI", "SCIENCE_EXECUTOR_AI", "HUMAN"];
  for (const role of deniedRoles) {
    transcripts.push(await requestScenario({ name: `deny ${role}`, method: "POST", path: "/v1/pm/intake", role, request_body: { handoff_id: handoffId, idempotency_key: `intake-deny-${role.toLowerCase().replace(/_/g, "-")}-${suffix}` }, expected_status: 403, expected_error: "PM_INTAKE_ROLE_FORBIDDEN" }));
  }

  const intakePayload = { handoff_id: handoffId, idempotency_key: `intake-${suffix}`, pm_notes: "Create PM dossier only. Do not generate specs or tasks." };
  transcripts.push(await requestScenario({ name: "PM intake succeeds", method: "POST", path: "/v1/pm/intake", role: "PM_AI", request_body: intakePayload, expected_status: 201 }));
  const intake = transcripts.at(-1).response_body.intake;
  assert(intake.output_artifacts.pm_dossier.artifact_type === "pm_dossier", "missing pm_dossier");
  assert(intake.output_artifacts.pm_gate_definition.artifact_type === "pm_gate_definition", "missing pm_gate_definition");
  assert(intake.source_handoff.forbidden_claims.length === 2, "forbidden claims not preserved");

  transcripts.push(await requestScenario({ name: "duplicate PM intake idempotent", method: "POST", path: "/v1/pm/intake", role: "PM_AI", request_body: intakePayload, expected_status: 200 }));
  assert(transcripts.at(-1).response_body.idempotent_replay === true, "duplicate should replay");

  transcripts.push(await requestScenario({ name: "changed PM intake payload conflicts", method: "POST", path: "/v1/pm/intake", role: "PM_AI", request_body: { ...intakePayload, pm_notes: "Changed notes with same key." }, expected_status: 409, expected_error: "PM_INTAKE_IDEMPOTENCY_CONFLICT" }));

  console.log(JSON.stringify({ ok: true, worker_url: WORKER_URL, science_flow_id: scienceFlowId, share_id: shareId, handoff_id: handoffId, code_flow_id: codeFlowId, intake_id: intake.intake_id, transcripts }, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});

export {};
