import type { Role } from "./types";

export type FlowType = "science_flow" | "code_flow" | "audit_flow" | "governance_flow";
export type FlowStatus = "active" | "blocked" | "completed" | "archived";
export type GateState =
  | "DRAFT"
  | "PLAN_READY"
  | "DEV_EVIDENCE_READY"
  | "INTEGRITY_GATE_PASSED"
  | "CLAIM_OR_PROMOTION_CANDIDATE"
  | "HUMAN_APPROVED";

export const FLOW_TYPES: FlowType[] = ["science_flow", "code_flow", "audit_flow", "governance_flow"];
export const FLOW_STATUSES: FlowStatus[] = ["active", "blocked", "completed", "archived"];
export const GATE_STATES: GateState[] = [
  "DRAFT",
  "PLAN_READY",
  "DEV_EVIDENCE_READY",
  "INTEGRITY_GATE_PASSED",
  "CLAIM_OR_PROMOTION_CANDIDATE",
  "HUMAN_APPROVED"
];

export const GATE_ORDER: GateState[] = [
  "DRAFT",
  "PLAN_READY",
  "DEV_EVIDENCE_READY",
  "INTEGRITY_GATE_PASSED",
  "CLAIM_OR_PROMOTION_CANDIDATE",
  "HUMAN_APPROVED"
];

export const SCIENCE_ARTIFACT_SLOTS = [
  "clarification",
  "research_dossier",
  "source_map",
  "contradiction_map",
  "open_questions",
  "hypothesis_card",
  "null_hypothesis",
  "prediction_record",
  "experiment_protocol",
  "metric_plan",
  "control_plan",
  "execution_packet",
  "sealed_boundary_plan",
  "execution_report",
  "evidence_manifest",
  "command_log",
  "raw_result_index",
  "deviation_report",
  "science_checklist",
  "protocol_audit",
  "evidence_audit",
  "claim_scope_audit",
  "audit_report",
  "quarantine_recommendation",
  "interpretation_draft",
  "alternative_explanation_review",
  "claim_scope_review",
  "iteration_proposal",
  "revised_hypothesis_card",
  "revised_experiment_protocol",
  "finding_record",
  "negative_finding_record",
  "inconclusive_finding_record",
  "finding_boundary_record",
  "share_recommendation",
  "share_packet",
  "pm_context_seed",
  "share_notification",
  "human_decision",
  "advancement_approval",
  "exception_manifest"
] as const;

export const FLOW_ARTIFACT_SLOTS: Record<FlowType, string[]> = {
  science_flow: [...SCIENCE_ARTIFACT_SLOTS],
  code_flow: [
    "pm_dossier",
    "constitution",
    "specification",
    "plan",
    "pm_spec",
    "pm_gate_definition",
    "handoff_intake",
    "dossier_seed",
    "tasks",
    "implementation_bundle",
    "coder_patch_bundle",
    "coder_handoff",
    "execution_report",
    "evidence_manifest",
    "command_log",
    "helper_log",
    "clarification",
    "checklist",
    "analysis",
    "audit_report",
    "integrity_review",
    "claim_audit",
    "human_decision",
    "advancement_approval",
    "promotion_decision",
    "exception_manifest"
  ],
  audit_flow: [
    "clarification",
    "checklist",
    "analysis",
    "audit_report",
    "integrity_review",
    "claim_audit",
    "execution_report",
    "evidence_manifest",
    "command_log",
    "human_decision",
    "advancement_approval",
    "exception_manifest"
  ],
  governance_flow: [
    "research_dossier_review",
    "pm_dossier",
    "constitution",
    "specification",
    "plan",
    "pm_spec",
    "pm_gate_definition",
    "share_review",
    "tasks",
    "implementation_bundle",
    "coder_patch_bundle",
    "coder_handoff",
    "execution_report",
    "evidence_manifest",
    "command_log",
    "helper_log",
    "clarification",
    "checklist",
    "analysis",
    "audit_report",
    "integrity_review",
    "claim_audit",
    "human_decision",
    "advancement_approval",
    "promotion_decision",
    "exception_manifest"
  ]
};


