export const ENTERPRISE_APPROVAL_LIFECYCLE_SCHEMA_VERSION = "2026-04-21" as const;

export type EnterpriseApprovalLifecycleStatus =
  | "pending_review"
  | "escalated"
  | "approved"
  | "denied"
  | "expired"
  | "superseded";

export type EnterpriseApprovalLifecycleTrigger =
  | "submit_for_review"
  | "auto_escalate"
  | "auto_expire"
  | "resolve_approve"
  | "resolve_deny"
  | "supersede_request"
  | "request_reapproval"
  | "handoff_audit";

export type EnterpriseApprovalLifecycleTransition = {
  from: EnterpriseApprovalLifecycleStatus;
  trigger: EnterpriseApprovalLifecycleTrigger;
  to: EnterpriseApprovalLifecycleStatus;
};

export type EnterpriseApprovalAuditHandoffState = "pending" | "handoff_ready" | "published";

export type EnterpriseApprovalLifecycleRecord = {
  schemaVersion: typeof ENTERPRISE_APPROVAL_LIFECYCLE_SCHEMA_VERSION;
  ticketKey: "CONCLAW-37";
  requestId: string;
  workspaceId: string;
  status: EnterpriseApprovalLifecycleStatus;
  createdAt: string;
  expiresAt: string;
  escalationAt?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionReason?: string;
  revision: number;
  supersedesRequestId?: string;
  supersededByRequestId?: string;
  auditHandoff: EnterpriseApprovalAuditHandoffState;
};

export type EnterpriseApprovalLifecycleEvent = {
  trigger: EnterpriseApprovalLifecycleTrigger;
  happenedAt: string;
  actorId: string;
  resolutionReason?: string;
  supersededByRequestId?: string;
  nextExpiresAt?: string;
};

export const ENTERPRISE_APPROVAL_LIFECYCLE_TRANSITIONS = [
  {
    from: "pending_review",
    trigger: "auto_escalate",
    to: "escalated",
  },
  {
    from: "pending_review",
    trigger: "resolve_approve",
    to: "approved",
  },
  {
    from: "pending_review",
    trigger: "resolve_deny",
    to: "denied",
  },
  {
    from: "pending_review",
    trigger: "auto_expire",
    to: "expired",
  },
  {
    from: "pending_review",
    trigger: "supersede_request",
    to: "superseded",
  },
  {
    from: "escalated",
    trigger: "resolve_approve",
    to: "approved",
  },
  {
    from: "escalated",
    trigger: "resolve_deny",
    to: "denied",
  },
  {
    from: "escalated",
    trigger: "auto_expire",
    to: "expired",
  },
  {
    from: "escalated",
    trigger: "supersede_request",
    to: "superseded",
  },
  {
    from: "denied",
    trigger: "request_reapproval",
    to: "pending_review",
  },
  {
    from: "expired",
    trigger: "request_reapproval",
    to: "pending_review",
  },
] as const satisfies readonly EnterpriseApprovalLifecycleTransition[];

export const ENTERPRISE_APPROVAL_HANDED_OFF_STATUSES = [
  "approved",
  "denied",
  "expired",
  "superseded",
] as const satisfies readonly EnterpriseApprovalLifecycleStatus[];

export type EnterpriseApprovalAutomaticLifecycleAction = {
  trigger: "auto_escalate" | "auto_expire";
  happenedAt: string;
  reason: string;
};

export type EnterpriseApprovalPersistenceRequirement = {
  id: string;
  purpose: string;
  requiredFields: string[];
  indexKeys: string[];
  retentionClass: "regulatory" | "security" | "operational";
};

export const ENTERPRISE_APPROVAL_PERSISTENCE_REQUIREMENTS = [
  {
    id: "approval-request-snapshot",
    purpose: "Store latest request lifecycle snapshot for UI/API reads.",
    requiredFields: [
      "requestId",
      "workspaceId",
      "status",
      "revision",
      "createdAt",
      "expiresAt",
      "auditHandoff",
    ],
    indexKeys: ["workspaceId+status", "requestId"],
    retentionClass: "regulatory",
  },
  {
    id: "approval-transition-log",
    purpose: "Append-only transition history for audit and debugging replay.",
    requiredFields: ["requestId", "fromStatus", "toStatus", "trigger", "happenedAt", "actorId"],
    indexKeys: ["requestId+happenedAt", "workspaceId+happenedAt"],
    retentionClass: "regulatory",
  },
  {
    id: "approval-escalation-timeout-log",
    purpose: "Record automatic escalation and timeout outcomes with reasons.",
    requiredFields: ["requestId", "trigger", "happenedAt", "reason"],
    indexKeys: ["workspaceId+trigger+happenedAt"],
    retentionClass: "security",
  },
  {
    id: "approval-audit-handoff-log",
    purpose: "Track readiness and publication state for downstream audit pipelines.",
    requiredFields: ["requestId", "auditHandoff", "happenedAt", "eventType"],
    indexKeys: ["auditHandoff+happenedAt"],
    retentionClass: "regulatory",
  },
] as const satisfies readonly EnterpriseApprovalPersistenceRequirement[];

export type EnterpriseApprovalOperationMapping = {
  operationId: string;
  apiOperation: string;
  uiSurface: string;
  requiredStatuses: EnterpriseApprovalLifecycleStatus[];
  trigger?: EnterpriseApprovalLifecycleTrigger;
};

