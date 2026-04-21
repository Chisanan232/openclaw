export const ENTERPRISE_POLICY_STORAGE_SCHEMA_VERSION = "2026-04-21" as const;

export type EnterprisePolicyBundleState = "draft" | "active" | "superseded" | "rolled_back";

export type EnterprisePolicyChangeReviewState =
  | "not_required"
  | "pending"
  | "approved"
  | "rejected";

export type EnterprisePolicyLayerScope = "organization" | "workspace";

export type EnterprisePolicyLayeringMode = "org_only" | "workspace_only" | "org_then_workspace";

export type EnterprisePolicyRolloutStrategy = "immediate" | "phased";

export type EnterprisePolicyDocument = {
  schemaVersion: typeof ENTERPRISE_POLICY_STORAGE_SCHEMA_VERSION;
  documentId: string;
  organizationId: string;
  workspaceId?: string;
  layerScope: EnterprisePolicyLayerScope;
  layeringMode: EnterprisePolicyLayeringMode;
  version: number;
  versionLabel: string;
  state: EnterprisePolicyBundleState;
  reviewState: EnterprisePolicyChangeReviewState;
  reviewRequestId?: string;
  reviewRequestedAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  activatedAt?: string;
  supersededByDocumentId?: string;
  rollbackFromDocumentId?: string;
  rollbackReason?: string;
  createdAt: string;
  updatedAt: string;
  entries: Array<{
    id: string;
    targetKey: string;
    effect: "allow" | "deny" | "conditional";
    reasonCode: string;
  }>;
};

export type EnterprisePolicyRolloutPlan = {
  strategy: EnterprisePolicyRolloutStrategy;
  startedAt: string;
  phases: Array<{
    sequence: number;
    targetPercent: number;
    scheduledAt: string;
  }>;
};

export type EnterprisePolicyActivationCheck = {
  allowed: boolean;
  code: "ok" | "review_not_approved" | "invalid_state" | "active_bundle_exists" | "scope_mismatch";
  message: string;
};

export type EnterprisePolicyRollbackCheck = {
  allowed: boolean;
  code: "ok" | "invalid_state" | "target_not_rollbackable" | "scope_mismatch";
  message: string;
};

export type EnterprisePolicyAuditLink = {
  eventType:
    | "policy.bundle.created"
    | "policy.bundle.reviewed"
    | "policy.bundle.activated"
    | "policy.bundle.superseded"
    | "policy.bundle.rolled_back";
  bundleDocumentId: string;
  bundleVersion: number;
  organizationId: string;
  workspaceId?: string;
  reviewRequestId?: string;
  activationRequestId?: string;
};

export type EnterprisePolicyAdminOperation = {
  operationId: string;
  apiOperation: string;
  uiSurface: string;
  allowedStates: EnterprisePolicyBundleState[];
};

export const ENTERPRISE_POLICY_ADMIN_OPERATIONS = [
  {
    operationId: "create-draft-policy-bundle",
    apiOperation: "POST /policy/bundles",
    uiSurface: "admin-policy/bundle-new",
    allowedStates: ["draft"],
  },
  {
    operationId: "request-policy-review",
    apiOperation: "POST /policy/bundles/{documentId}/review",
    uiSurface: "admin-policy/bundle-detail",
    allowedStates: ["draft"],
  },
  {
    operationId: "activate-policy-bundle",
    apiOperation: "POST /policy/bundles/{documentId}/activate",
    uiSurface: "admin-policy/bundle-detail",
    allowedStates: ["draft"],
  },
  {
    operationId: "rollback-active-policy-bundle",
    apiOperation: "POST /policy/bundles/{documentId}/rollback",
    uiSurface: "admin-policy/bundle-history",
    allowedStates: ["active"],
  },
] as const satisfies readonly EnterprisePolicyAdminOperation[];

export function resolvePolicyLayerPrecedence(
  layeringMode: EnterprisePolicyLayeringMode,
): EnterprisePolicyLayerScope[] {
  if (layeringMode === "org_only") {
    return ["organization"];
  }
  if (layeringMode === "workspace_only") {
    return ["workspace"];
  }
  return ["organization", "workspace"];
}

export function canTransitionPolicyBundleState(params: {
  from: EnterprisePolicyBundleState;
  to: EnterprisePolicyBundleState;
}): boolean {
  const { from, to } = params;
  if (from === to) {
    return true;
  }
  if (from === "draft" && (to === "active" || to === "superseded")) {
    return true;
  }
  if (from === "active" && (to === "superseded" || to === "rolled_back")) {
    return true;
  }
  if (from === "rolled_back" && to === "active") {
    return true;
  }
  return false;
}

