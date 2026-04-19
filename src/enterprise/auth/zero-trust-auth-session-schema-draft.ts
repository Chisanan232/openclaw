export const ZERO_TRUST_PRINCIPAL_TYPES = [
  "user",
  "service-account",
  "agent",
  "plugin",
  "node",
  "system",
] as const;

export type ZeroTrustPrincipalType = (typeof ZERO_TRUST_PRINCIPAL_TYPES)[number];

export const ZERO_TRUST_TRUST_LEVELS = ["external", "managed-node", "system"] as const;

export type ZeroTrustTrustLevel = (typeof ZERO_TRUST_TRUST_LEVELS)[number];

export const ZERO_TRUST_AUTH_METHODS = [
  "shared-secret",
  "trusted-proxy",
  "device-token",
  "m2m-token",
  "local-compat",
] as const;

export type ZeroTrustAuthMethod = (typeof ZERO_TRUST_AUTH_METHODS)[number];

export interface ZeroTrustDelegationClaim {
  sourcePrincipalId: string;
  sourcePrincipalType: ZeroTrustPrincipalType;
  reason: string;
}

export interface ZeroTrustTokenClaims {
  sub: string;
  principalType: ZeroTrustPrincipalType;
  orgId: string;
  workspaceId?: string;
  roles: readonly string[];
  scopes: readonly string[];
  delegation?: ZeroTrustDelegationClaim;
  sessionId: string;
  requestId: string;
}

export interface ZeroTrustSessionContext {
  actorPrincipalId: string;
  actorPrincipalType: ZeroTrustPrincipalType;
  subjectPrincipalId: string;
  subjectPrincipalType: ZeroTrustPrincipalType;
  orgId: string;
  workspaceId?: string;
  trustLevel: ZeroTrustTrustLevel;
  authMethod: ZeroTrustAuthMethod;
  sessionId: string;
  requestId: string;
  policyContext: Record<string, string>;
}

export const ZERO_TRUST_PROPAGATION_SURFACES = [
  "gateway-method",
  "tool-execution",
  "plugin-action",
  "node-command",
  "audit-approval",
] as const;

export type ZeroTrustPropagationSurface = (typeof ZERO_TRUST_PROPAGATION_SURFACES)[number];

export interface ZeroTrustPropagationRequirement {
  surface: ZeroTrustPropagationSurface;
  requiredContextFields: readonly (keyof ZeroTrustSessionContext)[];
}

export const ZERO_TRUST_PROPAGATION_REQUIREMENTS: readonly ZeroTrustPropagationRequirement[] = [
  {
    surface: "gateway-method",
    requiredContextFields: [
      "actorPrincipalId",
      "actorPrincipalType",
      "orgId",
      "workspaceId",
      "authMethod",
      "requestId",
    ],
  },
  {
    surface: "tool-execution",
    requiredContextFields: [
      "subjectPrincipalId",
      "subjectPrincipalType",
      "orgId",
      "workspaceId",
      "policyContext",
      "requestId",
    ],
  },
  {
    surface: "plugin-action",
    requiredContextFields: [
      "actorPrincipalId",
      "subjectPrincipalId",
      "subjectPrincipalType",
      "orgId",
      "workspaceId",
      "requestId",
    ],
  },
  {
    surface: "node-command",
    requiredContextFields: [
      "actorPrincipalId",
      "actorPrincipalType",
      "orgId",
      "workspaceId",
      "trustLevel",
      "requestId",
    ],
  },
  {
    surface: "audit-approval",
    requiredContextFields: [
      "actorPrincipalId",
      "subjectPrincipalId",
      "orgId",
      "workspaceId",
      "sessionId",
      "requestId",
    ],
  },
] as const;

export const TRUSTED_OPERATOR_ASSUMPTIONS_TO_REMOVE = [
  "localhost-implies-trusted-operator",
  "transport-origin-implies-authenticated-principal",
  "node-pairing-alone-is-sufficient-for-command-attribution",
  "internal-requests-can-skip-session-context",
  "delegated-plugin-actions-do-not-need-source-actor-attribution",
] as const;

export type TrustedOperatorAssumptionToRemove =
  (typeof TRUSTED_OPERATOR_ASSUMPTIONS_TO_REMOVE)[number];

export interface ZeroTrustGatewayTouchpoint {
  path:
    | "src/gateway/device-auth.ts"
    | "src/gateway/role-policy.ts"
    | "src/gateway/method-scopes.ts";
  purpose: string;
}

export const ZERO_TRUST_GATEWAY_TOUCHPOINTS: readonly ZeroTrustGatewayTouchpoint[] = [
  {
    path: "src/gateway/device-auth.ts",
    purpose: "Normalize auth inputs and bind explicit principal claims to request context.",
  },
  {
    path: "src/gateway/role-policy.ts",
    purpose: "Apply role/scope policy against explicit actor and subject context.",
  },
  {
    path: "src/gateway/method-scopes.ts",
    purpose: "Enforce method-level scope checks using normalized zero-trust session context.",
  },
] as const;
