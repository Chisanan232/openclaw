import { describe, expect, it } from "vitest";
import {
  ENTERPRISE_IMPERSONATION_RULES,
  ENTERPRISE_PROPAGATION_EXPECTATIONS,
  ENTERPRISE_SESSION_FIELDS_ADDITIONS,
  ENTERPRISE_SESSION_FIELDS_REUSED_FROM_ZERO_TRUST,
  ENTERPRISE_TOKEN_CLAIM_MODEL,
  ENTERPRISE_TOKEN_SESSION_TOUCHPOINTS,
  ENTERPRISE_TOKEN_SUBJECT_TYPES,
} from "./token-claims-session-propagation-draft.js";

describe("token claims session propagation draft", () => {
  it("keeps token subject types and claim fields stable", () => {
    expect(ENTERPRISE_TOKEN_SUBJECT_TYPES).toEqual(["user", "service-account", "agent", "system"]);

    expect(ENTERPRISE_TOKEN_CLAIM_MODEL.map((field) => field.field)).toEqual([
      "sub",
      "subjectType",
      "orgId",
      "workspaceId",
      "roles",
      "scopes",
      "sessionId",
      "requestId",
      "delegation",
      "impersonation",
    ]);
  });

  it("documents reused and enterprise-specific session fields", () => {
    expect(ENTERPRISE_SESSION_FIELDS_REUSED_FROM_ZERO_TRUST).toContain("delegationChain");
    expect(ENTERPRISE_SESSION_FIELDS_REUSED_FROM_ZERO_TRUST).toContain("requestId");

    expect(ENTERPRISE_SESSION_FIELDS_ADDITIONS).toContain("effectiveRoles");
    expect(ENTERPRISE_SESSION_FIELDS_ADDITIONS).toContain("originalRequestPrincipalId");
    expect(ENTERPRISE_SESSION_FIELDS_ADDITIONS).toContain("approvalBindingId");
  });

  it("defines impersonation and delegated-execution constraints", () => {
    expect(ENTERPRISE_IMPERSONATION_RULES).toHaveLength(4);
    expect(ENTERPRISE_IMPERSONATION_RULES.map((rule) => rule.id)).toContain(
      "impersonation-cannot-expand-effective-scope",
    );
  });

  it("defines propagation expectations across control plane, runtime, approval, and audit", () => {
    expect(ENTERPRISE_PROPAGATION_EXPECTATIONS).toHaveLength(5);
    expect(ENTERPRISE_PROPAGATION_EXPECTATIONS.map((expectation) => expectation.surface)).toEqual([
      "control-plane",
      "runtime",
      "approval",
      "audit",
      "admin-api",
    ]);

    const approvalExpectation = ENTERPRISE_PROPAGATION_EXPECTATIONS.find(
      (expectation) => expectation.surface === "approval",
    );
    expect(approvalExpectation?.requiredContext).toContain("originalRequestPrincipalId");

    const auditExpectation = ENTERPRISE_PROPAGATION_EXPECTATIONS.find(
      (expectation) => expectation.surface === "audit",
    );
    expect(auditExpectation?.requiredContext).toContain("executorPrincipalId");
  });

  it("maps implementation touchpoints for compatibility work", () => {
    expect(ENTERPRISE_TOKEN_SESSION_TOUCHPOINTS.map((touchpoint) => touchpoint.path)).toEqual([
      "src/gateway/device-auth.ts",
      "src/gateway/operator-scopes.ts",
      "src/gateway/role-policy.ts",
      "src/gateway/protocol/schema.ts",
      "src/admin",
    ]);
    expect(
      ENTERPRISE_TOKEN_SESSION_TOUCHPOINTS.every((touchpoint) => touchpoint.purpose.length > 0),
    ).toBe(true);
  });
});
