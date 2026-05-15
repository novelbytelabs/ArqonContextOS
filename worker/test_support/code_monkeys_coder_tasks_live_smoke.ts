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
  transcript.push(await req("no-auth Coder tasks denied", "POST", "/v1/coder/tasks", undefined, { coder_work_plan_id: "none", idempotency_key: `coder-tasks-noauth-${suffix}` }, 401, "UNAUTHORIZED"));

  const coderWorkPlanId = process.env.CODER_TASKS_WORK_PLAN_ID;
  const codeFlowId = process.env.CODER_TASKS_CODE_FLOW_ID;
  if (!coderWorkPlanId) throw new Error("Set CODER_TASKS_WORK_PLAN_ID to a live coder_work_plan_id before running this smoke.");
  if (!codeFlowId) throw new Error("Set CODER_TASKS_CODE_FLOW_ID to the corresponding live code_flow_id before running this smoke.");

  const deniedRoles: Role[] = ["PM_AI", "AUDITOR_AI", "HELPER_AI", "EXPLORER_AI", "HYPOTHESIZER_AI", "DESIGNER_AI", "SCIENCE_AUDITOR_AI", "SCIENCE_EXECUTOR_AI", "HUMAN"];
  for (const role of deniedRoles) {
    transcript.push(await req(`deny ${role}`, "POST", "/v1/coder/tasks", role, { coder_work_plan_id: coderWorkPlanId, idempotency_key: `coder-tasks-deny-${role}-${suffix}`, tasks_title: "Denied", tasks_body: "Denied body." }, 403, "CODER_TASKS_ROLE_FORBIDDEN"));
  }

  const payload = { coder_work_plan_id: coderWorkPlanId, idempotency_key: `coder-tasks-${suffix}`, tasks_title: "Coder Tasks 001 Candidate", tasks_body: "Task 1: prepare a bounded implementation bundle proposal in the next stage. Task 2: preserve acceptance criteria and evidence needs. Task 3: identify risks and rollback points. Do not create or apply patches. Do not authorize Helper execution." };
  transcript.push(await req("Coder tasks succeeds", "POST", "/v1/coder/tasks", "CODER_AI", payload, 201));
  const tasks = transcript.at(-1).response_body.coder_tasks;
  assert(tasks.output_artifacts.coder_tasks.artifact_type === "coder_tasks", "missing coder_tasks artifact");
  assert(tasks.source_coder_work_plan.forbidden_claims.length > 0, "forbidden claims not preserved");
  assert(tasks.source_coder_work_plan.share_packet_hash, "share hash not preserved");

  transcript.push(await req("duplicate Coder tasks idempotent", "POST", "/v1/coder/tasks", "CODER_AI", payload, 200));
  assert(transcript.at(-1).response_body.idempotent_replay === true, "duplicate should replay");
  transcript.push(await req("changed Coder tasks payload conflicts", "POST", "/v1/coder/tasks", "CODER_AI", { ...payload, tasks_body: "Changed tasks body with same key." }, 409, "CODER_TASKS_IDEMPOTENCY_CONFLICT"));
  transcript.push(await req("promotion language denied", "POST", "/v1/coder/tasks", "CODER_AI", { coder_work_plan_id: coderWorkPlanId, idempotency_key: `coder-tasks-bad-${suffix}`, tasks_title: "Bad", tasks_body: "This is approved for release." }, 409, "CODER_TASKS_FORBIDDEN_CLAIM_INCLUDED"));
  transcript.push(await req("execution authority denied", "POST", "/v1/coder/tasks", "CODER_AI", { coder_work_plan_id: coderWorkPlanId, idempotency_key: `coder-tasks-auth-${suffix}`, tasks_title: "Bad", tasks_body: "Helper may execute." }, 409, "CODER_TASKS_EXECUTION_AUTHORITY_FORBIDDEN"));

  transcript.push(await req("PM coder_tasks denied", "POST", `/v1/flows/${encodeURIComponent(codeFlowId)}/artifacts`, "PM_AI", { artifact_type: "coder_tasks", title: "PM coder tasks attempt", body: "This should be denied." }, 403));
  transcript.push(await req("Helper coder_tasks denied", "POST", `/v1/flows/${encodeURIComponent(codeFlowId)}/artifacts`, "HELPER_AI", { artifact_type: "coder_tasks", title: "Helper coder tasks attempt", body: "This should be denied." }, 403));

  console.log(JSON.stringify({ ok: true, worker_url: WORKER_URL, coder_work_plan_id: coderWorkPlanId, coder_tasks_id: tasks.coder_tasks_id, code_flow_id: codeFlowId, transcripts: transcript }, null, 2));
}
main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
