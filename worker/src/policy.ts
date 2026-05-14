import type { Role } from "./types";

export const STATUS_LABELS = [
  "REQUIRES_HUMAN_REVIEW",
  "development diagnostic only",
  "NOT SEALED-TEST CERTIFIED",
  "not promotable"
] as const;

const FORBIDDEN_PARTS = [".env", "secrets", "sealed", "holdout", "models", "data", "private", "credentials"];
const ALLOWED_WRITE_ROOTS = ["governance/flows/", "governance/runs/", "governance/messages/", "governance/notes/", "governance/ledger/", "governance/context/", "governance/outbox/science_share/"];

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
  return (
    value === "PM_AI" ||
    value === "CODER_AI" ||
    value === "AUDITOR_AI" ||
    value === "HELPER_AI" ||
    value === "HELPER_CODEX" ||
    value === "EXPLORER_AI" ||
    value === "HYPOTHESIZER_AI" ||
    value === "DESIGNER_AI" ||
    value === "SCIENCE_AUDITOR_AI" ||
    value === "SCIENCE_EXECUTOR_AI" ||
    value === "HUMAN"
  );
}

export function isKnownProject(value: string): boolean {
  return value === "ArqonZero";
}

export function canWriteArtifact(role: Role, artifactType: string): boolean {
  const allowed: Record<Role, string[]> = {
    PM_AI: ["pm_spec", "pm_task_packets", "pm_message", "pm_note", "run_event"],
    CODER_AI: ["coder_patch_bundle", "coder_handoff", "coder_message", "coder_note"],
    HELPER_AI: ["helper_execution_report", "evidence_manifest", "helper_log", "helper_message"],
    HELPER_CODEX: [],
    AUDITOR_AI: ["auditor_report", "auditor_score", "claim_audit", "auditor_message", "auditor_note"],
    EXPLORER_AI: ["science_message", "science_note"],
    HYPOTHESIZER_AI: ["science_message", "science_note"],
    DESIGNER_AI: ["science_message", "science_note"],
    SCIENCE_AUDITOR_AI: ["science_auditor_message", "science_auditor_note"],
    SCIENCE_EXECUTOR_AI: ["science_execution_report", "science_evidence_manifest", "science_command_log"],
    HUMAN: ["human_decision", "exception_manifest", "promotion_manifest", "human_message", "human_note"]
  };
  return allowed[role]?.includes(artifactType) ?? false;
}

/**
 * Legacy flow-artifact role gate retained for compatibility.
 * New Flow Core writes should use flow-type-aware policy in flow_policy.ts.
 */
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
    CODER_AI: ["tasks", "implementation_bundle", "coder_patch_bundle", "coder_handoff"],
    HELPER_AI: ["execution_report", "evidence_manifest", "command_log", "helper_log"],
    HELPER_CODEX: [],
    AUDITOR_AI: ["clarification", "checklist", "analysis", "audit_report", "integrity_review", "claim_audit"],
    EXPLORER_AI: ["research_dossier", "source_map", "contradiction_map", "open_questions"],
    HYPOTHESIZER_AI: [
      "hypothesis_card",
      "null_hypothesis",
      "prediction_record",
      "interpretation_draft",
      "alternative_explanation_review",
      "iteration_proposal",
      "revised_hypothesis_card"
    ],
    DESIGNER_AI: ["experiment_protocol", "metric_plan", "control_plan", "execution_packet", "sealed_boundary_plan", "revised_experiment_protocol"],
    SCIENCE_EXECUTOR_AI: ["execution_report", "evidence_manifest", "command_log", "raw_result_index", "deviation_report"],
    SCIENCE_AUDITOR_AI: [
      "clarification",
      "science_checklist",
      "protocol_audit",
      "evidence_audit",
      "claim_scope_audit",
      "audit_report",
      "quarantine_recommendation",
      "claim_scope_review",
      "finding_record",
      "negative_finding_record",
      "inconclusive_finding_record",
      "finding_boundary_record",
      "share_recommendation"
    ],
    HUMAN: ["human_decision", "advancement_approval", "promotion_decision", "exception_manifest", "share_packet"]
  };
  return allowed[role]?.includes(artifactType) ?? false;
}
