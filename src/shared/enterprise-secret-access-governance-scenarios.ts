export const ENTERPRISE_SECRET_ACCESS_GOVERNANCE_SCHEMA_VERSION = "2026-04-20" as const;

export type EnterpriseSecretGovernancePrincipalType = "user" | "agent" | "service-account";

export type EnterpriseSecretScope = {
  kind: "secret" | "secret-class";
  id: string;
};

export type EnterpriseSecretGrantPath = {
  kind: "direct-grant" | "policy-rule";
  id: string;
};

export type EnterpriseSecretAccessReviewFilter = {
  workspaceId: string;
  principal?: {
    type: EnterpriseSecretGovernancePrincipalType;
    id: string;
  };
  scope: EnterpriseSecretScope;
};

export type EnterpriseSecretAccessRevocationRequest = {
  workspaceId: string;
  principal: {
    type: EnterpriseSecretGovernancePrincipalType;
    id: string;
  };
  scope: EnterpriseSecretScope;
  grantPath: EnterpriseSecretGrantPath;
  revokeReasonCode: string;
  effectWindow: "future-only" | "live-and-future";
  requestedBy: {
    type: "secrets-admin";
    id: string;
  };
};

export type EnterpriseSecretAccessGovernanceExpectation = {
  reviewMatchedPrincipalIds: string[];
  reviewMatchedGrantPathIds: string[];
  futureSecretResolveDecision: "allow" | "deny";
  futurePolicyReasonCode: string;
  inFlightExecutionImpact: "unchanged" | "terminated";
  requiredAuditEventTypes: string[];
  requiredAuditFields: string[];
};

export type EnterpriseSecretAccessGovernanceScenarioCase = {
  schemaVersion: typeof ENTERPRISE_SECRET_ACCESS_GOVERNANCE_SCHEMA_VERSION;
  ticketKey: "CONCLAW-53";
  scenarioId: string;
  testCase: string;
  title: string;
  reviewFilter: EnterpriseSecretAccessReviewFilter;
  revocationRequest?: EnterpriseSecretAccessRevocationRequest;
  expected: EnterpriseSecretAccessGovernanceExpectation;
};

