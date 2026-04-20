import { describe, expect, it } from "vitest";
import {
  TRUSTED_OPERATOR_ASSUMPTIONS_TO_REMOVE,
  ZERO_TRUST_AUTH_METHODS,
  ZERO_TRUST_GATEWAY_TOUCHPOINTS,
  ZERO_TRUST_PRINCIPAL_TYPES,
  ZERO_TRUST_PROPAGATION_REQUIREMENTS,
  ZERO_TRUST_PROPAGATION_SURFACES,
  ZERO_TRUST_TRUST_LEVELS,
} from "./zero-trust-auth-session-schema-draft.js";

describe("zero trust auth session schema draft", () => {
  it("keeps principal, trust, and auth method enums stable", () => {
    expect(ZERO_TRUST_PRINCIPAL_TYPES).toEqual([
      "user",
      "service-account",
      "agent",
      "plugin",
      "node",
      "system",
    ]);

    expect(ZERO_TRUST_TRUST_LEVELS).toEqual(["external", "managed-node", "system"]);

    expect(ZERO_TRUST_AUTH_METHODS).toEqual([
      "shared-secret",
      "trusted-proxy",
      "device-token",
      "m2m-token",
      "local-compat",
    ]);
  });

  it("defines required propagation surfaces", () => {
    expect(ZERO_TRUST_PROPAGATION_SURFACES).toEqual([
      "gateway-method",
      "tool-execution",
      "plugin-action",
      "node-command",
      "audit-approval",
    ]);
    expect(ZERO_TRUST_PROPAGATION_REQUIREMENTS).toHaveLength(5);
    expect(
      ZERO_TRUST_PROPAGATION_REQUIREMENTS.every(
        (requirement) => requirement.requiredContextFields.length > 0,
      ),
    ).toBe(true);

    const toolExecutionRequirement = ZERO_TRUST_PROPAGATION_REQUIREMENTS.find(
      (requirement) => requirement.surface === "tool-execution",
    );
    expect(toolExecutionRequirement?.requiredContextFields).toContain("delegationChain");

    const nodeCommandRequirement = ZERO_TRUST_PROPAGATION_REQUIREMENTS.find(
      (requirement) => requirement.surface === "node-command",
    );
    expect(nodeCommandRequirement?.requiredContextFields).toContain("nodeIdentityId");
  });

  it("enumerates trusted-operator assumptions to remove", () => {
    expect(TRUSTED_OPERATOR_ASSUMPTIONS_TO_REMOVE).toEqual([
      "localhost-implies-trusted-operator",
      "transport-origin-implies-authenticated-principal",
      "node-pairing-alone-is-sufficient-for-command-attribution",
      "internal-requests-can-skip-session-context",
      "delegated-plugin-actions-do-not-need-source-actor-attribution",
    ]);
  });

  it("maps required gateway touchpoints for migration", () => {
    expect(ZERO_TRUST_GATEWAY_TOUCHPOINTS.map((touchpoint) => touchpoint.path)).toEqual([
      "src/gateway/device-auth.ts",
      "src/gateway/role-policy.ts",
      "src/gateway/method-scopes.ts",
    ]);
    expect(
      ZERO_TRUST_GATEWAY_TOUCHPOINTS.every((touchpoint) => touchpoint.purpose.length > 0),
    ).toBe(true);
  });
});
