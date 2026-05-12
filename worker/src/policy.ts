import type { Role } from "./types";

const FORBIDDEN_PARTS = [".env", "secrets", "sealed", "holdout", "models", "data", "private", "credentials"];
const ALLOWED_WRITE_ROOTS = ["governance/runs/", "governance/messages/", "governance/notes/", "governance/ledger/", "governance/context/"];

export function assertSafeReadPath(path: string): void {
  const parts = path.split("/").map(p => p.toLowerCase());
  for (const forbidden of FORBIDDEN_PARTS) {
    if (parts.includes(forbidden)) throw new Error(`Forbidden path component: ${forbidden}`);
  }
}

export function assertSafeWritePath(path: string): void {
  assertSafeReadPath(path);
  if (!ALLOWED_WRITE_ROOTS.some(root => path.startsWith(root))) throw new Error(`Write path is not allowlisted: ${path}`);
  if (path.startsWith("src/") || path.startsWith("tests/") || path.startsWith(".github/")) {
    throw new Error(`Source/test/workflow writes are forbidden in broker v0.1: ${path}`);
  }
}

export function canWriteArtifact(role: Role, artifactType: string): boolean {
  const allowed: Record<Role, string[]> = {
    PM_AI: ["pm_spec", "pm_task_packets", "pm_message", "pm_note", "run_event"],
    CODER_AI: ["coder_patch_bundle", "coder_handoff", "coder_message", "coder_note"],
    HELPER_CODEX: ["helper_execution_report", "evidence_manifest", "helper_log", "helper_message"],
    AUDITOR_AI: ["auditor_report", "auditor_score", "claim_audit", "auditor_message", "auditor_note"],
    HUMAN: ["human_decision", "exception_manifest", "promotion_manifest", "human_message", "human_note"]
  };
  return allowed[role]?.includes(artifactType) ?? false;
}
