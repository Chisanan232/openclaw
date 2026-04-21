export const ENTERPRISE_BOUNDARY_SCOPES = ["org", "workspace"] as const;

export type EnterpriseBoundaryScope = (typeof ENTERPRISE_BOUNDARY_SCOPES)[number];

export const ENTERPRISE_BOUNDARY_SUBSYSTEMS = [
  "gateway",
  "runtime-session",
  "plugin-execution",
  "secrets",
  "audit",
  "admin-ui",
] as const;

export type EnterpriseBoundarySubsystem = (typeof ENTERPRISE_BOUNDARY_SUBSYSTEMS)[number];

export interface EnterpriseBoundaryInvariant {
  id: string;
  description: string;
}

export const ENTERPRISE_BOUNDARY_INVARIANTS: readonly EnterpriseBoundaryInvariant[] = [
  {
    id: "org-scope-required-for-all-enterprise-requests",
    description:
      "Every enterprise request must resolve to exactly one org scope before side effects.",
  },
  {
    id: "workspace-scope-required-for-sensitive-operations",
    description:
      "Sensitive operations must include workspace scope and cannot rely on implicit defaults.",
  },
  {
    id: "cross-workspace-actions-require-explicit-policy-approval",
    description:
      "Cross-workspace actions must declare source and target workspaces plus explicit policy approval context.",
  },
  {
    id: "workspace-context-must-propagate-to-audit-and-secret-events",
    description:
      "Gateway/runtime workspace context must flow into audit and secret decision events without loss.",
  },
] as const;

export interface EnterpriseBoundarySensitiveOperation {
  operation: string;
  requiredScope: Extract<EnterpriseBoundaryScope, "workspace">;
  reason: string;
}

export const ENTERPRISE_BOUNDARY_SENSITIVE_OPERATIONS: readonly EnterpriseBoundarySensitiveOperation[] =
  [
    {
      operation: "secret-read",
      requiredScope: "workspace",
      reason: "Secret access must be isolated to a specific workspace boundary.",
    },
    {
      operation: "secret-write",
      requiredScope: "workspace",
      reason: "Secret mutation must remain tied to workspace ownership and audit context.",
    },
    {
      operation: "plugin-install",
      requiredScope: "workspace",
      reason: "Plugin installation changes runtime surface and must be workspace-scoped.",
    },
    {
      operation: "plugin-capability-grant",
      requiredScope: "workspace",
      reason: "Capability grants define execution authority and must map to a workspace.",
    },
    {
      operation: "runtime-command-dispatch",
      requiredScope: "workspace",
      reason:
        "Runtime command execution must preserve workspace ownership for attribution and policy.",
    },
  ] as const;

export interface EnterpriseBoundaryPropagationRequirement {
  subsystem: EnterpriseBoundarySubsystem;
  requiredContextFields: readonly string[];
}

export const ENTERPRISE_BOUNDARY_PROPAGATION_REQUIREMENTS: readonly EnterpriseBoundaryPropagationRequirement[] =
  [
    {
      subsystem: "gateway",
      requiredContextFields: ["orgId", "workspaceId", "requestId", "authMethod"],
    },
    {
      subsystem: "runtime-session",
      requiredContextFields: ["orgId", "workspaceId", "sessionId", "requestId"],
    },
    {
      subsystem: "plugin-execution",
      requiredContextFields: ["orgId", "workspaceId", "pluginId", "requestId"],
    },
    {
      subsystem: "secrets",
      requiredContextFields: ["orgId", "workspaceId", "requestId", "decisionId"],
    },
    {
      subsystem: "audit",
      requiredContextFields: ["orgId", "workspaceId", "requestId", "sessionId"],
    },
    {
      subsystem: "admin-ui",
      requiredContextFields: ["orgId", "workspaceId", "viewerRole"],
    },
  ] as const;
