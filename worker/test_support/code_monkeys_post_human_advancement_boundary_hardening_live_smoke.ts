export {};

const baseUrl = process.env.ARQON_BROKER_URL || "https://arqon-contextos-broker.sonarum.workers.dev";
const humanKey = process.env.BROKER_KEY_HUMAN || "";
const codeFlowId = process.env.POST_HUMAN_HARDENING_CODE_FLOW_ID || "";
const runId = `${Date.now()}`;

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function requireEnv(name: string, value: string): void {
  if (!value) throw new Error(`Missing required env var: ${name}`);
}

async function post(path: string, token: string, body: unknown): Promise<{ status: number; body: any }> {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  const text = await response.text();
  let parsed: any = null;
  try { parsed = text ? JSON.parse(text) : null; } catch { parsed = text; }
  return { status: response.status, body: parsed };
}

async function main(): Promise<void> {
  requireEnv("BROKER_KEY_HUMAN", humanKey);
  requireEnv("POST_HUMAN_HARDENING_CODE_FLOW_ID", codeFlowId);

  const results: Record<string, { status: number; code?: string }> = {};
  for (const artifactType of ["human_decision", "advancement_approval", "promotion_decision", "human_advancement_decision"]) {
    const response = await post(`/v1/flows/${encodeURIComponent(codeFlowId)}/artifacts`, humanKey, {
      artifact_type: artifactType,
      title: `Raw ${artifactType} ${runId}`,
      body: `raw generic ${artifactType} must be route-only`
    });
    results[artifactType] = { status: response.status, code: response.body?.error?.code };
    assert(response.status === 403, `${artifactType} expected 403, got ${response.status}`);
    assert(response.body?.error?.code === "FLOW_ARTIFACT_ROUTE_REQUIRED", `${artifactType} expected FLOW_ARTIFACT_ROUTE_REQUIRED`);
  }

  console.log(JSON.stringify({ ok: true, result: "PASS", results }, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
