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
  if (!envName) throw new Error(`Unknown role for token lookup: ${role}`);
  const value = process.env[envName];
  if (!value) throw new Error(`Missing required token env var: ${envName}`);
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
  try {
    responseBody = text ? JSON.parse(text) : null;
  } catch {
    responseBody = text;
  }

  const transcript: Transcript = {
    ...scenario,
    status: response.status,
    ok: response.ok,
    response_body: responseBody,
    authorization: scenario.role ? "Bearer REDACTED" : "none"
  };

  if (scenario.expected_status !== undefined) {
    assert(response.status === scenario.expected_status, `${scenario.name}: expected status ${scenario.expected_status}, got ${response.status}: ${text}`);
  }
  if (scenario.expected_error) {
    const code = responseBody && typeof responseBody === "object" ? (responseBody as { error?: { code?: string } }).error?.code : undefined;
    assert(code === scenario.expected_error, `${scenario.name}: expected error ${scenario.expected_error}, got ${code}: ${text}`);
  }

  return transcript;
}

function artifactBody(label: string): string {
  return `${label}\n\nREQUIRES_HUMAN_REVIEW\ndevelopment diagnostic only\nNOT SEALED-TEST CERTIFIED\nnot promotable\n`;
}

async function main(): Promise<void> {
  const keyCheck = brokerKeyUniqueness();
  assert(keyCheck.ok, `Broker key uniqueness failed: ${JSON.stringify(keyCheck)}`);

  const suffix = String(Date.now()).slice(-10);
  const scienceName = `science-routes-v01-live-${suffix}`;
  const codeName = `code-routes-v01-live-${suffix}`;

  const transcripts: Transcript[] = [];

  transcripts.push(await requestScenario({
    name: "1 health",
    method: "GET",
    path: "/v1/health",
    expected_status: 200
  }));

  transcripts.push(await requestScenario({
    name: "2 research creates science_flow and research_dossier",
    method: "POST",
    path: "/v1/science/research",
    role: "EXPLORER_AI",
    request_body: {
      name: scienceName,
      title: "Routes 001 live science flow",
      summary: "Routes 001 live smoke science flow.",
      artifact_title: "Research dossier",
      body: artifactBody("research_dossier")
    },
    expected_status: 201
  }));
  const researchBody = transcripts[transcripts.length - 1].response_body as { flow_id?: string };
  const scienceFlowId = researchBody.flow_id;
  assert(typeof scienceFlowId === "string" && scienceFlowId.startsWith("FLOW-"), "research route did not return science flow id");
  const scienceFlowIdValue = scienceFlowId as string;

  const writes: Scenario[] = [
    {
      name: "3 hypothesize writes hypothesis_card",
      method: "POST",
      path: "/v1/science/hypothesize",
      role: "HYPOTHESIZER_AI",
      request_body: { flow_ref: scienceFlowId, artifact_title: "Hypothesis card", body: artifactBody("hypothesis_card") },
      expected_status: 201
    },
    {
      name: "4 design-experiment writes experiment_protocol",
      method: "POST",
      path: "/v1/science/design-experiment",
      role: "DESIGNER_AI",
      request_body: { flow_ref: scienceFlowId, artifact_title: "Experiment protocol", body: artifactBody("experiment_protocol") },
      expected_status: 201
    },
    {
      name: "5 execute-experiment writes execution_report",
      method: "POST",
      path: "/v1/science/execute-experiment",
      role: "SCIENCE_EXECUTOR_AI",
      request_body: { flow_ref: scienceFlowId, artifact_title: "Execution report", body: artifactBody("execution_report") },
      expected_status: 201
    },
    {
      name: "6 audit-experiment writes audit_report",
      method: "POST",
      path: "/v1/science/audit-experiment",
      role: "SCIENCE_AUDITOR_AI",
      request_body: { flow_ref: scienceFlowId, artifact_title: "Audit report", body: artifactBody("audit_report") },
      expected_status: 201
    },
    {
      name: "7 interpret writes interpretation_draft",
      method: "POST",
      path: "/v1/science/interpret",
      role: "HYPOTHESIZER_AI",
      request_body: { flow_ref: scienceFlowId, artifact_title: "Interpretation draft", body: artifactBody("interpretation_draft") },
      expected_status: 201
    },
    {
      name: "8 iterate writes iteration_proposal",
      method: "POST",
      path: "/v1/science/iterate",
      role: "HYPOTHESIZER_AI",
      request_body: { flow_ref: scienceFlowId, artifact_type: "iteration_proposal", artifact_title: "Iteration proposal", body: artifactBody("iteration_proposal") },
      expected_status: 201
    },
    {
      name: "9 record-finding writes finding_record",
      method: "POST",
      path: "/v1/science/record-finding",
      role: "SCIENCE_AUDITOR_AI",
      request_body: { flow_ref: scienceFlowId, artifact_title: "Finding record", body: artifactBody("finding_record") },
      expected_status: 201
    }
  ];

  for (const scenario of writes) transcripts.push(await requestScenario(scenario));

  const denials: Scenario[] = [
    {
      name: "10 PM_AI denied research route despite body role spoof",
      method: "POST",
      path: "/v1/science/research",
      role: "PM_AI",
      request_body: { flow_ref: scienceFlowId, role: "EXPLORER_AI", artifact_title: "Spoofed research", body: artifactBody("spoof") },
      expected_status: 403,
      expected_error: "SCIENCE_ROUTE_ROLE_FORBIDDEN"
    },
    {
      name: "11 HELPER_AI denied execute-experiment",
      method: "POST",
      path: "/v1/science/execute-experiment",
      role: "HELPER_AI",
      request_body: { flow_ref: scienceFlowId, artifact_title: "Helper forbidden execution", body: artifactBody("forbidden") },
      expected_status: 403,
      expected_error: "SCIENCE_ROUTE_ROLE_FORBIDDEN"
    },
    {
      name: "12 AUDITOR_AI denied audit-experiment",
      method: "POST",
      path: "/v1/science/audit-experiment",
      role: "AUDITOR_AI",
      request_body: { flow_ref: scienceFlowId, artifact_title: "Code auditor forbidden audit", body: artifactBody("forbidden") },
      expected_status: 403,
      expected_error: "SCIENCE_ROUTE_ROLE_FORBIDDEN"
    },
    {
      name: "13 science share route remains not implemented",
      method: "POST",
      path: "/v1/science/share",
      role: "HUMAN",
      request_body: { flow_ref: scienceFlowId, human_identity: "Mike", body: artifactBody("share") },
      expected_status: 501,
      expected_error: "SCIENCE_SHARE_NOT_IMPLEMENTED"
    },
    {
      name: "14 generic Human share_packet remains blocked",
      method: "POST",
      path: `/v1/flows/${encodeURIComponent(scienceFlowIdValue)}/artifacts`,
      role: "HUMAN",
      request_body: { artifact_type: "share_packet", title: "Generic share packet should stay blocked", body: artifactBody("generic share") },
      expected_status: 403,
      expected_error: "SCIENCE_SHARE_ROUTE_REQUIRED"
    }
  ];

  for (const scenario of denials) transcripts.push(await requestScenario(scenario));

  transcripts.push(await requestScenario({
    name: "15 create code_flow as PM_AI",
    method: "POST",
    path: "/v1/flows",
    role: "PM_AI",
    request_body: { name: codeName, type: "code_flow", title: "Routes 001 code compatibility", summary: "Regression code flow." },
    expected_status: 201
  }));
  const codeBody = transcripts[transcripts.length - 1].response_body as { flow_id?: string };
  const codeFlowId = codeBody.flow_id;
  assert(typeof codeFlowId === "string" && codeFlowId.startsWith("FLOW-"), "code flow create did not return flow id");
  const codeFlowIdValue = codeFlowId as string;

  transcripts.push(await requestScenario({
    name: "16 HELPER_AI writes code_flow execution_report",
    method: "POST",
    path: `/v1/flows/${encodeURIComponent(codeFlowIdValue)}/artifacts`,
    role: "HELPER_AI",
    request_body: { artifact_type: "execution_report", title: "Code flow execution report", body: artifactBody("code execution_report") },
    expected_status: 201
  }));

  transcripts.push(await requestScenario({
    name: "17 science flow status",
    method: "GET",
    path: `/v1/flows/${encodeURIComponent(scienceFlowIdValue)}/status`,
    role: "EXPLORER_AI",
    expected_status: 200
  }));

  transcripts.push(await requestScenario({
    name: "18 v0.2 runs fallback",
    method: "GET",
    path: "/v1/runs",
    role: "PM_AI",
    expected_status: 501,
    expected_error: "NOT_IMPLEMENTED"
  }));

  console.log(JSON.stringify({
    ok: true,
    worker_url: WORKER_URL,
    broker_key_uniqueness: { ok: keyCheck.ok, missing: keyCheck.missing, duplicate_groups: keyCheck.duplicate_groups },
    science_flow_id: scienceFlowId,
    science_flow_name: scienceName,
    code_flow_id: codeFlowId,
    code_flow_name: codeName,
    transcripts
  }, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
