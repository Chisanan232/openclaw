import type {
  EnterprisePolicyAction,
  EnterprisePolicyResource,
  EnterprisePolicySubject,
} from "./enterprise-policy-model.js";

export const ENTERPRISE_APPROVAL_SCENARIO_VERSION = "2026-04-19" as const;

export type EnterpriseApprovalAuditVisibility =
  | "requester-and-approvers"
  | "workspace-admins"
  | "org-auditors";

export type EnterpriseApprovalRequest = {
  schemaVersion: typeof ENTERPRISE_APPROVAL_SCENARIO_VERSION;
  id: string;
  createdAt: string;
  expiresAt: string;
  workspaceId: string;
  requester: EnterprisePolicySubject;
  resource: EnterprisePolicyResource;
  action: EnterprisePolicyAction & {
    scope: string[];
  };
  justification: string;
  auditVisibility: EnterpriseApprovalAuditVisibility;
};

export type EnterpriseApprovalResolutionApprove = {
  decision: "approve";
  decidedAt: string;
  resolver: EnterprisePolicySubject;
};

export type EnterpriseApprovalResolutionDeny = {
  decision: "deny";
  decidedAt: string;
  resolver: EnterprisePolicySubject;
  rationale: string;
};

export type EnterpriseApprovalResolution =
  | EnterpriseApprovalResolutionApprove
  | EnterpriseApprovalResolutionDeny;

export type EnterpriseApprovalOutcomeStatus = "approved" | "denied" | "expired";

export type EnterpriseApprovalOutcome = {
  requestId: string;
  status: EnterpriseApprovalOutcomeStatus;
  resolvedAt: string;
  resolvedBy: EnterprisePolicySubject;
  reason: string;
  visibility: EnterpriseApprovalAuditVisibility;
};

export function isEnterpriseApprovalExpired(
  request: Pick<EnterpriseApprovalRequest, "expiresAt">,
  decidedAt: string,
): boolean {
  return Date.parse(decidedAt) > Date.parse(request.expiresAt);
}

export function resolveEnterpriseApproval(params: {
  request: EnterpriseApprovalRequest;
  resolution: EnterpriseApprovalResolution;
}): EnterpriseApprovalOutcome {
  const expired = isEnterpriseApprovalExpired(params.request, params.resolution.decidedAt);
  if (expired) {
    return {
      requestId: params.request.id,
      status: "expired",
      resolvedAt: params.resolution.decidedAt,
      resolvedBy: params.resolution.resolver,
      reason: "approval expired before decision was applied",
      visibility: params.request.auditVisibility,
    };
  }
  if (params.resolution.decision === "deny") {
    return {
      requestId: params.request.id,
      status: "denied",
      resolvedAt: params.resolution.decidedAt,
      resolvedBy: params.resolution.resolver,
      reason: params.resolution.rationale,
      visibility: params.request.auditVisibility,
    };
  }
  return {
    requestId: params.request.id,
    status: "approved",
    resolvedAt: params.resolution.decidedAt,
    resolvedBy: params.resolution.resolver,
    reason: "approved by reviewer",
    visibility: params.request.auditVisibility,
  };
}

export type EnterpriseApprovalAuditRecord = {
  eventType: "enterprise.approval.outcome";
  requestId: string;
  workspaceId: string;
  requesterId: string;
  resolverId: string;
  actionId: string;
  actionScope: string[];
  resourceId: string;
  resourceKind: string;
  status: EnterpriseApprovalOutcomeStatus;
  reason: string;
  visibility: EnterpriseApprovalAuditVisibility;
  happenedAt: string;
};

export function createEnterpriseApprovalAuditRecord(params: {
  request: EnterpriseApprovalRequest;
  outcome: EnterpriseApprovalOutcome;
}): EnterpriseApprovalAuditRecord {
  return {
    eventType: "enterprise.approval.outcome",
    requestId: params.request.id,
    workspaceId: params.request.workspaceId,
    requesterId: params.request.requester.id,
    resolverId: params.outcome.resolvedBy.id,
    actionId: params.request.action.id,
    actionScope: [...params.request.action.scope],
    resourceId: params.request.resource.id,
    resourceKind: params.request.resource.kind,
    status: params.outcome.status,
    reason: params.outcome.reason,
    visibility: params.outcome.visibility,
    happenedAt: params.outcome.resolvedAt,
  };
}
