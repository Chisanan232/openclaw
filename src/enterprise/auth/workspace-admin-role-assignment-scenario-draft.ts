export const WORKSPACE_ROLE_ASSIGNMENT_PRINCIPAL_TYPES = ["user", "service-account"] as const;

export type WorkspaceRoleAssignmentPrincipalType =
  (typeof WORKSPACE_ROLE_ASSIGNMENT_PRINCIPAL_TYPES)[number];

export const WORKSPACE_ROLE_ASSIGNMENT_SUPPORTED_ROLES = [
  "workspace-viewer",
  "workspace-operator",
  "workspace-auditor",
  "workspace-admin",
] as const;

export type WorkspaceRoleAssignmentSupportedRole =
  (typeof WORKSPACE_ROLE_ASSIGNMENT_SUPPORTED_ROLES)[number];

export interface WorkspaceRoleAssignmentAction {
  action: "grant" | "remove";
  principalType: WorkspaceRoleAssignmentPrincipalType;
  role: WorkspaceRoleAssignmentSupportedRole;
  workspaceScoped: true;
}

export const WORKSPACE_ROLE_ASSIGNMENT_ACTIONS: readonly WorkspaceRoleAssignmentAction[] = [
  {
    action: "grant",
    principalType: "user",
    role: "workspace-operator",
    workspaceScoped: true,
  },
  {
    action: "grant",
    principalType: "service-account",
    role: "workspace-operator",
    workspaceScoped: true,
  },
  {
    action: "remove",
    principalType: "user",
    role: "workspace-operator",
    workspaceScoped: true,
  },
  {
    action: "remove",
    principalType: "service-account",
    role: "workspace-operator",
    workspaceScoped: true,
  },
] as const;

export const WORKSPACE_ROLE_ASSIGNMENT_RESTRICTIONS = [
  "cannot-assign-org-scoped-roles-from-workspace-admin-surface",
  "cannot-apply-role-change-without-explicit-workspace-target",
  "cannot-escalate-principal-outside-acting-admin-workspace",
  "cannot-omit-acting-admin-and-target-principal-attribution",
] as const;

export type WorkspaceRoleAssignmentRestriction =
  (typeof WORKSPACE_ROLE_ASSIGNMENT_RESTRICTIONS)[number];

export interface WorkspaceRoleAssignmentAuditContext {
  requiredFields: readonly string[];
}

export const WORKSPACE_ROLE_ASSIGNMENT_AUDIT_CONTEXT: WorkspaceRoleAssignmentAuditContext = {
  requiredFields: [
    "actingAdminPrincipalId",
    "actingAdminPrincipalType",
    "targetPrincipalId",
    "targetPrincipalType",
    "workspaceId",
    "role",
    "action",
    "requestId",
    "sessionId",
  ],
} as const;

export interface WorkspaceRoleAssignmentTouchpoint {
  path: "src/admin" | "src/gateway/role-policy.ts" | "src/audit" | "src/plugins";
  purpose: string;
}

export const WORKSPACE_ROLE_ASSIGNMENT_TOUCHPOINTS: readonly WorkspaceRoleAssignmentTouchpoint[] = [
  {
    path: "src/admin",
    purpose: "Present workspace-scoped role assignment controls and guardrails.",
  },
  {
    path: "src/gateway/role-policy.ts",
    purpose: "Enforce workspace role mutation policy using acting-admin scope.",
  },
  {
    path: "src/audit",
    purpose: "Capture attributable role assignment events for later review.",
  },
  {
    path: "src/plugins",
    purpose: "Apply workspace-scoped role context to plugin capability mediation when relevant.",
  },
] as const;
