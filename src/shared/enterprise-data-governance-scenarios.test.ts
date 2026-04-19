import { describe, expect, it } from "vitest";
import {
  CONCLAW_22_ENTERPRISE_GOVERNANCE_SCENARIOS,
  getConclaw22GovernanceScenario,
  listConclaw22GovernanceScenarioIds,
} from "./enterprise-data-governance-scenarios.js";

describe("enterprise data governance scenarios (CONCLAW-22)", () => {
  it("registers stable, unique scenario ids", () => {
    const scenarioIds = listConclaw22GovernanceScenarioIds();
    expect(new Set(scenarioIds).size).toBe(scenarioIds.length);
    expect(scenarioIds).toEqual([
      "workspace-allowed-destination-allow",
      "workspace-denied-destination-deny",
      "secret-exists-but-denied-for-principal-action",
      "outbound-deny-emits-traceable-governance-record",
    ]);
  });

  it("models workspace-specific destination access differences", () => {
    const comparisonCases = CONCLAW_22_ENTERPRISE_GOVERNANCE_SCENARIOS.filter(
      (scenario) => scenario.testCase === "workspace-destination-segmentation",
    );
    expect(comparisonCases).toHaveLength(2);

    const decisionsByWorkspace = Object.fromEntries(
      comparisonCases.map((scenario) => [scenario.request.workspaceId, scenario.expected.decision]),
    );
    expect(decisionsByWorkspace).toEqual({
      "ws-finance": "allow",
      "ws-support": "deny",
    });

    const destinations = comparisonCases.map((scenario) => scenario.request.destination?.id);
    expect(new Set(destinations).size).toBe(1);
  });

  it("keeps secret deny behavior explicit even when the secret exists", () => {
    const scenario = getConclaw22GovernanceScenario(
      "secret-exists-but-denied-for-principal-action",
    );
    expect(scenario).not.toBeNull();
    expect(scenario?.request.secretTarget?.exists).toBe(true);
    expect(scenario?.expected.decision).toBe("deny");
    expect(scenario?.expected.requiredAuditEventTypes).toContain("governance.secret.denied");
  });

  it("requires traceable audit events for denied outbound actions", () => {
    const outboundDeny = getConclaw22GovernanceScenario(
      "outbound-deny-emits-traceable-governance-record",
    );
    expect(outboundDeny).not.toBeNull();
    expect(outboundDeny?.expected.decision).toBe("deny");
    expect(outboundDeny?.expected.auditRequired).toBe(true);
    expect(outboundDeny?.expected.requiredAuditEventTypes).toEqual([
      "governance.outbound.denied",
      "governance.policy.denied",
    ]);
  });
});
