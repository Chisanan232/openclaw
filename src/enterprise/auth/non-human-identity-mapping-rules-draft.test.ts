import { describe, expect, it } from "vitest";
import {
  NON_HUMAN_DELEGATION_CONSTRAINTS,
  NON_HUMAN_IDENTITY_MAPPING_MODES,
  NON_HUMAN_IDENTITY_MAPPING_RULES,
  NON_HUMAN_IDENTITY_PRINCIPAL_TYPES,
  NON_HUMAN_IDENTITY_TOUCHPOINTS,
  NON_HUMAN_IMPERSONATION_GUARDRAILS,
} from "./non-human-identity-mapping-rules-draft.js";

describe("non human identity mapping rules draft", () => {
  it("keeps non-human principal and mapping enums stable", () => {
    expect(NON_HUMAN_IDENTITY_PRINCIPAL_TYPES).toEqual([
      "user",
      "service-account",
      "agent",
      "plugin",
    ]);

    expect(NON_HUMAN_IDENTITY_MAPPING_MODES).toEqual([
      "service-account-to-agent-session",
      "user-to-agent-delegation",
      "user-to-plugin-delegation",
      "service-account-to-plugin-delegation",
      "plugin-to-agent-execution",
    ]);
  });

  it("defines explicit mapping rules for service-account, agent, and plugin paths", () => {
    expect(NON_HUMAN_IDENTITY_MAPPING_RULES).toHaveLength(5);
    expect(NON_HUMAN_IDENTITY_MAPPING_RULES.every((rule) => rule.requiredClaims.length > 0)).toBe(
      true,
    );
    expect(NON_HUMAN_IDENTITY_MAPPING_RULES.every((rule) => rule.requiresDelegationChain)).toBe(
      true,
    );
    expect(
      NON_HUMAN_IDENTITY_MAPPING_RULES.some((rule) => rule.mode === "plugin-to-agent-execution"),
    ).toBe(true);
  });

  it("documents delegation constraints and impersonation guardrails", () => {
    expect(NON_HUMAN_DELEGATION_CONSTRAINTS).toEqual([
      "delegation-requires-explicit-source-principal",
      "delegation-chain-must-preserve-original-user-when-present",
      "delegation-must-remain-within-declared-org-and-workspace-boundary",
      "delegation-must-carry-approval-reference-for-sensitive-actions",
      "delegation-context-must-be-attached-to-audit-and-secret-events",
    ]);

    expect(NON_HUMAN_IMPERSONATION_GUARDRAILS).toEqual([
      "impersonation-is-disabled-by-default",
      "impersonation-requires-policy-and-audit-justification",
      "impersonation-cannot-drop-delegation-chain-claims",
      "impersonation-cannot-expand-scope-beyond-source-principal-grants",
    ]);
  });

  it("maps follow-up implementation touchpoints", () => {
    expect(NON_HUMAN_IDENTITY_TOUCHPOINTS.map((touchpoint) => touchpoint.path)).toEqual([
      "src/gateway",
      "src/agents",
      "src/plugins",
      "src/secrets",
      "src/audit",
    ]);
    expect(
      NON_HUMAN_IDENTITY_TOUCHPOINTS.every((touchpoint) => touchpoint.purpose.length > 0),
    ).toBe(true);
  });
});
