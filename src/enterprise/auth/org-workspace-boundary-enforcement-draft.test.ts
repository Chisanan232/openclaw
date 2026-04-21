import { describe, expect, it } from "vitest";
import {
  ENTERPRISE_BOUNDARY_INVARIANTS,
  ENTERPRISE_BOUNDARY_PROPAGATION_REQUIREMENTS,
  ENTERPRISE_BOUNDARY_SCOPES,
  ENTERPRISE_BOUNDARY_SENSITIVE_OPERATIONS,
  ENTERPRISE_BOUNDARY_SUBSYSTEMS,
} from "./org-workspace-boundary-enforcement-draft.js";

describe("org workspace boundary enforcement draft", () => {
  it("keeps scope and subsystem enums stable", () => {
    expect(ENTERPRISE_BOUNDARY_SCOPES).toEqual(["org", "workspace"]);

    expect(ENTERPRISE_BOUNDARY_SUBSYSTEMS).toEqual([
      "gateway",
      "runtime-session",
      "plugin-execution",
      "secrets",
      "audit",
      "admin-ui",
    ]);
  });

  it("documents boundary invariants", () => {
    expect(ENTERPRISE_BOUNDARY_INVARIANTS).toHaveLength(4);
    expect(ENTERPRISE_BOUNDARY_INVARIANTS.every((invariant) => invariant.id.length > 0)).toBe(true);
    expect(
      ENTERPRISE_BOUNDARY_INVARIANTS.some(
        (invariant) => invariant.id === "cross-workspace-actions-require-explicit-policy-approval",
      ),
    ).toBe(true);
  });

  it("enumerates workspace-scoped sensitive operations", () => {
    expect(ENTERPRISE_BOUNDARY_SENSITIVE_OPERATIONS).toHaveLength(5);
    expect(
      ENTERPRISE_BOUNDARY_SENSITIVE_OPERATIONS.every(
        (operation) => operation.requiredScope === "workspace",
      ),
    ).toBe(true);
    expect(
      ENTERPRISE_BOUNDARY_SENSITIVE_OPERATIONS.map((operation) => operation.operation),
    ).toContain("runtime-command-dispatch");
  });

  it("defines context propagation requirements per subsystem", () => {
    expect(ENTERPRISE_BOUNDARY_PROPAGATION_REQUIREMENTS).toHaveLength(6);
    expect(
      ENTERPRISE_BOUNDARY_PROPAGATION_REQUIREMENTS.every(
        (requirement) => requirement.requiredContextFields.length > 0,
      ),
    ).toBe(true);

    const secretsRequirement = ENTERPRISE_BOUNDARY_PROPAGATION_REQUIREMENTS.find(
      (requirement) => requirement.subsystem === "secrets",
    );
    expect(secretsRequirement?.requiredContextFields).toContain("workspaceId");

    const auditRequirement = ENTERPRISE_BOUNDARY_PROPAGATION_REQUIREMENTS.find(
      (requirement) => requirement.subsystem === "audit",
    );
    expect(auditRequirement?.requiredContextFields).toContain("workspaceId");
  });
});
