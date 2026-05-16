export {};

const baseUrl = process.env.ARQON_BROKER_URL || "https://arqon-contextos-broker.sonarum.workers.dev";
const humanKey = process.env.BROKER_KEY_HUMAN || "";
const ids = {
  code: process.env.CROSS_FLOW_HUMAN_AUTH_CODE_FLOW_ID || "",
  governance: process.env.CROSS_FLOW_HUMAN_AUTH_GOVERNANCE_FLOW_ID || "",
  audit: process.env.CROSS_FLOW_HUMAN_AUTH_AUDIT_FLOW_ID || "",
  science: process.env.CROSS_FLOW_HUMAN_AUTH_SCIENCE_FLOW_ID || ""
};
const runId = `${Date.now()}`;

function assert(condition: boolean, message: string): void { if (!condition) throw new Error(message); }
function requireEnv(name: string, value: string): void { if (!value) throw new Error(`Missing required env var: ${name}`); }
async function post(flowId: string, artifactType: string): Promise<{ status: number; code?: string }> {
  const response = await fetch(`${baseUrl}/v1/flows/${encodeURIComponent(flowId)}/artifacts`, {
    method: "POST",
    headers: { authorization: `Bearer ${humanKey}`, "content-type": "application/json" },
    body: JSON.stringify({ artifact_type: artifactType, title: `Raw ${artifactType} ${runId}`, body: `raw ${artifactType}` })
  });
  const text = await response.text();
  let parsed: any = null;
  try { parsed = text ? JSON.parse(text) : null; } catch { parsed = text; }
  return { status: response.status, code: parsed?.error?.code };
}
async function expectRouteOnly(flowId: string, artifactType: string, label: string, results: Record<string, { status: number; code?: string }>): Promise<void> {
  const result = await post(flowId, artifactType);
  results[label] = result;
  assert(result.status === 403, `${label} expected 403, got ${result.status}`);
  assert(result.code === "FLOW_ARTIFACT_ROUTE_REQUIRED", `${label} expected FLOW_ARTIFACT_ROUTE_REQUIRED, got ${result.code}`);
}
async function main(): Promise<void> {
  requireEnv("BROKER_KEY_HUMAN", humanKey);
  requireEnv("CROSS_FLOW_HUMAN_AUTH_CODE_FLOW_ID", ids.code);
  requireEnv("CROSS_FLOW_HUMAN_AUTH_GOVERNANCE_FLOW_ID", ids.governance);
  requireEnv("CROSS_FLOW_HUMAN_AUTH_AUDIT_FLOW_ID", ids.audit);
  requireEnv("CROSS_FLOW_HUMAN_AUTH_SCIENCE_FLOW_ID", ids.science);

  const results: Record<string, { status: number; code?: string }> = {};
  for (const a of ["human_decision", "advancement_approval", "promotion_decision", "human_advancement_decision"]) await expectRouteOnly(ids.code, a, `code_flow:${a}`, results);
  for (const a of ["human_decision", "advancement_approval", "promotion_decision"]) await expectRouteOnly(ids.governance, a, `governance_flow:${a}`, results);
  for (const a of ["human_decision", "advancement_approval"]) {
    await expectRouteOnly(ids.audit, a, `audit_flow:${a}`, results);
    await expectRouteOnly(ids.science, a, `science_flow:${a}`, results);
  }

  console.log(JSON.stringify({ ok: true, result: "PASS", results }, null, 2));
}
main().catch(err => { console.error(err); process.exitCode = 1; });
