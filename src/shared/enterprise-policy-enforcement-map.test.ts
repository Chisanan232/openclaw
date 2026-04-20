import { describe, expect, it } from "vitest";
import {
  CONCLAW_36_ENFORCEMENT_POINTS,
  collectConclaw36RequiredContextBySurface,
  getConclaw36EnforcementPoint,
  listConclaw36BypassesNeedingFollowUp,
  listConclaw36EnforcementPointIds,
} from "./enterprise-policy-enforcement-map.js";

describe("enterprise policy enforcement map (CONCLAW-36)", () => {
  it("registers stable and unique enforcement point ids across required surfaces", () => {
    const ids = listConclaw36EnforcementPointIds();
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual([
      "gateway-method-admission",
      "tool-call-pre-execution",
      "plugin-action-admission",
      "secret-access-resolution",
      "outbound-egress-policy-check",
    ]);

    const surfaces = new Set(CONCLAW_36_ENFORCEMENT_POINTS.map((point) => point.surface));
    expect(surfaces).toEqual(
      new Set(["gateway_method", "tool_call", "plugin_action", "secret_access", "outbound_egress"]),
    );
  });

  it("defines required policy-decision and audit attachment metadata for every point", () => {
    for (const point of CONCLAW_36_ENFORCEMENT_POINTS) {
      expect(point.decisionAttachment.policyDecisionRef).toBe("required");
      expect(point.decisionAttachment.auditEventTypes.length).toBeGreaterThan(0);
      expect(point.runtimeAreas.length).toBeGreaterThan(0);
      expect(point.requiredContext.length).toBeGreaterThan(0);
    }
  });

  it("aggregates deterministic context keys per surface", () => {
    expect(collectConclaw36RequiredContextBySurface("gateway_method")).toEqual([
      "actorId",
      "actorType",
      "gatewayMethod",
      "originChannel",
      "requestId",
      "sessionId",
      "workspaceId",
    ]);
    expect(collectConclaw36RequiredContextBySurface("outbound_egress")).toEqual([
      "actorId",
      "destinationHost",
      "destinationPort",
      "egressReason",
      "protocol",
      "requestId",
      "workspaceId",
    ]);
  });

  it("tracks bypass risks with closure notes and follow-up visibility", () => {
    const followUps = listConclaw36BypassesNeedingFollowUp();
    expect(followUps.length).toBeGreaterThanOrEqual(5);
    for (const risk of followUps) {
      expect(risk.closureStatus).toBe("tracked_follow_up");
      expect(risk.closureNotes.length).toBeGreaterThan(10);
    }
  });

  it("returns null for unknown enforcement points", () => {
    expect(getConclaw36EnforcementPoint("unknown-point")).toBeNull();
  });
});
