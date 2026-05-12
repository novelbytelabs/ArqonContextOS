import type { Env, Role } from "./types";

export function roleFromAuth(request: Request, env: Env): Role | null {
  const auth = request.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length).trim() : "";
  if (!token) return null;
  if (token === env.BROKER_KEY_PM) return "PM_AI";
  if (token === env.BROKER_KEY_CODER) return "CODER_AI";
  if (token === env.BROKER_KEY_AUDITOR) return "AUDITOR_AI";
  if (token === env.BROKER_KEY_HELPER) return "HELPER_CODEX";
  if (token === env.BROKER_KEY_HUMAN) return "HUMAN";
  return null;
}

export function requireRole(request: Request, env: Env): Role {
  const role = roleFromAuth(request, env);
  if (!role) {
    throw new Response(JSON.stringify({ ok: false, error: { code: "UNAUTHORIZED", message: "Missing or invalid bearer token" } }), {
      status: 401,
      headers: { "content-type": "application/json; charset=utf-8" }
    });
  }
  return role;
}
