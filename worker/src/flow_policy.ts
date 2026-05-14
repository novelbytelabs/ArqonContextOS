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

export const FLOW_ARTIFACT_SLOTS: Record<FlowType, string[]> = {
  science_flow: [
    "research_dossier_review",
    "share_review",
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
    "exception_manifest"
  ],
  code_flow: [
    "pm_dossier",
    "constitution",
    "specification",
    "plan",
    "pm_spec",
    "pm_gate_definition",
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

const EVIDENCE_ARTIFACTS = new Set(["execution_report", "evidence_manifest", "command_log", "helper_log"]);
const AUDIT_ARTIFACTS = new Set(["audit_report", "integrity_review", "claim_audit"]);
const HUMAN_DECISION_ARTIFACTS = new Set(["human_decision", "advancement_approval", "promotion_decision", "exception_manifest"]);

export function assertFlowType(value: string): asserts value is FlowType {
  if (!FLOW_TYPES.includes(value as FlowType)) {
    throw new Error("Flow type must be science_flow, code_flow, audit_flow, or governance_flow");
  }
}

export function assertFlowStatus(value: string): asserts value is FlowStatus {
  if (!FLOW_STATUSES.includes(value as FlowStatus)) {
    throw new Error("Flow status must be active, blocked, completed, or archived");
  }
}

export function assertGateState(value: string): asserts value is GateState {
  if (!GATE_STATES.includes(value as GateState)) {
    throw new Error("Invalid gate state");
  }
}

export function artifactAllowedForFlow(flowType: FlowType, artifactType: string): boolean {
  return FLOW_ARTIFACT_SLOTS[flowType].includes(artifactType);
}

export function validateArtifactSlot(flowType: FlowType, artifactType: string): string | null {
  if (artifactAllowedForFlow(flowType, artifactType)) return null;
  return `Artifact type ${artifactType} is not allowed for ${flowType}`;
}

function gateIndex(gate: GateState): number {
  return GATE_ORDER.indexOf(gate);
}

function hasAnyArtifact(artifactTypes: string[], allowed: Set<string>): boolean {
  return artifactTypes.some(type => allowed.has(type));
}

export function validateGateAdvance(
  currentGate: GateState,
  targetGate: GateState,
  targetStatus: FlowStatus,
  artifactTypes: string[]
): string | null {
  if (targetStatus === "blocked" || targetStatus === "archived") return null;
  if (currentGate === targetGate) return null;

  const currentIndex = gateIndex(currentGate);
  const targetIndex = gateIndex(targetGate);
  if (targetIndex < currentIndex) {
    return `Gate rollback is not allowed: ${currentGate} -> ${targetGate}`;
  }
  if (targetIndex > currentIndex + 1) {
    return `Gate jump is not allowed: ${currentGate} -> ${targetGate}`;
  }

  if (targetGate === "DEV_EVIDENCE_READY" && !hasAnyArtifact(artifactTypes, EVIDENCE_ARTIFACTS)) {
    return "DEV_EVIDENCE_READY requires at least one execution/evidence artifact";
  }

  if (targetGate === "INTEGRITY_GATE_PASSED" && !hasAnyArtifact(artifactTypes, AUDIT_ARTIFACTS)) {
    return "INTEGRITY_GATE_PASSED requires at least one audit/integrity artifact";
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
    flow_artifact_slots: FLOW_ARTIFACT_SLOTS
  };
}
