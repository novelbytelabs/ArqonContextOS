declare const process: {
  env: Record<string, string | undefined>;
  exitCode?: number;
};

type Scenario = {
  name: string;
  method: string;
  path: string;
  role?: string;
  request_body?: unknown;
  expected_status?: number;
  expected_error?: string;
};

type Transcript = Scenario & {
  status: number;
  ok: boolean;
  response_body: unknown;
  authorization: "Bearer REDACTED" | "none";
};

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

function requireToken(role: string): string {
  const envName = TOKEN_ENV[role];
  if (!envName) throw new Error(`Unknown role: ${role}`);
  const value = process.env[envName];
  if (!value) throw new Error(`Missing token env var: ${envName}`);
  return value;
}

function brokerKeyUniqueness(): { ok: boolean; duplicate_groups: string[][]; missing: string[] } {
  const missing: string[] = [];
  const byValue = new Map<string, string[]>();
  for (const envName of Object.values(TOKEN_ENV)) {
    const value = process.env[envName];
    if (!value) {
      missing.push(envName);
      continue;
    }
    const existing = byValue.get(value) || [];
    existing.push(envName);
    byValue.set(value, existing);
  }
  const duplicate_groups = [...byValue.values()].filter(group => group.length > 1);
  return { ok: missing.length === 0 && duplicate_groups.length === 0, duplicate_groups, missing };
}

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

async function requestScenario(scenario: Scenario): Promise<Transcript> {
  const headers = new Headers();
  if (scenario.role) headers.set("authorization", `Bearer ${requireToken(scenario.role)}`);
  if (scenario.request_body !== undefined) headers.set("content-type", "application/json");

  const response = await fetch(`${WORKER_URL}${scenario.path}`, {
    method: scenario.method,
    headers,
    body: scenario.request_body !== undefined ? JSON.stringify(scenario.request_body) : undefined
  });
  const text = await response.text();
  let responseBody: unknown = null;
  try { responseBody = text ? JSON.parse(text) : null; } catch { responseBody = text; }

  const transcript: Transcript = {
    ...scenario,
    status: response.status,
    ok: response.ok,
    response_body: responseBody,
    authorization: scenario.role ? "Bearer REDACTED" : "none"
  };

  if (scenario.expected_status !== undefined) {
    assert(response.status === scenario.expected_status, `${scenario.name}: expected ${scenario.expected_status}, got ${response.status}: ${text}`);
  }
  if (scenario.expected_error) {
    const code = responseBody && typeof responseBody === "object" ? (responseBody as { error?: { code?: string } }).error?.code : undefined;
    assert(code === scenario.expected_error, `${scenario.name}: expected ${scenario.expected_error}, got ${code}: ${text}`);
  }
  return transcript;
}

function body(label: string): string {
  return `${label}\n\nREQUIRES_HUMAN_REVIEW\ndevelopment diagnostic only\nNOT SEALED-TEST CERTIFIED\nnot promotable\n`;
}

