export {};

const baseUrl = process.env.ARQON_BROKER_URL || "https://arqon-contextos-broker.sonarum.workers.dev";
const auditorKey = process.env.BROKER_KEY_AUDITOR || "";
const helperKey = process.env.BROKER_KEY_HELPER || "";
const coderKey = process.env.BROKER_KEY_CODER || "";
const pmKey = process.env.BROKER_KEY_PM || "";
const humanKey = process.env.BROKER_KEY_HUMAN || "";
const reportId = process.env.AUDITOR_REVIEW_HELPER_EXECUTION_REPORT_ID || "";
const codeFlowId = process.env.AUDITOR_REVIEW_CODE_FLOW_ID || "";
const runId = `${Date.now()}`;

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}
function requireEnv(name: string, value: string): void {
  if (!value) throw new Error(`Missing required env var: ${name}`);
}
async function post(path: string, token: string, body: unknown): Promise<{ status: number; body: any }> {
  const headers = new Headers({ "content-type": "application/json" });
  if (token) headers.set("authorization", `Bearer ${token}`);
  const response = await fetch(`${baseUrl}${path}`, { method: "POST", headers, body: JSON.stringify(body) });
  const text = await response.text();
  let parsed: any = null;
  try { parsed = text ? JSON.parse(text) : null; } catch { parsed = text; }
  return { status: response.status, body: parsed };
}
async function main(): Promise<void> {
  requireEnv("BROKER_KEY_AUDITOR", auditorKey);
  requireEnv("BROKER_KEY_HELPER", helperKey);
  requireEnv("BROKER_KEY_CODER", coderKey);
  requireEnv("BROKER_KEY_PM", pmKey);
  requireEnv("BROKER_KEY_HUMAN", humanKey);
  requireEnv("AUDITOR_REVIEW_HELPER_EXECUTION_REPORT_ID", reportId);
  requireEnv("AUDITOR_REVIEW_CODE_FLOW_ID", codeFlowId);

  const noAuth = await post("/v1/auditor/helper-execution-review", "", {});
  assert(noAuth.status === 401, `no-auth expected 401, got ${noAuth.status}`);
  for (const [name, key] of [["PM", pmKey], ["CODER", coderKey], ["HELPER", helperKey], ["HUMAN", humanKey]] as Array<[string, string]>) {
    const denied = await post("/v1/auditor/helper-execution-review", key, { helper_execution_report_id: reportId, idempotency_key: `review-${name}-denied-${runId}`, review_title: "Denied", review_summary: "Denied", review_verdict: "AUDITOR_REVIEW_PASS" });
    assert(denied.status === 403, `${name} expected 403, got ${denied.status}`);
  }
  const raw = await post(`/v1/flows/${encodeURIComponent(codeFlowId)}/artifacts`, auditorKey, { artifact_type: "helper_execution_review", title: "Raw Review", body: "raw helper execution review should be blocked" });
  assert(raw.status === 403 && raw.body?.error?.code === "FLOW_ARTIFACT_ROUTE_REQUIRED", "raw helper_execution_review expected route-only block");

  const payload = {
    helper_execution_report_id: reportId,
    idempotency_key: `auditor-review-live-${runId}`,
    review_title: `Auditor Helper Review Live ${runId}`,
    review_summary: "Reviewed diagnostic Helper execution evidence.",
    review_verdict: "AUDITOR_REVIEW_PASS",
    findings: ["command evidence remains diagnostic"]
  };
  const success = await post("/v1/auditor/helper-execution-review", auditorKey, payload);
  assert(success.status === 201, `success expected 201, got ${success.status} ${JSON.stringify(success.body)}`);
  const replay = await post("/v1/auditor/helper-execution-review", auditorKey, payload);
  assert(replay.status === 200 && replay.body?.idempotent_replay === true, "replay expected idempotent");
  const conflict = await post("/v1/auditor/helper-execution-review", auditorKey, { ...payload, review_summary: "changed" });
  assert(conflict.status === 409 && conflict.body?.error?.code === "AUDITOR_HELPER_EXECUTION_REVIEW_IDEMPOTENCY_CONFLICT", "conflict expected 409");
  const badTitle = await post("/v1/auditor/helper-execution-review", auditorKey, { ...payload, idempotency_key: `bad-title-${runId}`, review_title: "approved for release" });
  assert(badTitle.status === 409 && badTitle.body?.error?.code === "AUDITOR_HELPER_EXECUTION_REVIEW_FORBIDDEN_CLAIM_INCLUDED", "bad title expected 409");
  const secretSummary = await post("/v1/auditor/helper-execution-review", auditorKey, { ...payload, idempotency_key: `secret-summary-${runId}`, review_summary: "Authorization: Bearer abc" });
  assert(secretSummary.status === 409 && secretSummary.body?.error?.code === "AUDITOR_HELPER_EXECUTION_REVIEW_SECRET_MATERIAL_FORBIDDEN", "secret summary expected 409");

  console.log(JSON.stringify({ ok: true, result: "PASS", review_id: success.body?.auditor_helper_execution_review?.auditor_helper_execution_review_id, no_auth_status: noAuth.status, raw_status: raw.status, success_status: success.status, replay_status: replay.status, conflict_status: conflict.status, bad_title_status: badTitle.status, secret_summary_status: secretSummary.status }, null, 2));
}
main().catch(err => { console.error(err); process.exitCode = 1; });
