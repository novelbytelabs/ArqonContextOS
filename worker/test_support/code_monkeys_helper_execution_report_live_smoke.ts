export {};

const baseUrl = process.env.ARQON_BROKER_URL || "https://arqon-contextos-broker.sonarum.workers.dev";
const helperKey = process.env.BROKER_KEY_HELPER || "";
const coderKey = process.env.BROKER_KEY_CODER || "";
const pmKey = process.env.BROKER_KEY_PM || "";
const intakeId = process.env.HELPER_EXECUTION_REPORT_INTAKE_ID || "";
const codeFlowId = process.env.HELPER_EXECUTION_REPORT_CODE_FLOW_ID || "";
const runId = `${Date.now()}`;

function assert(condition: boolean, message: string): void { if (!condition) throw new Error(message); }
function requireEnv(name: string, value: string): void { if (!value) throw new Error(`Missing required env var: ${name}`); }
async function post(path: string, token: string, body: unknown): Promise<{ status: number; body: any }> {
  const headers = new Headers({ "content-type": "application/json" }); if (token) headers.set("authorization", `Bearer ${token}`);
  const response = await fetch(`${baseUrl}${path}`, { method: "POST", headers, body: JSON.stringify(body) });
  const text = await response.text(); let parsed:any=null; try { parsed=text?JSON.parse(text):null; } catch { parsed=text; }
  return { status: response.status, body: parsed };
}
async function main(): Promise<void> {
  requireEnv("BROKER_KEY_HELPER", helperKey); requireEnv("BROKER_KEY_CODER", coderKey); requireEnv("BROKER_KEY_PM", pmKey);
  requireEnv("HELPER_EXECUTION_REPORT_INTAKE_ID", intakeId); requireEnv("HELPER_EXECUTION_REPORT_CODE_FLOW_ID", codeFlowId);
  const noAuth = await post("/v1/helper/execution-report", "", {}); assert(noAuth.status === 401, `no-auth expected 401, got ${noAuth.status}`);
  const pmDenied = await post("/v1/helper/execution-report", pmKey, { helper_execution_intake_id:intakeId, idempotency_key:`report-pm-denied-${runId}`, execution_title:"Denied", execution_summary:"Denied", commands:[{command:"pwd",purpose:"check",result:"PASS",exit_code:0}] }); assert(pmDenied.status === 403, "PM denied");
  const coderDenied = await post("/v1/helper/execution-report", coderKey, { helper_execution_intake_id:intakeId, idempotency_key:`report-coder-denied-${runId}`, execution_title:"Denied", execution_summary:"Denied", commands:[{command:"pwd",purpose:"check",result:"PASS",exit_code:0}] }); assert(coderDenied.status === 403, "Coder denied");
  for (const artifact_type of ["execution_report","command_log","evidence_manifest"]) {
    const raw = await post(`/v1/flows/${encodeURIComponent(codeFlowId)}/artifacts`, helperKey, { artifact_type, title:"Raw", body:"raw write should fail" });
    assert(raw.status === 403 && raw.body?.error?.code === "FLOW_ARTIFACT_ROUTE_REQUIRED", `raw ${artifact_type} expected FLOW_ARTIFACT_ROUTE_REQUIRED`);
  }
  const payload = { helper_execution_intake_id:intakeId, idempotency_key:`helper-report-live-${runId}`, execution_title:`Helper Execution Report Live ${runId}`, execution_summary:"Executed scoped validation commands only.", commands:[{ command:"pwd", purpose:"confirm repo path", result:"PASS", exit_code:0, stdout_excerpt:"/repo", stderr_excerpt:"" }] };
  const success = await post("/v1/helper/execution-report", helperKey, payload); assert(success.status === 201, `success expected 201, got ${success.status} ${JSON.stringify(success.body)}`);
  const replay = await post("/v1/helper/execution-report", helperKey, payload); assert(replay.status === 200 && replay.body?.idempotent_replay === true, "replay expected idempotent");
  const conflict = await post("/v1/helper/execution-report", helperKey, { ...payload, execution_summary:"changed" }); assert(conflict.status === 409 && conflict.body?.error?.code === "HELPER_EXECUTION_REPORT_IDEMPOTENCY_CONFLICT", "conflict expected 409");
  const badTitle = await post("/v1/helper/execution-report", helperKey, { ...payload, idempotency_key:`bad-title-${runId}`, execution_title:"approved for release" }); assert(badTitle.status === 409 && badTitle.body?.error?.code === "HELPER_EXECUTION_REPORT_FORBIDDEN_CLAIM_INCLUDED", "bad title expected 409");
  const badSummary = await post("/v1/helper/execution-report", helperKey, { ...payload, idempotency_key:`bad-summary-${runId}`, execution_summary:"deployment complete" }); assert(badSummary.status === 409 && badSummary.body?.error?.code === "HELPER_EXECUTION_REPORT_FORBIDDEN_CLAIM_INCLUDED", "bad summary expected 409");
  const badCommand = await post("/v1/helper/execution-report", helperKey, { ...payload, idempotency_key:`bad-command-${runId}`, commands:[{ command:"deploy now", purpose:"check", result:"PASS", exit_code:0, stdout_excerpt:"/repo", stderr_excerpt:"" }] }); assert(badCommand.status === 409 && badCommand.body?.error?.code === "HELPER_EXECUTION_REPORT_FORBIDDEN_CLAIM_INCLUDED", "bad command expected 409");
  const badPurpose = await post("/v1/helper/execution-report", helperKey, { ...payload, idempotency_key:`bad-purpose-${runId}`, commands:[{ command:"pwd", purpose:"certification complete", result:"PASS", exit_code:0, stdout_excerpt:"/repo", stderr_excerpt:"" }] }); assert(badPurpose.status === 409 && badPurpose.body?.error?.code === "HELPER_EXECUTION_REPORT_FORBIDDEN_CLAIM_INCLUDED", "bad purpose expected 409");
  const badStdout = await post("/v1/helper/execution-report", helperKey, { ...payload, idempotency_key:`bad-stdout-${runId}`, commands:[{ command:"pwd", purpose:"check", result:"PASS", exit_code:0, stdout_excerpt:"approved for release", stderr_excerpt:"" }] }); assert(badStdout.status === 409 && badStdout.body?.error?.code === "HELPER_EXECUTION_REPORT_FORBIDDEN_CLAIM_INCLUDED", "bad stdout expected 409");
  const badStderr = await post("/v1/helper/execution-report", helperKey, { ...payload, idempotency_key:`bad-stderr-${runId}`, commands:[{ command:"pwd", purpose:"check", result:"PASS", exit_code:0, stdout_excerpt:"/repo", stderr_excerpt:"production ready" }] }); assert(badStderr.status === 409 && badStderr.body?.error?.code === "HELPER_EXECUTION_REPORT_FORBIDDEN_CLAIM_INCLUDED", "bad stderr expected 409");
  const secretTitle = await post("/v1/helper/execution-report", helperKey, { ...payload, idempotency_key:`secret-title-${runId}`, execution_title:"GITHUB_APP_PRIVATE_KEY leak" }); assert(secretTitle.status === 409 && secretTitle.body?.error?.code === "HELPER_EXECUTION_REPORT_SECRET_MATERIAL_FORBIDDEN", "secret title expected 409");
  const secretSummary = await post("/v1/helper/execution-report", helperKey, { ...payload, idempotency_key:`secret-summary-${runId}`, execution_summary:"Authorization: Bearer abc" }); assert(secretSummary.status === 409 && secretSummary.body?.error?.code === "HELPER_EXECUTION_REPORT_SECRET_MATERIAL_FORBIDDEN", "secret summary expected 409");
  const secretCommand = await post("/v1/helper/execution-report", helperKey, { ...payload, idempotency_key:`secret-command-${runId}`, commands:[{ command:"curl token=abc", purpose:"check", result:"PASS", exit_code:0, stdout_excerpt:"/repo", stderr_excerpt:"" }] }); assert(secretCommand.status === 409 && secretCommand.body?.error?.code === "HELPER_EXECUTION_REPORT_SECRET_MATERIAL_FORBIDDEN", "secret command expected 409");
  const secretPurpose = await post("/v1/helper/execution-report", helperKey, { ...payload, idempotency_key:`secret-purpose-${runId}`, commands:[{ command:"pwd", purpose:"inspect api_key", result:"PASS", exit_code:0, stdout_excerpt:"/repo", stderr_excerpt:"" }] }); assert(secretPurpose.status === 409 && secretPurpose.body?.error?.code === "HELPER_EXECUTION_REPORT_SECRET_MATERIAL_FORBIDDEN", "secret purpose expected 409");
  const secretStdout = await post("/v1/helper/execution-report", helperKey, { ...payload, idempotency_key:`secret-stdout-${runId}`, commands:[{ command:"pwd", purpose:"check", result:"PASS", exit_code:0, stdout_excerpt:"Authorization: Bearer secret", stderr_excerpt:"" }] }); assert(secretStdout.status === 409 && secretStdout.body?.error?.code === "HELPER_EXECUTION_REPORT_SECRET_MATERIAL_FORBIDDEN", "secret stdout expected 409");
  const secretStderr = await post("/v1/helper/execution-report", helperKey, { ...payload, idempotency_key:`secret-stderr-${runId}`, commands:[{ command:"pwd", purpose:"check", result:"PASS", exit_code:0, stdout_excerpt:"/repo", stderr_excerpt:"BEGIN PRIVATE KEY" }] }); assert(secretStderr.status === 409 && secretStderr.body?.error?.code === "HELPER_EXECUTION_REPORT_SECRET_MATERIAL_FORBIDDEN", "secret stderr expected 409");
  console.log(JSON.stringify({ ok:true, result:"PASS", report_id:success.body?.helper_execution_report?.helper_execution_report_id, no_auth_status:noAuth.status, success_status:success.status, replay_status:replay.status, conflict_status:conflict.status, bad_title_status:badTitle.status, bad_summary_status:badSummary.status, bad_command_status:badCommand.status, bad_purpose_status:badPurpose.status, bad_stdout_status:badStdout.status, bad_stderr_status:badStderr.status, secret_title_status:secretTitle.status, secret_summary_status:secretSummary.status, secret_command_status:secretCommand.status, secret_purpose_status:secretPurpose.status, secret_stdout_status:secretStdout.status, secret_stderr_status:secretStderr.status }, null, 2));
}
main().catch(err => { console.error(err); process.exitCode = 1; });