async function main(): Promise<void> {
  const keyCheck = brokerKeyUniqueness();
  assert(keyCheck.ok, `broker key uniqueness failed: ${JSON.stringify(keyCheck)}`);

  const suffix = String(Date.now()).slice(-10);
  const name = `share-v01-live-${suffix}`;
  const transcripts: Transcript[] = [];

  transcripts.push(await requestScenario({
    name: "1 no-auth share requires auth",
    method: "POST",
    path: "/v1/science/share",
    request_body: { flow_ref: "FLOW-NOAUTH", idempotency_key: `noauth-${suffix}`, body: "no auth" },
    expected_status: 401,
    expected_error: "UNAUTHORIZED"
  }));

  transcripts.push(await requestScenario({
    name: "2 research creates flow",
    method: "POST",
    path: "/v1/science/research",
    role: "EXPLORER_AI",
    request_body: {
      name,
      title: "Share Integration 001 live smoke",
      summary: "Live smoke for Human share integration.",
      artifact_title: "Research dossier",
      body: body("research_dossier")
    },
    expected_status: 201
  }));
  const researchBody = transcripts[transcripts.length - 1].response_body as { flow_id?: string; artifact?: { artifact_id?: string } };
  const flowId = researchBody.flow_id;
  const researchArtifact = researchBody.artifact?.artifact_id;
  assert(typeof flowId === "string", "missing flow id");
  assert(typeof researchArtifact === "string", "missing research artifact id");
  const flowIdValue = flowId as string;
  const researchArtifactValue = researchArtifact as string;

  transcripts.push(await requestScenario({
    name: "3 premature Human share denied",
    method: "POST",
    path: "/v1/science/share",
    role: "HUMAN",
    request_body: {
      flow_ref: flowId,
      idempotency_key: `premature-${suffix}`,
      evidence_level: "SUPPORTED_DIAGNOSTIC",
      uncertainty: "audit incomplete",
      source_artifacts: [researchArtifactValue],
      allowed_claims: ["diagnostic only"],
      forbidden_claims: ["certified"],
      body: body("premature share")
    },
    expected_status: 409,
    expected_error: "SCIENCE_SHARE_PRECONDITION_FAILED"
  }));

  const chain = [
    ["4 hypothesize", "/v1/science/hypothesize", "HYPOTHESIZER_AI", { flow_ref: flowId, artifact_title: "Hypothesis", body: body("hypothesis_card") }],
    ["5 design", "/v1/science/design-experiment", "DESIGNER_AI", { flow_ref: flowId, artifact_title: "Protocol", body: body("experiment_protocol") }],
    ["6 execute", "/v1/science/execute-experiment", "SCIENCE_EXECUTOR_AI", { flow_ref: flowId, artifact_title: "Execution", body: body("execution_report") }],
    ["7 audit", "/v1/science/audit-experiment", "SCIENCE_AUDITOR_AI", { flow_ref: flowId, artifact_title: "Audit", body: body("audit_report") }],
    ["8 record alternate finding", "/v1/science/record-finding", "SCIENCE_AUDITOR_AI", { flow_ref: flowId, artifact_type: "inconclusive_finding_record", artifact_title: "Inconclusive finding", body: body("inconclusive_finding_record") }],
    ["9 designer iterate", "/v1/science/iterate", "DESIGNER_AI", { flow_ref: flowId, artifact_type: "revised_experiment_protocol", artifact_title: "Revised protocol", body: body("revised_experiment_protocol") }]
  ] as const;

  let auditArtifact = "";
  let findingArtifact = "";
  for (const [name, path, role, request_body] of chain) {
    transcripts.push(await requestScenario({ name, method: "POST", path, role, request_body, expected_status: 201 }));
    const last = transcripts[transcripts.length - 1].response_body as { artifact?: { artifact_id?: string } };
    if (name === "7 audit") auditArtifact = last.artifact?.artifact_id || "";
    if (name === "8 record alternate finding") findingArtifact = last.artifact?.artifact_id || "";
  }

  transcripts.push(await requestScenario({
    name: "10 write share recommendation",
    method: "POST",
    path: `/v1/flows/${encodeURIComponent(flowIdValue)}/artifacts`,
    role: "SCIENCE_AUDITOR_AI",
    request_body: { artifact_type: "share_recommendation", title: "Share recommendation", body: body("share_recommendation") },
    expected_status: 201
  }));
  const recommendationBody = transcripts[transcripts.length - 1].response_body as { artifact?: { artifact_id?: string } };
  const recommendationArtifact = recommendationBody.artifact?.artifact_id || "";
  assert(Boolean(auditArtifact && findingArtifact && recommendationArtifact), "missing source artifact ids");

  const sharePayload = {
    flow_ref: flowId,
    idempotency_key: `share-${suffix}`,
    evidence_level: "SUPPORTED_DIAGNOSTIC",
    uncertainty: "development diagnostic evidence only",
    source_artifacts: [auditArtifact, findingArtifact, recommendationArtifact],
    allowed_claims: ["Share integration live smoke passed as development diagnostic evidence."],
    forbidden_claims: ["Do not claim sealed-test certification.", "Do not claim production readiness."],
    human_identity: "body spoof ignored",
    body: body("Human-approved live share packet")
  };

  transcripts.push(await requestScenario({
    name: "11 Science Auditor cannot share",
    method: "POST",
    path: "/v1/science/share",
    role: "SCIENCE_AUDITOR_AI",
    request_body: sharePayload,
    expected_status: 403,
    expected_error: "SCIENCE_SHARE_HUMAN_REQUIRED"
  }));

  transcripts.push(await requestScenario({
    name: "12 Helper human_identity spoof cannot share",
    method: "POST",
    path: "/v1/science/share",
    role: "HELPER_AI",
    request_body: sharePayload,
    expected_status: 403,
    expected_error: "SCIENCE_SHARE_HUMAN_REQUIRED"
  }));

  transcripts.push(await requestScenario({
    name: "13 Human share succeeds",
    method: "POST",
    path: "/v1/science/share",
    role: "HUMAN",
    request_body: sharePayload,
    expected_status: 201
  }));
  const shareBody = transcripts[transcripts.length - 1].response_body as { share?: { share_id?: string; share_packet_hash?: string; human_authority?: string } };
  assert(shareBody.share?.human_authority === "server_authenticated_human", "share must be server-derived HUMAN authority");
  assert(typeof shareBody.share?.share_packet_hash === "string", "share hash missing");

  transcripts.push(await requestScenario({
    name: "14 duplicate Human share is idempotent",
    method: "POST",
    path: "/v1/science/share",
    role: "HUMAN",
    request_body: sharePayload,
    expected_status: 200
  }));
  const dup = transcripts[transcripts.length - 1].response_body as { idempotent_replay?: boolean; share?: { share_id?: string } };
  assert(dup.idempotent_replay === true, "duplicate must be idempotent replay");
  assert(dup.share?.share_id === shareBody.share?.share_id, "idempotent share id mismatch");

  transcripts.push(await requestScenario({
    name: "15 generic share_packet remains blocked",
    method: "POST",
    path: `/v1/flows/${encodeURIComponent(flowIdValue)}/artifacts`,
    role: "HUMAN",
    request_body: { artifact_type: "share_packet", title: "Generic share packet should remain blocked", body: body("generic share") },
    expected_status: 403,
    expected_error: "SCIENCE_SHARE_ROUTE_REQUIRED"
  }));

  console.log(JSON.stringify({
    ok: true,
    worker_url: WORKER_URL,
    broker_key_uniqueness: keyCheck,
    flow_id: flowId,
    flow_name: name,
    share_id: shareBody.share?.share_id,
    share_packet_hash: shareBody.share?.share_packet_hash,
    transcripts
  }, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});

export {};