export const ROLE_FLOW_CREATE: Record<FlowType, Role[]> = {
  science_flow: ["EXPLORER_AI"],
  code_flow: ["PM_AI", "HUMAN"],
  audit_flow: ["AUDITOR_AI", "HUMAN"],
  governance_flow: ["PM_AI", "HUMAN"]
};

export function validateFlowCreateRole(flowType: FlowType, role: Role): string | null {
  const allowed = ROLE_FLOW_CREATE[flowType] || [];
  if (allowed.includes(role)) return null;
  return `Role ${role} cannot create ${flowType}`;
}

export const ROLE_FLOW_ARTIFACTS: Record<FlowType, Partial<Record<Role, string[]>>> = {
  science_flow: {
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
  },
  code_flow: {
    PM_AI: ["pm_dossier", "constitution", "specification", "plan", "pm_spec", "pm_gate_definition", "handoff_intake", "dossier_seed"],
    CODER_AI: ["tasks", "implementation_bundle", "coder_patch_bundle", "coder_handoff"],
    HELPER_AI: ["execution_report", "evidence_manifest", "command_log", "helper_log"],
    AUDITOR_AI: ["clarification", "checklist", "analysis", "audit_report", "integrity_review", "claim_audit"],
    HUMAN: ["human_decision", "advancement_approval", "promotion_decision", "exception_manifest"]
  },
  audit_flow: {
    AUDITOR_AI: ["clarification", "checklist", "analysis", "audit_report", "integrity_review", "claim_audit"],
    HELPER_AI: ["execution_report", "evidence_manifest", "command_log"],
    HUMAN: ["human_decision", "advancement_approval", "exception_manifest"]
  },
  governance_flow: {
    PM_AI: ["research_dossier_review", "pm_dossier", "constitution", "specification", "plan", "pm_spec", "pm_gate_definition", "share_review"],
    CODER_AI: ["tasks", "implementation_bundle", "coder_patch_bundle", "coder_handoff"],
    HELPER_AI: ["execution_report", "evidence_manifest", "command_log", "helper_log"],
    AUDITOR_AI: ["clarification", "checklist", "analysis", "audit_report", "integrity_review", "claim_audit"],
    HUMAN: ["human_decision", "advancement_approval", "promotion_decision", "exception_manifest"]
  }
};

const EVIDENCE_ARTIFACTS = new Set(["execution_report", "evidence_manifest", "command_log", "helper_log"]);
const AUDIT_ARTIFACTS = new Set(["audit_report", "integrity_review", "claim_audit"]);
const HUMAN_DECISION_ARTIFACTS = new Set(["human_decision", "advancement_approval", "promotion_decision", "exception_manifest"]);
const SCIENCE_EVIDENCE_REQUIRED = ["execution_report", "evidence_manifest", "command_log", "raw_result_index"];
const SCIENCE_AUDIT_REQUIRED = ["audit_report", "evidence_audit", "claim_scope_audit", "protocol_audit"];

export function assertFlowType(value: string): asserts value is FlowType {
  if (!FLOW_TYPES.includes(value as FlowType)) throw new Error("Flow type must be science_flow, code_flow, audit_flow, or governance_flow");
}

export function assertFlowStatus(value: string): asserts value is FlowStatus {
  if (!FLOW_STATUSES.includes(value as FlowStatus)) throw new Error("Flow status must be active, blocked, completed, or archived");
}

export function assertGateState(value: string): asserts value is GateState {
  if (!GATE_STATES.includes(value as GateState)) throw new Error("Invalid gate state");
}

export function artifactAllowedForFlow(flowType: FlowType, artifactType: string): boolean {
  return FLOW_ARTIFACT_SLOTS[flowType].includes(artifactType);
}