export const CONCLAW_53_ENTERPRISE_SECRET_ACCESS_GOVERNANCE_SCENARIOS = [
  {
    schemaVersion: ENTERPRISE_SECRET_ACCESS_GOVERNANCE_SCHEMA_VERSION,
    ticketKey: "CONCLAW-53",
    scenarioId: "review-workspace-secret-principal-access",
    testCase: "identify-principals-with-workspace-secret-access",
    title: "Secrets admin can review principals with workspace-scoped secret access",
    reviewFilter: {
      workspaceId: "ws-finance",
      scope: {
        kind: "secret",
        id: "secret:ws-finance:payments/settlement-api-key",
      },
    },
    expected: {
      reviewMatchedPrincipalIds: ["agent-finance-ops", "svc-finance-reconcile"],
      reviewMatchedGrantPathIds: ["grant.finance.payments.ops", "policy.secret.finance.reconcile"],
      futureSecretResolveDecision: "allow",
      futurePolicyReasonCode: "secret_grant_active",
      inFlightExecutionImpact: "unchanged",
      requiredAuditEventTypes: ["governance.secret.grants.reviewed"],
      requiredAuditFields: [
        "workspaceId",
        "scope.kind",
        "scope.id",
        "principal.id",
        "grantPath.id",
      ],
    },
  },
  {
    schemaVersion: ENTERPRISE_SECRET_ACCESS_GOVERNANCE_SCHEMA_VERSION,
    ticketKey: "CONCLAW-53",
    scenarioId: "revoke-workspace-principal-secret-grant",
    testCase: "revocation-blocks-future-secret-requests",
    title: "Revoking a grant blocks future mediated secret requests in revoked scope",
    reviewFilter: {
      workspaceId: "ws-finance",
      principal: {
        type: "agent",
        id: "agent-finance-ops",
      },
      scope: {
        kind: "secret",
        id: "secret:ws-finance:payments/settlement-api-key",
      },
    },
    revocationRequest: {
      workspaceId: "ws-finance",
      principal: {
        type: "agent",
        id: "agent-finance-ops",
      },
      scope: {
        kind: "secret",
        id: "secret:ws-finance:payments/settlement-api-key",
      },
      grantPath: {
        kind: "direct-grant",
        id: "grant.finance.payments.ops",
      },
      revokeReasonCode: "principal_compromised",
      effectWindow: "future-only",
      requestedBy: {
        type: "secrets-admin",
        id: "user-security-admin",
      },
    },
    expected: {
      reviewMatchedPrincipalIds: ["agent-finance-ops"],
      reviewMatchedGrantPathIds: ["grant.finance.payments.ops"],
      futureSecretResolveDecision: "deny",
      futurePolicyReasonCode: "secret_grant_revoked",
      inFlightExecutionImpact: "unchanged",
      requiredAuditEventTypes: ["governance.secret.grants.revoked", "governance.secret.denied"],
      requiredAuditFields: [
        "workspaceId",
        "principal.id",
        "scope.id",
        "grantPath.id",
        "revocation.requestedBy.id",
        "revocation.effectWindow",
      ],
    },
  },
  {
    schemaVersion: ENTERPRISE_SECRET_ACCESS_GOVERNANCE_SCHEMA_VERSION,
    ticketKey: "CONCLAW-53",
    scenarioId: "revoke-secret-class-policy-path-with-audit-context",
    testCase: "revocation-produces-investigable-audit-context",
    title: "Revocation of secret-class policy path includes investigation-grade audit context",
    reviewFilter: {
      workspaceId: "ws-support",
      principal: {
        type: "service-account",
        id: "svc-support-automation",
      },
      scope: {
        kind: "secret-class",
        id: "class:credential/support",
      },
    },
    revocationRequest: {
      workspaceId: "ws-support",
      principal: {
        type: "service-account",
        id: "svc-support-automation",
      },
      scope: {
        kind: "secret-class",
        id: "class:credential/support",
      },
      grantPath: {
        kind: "policy-rule",
        id: "policy.secret.support.automation",
      },
      revokeReasonCode: "overprivileged_scope",
      effectWindow: "live-and-future",
      requestedBy: {
        type: "secrets-admin",
        id: "user-security-admin",
      },
    },
    expected: {
      reviewMatchedPrincipalIds: ["svc-support-automation"],
      reviewMatchedGrantPathIds: ["policy.secret.support.automation"],
      futureSecretResolveDecision: "deny",
      futurePolicyReasonCode: "secret_policy_path_revoked",
      inFlightExecutionImpact: "terminated",
      requiredAuditEventTypes: [
        "governance.secret.grants.revoked",
        "governance.secret.policy.revoked",
        "governance.audit.investigation.context",
      ],
      requiredAuditFields: [
        "workspaceId",
        "principal.type",
        "principal.id",
        "scope.kind",
        "scope.id",
        "grantPath.kind",
        "grantPath.id",
        "revocation.revokeReasonCode",
        "revocation.effectWindow",
        "revocation.requestedBy.id",
      ],
    },
  },
] as const satisfies readonly EnterpriseSecretAccessGovernanceScenarioCase[];

export function listConclaw53SecretAccessGovernanceScenarioIds(): string[] {
  return CONCLAW_53_ENTERPRISE_SECRET_ACCESS_GOVERNANCE_SCENARIOS.map(
    (scenario) => scenario.scenarioId,
  );
}

export function getConclaw53SecretAccessGovernanceScenario(
  scenarioId: string,
): EnterpriseSecretAccessGovernanceScenarioCase | null {
  return (
    CONCLAW_53_ENTERPRISE_SECRET_ACCESS_GOVERNANCE_SCENARIOS.find(
      (scenario) => scenario.scenarioId === scenarioId,
    ) ?? null
  );
}
