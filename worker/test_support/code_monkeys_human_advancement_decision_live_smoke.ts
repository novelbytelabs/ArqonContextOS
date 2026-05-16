export {};

const baseUrl = process.env.ARQON_BROKER_URL || "https://arqon-contextos-broker.sonarum.workers.dev";
const humanKey = process.env.BROKER_KEY_HUMAN || "";
const pmKey = process.env.BROKER_KEY_PM || "";
const coderKey = process.env.BROKER_KEY_CODER || "";
const helperKey = process.env.BROKER_KEY_HELPER || "";
const auditorKey = process.env.BROKER_KEY_AUDITOR || "";
const reviewId = process.env.HUMAN_ADVANCEMENT_REVIEW_ID || "";
const codeFlowId = process.env.HUMAN_ADVANCEMENT_CODE_FLOW_ID || "";
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
  requireEnv("BROKER_KEY_HUMAN", humanKey);
  requireEnv("BROKER_KEY_PM", pmKey);
  requireEnv("BROKER_KEY_CODER", coderKey);
  requireEnv("BROKER_KEY_HELPER", helperKey);
  requireEnv("BROKER_KEY_AUDITOR", auditorKey);
  requireEnv("HUMAN_ADVANCEMENT_REVIEW_ID", reviewId);
  requireEnv("HUMAN_ADVANCEMENT_CODE_FLOW_ID", codeFlowId);

  const noAuth = await post("/v1/human/advancement-decision", "", {});
  assert(noAuth.status === 401, `no-auth expected 401, got ${noAuth.status}`);

  for (const [name, key] of [["PM", pmKey], ["CODER", coderKey], ["HELPER", helperKey], ["AUDITOR", auditorKey]] as Array<[string, string]>) {
    const denied = await post("/v1/human/advancement-decision", key, { auditor_helper_execution_review_id: reviewId, idempotency_key: `decision-${name}-denied-${runId}`, decision_title: "Denied", decision_summary: "Denied", decision_outcome: "advance", required_next_action: "Proceed to next bounded planning stage." });
    assert(denied.status === 403, `${name} expected 403, got ${denied.status}`);
  }

  const raw = await post(`/v1/flows/${encodeURIComponent(codeFlowId)}/artifacts`, humanKey, { artifact_type: "human_advancement_decision", title: "Raw Decision", body: "raw write should fail" });
  assert(raw.status === 403 && raw.body?.error?.code === "FLOW_ARTIFACT_ROUTE_REQUIRED", "raw human_advancement_decision expected route-only block");

  const payload = {
    auditor_helper_execution_review_id: reviewId,
    idempotency_key: `human-decision-live-${runId}`,
    decision_title: `Human Advancement Decision Live ${runId}`,
    decision_summary: "Human reviewed the diagnostic evidence and allows the next bounded planning stage.",
    decision_outcome: "advance",
    required_next_action: "Proceed to the next bounded PM planning stage.",
    unresolved_blockers: [],
    findings: ["No unresolved blocker declared."]
  };

  const success = await post("/v1/human/advancement-decision", humanKey, payload);
  assert(success.status === 201, `success expected 201, got ${success.status} ${JSON.stringify(success.body)}`);
  const replay = await post("/v1/human/advancement-decision", humanKey, payload);
  assert(replay.status === 200 && replay.body?.idempotent_replay === true, "replay expected idempotent");
  const conflict = await post("/v1/human/advancement-decision", humanKey, { ...payload, decision_summary: "changed" });
  assert(conflict.status === 409 && conflict.body?.error?.code === "HUMAN_ADVANCEMENT_DECISION_IDEMPOTENCY_CONFLICT", "conflict expected 409");
  const badClaim = await post("/v1/human/advancement-decision", humanKey, { ...payload, idempotency_key: `bad-claim-${runId}`, decision_title: "approved for release" });
  assert(badClaim.status === 409 && badClaim.body?.error?.code === "HUMAN_ADVANCEMENT_DECISION_FORBIDDEN_CLAIM_INCLUDED", "bad claim expected 409");
  const secret = await post("/v1/human/advancement-decision", humanKey, { ...payload, idempotency_key: `secret-${runId}`, decision_summary: "Authorization: Bearer abc" });
  assert(secret.status === 409 && secret.body?.error?.code === "HUMAN_ADVANCEMENT_DECISION_SECRET_MATERIAL_FORBIDDEN", "secret expected 409");
  const blockers = await post("/v1/human/advancement-decision", humanKey, { ...payload, idempotency_key: `blockers-${runId}`, unresolved_blockers: ["blocking issue"] });
  assert(blockers.status === 409 && blockers.body?.error?.code === "HUMAN_ADVANCEMENT_DECISION_UNRESOLVED_BLOCKERS_PRESENT", "blockers expected 409");

  console.log(JSON.stringify({ ok: true, result: "PASS", decision_id: success.body?.human_advancement_decision?.human_advancement_decision_id, no_auth_status: noAuth.status, raw_status: raw.status, success_status: success.status, replay_status: replay.status, conflict_status: conflict.status, bad_claim_status: badClaim.status, secret_status: secret.status, blockers_status: blockers.status }, null, 2));
}
main().catch(err => { console.error(err); process.exitCode = 1; });
