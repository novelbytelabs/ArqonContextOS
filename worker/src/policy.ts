import type { Role } from "./types";

export const STATUS_LABELS = [
  "REQUIRES_HUMAN_REVIEW",
  "development diagnostic only",
  "NOT SEALED-TEST CERTIFIED",
  "not promotable"
] as const;

const FORBIDDEN_PARTS = [".env", "secrets", "sealed", "holdout", "models", "data", "private", "credentials"];
const ALLOWED_WRITE_ROOTS = ["governance/flows/", "governance/runs/", "governance/messages/", "governance/notes/", "governance/ledger/", "governance/context/"];

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

export function isRole(value: string): value is Role {
  return value === "PM_AI" || value === "CODER_AI" || value === "AUDITOR_AI" || value === "HELPER_CODEX" || value === "HUMAN";
}

export function isKnownProject(value: string): boolean {
  return value === "ArqonZero";
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

export function canWriteFlowArtifact(role: Role, artifactType: string): boolean {
  const allowed: Record<Role, string[]> = {
    PM_AI: [
      "research_dossier_review",
      "pm_dossier",
      "constitution",
      "specification",
      "plan",
      "pm_spec",
      "pm_gate_definition",
      "share_review"
    ],
    CODER_AI: [
      "tasks",
      "implementation_bundle",
      "coder_patch_bundle",
      "coder_handoff"
    ],
    HELPER_CODEX: [
      "execution_report",
      "evidence_manifest",
      "command_log",
      "helper_log"
    ],
    AUDITOR_AI: [
      "clarification",
      "checklist",
      "analysis",
      "audit_report",
      "integrity_review",
      "claim_audit"
    ],
    HUMAN: [
      "human_decision",
      "advancement_approval",
      "promotion_decision",
      "exception_manifest"
    ]
  };
  return allowed[role]?.includes(artifactType) ?? false;
}
