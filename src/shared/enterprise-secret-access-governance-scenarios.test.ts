import { describe, expect, it } from "vitest";
import {
  CONCLAW_53_ENTERPRISE_SECRET_ACCESS_GOVERNANCE_SCENARIOS,
  getConclaw53SecretAccessGovernanceScenario,
  listConclaw53SecretAccessGovernanceScenarioIds,
} from "./enterprise-secret-access-governance-scenarios.js";

describe("enterprise secret access governance scenarios (CONCLAW-53)", () => {
  it("registers stable, unique scenario ids", () => {
    const scenarioIds = listConclaw53SecretAccessGovernanceScenarioIds();
    expect(new Set(scenarioIds).size).toBe(scenarioIds.length);
    expect(scenarioIds).toEqual([
      "review-workspace-secret-principal-access",
      "revoke-workspace-principal-secret-grant",
      "revoke-secret-class-policy-path-with-audit-context",
    ]);
  });

  it("models review visibility by workspace and principal scope", () => {
    const reviewOnlyScenario = getConclaw53SecretAccessGovernanceScenario(
      "review-workspace-secret-principal-access",
    );
    expect(reviewOnlyScenario).not.toBeNull();
    expect(reviewOnlyScenario?.reviewFilter.workspaceId).toBe("ws-finance");
    expect(reviewOnlyScenario?.reviewFilter.principal).toBeUndefined();
    expect(reviewOnlyScenario?.expected.reviewMatchedPrincipalIds).toEqual([
      "agent-finance-ops",
      "svc-finance-reconcile",
    ]);
  });

  it("requires revocation to deny future mediated secret requests", () => {
    const revokedGrantScenario = getConclaw53SecretAccessGovernanceScenario(
      "revoke-workspace-principal-secret-grant",
    );
    expect(revokedGrantScenario).not.toBeNull();
    expect(revokedGrantScenario?.revocationRequest?.effectWindow).toBe("future-only");
    expect(revokedGrantScenario?.expected.futureSecretResolveDecision).toBe("deny");
    expect(revokedGrantScenario?.expected.futurePolicyReasonCode).toBe("secret_grant_revoked");
    expect(revokedGrantScenario?.expected.requiredAuditEventTypes).toContain(
      "governance.secret.grants.revoked",
    );
  });

  it("keeps revocation audit context sufficient for investigations", () => {
    const policyPathRevocation = CONCLAW_53_ENTERPRISE_SECRET_ACCESS_GOVERNANCE_SCENARIOS.find(
      (scenario) => scenario.testCase === "revocation-produces-investigable-audit-context",
    );
    expect(policyPathRevocation).toBeDefined();
    expect(policyPathRevocation?.revocationRequest?.grantPath.kind).toBe("policy-rule");
    expect(policyPathRevocation?.expected.inFlightExecutionImpact).toBe("terminated");
    expect(policyPathRevocation?.expected.requiredAuditFields).toEqual(
      expect.arrayContaining([
        "workspaceId",
        "principal.id",
        "scope.id",
        "grantPath.id",
        "revocation.revokeReasonCode",
      ]),
    );
  });
});
