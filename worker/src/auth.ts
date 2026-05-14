import type { Env, Role } from "./types";

export const BROKER_KEY_FIELDS = [
  "BROKER_KEY_PM",
  "BROKER_KEY_CODER",
  "BROKER_KEY_AUDITOR",
  "BROKER_KEY_HELPER",
  "BROKER_KEY_EXPLORER",
  "BROKER_KEY_HYPOTHESIZER",
  "BROKER_KEY_DESIGNER",
  "BROKER_KEY_SCIENCE_AUDITOR",
  "BROKER_KEY_SCIENCE_EXECUTOR",
  "BROKER_KEY_HUMAN"
] as const;

export type BrokerKeyField = typeof BROKER_KEY_FIELDS[number];

export interface BrokerKeyValidation {
  ok: boolean;
  missing: BrokerKeyField[];
  duplicate_groups: BrokerKeyField[][];
}

export function validateBrokerKeyUniqueness(env: Env): BrokerKeyValidation {
  const missing: BrokerKeyField[] = [];
  const byValue = new Map<string, BrokerKeyField[]>();

  for (const field of BROKER_KEY_FIELDS) {
    const value = env[field];
    if (!value) {
      missing.push(field);
      continue;
    }
    const existing = byValue.get(value) || [];
    existing.push(field);
    byValue.set(value, existing);
  }

  const duplicate_groups = [...byValue.values()].filter(group => group.length > 1);
  return {
    ok: missing.length === 0 && duplicate_groups.length === 0,
    missing,
    duplicate_groups
  };
}

export function roleFromAuth(request: Request, env: Env): Role | null {
  const auth = request.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length).trim() : "";
  if (!token) return null;
  if (token === env.BROKER_KEY_PM) return "PM_AI";
  if (token === env.BROKER_KEY_CODER) return "CODER_AI";
  if (token === env.BROKER_KEY_AUDITOR) return "AUDITOR_AI";
  if (token === env.BROKER_KEY_HELPER) return "HELPER_AI";
  if (token === env.BROKER_KEY_EXPLORER) return "EXPLORER_AI";
  if (token === env.BROKER_KEY_HYPOTHESIZER) return "HYPOTHESIZER_AI";
  if (token === env.BROKER_KEY_DESIGNER) return "DESIGNER_AI";
  if (token === env.BROKER_KEY_SCIENCE_AUDITOR) return "SCIENCE_AUDITOR_AI";
  if (token === env.BROKER_KEY_SCIENCE_EXECUTOR) return "SCIENCE_EXECUTOR_AI";
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