export function validateArtifactSlot(flowType: FlowType, artifactType: string): string | null {
  if (artifactAllowedForFlow(flowType, artifactType)) return null;
  return `Artifact type ${artifactType} is not allowed for ${flowType}`;
}

export function validateFlowArtifactRole(flowType: FlowType, role: Role, artifactType: string): string | null {
  const allowed = ROLE_FLOW_ARTIFACTS[flowType]?.[role] || [];
  if (allowed.includes(artifactType)) return null;
  return `Role ${role} cannot write artifact_type ${artifactType} for ${flowType}`;
}

export function canWriteFlowArtifactForFlow(flowType: FlowType, role: Role, artifactType: string): boolean {
  return validateFlowArtifactRole(flowType, role, artifactType) === null;
}

function gateIndex(gate: GateState): number {
  return GATE_ORDER.indexOf(gate);
}

function hasAnyArtifact(artifactTypes: string[], allowed: Set<string>): boolean {
  return artifactTypes.some(type => allowed.has(type));
}

function hasAllArtifacts(artifactTypes: string[], required: string[]): boolean {
  return required.every(type => artifactTypes.includes(type));
}

export function validateGateAdvance(
  currentGate: GateState,
  targetGate: GateState,
  targetStatus: FlowStatus,
  artifactTypes: string[],
  flowType?: FlowType
): string | null {
  if (targetStatus === "blocked" || targetStatus === "archived") return null;
  if (currentGate === targetGate) return null;

  const currentIndex = gateIndex(currentGate);
  const targetIndex = gateIndex(targetGate);
  if (targetIndex < currentIndex) return `Gate rollback is not allowed: ${currentGate} -> ${targetGate}`;
  if (targetIndex > currentIndex + 1) return `Gate jump is not allowed: ${currentGate} -> ${targetGate}`;

  if (flowType === "science_flow") {
    if (targetGate === "DEV_EVIDENCE_READY" && !hasAllArtifacts(artifactTypes, SCIENCE_EVIDENCE_REQUIRED)) {
      return `DEV_EVIDENCE_READY requires science evidence artifacts: ${SCIENCE_EVIDENCE_REQUIRED.join(", ")}`;
    }
    if (targetGate === "INTEGRITY_GATE_PASSED" && !hasAllArtifacts(artifactTypes, SCIENCE_AUDIT_REQUIRED)) {
      return `INTEGRITY_GATE_PASSED requires science audit artifacts: ${SCIENCE_AUDIT_REQUIRED.join(", ")}`;
    }
  } else {
    if (targetGate === "DEV_EVIDENCE_READY" && !hasAnyArtifact(artifactTypes, EVIDENCE_ARTIFACTS)) {
      return "DEV_EVIDENCE_READY requires at least one execution/evidence artifact";
    }
    if (targetGate === "INTEGRITY_GATE_PASSED" && !hasAnyArtifact(artifactTypes, AUDIT_ARTIFACTS)) {
      return "INTEGRITY_GATE_PASSED requires at least one audit/integrity artifact";
    }
  }

  if (targetGate === "CLAIM_OR_PROMOTION_CANDIDATE" && !hasAnyArtifact(artifactTypes, AUDIT_ARTIFACTS)) {
    return "CLAIM_OR_PROMOTION_CANDIDATE requires at least one audit/integrity artifact";
  }

  if (targetGate === "HUMAN_APPROVED" && !hasAnyArtifact(artifactTypes, HUMAN_DECISION_ARTIFACTS)) {
    return "HUMAN_APPROVED requires at least one human decision artifact";
  }

  return null;
}

export function flowPolicySnapshot(): Record<string, unknown> {
  return {
    flow_types: FLOW_TYPES,
    flow_statuses: FLOW_STATUSES,
    gate_states: GATE_STATES,
    gate_order: GATE_ORDER,
    flow_artifact_slots: FLOW_ARTIFACT_SLOTS,
    role_flow_artifacts: ROLE_FLOW_ARTIFACTS
  };
}
