export {};

declare const process: { env: Record<string, string | undefined>; exitCode?: number };
const WORKER_URL = (process.env.WORKER_URL || "https://arqon-contextos-broker.sonarum.workers.dev").replace(/\/+$/, "");
const TOKEN_ENV: Record<string, string> = { PM_AI: "BROKER_KEY_PM", CODER_AI: "BROKER_KEY_CODER", AUDITOR_AI: "BROKER_KEY_AUDITOR", HELPER_AI: "BROKER_KEY_HELPER", EXPLORER_AI: "BROKER_KEY_EXPLORER", HYPOTHESIZER_AI: "BROKER_KEY_HYPOTHESIZER", DESIGNER_AI: "BROKER_KEY_DESIGNER", SCIENCE_AUDITOR_AI: "BROKER_KEY_SCIENCE_AUDITOR", SCIENCE_EXECUTOR_AI: "BROKER_KEY_SCIENCE_EXECUTOR", HUMAN: "BROKER_KEY_HUMAN" };
type Role = keyof typeof TOKEN_ENV;
function token(role: Role): string { const value = process.env[TOKEN_ENV[role]]; if (!value) throw new Error(`Missing token env var: ${TOKEN_ENV[role]}`); return value; }
function assert(condition: boolean, message: string): void { if (!condition) throw new Error(message); }
async function req(name: string, method: string, path: string, role: Role | undefined, body: unknown, expected: number, expectedError?: string): Promise<any> {
  const headers = new Headers(); if (role) headers.set("authorization", `Bearer ${token(role)}`); if (body !== undefined) headers.set("content-type", "application/json");
  const response = await fetch(`${WORKER_URL}${path}`, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  const text = await response.text(); let parsed: any = null; try { parsed = text ? JSON.parse(text) : null; } catch { parsed = text; }
  assert(response.status === expected, `${name}: expected ${expected}, got ${response.status}: ${text}`);
  if (expectedError) assert(parsed?.error?.code === expectedError, `${name}: expected ${expectedError}, got ${parsed?.error?.code}`);
  return { name, status: response.status, ok: response.ok, response_body: parsed, authorization: role ? "Bearer REDACTED" : "none" };
}
async function main(): Promise<void> {
  const suffix = String(Date.now()).slice(-10);
  const taskingId = process.env.CODER_WORK_PLAN_TASKING_ID;
  const codeFlowId = process.env.CODER_WORK_PLAN_CODE_FLOW_ID;
  if (!taskingId) throw new Error("Set CODER_WORK_PLAN_TASKING_ID to a live tasking_id before running this smoke.");
  if (!codeFlowId) throw new Error("Set CODER_WORK_PLAN_CODE_FLOW_ID to the corresponding live code_flow_id before running this smoke.");
  const transcript: any[] = [];
  transcript.push(await req("no-auth Coder work plan denied", "POST", "/v1/coder/work-plan", undefined, { tasking_id: taskingId, idempotency_key: `noauth-${suffix}` }, 401, "UNAUTHORIZED"));
  const deniedRoles: Role[] = ["PM_AI", "AUDITOR_AI", "HELPER_AI", "EXPLORER_AI", "HYPOTHESIZER_AI", "DESIGNER_AI", "SCIENCE_AUDITOR_AI", "SCIENCE_EXECUTOR_AI", "HUMAN"];
  for (const role of deniedRoles) transcript.push(await req(`deny ${role}`, "POST", "/v1/coder/work-plan", role, { tasking_id: taskingId, idempotency_key: `deny-${role}-${suffix}`, work_plan_title: "Denied", work_plan_body: "Denied body." }, 403, "CODER_WORK_PLAN_ROLE_FORBIDDEN"));
  const payload = { tasking_id: taskingId, idempotency_key: `coder-work-plan-${suffix}`, work_plan_title: "Coder Work Plan 001 Candidate", work_plan_body: "Interpret the PM tasking into engineering steps, dependencies, and risk checks. Return a proposal only. Do not create patches. Do not authorize Helper execution." };
  transcript.push(await req("Coder work plan succeeds", "POST", "/v1/coder/work-plan", "CODER_AI", payload, 201));
  const workPlan = transcript.at(-1).response_body.coder_work_plan;
  assert(workPlan.output_artifacts.coder_work_plan.artifact_type === "coder_work_plan", "missing coder_work_plan artifact");
  assert(workPlan.source_tasking.share_packet_hash, "share hash not preserved");
  transcript.push(await req("duplicate Coder work plan idempotent", "POST", "/v1/coder/work-plan", "CODER_AI", payload, 200));
  assert(transcript.at(-1).response_body.idempotent_replay === true, "duplicate should replay");
  transcript.push(await req("changed Coder work plan payload conflicts", "POST", "/v1/coder/work-plan", "CODER_AI", { ...payload, work_plan_body: "Changed work plan body with same key." }, 409, "CODER_WORK_PLAN_IDEMPOTENCY_CONFLICT"));
  transcript.push(await req("promotion language denied", "POST", "/v1/coder/work-plan", "CODER_AI", { tasking_id: taskingId, idempotency_key: `promotion-${suffix}`, work_plan_title: "Bad", work_plan_body: "This is approved for release." }, 409, "CODER_WORK_PLAN_FORBIDDEN_CLAIM_INCLUDED"));
  transcript.push(await req("execution authority denied", "POST", "/v1/coder/work-plan", "CODER_AI", { tasking_id: taskingId, idempotency_key: `execution-${suffix}`, work_plan_title: "Bad", work_plan_body: "Helper may execute." }, 409, "CODER_WORK_PLAN_EXECUTION_AUTHORITY_FORBIDDEN"));
  transcript.push(await req("PM coder_work_plan denied", "POST", `/v1/flows/${encodeURIComponent(codeFlowId)}/artifacts`, "PM_AI", { artifact_type: "coder_work_plan", title: "PM coder work plan attempt", body: "This should be denied." }, 403));
  transcript.push(await req("Helper coder_work_plan denied", "POST", `/v1/flows/${encodeURIComponent(codeFlowId)}/artifacts`, "HELPER_AI", { artifact_type: "coder_work_plan", title: "Helper coder work plan attempt", body: "This should be denied." }, 403));
  console.log(JSON.stringify({ ok: true, worker_url: WORKER_URL, tasking_id: taskingId, coder_work_plan_id: workPlan.coder_work_plan_id, code_flow_id: codeFlowId, transcripts: transcript }, null, 2));
}
main().catch(err => { console.error(err); process.exitCode = 1; });