export function checkPolicyActivation(params: {
  candidate: Pick<
    EnterprisePolicyDocument,
    "state" | "reviewState" | "layerScope" | "organizationId" | "workspaceId"
  >;
  existingActive: Pick<
    EnterprisePolicyDocument,
    "layerScope" | "organizationId" | "workspaceId"
  > | null;
}): EnterprisePolicyActivationCheck {
  if (params.candidate.state !== "draft") {
    return {
      allowed: false,
      code: "invalid_state",
      message: "only draft policy bundles can be activated",
    };
  }
  if (
    params.candidate.reviewState !== "approved" &&
    params.candidate.reviewState !== "not_required"
  ) {
    return {
      allowed: false,
      code: "review_not_approved",
      message: "policy bundle review must be approved before activation",
    };
  }
  if (!params.existingActive) {
    return {
      allowed: true,
      code: "ok",
      message: "activation allowed; no active bundle for target scope",
    };
  }
  const sameOrg = params.candidate.organizationId === params.existingActive.organizationId;
  const sameLayer = params.candidate.layerScope === params.existingActive.layerScope;
  const sameWorkspace = params.candidate.workspaceId === params.existingActive.workspaceId;
  if (!sameOrg || !sameLayer) {
    return {
      allowed: false,
      code: "scope_mismatch",
      message: "candidate and active bundles target different policy scopes",
    };
  }
  if (params.candidate.layerScope === "workspace" && !sameWorkspace) {
    return {
      allowed: false,
      code: "scope_mismatch",
      message: "workspace-scoped activation must match the target workspace",
    };
  }
  return {
    allowed: false,
    code: "active_bundle_exists",
    message: "active bundle already exists for this policy scope and must be superseded first",
  };
}

export function checkPolicyRollback(params: {
  targetActive: Pick<
    EnterprisePolicyDocument,
    "state" | "layerScope" | "organizationId" | "workspaceId" | "rollbackFromDocumentId"
  >;
  rollbackCandidate: Pick<
    EnterprisePolicyDocument,
    "state" | "layerScope" | "organizationId" | "workspaceId"
  >;
}): EnterprisePolicyRollbackCheck {
  if (params.targetActive.state !== "active") {
    return {
      allowed: false,
      code: "invalid_state",
      message: "rollback target must be an active policy bundle",
    };
  }
  if (
    params.rollbackCandidate.state !== "superseded" &&
    params.rollbackCandidate.state !== "rolled_back"
  ) {
    return {
      allowed: false,
      code: "target_not_rollbackable",
      message: "rollback candidate must be superseded or rolled_back",
    };
  }
  const sameScope =
    params.targetActive.layerScope === params.rollbackCandidate.layerScope &&
    params.targetActive.organizationId === params.rollbackCandidate.organizationId &&
    params.targetActive.workspaceId === params.rollbackCandidate.workspaceId;
  if (!sameScope) {
    return {
      allowed: false,
      code: "scope_mismatch",
      message: "rollback candidate scope must match the active policy scope",
    };
  }
  return {
    allowed: true,
    code: "ok",
    message: "rollback allowed for matching policy scope",
  };
}

export function buildPolicyRolloutPlan(params: {
  strategy: EnterprisePolicyRolloutStrategy;
  startedAt: string;
  phaseCount?: number;
  intervalMinutes?: number;
}): EnterprisePolicyRolloutPlan {
  if (params.strategy === "immediate") {
    return {
      strategy: "immediate",
      startedAt: params.startedAt,
      phases: [
        {
          sequence: 1,
          targetPercent: 100,
          scheduledAt: params.startedAt,
        },
      ],
    };
  }
  const phaseCount = params.phaseCount ?? 4;
  const intervalMinutes = params.intervalMinutes ?? 15;
  const startedEpoch = Date.parse(params.startedAt);
  const phases: EnterprisePolicyRolloutPlan["phases"] = [];
  for (let index = 1; index <= phaseCount; index += 1) {
    const percent = Math.round((index / phaseCount) * 100);
    const scheduledAt = new Date(
      startedEpoch + (index - 1) * intervalMinutes * 60_000,
    ).toISOString();
    phases.push({
      sequence: index,
      targetPercent: percent,
      scheduledAt,
    });
  }
  return {
    strategy: "phased",
    startedAt: params.startedAt,
    phases,
  };
}
