export {};

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
  transcript.push(await req("no-auth PM tasking denied", "POST", "/v1/pm/tasking", undefined, { plan_id: "none", idempotency_key: `tasking-noauth-${suffix}` }, 401, "UNAUTHORIZED"));

  const planId = process.env.PM_TASKING_PLAN_ID;
  const codeFlowId = process.env.PM_TASKING_CODE_FLOW_ID;
  if (!planId) throw new Error("Set PM_TASKING_PLAN_ID to a live plan_id before running this smoke.");
  if (!codeFlowId) throw new Error("Set PM_TASKING_CODE_FLOW_ID to the corresponding live code_flow_id before running this smoke.");

  const deniedRoles: Role[] = ["CODER_AI", "AUDITOR_AI", "HELPER_AI", "EXPLORER_AI", "HYPOTHESIZER_AI", "DESIGNER_AI", "SCIENCE_AUDITOR_AI", "SCIENCE_EXECUTOR_AI", "HUMAN"];
  for (const role of deniedRoles) {
    transcript.push(await req(`deny ${role}`, "POST", "/v1/pm/tasking", role, { plan_id: planId, idempotency_key: `tasking-deny-${role}-${suffix}`, tasking_title: "Denied", tasking_body: "Denied body." }, 403, "PM_TASKING_ROLE_FORBIDDEN"));
  }

  const payload = { plan_id: planId, idempotency_key: `tasking-${suffix}`, tasking_title: "PM Tasking 001 Candidate Work Order", tasking_body: "Prepare a coder work plan proposal. Preserve acceptance criteria and risks. Return an implementation proposal for review. No execution is authorized by this artifact." };
  transcript.push(await req("PM tasking succeeds", "POST", "/v1/pm/tasking", "PM_AI", payload, 201));
  const tasking = transcript.at(-1).response_body.tasking;
  assert(tasking.output_artifacts.pm_tasking.artifact_type === "pm_tasking", "missing pm_tasking artifact");
  assert(tasking.source_plan.forbidden_claims.length > 0, "forbidden claims not preserved");
  assert(tasking.source_plan.share_packet_hash, "share hash not preserved");

  transcript.push(await req("duplicate PM tasking idempotent", "POST", "/v1/pm/tasking", "PM_AI", payload, 200));
  assert(transcript.at(-1).response_body.idempotent_replay === true, "duplicate should replay");
  transcript.push(await req("changed PM tasking payload conflicts", "POST", "/v1/pm/tasking", "PM_AI", { ...payload, tasking_body: "Changed tasking body with same key." }, 409, "PM_TASKING_IDEMPOTENCY_CONFLICT"));
  transcript.push(await req("promotion language denied", "POST", "/v1/pm/tasking", "PM_AI", { plan_id: planId, idempotency_key: `tasking-bad-${suffix}`, tasking_title: "Bad", tasking_body: "This is approved for release." }, 409, "PM_TASKING_FORBIDDEN_CLAIM_INCLUDED"));
  transcript.push(await req("implementation authority denied", "POST", "/v1/pm/tasking", "PM_AI", { plan_id: planId, idempotency_key: `tasking-auth-${suffix}`, tasking_title: "Bad", tasking_body: "Coder may begin." }, 409, "PM_TASKING_IMPLEMENTATION_AUTHORITY_FORBIDDEN"));

  transcript.push(await req("PM generic tasks denied", "POST", `/v1/flows/${encodeURIComponent(codeFlowId)}/artifacts`, "PM_AI", { artifact_type: "tasks", title: "PM generic tasks attempt", body: "This should be denied." }, 403));
  transcript.push(await req("Coder coder_tasks allowed", "POST", `/v1/flows/${encodeURIComponent(codeFlowId)}/artifacts`, "CODER_AI", { artifact_type: "coder_tasks", title: "Coder tasks probe", body: "Coder owns implementation decomposition later." }, 201));

  console.log(JSON.stringify({ ok: true, worker_url: WORKER_URL, plan_id: planId, tasking_id: tasking.tasking_id, code_flow_id: codeFlowId, transcripts: transcript }, null, 2));
}
main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
