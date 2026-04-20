import { describe, expect, it } from "vitest";
import {
  collectEnterpriseEgressDecisionAttributeKeys,
  CONCLAW_39_SAMPLE_DECISIONS,
  ENTERPRISE_DATA_CLASSIFICATION_TOUCHPOINTS,
  ENTERPRISE_EGRESS_DECISION_REQUIRED_ATTRIBUTE_KEYS,
} from "./enterprise-egress-decision-model.js";

describe("enterprise egress decision model (CONCLAW-39)", () => {
  it("defines stable data-classification hook coverage", () => {
    expect(ENTERPRISE_DATA_CLASSIFICATION_TOUCHPOINTS).toEqual([
      "outbound.web.request",
      "outbound.connector.call",
      "outbound.saas.call",
      "plugin.capability.broker",
      "secret.broker.resolve",
    ]);
  });

  it("publishes the minimum required decision attributes", () => {
    expect(ENTERPRISE_EGRESS_DECISION_REQUIRED_ATTRIBUTE_KEYS).toEqual([
      "workspaceId",
      "principal.id",
      "action.id",
      "destination.kind",
      "destination.id",
      "resource.id",
      "resource.type",
      "resource.classifications",
      "auditContext.requestId",
    ]);
  });

  it("collects destination and resource attributes deterministically", () => {
    expect(
      collectEnterpriseEgressDecisionAttributeKeys({
        destination: {
          kind: "service",
          id: "partner-api",
          attributes: {
            region: "us",
            trustTier: "external",
          },
        },
        resource: {
          id: "artifact-42",
          type: "artifact",
          classifications: ["confidential"],
          attributes: {
            containsPii: true,
            retentionDays: 30,
          },
        },
      }),
    ).toEqual([
      "destination.kind",
      "destination.id",
      "resource.id",
      "resource.type",
      "destination.attributes.region",
      "destination.attributes.trustTier",
      "resource.attributes.containsPii",
      "resource.attributes.retentionDays",
    ]);
  });

  it("includes auditable deny and conditional sample decisions", () => {
    expect(CONCLAW_39_SAMPLE_DECISIONS).toHaveLength(2);
    expect(CONCLAW_39_SAMPLE_DECISIONS[0]).toMatchObject({
      result: "deny",
      reasonCode: "classification_policy_denied",
      requiredAuditEventTypes: ["governance.egress.denied", "governance.policy.denied"],
    });
    expect(CONCLAW_39_SAMPLE_DECISIONS[1]).toMatchObject({
      result: "conditional",
      reasonCode: "approval_required",
      requiredControls: ["require_approval", "redact_payload", "force_audit_enrichment"],
    });
  });
});
