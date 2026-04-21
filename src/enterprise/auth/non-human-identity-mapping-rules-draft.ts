export const NON_HUMAN_IDENTITY_PRINCIPAL_TYPES = [
  "user",
  "service-account",
  "agent",
  "plugin",
] as const;

export type NonHumanIdentityPrincipalType = (typeof NON_HUMAN_IDENTITY_PRINCIPAL_TYPES)[number];

export const NON_HUMAN_IDENTITY_MAPPING_MODES = [
  "service-account-to-agent-session",
  "user-to-agent-delegation",
  "user-to-plugin-delegation",
  "service-account-to-plugin-delegation",
  "plugin-to-agent-execution",
] as const;

export type NonHumanIdentityMappingMode = (typeof NON_HUMAN_IDENTITY_MAPPING_MODES)[number];

export interface NonHumanIdentityMappingRule {
  mode: NonHumanIdentityMappingMode;
  sourcePrincipalType: NonHumanIdentityPrincipalType;
  targetPrincipalType: NonHumanIdentityPrincipalType;
  requiresDelegationChain: boolean;
  allowsImpersonation: boolean;
  requiredClaims: readonly string[];
}

export const NON_HUMAN_IDENTITY_MAPPING_RULES: readonly NonHumanIdentityMappingRule[] = [
  {
    mode: "service-account-to-agent-session",
    sourcePrincipalType: "service-account",
    targetPrincipalType: "agent",
    requiresDelegationChain: true,
    allowsImpersonation: false,
    requiredClaims: ["orgId", "workspaceId", "sessionId", "requestId", "scopeGrantId"],
  },
  {
    mode: "user-to-agent-delegation",
    sourcePrincipalType: "user",
    targetPrincipalType: "agent",
    requiresDelegationChain: true,
    allowsImpersonation: false,
    requiredClaims: ["orgId", "workspaceId", "sessionId", "requestId", "approvalId"],
  },
  {
    mode: "user-to-plugin-delegation",
    sourcePrincipalType: "user",
    targetPrincipalType: "plugin",
    requiresDelegationChain: true,
    allowsImpersonation: false,
    requiredClaims: ["orgId", "workspaceId", "requestId", "capabilityGrantId", "pluginId"],
  },
  {
    mode: "service-account-to-plugin-delegation",
    sourcePrincipalType: "service-account",
    targetPrincipalType: "plugin",
    requiresDelegationChain: true,
    allowsImpersonation: false,
    requiredClaims: ["orgId", "workspaceId", "requestId", "scopeGrantId", "pluginId"],
  },
  {
    mode: "plugin-to-agent-execution",
    sourcePrincipalType: "plugin",
    targetPrincipalType: "agent",
    requiresDelegationChain: true,
    allowsImpersonation: false,
    requiredClaims: ["orgId", "workspaceId", "requestId", "pluginId", "executorAgentId"],
  },
] as const;

export const NON_HUMAN_DELEGATION_CONSTRAINTS = [
  "delegation-requires-explicit-source-principal",
  "delegation-chain-must-preserve-original-user-when-present",
  "delegation-must-remain-within-declared-org-and-workspace-boundary",
  "delegation-must-carry-approval-reference-for-sensitive-actions",
  "delegation-context-must-be-attached-to-audit-and-secret-events",
] as const;

export type NonHumanDelegationConstraint = (typeof NON_HUMAN_DELEGATION_CONSTRAINTS)[number];

export const NON_HUMAN_IMPERSONATION_GUARDRAILS = [
  "impersonation-is-disabled-by-default",
  "impersonation-requires-policy-and-audit-justification",
  "impersonation-cannot-drop-delegation-chain-claims",
  "impersonation-cannot-expand-scope-beyond-source-principal-grants",
] as const;

export type NonHumanImpersonationGuardrail = (typeof NON_HUMAN_IMPERSONATION_GUARDRAILS)[number];

export interface NonHumanIdentityTouchpoint {
  path: "src/gateway" | "src/agents" | "src/plugins" | "src/secrets" | "src/audit";
  purpose: string;
}

export const NON_HUMAN_IDENTITY_TOUCHPOINTS: readonly NonHumanIdentityTouchpoint[] = [
  {
    path: "src/gateway",
    purpose: "Normalize principal mapping at gateway request ingress and method context setup.",
  },
  {
    path: "src/agents",
    purpose: "Persist caller/executor/delegated identity fields in runtime and session context.",
  },
  {
    path: "src/plugins",
    purpose: "Bind plugin principal identity to capability grants and delegated execution context.",
  },
  {
    path: "src/secrets",
    purpose: "Apply principal mapping model to secret access mediation and scope checks.",
  },
  {
    path: "src/audit",
    purpose: "Emit caller and delegated non-human identities in audit producer payloads.",
  },
] as const;
