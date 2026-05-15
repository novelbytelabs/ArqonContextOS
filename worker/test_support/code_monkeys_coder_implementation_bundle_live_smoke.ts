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
function assert(condition: boolean, message: string): void { if (!condition) throw new Error(message); }
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
async function main(): Promise<void> {
  const suffix = String(Date.now()).slice(-10);
  const transcript: any[] = [];
  transcript.push(await req("no-auth implementation bundle denied", "POST", "/v1/coder/implementation-bundle", undefined, { coder_tasks_id: "none", idempotency_key: `implementation-bundle-noauth-${suffix}` }, 401, "UNAUTHORIZED"));

  const coderTasksId = process.env.CODER_IMPLEMENTATION_BUNDLE_TASKS_ID;
  const codeFlowId = process.env.CODER_IMPLEMENTATION_BUNDLE_CODE_FLOW_ID;
  if (!coderTasksId) throw new Error("Set CODER_IMPLEMENTATION_BUNDLE_TASKS_ID to a live coder_tasks_id before running this smoke.");
  if (!codeFlowId) throw new Error("Set CODER_IMPLEMENTATION_BUNDLE_CODE_FLOW_ID to the corresponding live code_flow_id before running this smoke.");

  const deniedRoles: Role[] = ["PM_AI", "AUDITOR_AI", "HELPER_AI", "EXPLORER_AI", "HYPOTHESIZER_AI", "DESIGNER_AI", "SCIENCE_AUDITOR_AI", "SCIENCE_EXECUTOR_AI", "HUMAN"];
  for (const role of deniedRoles) {
    transcript.push(await req(`deny ${role}`, "POST", "/v1/coder/implementation-bundle", role, { coder_tasks_id: coderTasksId, idempotency_key: `implementation-bundle-deny-${role}-${suffix}`, bundle_title: "Denied", bundle_body: "Denied body." }, 403, "CODER_IMPLEMENTATION_BUNDLE_ROLE_FORBIDDEN"));
  }

  const payload = { coder_tasks_id: coderTasksId, idempotency_key: `implementation-bundle-${suffix}`, bundle_title: "Implementation Bundle 001 Candidate", bundle_body: "Implementation proposal only. Include intended files, patch strategy, unit tests, integration tests, end-to-end tests, regression tests, adversarial tests, rollback plan, and evidence requirements. Do not tell Helper to run. Do not authorize execution." };
  transcript.push(await req("Implementation bundle succeeds", "POST", "/v1/coder/implementation-bundle", "CODER_AI", payload, 201));
  const bundle = transcript.at(-1).response_body.implementation_bundle;
  assert(bundle.output_artifacts.implementation_bundle.artifact_type === "implementation_bundle", "missing implementation_bundle artifact");
  assert(bundle.source_coder_tasks.forbidden_claims.length > 0, "forbidden claims not preserved");
  assert(bundle.source_coder_tasks.share_packet_hash, "share hash not preserved");

  transcript.push(await req("duplicate implementation bundle idempotent", "POST", "/v1/coder/implementation-bundle", "CODER_AI", payload, 200));
  assert(transcript.at(-1).response_body.idempotent_replay === true, "duplicate should replay");
  transcript.push(await req("changed implementation bundle payload conflicts", "POST", "/v1/coder/implementation-bundle", "CODER_AI", { ...payload, bundle_body: "Changed bundle body with same key." }, 409, "CODER_IMPLEMENTATION_BUNDLE_IDEMPOTENCY_CONFLICT"));
  transcript.push(await req("promotion language denied", "POST", "/v1/coder/implementation-bundle", "CODER_AI", { coder_tasks_id: coderTasksId, idempotency_key: `implementation-bundle-bad-${suffix}`, bundle_title: "Bad", bundle_body: "This is approved for release." }, 409, "CODER_IMPLEMENTATION_BUNDLE_FORBIDDEN_CLAIM_INCLUDED"));
  transcript.push(await req("execution authority denied", "POST", "/v1/coder/implementation-bundle", "CODER_AI", { coder_tasks_id: coderTasksId, idempotency_key: `implementation-bundle-auth-${suffix}`, bundle_title: "Bad", bundle_body: "Helper may execute." }, 409, "CODER_IMPLEMENTATION_BUNDLE_EXECUTION_AUTHORITY_FORBIDDEN"));

  transcript.push(await req("PM implementation_bundle denied", "POST", `/v1/flows/${encodeURIComponent(codeFlowId)}/artifacts`, "PM_AI", { artifact_type: "implementation_bundle", title: "PM implementation bundle attempt", body: "This should be denied." }, 403));
  transcript.push(await req("Helper implementation_bundle denied", "POST", `/v1/flows/${encodeURIComponent(codeFlowId)}/artifacts`, "HELPER_AI", { artifact_type: "implementation_bundle", title: "Helper implementation bundle attempt", body: "This should be denied." }, 403));

  console.log(JSON.stringify({ ok: true, worker_url: WORKER_URL, coder_tasks_id: coderTasksId, implementation_bundle_id: bundle.implementation_bundle_id, code_flow_id: codeFlowId, transcripts: transcript }, null, 2));
}
main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
