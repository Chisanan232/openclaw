import { describe, expect, it } from "vitest";
import {
  ENTERPRISE_CODE_TOUCHPOINTS,
  ENTERPRISE_PRINCIPAL_TYPES,
  ENTERPRISE_RESOURCE_TYPES,
  buildCanonicalEnterpriseId,
  isCanonicalEnterpriseId,
  parseCanonicalEnterpriseId,
} from "./identity-resource-schema-draft.js";

describe("enterprise identity resource schema draft", () => {
  it("keeps canonical principal and resource types stable", () => {
    expect(ENTERPRISE_PRINCIPAL_TYPES).toEqual([
      "user",
      "agent",
      "service-account",
      "plugin",
      "node",
      "system",
    ]);

    expect(ENTERPRISE_RESOURCE_TYPES).toEqual([
      "org",
      "workspace",
      "tool",
      "secret",
      "plugin",
      "artifact",
      "external-target",
    ]);
  });

  it("builds and parses workspace-scoped canonical identifiers", () => {
    const canonicalId = buildCanonicalEnterpriseId({
      entityType: "service-account",
      orgId: "acme",
      workspaceId: "payments",
      entityId: "ci-bot",
    });

    expect(canonicalId).toBe("cc:service-account:acme:ws:payments:ci-bot");
    expect(isCanonicalEnterpriseId(canonicalId)).toBe(true);
    expect(parseCanonicalEnterpriseId(canonicalId)).toEqual({
      entityType: "service-account",
      orgId: "acme",
      workspaceId: "payments",
      entityId: "ci-bot",
    });
  });

  it("builds and parses org-scoped canonical identifiers", () => {
    const canonicalId = buildCanonicalEnterpriseId({
      entityType: "org",
      orgId: "acme",
      entityId: "platform",
    });

    expect(canonicalId).toBe("cc:org:acme:org:platform");
    expect(isCanonicalEnterpriseId(canonicalId)).toBe(true);
    expect(parseCanonicalEnterpriseId(canonicalId)).toEqual({
      entityType: "org",
      orgId: "acme",
      workspaceId: undefined,
      entityId: "platform",
    });
  });

  it("rejects non-canonical identifiers", () => {
    expect(isCanonicalEnterpriseId("service-account:acme:ws:payments:ci-bot")).toBe(false);
    expect(parseCanonicalEnterpriseId("cc:service-account:acme:ws:payments")).toBeNull();
    expect(isCanonicalEnterpriseId("cc:foobar:acme:org:platform")).toBe(false);
    expect(parseCanonicalEnterpriseId("cc:foobar:acme:org:platform")).toBeNull();
  });

  it("covers all required implementation touchpoint areas", () => {
    const areas = ENTERPRISE_CODE_TOUCHPOINTS.map((entry) => entry.area).toSorted();
    expect(areas).toEqual(["agents", "gateway", "plugins", "secrets", "ui"]);
    expect(ENTERPRISE_CODE_TOUCHPOINTS.every((entry) => entry.paths.length > 0)).toBe(true);
  });
});
