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
  transcript.push(await req("no-auth PM tasks denied", "POST", "/v1/pm/tasks", undefined, { plan_id: "none", idempotency_key: `tasks-noauth-${suffix}` }, 401, "UNAUTHORIZED"));

  const planId = process.env.PM_TASKS_PLAN_ID;
  if (!planId) throw new Error("Set PM_TASKS_PLAN_ID to a live plan_id before running this smoke.");

  const deniedRoles: Role[] = ["CODER_AI", "AUDITOR_AI", "HELPER_AI", "EXPLORER_AI", "HYPOTHESIZER_AI", "DESIGNER_AI", "SCIENCE_AUDITOR_AI", "SCIENCE_EXECUTOR_AI", "HUMAN"];
  for (const role of deniedRoles) {
    transcript.push(await req(`deny ${role}`, "POST", "/v1/pm/tasks", role, { plan_id: planId, idempotency_key: `tasks-deny-${role}-${suffix}`, tasks_title: "Denied", tasks_body: "Denied body." }, 403, "PM_TASKS_ROLE_FORBIDDEN"));
  }

  const payload = { plan_id: planId, idempotency_key: `tasks-${suffix}`, tasks_title: "PM Tasks 001 Candidate Tasks", tasks_body: "Task A: draft a bounded implementation packet. Task B: define gates. This does not authorize Coder handoff or Helper execution." };
  transcript.push(await req("PM tasks succeeds", "POST", "/v1/pm/tasks", "PM_AI", payload, 201));
  const tasks = transcript.at(-1).response_body.tasks;
  assert(tasks.output_artifacts.tasks.artifact_type === "tasks", "missing tasks artifact");
  assert(tasks.source_plan.forbidden_claims.length > 0, "forbidden claims not preserved");
  assert(tasks.source_plan.share_packet_hash, "share hash not preserved");

  transcript.push(await req("duplicate PM tasks idempotent", "POST", "/v1/pm/tasks", "PM_AI", payload, 200));
  assert(transcript.at(-1).response_body.idempotent_replay === true, "duplicate should replay");
  transcript.push(await req("changed PM tasks payload conflicts", "POST", "/v1/pm/tasks", "PM_AI", { ...payload, tasks_body: "Changed tasks body with same key." }, 409, "PM_TASKS_IDEMPOTENCY_CONFLICT"));
  transcript.push(await req("promotion language denied", "POST", "/v1/pm/tasks", "PM_AI", { plan_id: planId, idempotency_key: `tasks-bad-${suffix}`, tasks_title: "Bad", tasks_body: "This is approved for release." }, 409, "PM_TASKS_FORBIDDEN_CLAIM_INCLUDED"));
  transcript.push(await req("implementation authority denied", "POST", "/v1/pm/tasks", "PM_AI", { plan_id: planId, idempotency_key: `tasks-auth-${suffix}`, tasks_title: "Bad", tasks_body: "Coder may begin." }, 409, "PM_TASKS_IMPLEMENTATION_AUTHORITY_FORBIDDEN"));

  console.log(JSON.stringify({ ok: true, worker_url: WORKER_URL, plan_id: planId, tasks_id: tasks.tasks_id, code_flow_id: tasks.source_plan.code_flow_id, transcripts: transcript }, null, 2));
}
main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
