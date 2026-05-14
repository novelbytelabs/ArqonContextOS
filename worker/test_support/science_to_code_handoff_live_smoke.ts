declare const process: { env: Record<string, string | undefined>; exitCode?: number };

type Scenario = { name: string; method: string; path: string; role?: string; request_body?: unknown; expected_status?: number; expected_error?: string };
type Transcript = Scenario & { status: number; ok: boolean; response_body: unknown; authorization: "Bearer REDACTED" | "none" };

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

function token(role: string): string {
  const envName = TOKEN_ENV[role];
  const value = process.env[envName];
  if (!value) throw new Error(`Missing token env var: ${envName}`);
  return value;
}

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

async function requestScenario(scenario: Scenario): Promise<Transcript> {
  const headers = new Headers();
  if (scenario.role) headers.set("authorization", `Bearer ${token(scenario.role)}`);
  if (scenario.request_body !== undefined) headers.set("content-type", "application/json");
  const response = await fetch(`${WORKER_URL}${scenario.path}`, { method: scenario.method, headers, body: scenario.request_body !== undefined ? JSON.stringify(scenario.request_body) : undefined });
  const text = await response.text();
  let responseBody: unknown = null;
  try { responseBody = text ? JSON.parse(text) : null; } catch { responseBody = text; }
  const transcript: Transcript = { ...scenario, status: response.status, ok: response.ok, response_body: responseBody, authorization: scenario.role ? "Bearer REDACTED" : "none" };
  if (scenario.expected_status !== undefined) assert(response.status === scenario.expected_status, `${scenario.name}: expected ${scenario.expected_status}, got ${response.status}: ${text}`);
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
  const suffix = String(Date.now()).slice(-10);
  const transcripts: Transcript[] = [];

  transcripts.push(await requestScenario({ name: "1 no-auth handoff denied", method: "POST", path: "/v1/pm/handoff", request_body: { share_id: "none", idempotency_key: `handoff-noauth-${suffix}` }, expected_status: 401, expected_error: "UNAUTHORIZED" }));

  transcripts.push(await requestScenario({ name: "2 create science flow", method: "POST", path: "/v1/science/research", role: "EXPLORER_AI", request_body: { name: `handoff-science-${suffix}`, title: "Science to Code Handoff Live Smoke", summary: "Live smoke for PM handoff boundary.", artifact_title: "Research dossier", body: body("research_dossier") }, expected_status: 201 }));
  const research = transcripts[transcripts.length - 1].response_body as { flow_id?: string };
  const flowId = research.flow_id;
  assert(typeof flowId === "string", "missing science flow id");
  const flowIdValue = flowId as string;

  const chain = [
    { name: "3 hypothesis", path: "/v1/science/hypothesize", role: "HYPOTHESIZER_AI", request_body: { flow_ref: flowIdValue, artifact_title: "Hypothesis", body: body("hypothesis_card") } },
    { name: "4 design", path: "/v1/science/design-experiment", role: "DESIGNER_AI", request_body: { flow_ref: flowIdValue, artifact_title: "Protocol", body: body("experiment_protocol") } },
    { name: "5 execute", path: "/v1/science/execute-experiment", role: "SCIENCE_EXECUTOR_AI", request_body: { flow_ref: flowIdValue, artifact_title: "Execution", body: body("execution_report") } },
    { name: "6 audit", path: "/v1/science/audit-experiment", role: "SCIENCE_AUDITOR_AI", request_body: { flow_ref: flowIdValue, artifact_title: "Audit", body: body("audit_report") } },
    { name: "7 finding", path: "/v1/science/record-finding", role: "SCIENCE_AUDITOR_AI", request_body: { flow_ref: flowIdValue, artifact_type: "finding_record", artifact_title: "Finding", body: body("finding_record") } }
  ];

  let auditArtifact = "";
  let findingArtifact = "";
  for (const item of chain) {
    transcripts.push(await requestScenario({ method: "POST", expected_status: 201, ...item } as Scenario));
    const response = transcripts[transcripts.length - 1].response_body as { artifact?: { artifact_id?: string } };
    if (item.name === "6 audit") auditArtifact = response.artifact?.artifact_id || "";
    if (item.name === "7 finding") findingArtifact = response.artifact?.artifact_id || "";
  }

  transcripts.push(await requestScenario({ name: "8 share recommendation", method: "POST", path: `/v1/flows/${encodeURIComponent(flowIdValue)}/artifacts`, role: "SCIENCE_AUDITOR_AI", request_body: { artifact_type: "share_recommendation", title: "Share recommendation", body: body("share_recommendation") }, expected_status: 201 }));
  const recommendation = transcripts[transcripts.length - 1].response_body as { artifact?: { artifact_id?: string } };
  const recommendationArtifact = recommendation.artifact?.artifact_id || "";
  assert(Boolean(auditArtifact && findingArtifact && recommendationArtifact), "missing source artifact ids");

  transcripts.push(await requestScenario({ name: "9 Human share", method: "POST", path: "/v1/science/share", role: "HUMAN", request_body: { flow_ref: flowIdValue, idempotency_key: `share-${suffix}`, evidence_level: "SUPPORTED_DIAGNOSTIC", uncertainty: "development diagnostic only", source_artifacts: [auditArtifact, findingArtifact, recommendationArtifact], allowed_claims: ["Diagnostic science share may seed PM context."], forbidden_claims: ["Do not claim certification.", "Do not claim production readiness."], body: body("Human approved share") }, expected_status: 201 }));
  const shareResponse = transcripts[transcripts.length - 1].response_body as { share?: { share_id?: string; share_packet_hash?: string } };
  const shareId = shareResponse.share?.share_id;
  const shareHash = shareResponse.share?.share_packet_hash;
  assert(typeof shareId === "string", "missing share_id");
  assert(typeof shareHash === "string", "missing share hash");

  transcripts.push(await requestScenario({ name: "10 Helper handoff denied", method: "POST", path: "/v1/pm/handoff", role: "HELPER_AI", request_body: { share_id: shareId, idempotency_key: `handoff-helper-${suffix}` }, expected_status: 403, expected_error: "PM_HANDOFF_ROLE_FORBIDDEN" }));

  const handoffPayload = { share_id: shareId as string, idempotency_key: `handoff-${suffix}`, code_flow_name: `handoff-code-${suffix}`, code_flow_title: "Code Flow from Science Share", pm_notes: "Preserve uncertainty and forbidden claims." };

  transcripts.push(await requestScenario({ name: "11 PM handoff succeeds", method: "POST", path: "/v1/pm/handoff", role: "PM_AI", request_body: handoffPayload, expected_status: 201 }));
  const handoffResponse = transcripts[transcripts.length - 1].response_body as { handoff?: { handoff_id?: string; source_share?: { share_packet_hash?: string; forbidden_claims?: string[] }; code_flow?: { flow_id?: string }; output_artifacts?: { handoff_intake?: { artifact_type?: string }; dossier_seed?: { artifact_type?: string } } } };
  assert(handoffResponse.handoff?.source_share?.share_packet_hash === shareHash, "handoff did not preserve share hash");
  assert(handoffResponse.handoff?.source_share?.forbidden_claims?.length === 2, "handoff did not preserve forbidden claims");
  assert(handoffResponse.handoff?.output_artifacts?.handoff_intake?.artifact_type === "handoff_intake", "missing handoff_intake");
  assert(handoffResponse.handoff?.output_artifacts?.dossier_seed?.artifact_type === "dossier_seed", "missing dossier_seed");

  transcripts.push(await requestScenario({ name: "12 duplicate PM handoff idempotent", method: "POST", path: "/v1/pm/handoff", role: "PM_AI", request_body: handoffPayload, expected_status: 200 }));
  const duplicate = transcripts[transcripts.length - 1].response_body as { idempotent_replay?: boolean };
  assert(duplicate.idempotent_replay === true, "duplicate PM handoff should be idempotent replay");

  transcripts.push(await requestScenario({ name: "13 changed PM handoff payload conflicts", method: "POST", path: "/v1/pm/handoff", role: "PM_AI", request_body: { ...handoffPayload, pm_notes: "Changed notes with same handoff key." }, expected_status: 409, expected_error: "PM_HANDOFF_IDEMPOTENCY_CONFLICT" }));

  console.log(JSON.stringify({ ok: true, worker_url: WORKER_URL, science_flow_id: flowId, share_id: shareId, share_packet_hash: shareHash, handoff_id: handoffResponse.handoff?.handoff_id, code_flow_id: handoffResponse.handoff?.code_flow?.flow_id, transcripts }, null, 2));
}

main().catch(err => { console.error(err); process.exitCode = 1; });
