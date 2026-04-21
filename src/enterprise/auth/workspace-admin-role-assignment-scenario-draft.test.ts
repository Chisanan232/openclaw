import { describe, expect, it } from "vitest";
import {
  WORKSPACE_ROLE_ASSIGNMENT_ACTIONS,
  WORKSPACE_ROLE_ASSIGNMENT_AUDIT_CONTEXT,
  WORKSPACE_ROLE_ASSIGNMENT_PRINCIPAL_TYPES,
  WORKSPACE_ROLE_ASSIGNMENT_RESTRICTIONS,
  WORKSPACE_ROLE_ASSIGNMENT_SUPPORTED_ROLES,
  WORKSPACE_ROLE_ASSIGNMENT_TOUCHPOINTS,
} from "./workspace-admin-role-assignment-scenario-draft.js";

describe("workspace admin role assignment scenario draft", () => {
  it("defines supported principal types and workspace roles", () => {
    expect(WORKSPACE_ROLE_ASSIGNMENT_PRINCIPAL_TYPES).toEqual(["user", "service-account"]);
    expect(WORKSPACE_ROLE_ASSIGNMENT_SUPPORTED_ROLES).toEqual([
      "workspace-viewer",
      "workspace-operator",
      "workspace-auditor",
      "workspace-admin",
    ]);
  });

  it("limits role assignment actions to workspace-scoped grant/remove flows", () => {
    expect(WORKSPACE_ROLE_ASSIGNMENT_ACTIONS).toHaveLength(4);
    expect(WORKSPACE_ROLE_ASSIGNMENT_ACTIONS.every((entry) => entry.workspaceScoped)).toBe(true);
    expect(
      WORKSPACE_ROLE_ASSIGNMENT_ACTIONS.some(
        (entry) => entry.action === "grant" && entry.principalType === "service-account",
      ),
    ).toBe(true);
  });

  it("documents anti-escalation restrictions", () => {
    expect(WORKSPACE_ROLE_ASSIGNMENT_RESTRICTIONS).toEqual([
      "cannot-assign-org-scoped-roles-from-workspace-admin-surface",
      "cannot-apply-role-change-without-explicit-workspace-target",
      "cannot-escalate-principal-outside-acting-admin-workspace",
      "cannot-omit-acting-admin-and-target-principal-attribution",
    ]);
  });

  it("requires attributable audit context", () => {
    expect(WORKSPACE_ROLE_ASSIGNMENT_AUDIT_CONTEXT.requiredFields).toEqual([
      "actingAdminPrincipalId",
      "actingAdminPrincipalType",
      "targetPrincipalId",
      "targetPrincipalType",
      "workspaceId",
      "role",
      "action",
      "requestId",
      "sessionId",
    ]);
  });

  it("maps admin, policy, audit, and plugin touchpoints", () => {
    expect(WORKSPACE_ROLE_ASSIGNMENT_TOUCHPOINTS.map((touchpoint) => touchpoint.path)).toEqual([
      "src/admin",
      "src/gateway/role-policy.ts",
      "src/audit",
      "src/plugins",
    ]);
    expect(
      WORKSPACE_ROLE_ASSIGNMENT_TOUCHPOINTS.every((touchpoint) => touchpoint.purpose.length > 0),
    ).toBe(true);
  });
});
