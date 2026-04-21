export const ENTERPRISE_TOKEN_SUBJECT_TYPES = [
  "user",
  "service-account",
  "agent",
  "system",
] as const;

export type EnterpriseTokenSubjectType = (typeof ENTERPRISE_TOKEN_SUBJECT_TYPES)[number];

export interface EnterpriseTokenClaimFieldDefinition {
  field: string;
  required: boolean;
  description: string;
}

export const ENTERPRISE_TOKEN_CLAIM_MODEL: readonly EnterpriseTokenClaimFieldDefinition[] = [
  {
    field: "sub",
    required: true,
    description: "Canonical principal id for the active subject.",
  },
  {
    field: "subjectType",
    required: true,
    description: "Normalized subject principal type for user, service-account, agent, or system.",
  },
  {
    field: "orgId",
    required: true,
    description: "Organization boundary scope for authorization and policy.",
  },
  {
    field: "workspaceId",
    required: false,
    description: "Workspace boundary scope for workspace-scoped actions.",
  },
  {
    field: "roles",
    required: true,
    description: "Resolved org/workspace role claims used in role-policy checks.",
  },
  {
    field: "scopes",
    required: true,
    description: "Method and capability scopes granted to the token.",
  },
  {
    field: "sessionId",
    required: true,
    description: "Session correlation id for runtime, approval, and audit linkage.",
  },
  {
    field: "requestId",
    required: true,
    description: "Per-request correlation id for replay-safe attribution.",
  },
  {
    field: "delegation",
    required: false,
    description: "Delegated actor chain claims for on-behalf-of execution.",
  },
  {
    field: "impersonation",
    required: false,
    description: "Impersonation metadata including original actor and policy justification.",
  },
] as const;

export const ENTERPRISE_SESSION_FIELDS_REUSED_FROM_ZERO_TRUST = [
  "actorPrincipalId",
  "actorPrincipalType",
  "subjectPrincipalId",
  "subjectPrincipalType",
  "orgId",
  "workspaceId",
  "sessionId",
  "requestId",
  "delegationChain",
  "authMethod",
] as const;

export const ENTERPRISE_SESSION_FIELDS_ADDITIONS = [
  "effectiveRoles",
  "originalRequestPrincipalId",
  "approvalBindingId",
  "impersonationReason",
  "executorPrincipalId",
  "auditCorrelationId",
] as const;

export interface EnterpriseImpersonationRule {
  id: string;
  description: string;
}

export const ENTERPRISE_IMPERSONATION_RULES: readonly EnterpriseImpersonationRule[] = [
  {
    id: "impersonation-requires-explicit-policy-decision",
    description: "Impersonation is allowed only with explicit policy decision and reason code.",
  },
  {
    id: "original-principal-must-be-retained",
    description:
      "Original request principal must remain attached for approval and audit attribution.",
  },
  {
    id: "impersonation-cannot-expand-effective-scope",
    description: "Effective scopes and roles cannot exceed grants of the original principal.",
  },
  {
    id: "impersonation-must-be-auditable",
    description: "Audit events must include impersonation marker, reason, and approval binding.",
  },
] as const;

export interface EnterprisePropagationExpectation {
  surface: "control-plane" | "runtime" | "approval" | "audit" | "admin-api";
  requiredContext: readonly string[];
}

export const ENTERPRISE_PROPAGATION_EXPECTATIONS: readonly EnterprisePropagationExpectation[] = [
  {
    surface: "control-plane",
    requiredContext: ["orgId", "workspaceId", "requestId", "subjectPrincipalId", "effectiveRoles"],
  },
  {
    surface: "runtime",
    requiredContext: [
      "sessionId",
      "requestId",
      "actorPrincipalId",
      "executorPrincipalId",
      "delegationChain",
    ],
  },
  {
    surface: "approval",
    requiredContext: [
      "requestId",
      "originalRequestPrincipalId",
      "subjectPrincipalId",
      "approvalBindingId",
      "impersonationReason",
    ],
  },
  {
    surface: "audit",
    requiredContext: [
      "requestId",
      "sessionId",
      "originalRequestPrincipalId",
      "executorPrincipalId",
      "auditCorrelationId",
    ],
  },
  {
    surface: "admin-api",
    requiredContext: ["orgId", "workspaceId", "effectiveRoles", "requestId"],
  },
] as const;

export interface EnterpriseTokenSessionTouchpoint {
  path:
    | "src/gateway/device-auth.ts"
    | "src/gateway/operator-scopes.ts"
    | "src/gateway/role-policy.ts"
    | "src/gateway/protocol/schema.ts"
    | "src/admin";
  purpose: string;
}

export const ENTERPRISE_TOKEN_SESSION_TOUCHPOINTS: readonly EnterpriseTokenSessionTouchpoint[] = [
  {
    path: "src/gateway/device-auth.ts",
    purpose: "Bind inbound token claims to canonical enterprise request context.",
  },
  {
    path: "src/gateway/operator-scopes.ts",
    purpose: "Resolve and constrain effective scopes for delegated and impersonated sessions.",
  },
  {
    path: "src/gateway/role-policy.ts",
    purpose: "Evaluate role and scope policy using original actor and delegated executor context.",
  },
  {
    path: "src/gateway/protocol/schema.ts",
    purpose:
      "Carry enterprise request/session context fields across control plane protocol payloads.",
  },
  {
    path: "src/admin",
    purpose: "Expose requester, approver, and executor identity context in admin and audit APIs.",
  },
] as const;
