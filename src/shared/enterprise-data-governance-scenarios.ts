export const ENTERPRISE_DATA_GOVERNANCE_SCENARIO_SCHEMA_VERSION = "2026-04-19" as const;

export type EnterpriseGovernancePrincipalType = "user" | "agent" | "service-account";

export type EnterpriseGovernanceSurface = "outbound" | "secret";

export type EnterpriseGovernanceDecision = "allow" | "deny";

export type EnterpriseGovernanceDestination = {
  kind: "hostname" | "service";
  id: string;
};

export type EnterpriseGovernanceSecretTarget = {
  id: string;
  exists: boolean;
};

export type EnterpriseGovernanceRequest = {
  workspaceId: string;
  principal: {
    type: EnterpriseGovernancePrincipalType;
    id: string;
  };
  surface: EnterpriseGovernanceSurface;
  action: string;
  destination?: EnterpriseGovernanceDestination;
  secretTarget?: EnterpriseGovernanceSecretTarget;
};

export type EnterpriseGovernanceExpectation = {
  decision: EnterpriseGovernanceDecision;
  policyReasonCode: string;
  auditRequired: boolean;
  requiredAuditEventTypes: string[];
};

export type EnterpriseGovernanceScenarioCase = {
  schemaVersion: typeof ENTERPRISE_DATA_GOVERNANCE_SCENARIO_SCHEMA_VERSION;
  ticketKey: "CONCLAW-22";
  scenarioId: string;
  testCase: string;
  title: string;
  request: EnterpriseGovernanceRequest;
  expected: EnterpriseGovernanceExpectation;
};

export const CONCLAW_22_ENTERPRISE_GOVERNANCE_SCENARIOS = [
  {
    schemaVersion: ENTERPRISE_DATA_GOVERNANCE_SCENARIO_SCHEMA_VERSION,
    ticketKey: "CONCLAW-22",
    scenarioId: "workspace-allowed-destination-allow",
    testCase: "workspace-destination-segmentation",
    title: "Workspace finance can access approved settlement destination",
    request: {
      workspaceId: "ws-finance",
      principal: {
        type: "agent",
        id: "agent-finance-ops",
      },
      surface: "outbound",
      action: "outbound.request",
      destination: {
        kind: "hostname",
        id: "settlement.internal.example",
      },
    },
    expected: {
      decision: "allow",
      policyReasonCode: "destination_allowlist_match",
      auditRequired: true,
      requiredAuditEventTypes: ["governance.outbound.allowed"],
    },
  },
  {
    schemaVersion: ENTERPRISE_DATA_GOVERNANCE_SCENARIO_SCHEMA_VERSION,
    ticketKey: "CONCLAW-22",
    scenarioId: "workspace-denied-destination-deny",
    testCase: "workspace-destination-segmentation",
    title: "Workspace support is denied the same settlement destination",
    request: {
      workspaceId: "ws-support",
      principal: {
        type: "agent",
        id: "agent-support-ops",
      },
      surface: "outbound",
      action: "outbound.request",
      destination: {
        kind: "hostname",
        id: "settlement.internal.example",
      },
    },
    expected: {
      decision: "deny",
      policyReasonCode: "workspace_destination_denied",
      auditRequired: true,
      requiredAuditEventTypes: ["governance.outbound.denied", "governance.policy.denied"],
    },
  },
  {
    schemaVersion: ENTERPRISE_DATA_GOVERNANCE_SCENARIO_SCHEMA_VERSION,
    ticketKey: "CONCLAW-22",
    scenarioId: "secret-exists-but-denied-for-principal-action",
    testCase: "secret-access-deny-even-when-secret-exists",
    title: "Secret access can be denied by principal and action even when secret exists",
    request: {
      workspaceId: "ws-finance",
      principal: {
        type: "agent",
        id: "agent-finance-ops",
      },
      surface: "secret",
      action: "secret.resolve",
      secretTarget: {
        id: "secret:ws-finance:payments/settlement-api-key",
        exists: true,
      },
    },
    expected: {
      decision: "deny",
      policyReasonCode: "secret_action_not_permitted",
      auditRequired: true,
      requiredAuditEventTypes: ["governance.secret.denied", "governance.policy.denied"],
    },
  },
  {
    schemaVersion: ENTERPRISE_DATA_GOVERNANCE_SCENARIO_SCHEMA_VERSION,
    ticketKey: "CONCLAW-22",
    scenarioId: "outbound-deny-emits-traceable-governance-record",
    testCase: "outbound-deny-audit-traceability",
    title: "Denied outbound actions must emit traceable governance records",
    request: {
      workspaceId: "ws-finance",
      principal: {
        type: "agent",
        id: "agent-finance-ops",
      },
      surface: "outbound",
      action: "outbound.request",
      destination: {
        kind: "service",
        id: "external-transfer-api",
      },
    },
    expected: {
      decision: "deny",
      policyReasonCode: "destination_not_approved",
      auditRequired: true,
      requiredAuditEventTypes: ["governance.outbound.denied", "governance.policy.denied"],
    },
  },
] as const satisfies readonly EnterpriseGovernanceScenarioCase[];

export function listConclaw22GovernanceScenarioIds(): string[] {
  return CONCLAW_22_ENTERPRISE_GOVERNANCE_SCENARIOS.map((scenario) => scenario.scenarioId);
}

export function getConclaw22GovernanceScenario(
  scenarioId: string,
): EnterpriseGovernanceScenarioCase | null {
  return (
    CONCLAW_22_ENTERPRISE_GOVERNANCE_SCENARIOS.find(
      (scenario) => scenario.scenarioId === scenarioId,
    ) ?? null
  );
}