export const ENTERPRISE_APPROVAL_OPERATION_MAPPINGS = [
  {
    operationId: "create-request",
    apiOperation: "POST /approvals",
    uiSurface: "requester-flow/new-approval",
    requiredStatuses: ["pending_review"],
    trigger: "submit_for_review",
  },
  {
    operationId: "approve-request",
    apiOperation: "POST /approvals/{requestId}/approve",
    uiSurface: "approver-console/request-detail",
    requiredStatuses: ["pending_review", "escalated"],
    trigger: "resolve_approve",
  },
  {
    operationId: "deny-request",
    apiOperation: "POST /approvals/{requestId}/deny",
    uiSurface: "approver-console/request-detail",
    requiredStatuses: ["pending_review", "escalated"],
    trigger: "resolve_deny",
  },
  {
    operationId: "request-reapproval",
    apiOperation: "POST /approvals/{requestId}/reapprove",
    uiSurface: "requester-flow/denied-or-expired-request",
    requiredStatuses: ["denied", "expired"],
    trigger: "request_reapproval",
  },
  {
    operationId: "supersede-request",
    apiOperation: "POST /approvals/{requestId}/supersede",
    uiSurface: "approver-console/request-detail",
    requiredStatuses: ["pending_review", "escalated"],
    trigger: "supersede_request",
  },
  {
    operationId: "publish-audit-handoff",
    apiOperation: "POST /approvals/{requestId}/audit-handoff",
    uiSurface: "admin-audit/approval-lifecycle",
    requiredStatuses: ["approved", "denied", "expired", "superseded"],
    trigger: "handoff_audit",
  },
] as const satisfies readonly EnterpriseApprovalOperationMapping[];

export function canApplyApprovalLifecycleTrigger(
  status: EnterpriseApprovalLifecycleStatus,
  trigger: EnterpriseApprovalLifecycleTrigger,
): boolean {
  if (trigger === "handoff_audit") {
    return ENTERPRISE_APPROVAL_HANDED_OFF_STATUSES.includes(status);
  }
  return ENTERPRISE_APPROVAL_LIFECYCLE_TRANSITIONS.some(
    (transition) => transition.from === status && transition.trigger === trigger,
  );
}

export function deriveApprovalAutomaticLifecycleActions(params: {
  record: Pick<EnterpriseApprovalLifecycleRecord, "status" | "escalationAt" | "expiresAt">;
  now: string;
}): EnterpriseApprovalAutomaticLifecycleAction[] {
  const automaticActions: EnterpriseApprovalAutomaticLifecycleAction[] = [];
  const nowEpoch = Date.parse(params.now);
  const expiresEpoch = Date.parse(params.record.expiresAt);
  const escalationEpoch = params.record.escalationAt
    ? Date.parse(params.record.escalationAt)
    : null;
  if (
    params.record.status === "pending_review" &&
    escalationEpoch !== null &&
    nowEpoch >= escalationEpoch &&
    nowEpoch < expiresEpoch
  ) {
    automaticActions.push({
      trigger: "auto_escalate",
      happenedAt: params.now,
      reason: "approval reached escalation threshold before resolution",
    });
  }
  if (
    (params.record.status === "pending_review" || params.record.status === "escalated") &&
    nowEpoch >= expiresEpoch
  ) {
    automaticActions.push({
      trigger: "auto_expire",
      happenedAt: params.now,
      reason: "approval lifetime exceeded expiry threshold",
    });
  }
  return automaticActions;
}

export function applyApprovalLifecycleEvent(params: {
  record: EnterpriseApprovalLifecycleRecord;
  event: EnterpriseApprovalLifecycleEvent;
}): EnterpriseApprovalLifecycleRecord {
  const { record, event } = params;
  if (!canApplyApprovalLifecycleTrigger(record.status, event.trigger)) {
    throw new Error(`invalid lifecycle transition: ${record.status} -> ${event.trigger}`);
  }
  if (event.trigger === "handoff_audit") {
    return {
      ...record,
      auditHandoff: "published",
    };
  }
  const transition = ENTERPRISE_APPROVAL_LIFECYCLE_TRANSITIONS.find(
    (candidate) => candidate.from === record.status && candidate.trigger === event.trigger,
  );
  if (!transition) {
    throw new Error(`transition metadata not found: ${record.status} -> ${event.trigger}`);
  }
  const nextRecord: EnterpriseApprovalLifecycleRecord = {
    ...record,
    status: transition.to,
  };
  if (event.trigger === "resolve_approve" || event.trigger === "resolve_deny") {
    nextRecord.resolvedAt = event.happenedAt;
    nextRecord.resolvedBy = event.actorId;
    nextRecord.resolutionReason = event.resolutionReason ?? "resolved by approver";
    nextRecord.auditHandoff = "handoff_ready";
  }
  if (event.trigger === "auto_expire") {
    nextRecord.resolvedAt = event.happenedAt;
    nextRecord.resolvedBy = event.actorId;
    nextRecord.resolutionReason = event.resolutionReason ?? "expired by timeout";
    nextRecord.auditHandoff = "handoff_ready";
  }
  if (event.trigger === "supersede_request") {
    if (!event.supersededByRequestId) {
      throw new Error("supersede_request requires supersededByRequestId");
    }
    nextRecord.supersededByRequestId = event.supersededByRequestId;
    nextRecord.resolvedAt = event.happenedAt;
    nextRecord.resolvedBy = event.actorId;
    nextRecord.resolutionReason = event.resolutionReason ?? "superseded by replacement request";
    nextRecord.auditHandoff = "handoff_ready";
  }
  if (event.trigger === "request_reapproval") {
    if (!event.nextExpiresAt) {
      throw new Error("request_reapproval requires nextExpiresAt");
    }
    nextRecord.revision = record.revision + 1;
    nextRecord.expiresAt = event.nextExpiresAt;
    nextRecord.resolvedAt = undefined;
    nextRecord.resolvedBy = undefined;
    nextRecord.resolutionReason = undefined;
    nextRecord.auditHandoff = "pending";
  }
  return nextRecord;
}
