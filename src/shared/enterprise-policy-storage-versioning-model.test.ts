import { describe, expect, it } from "vitest";
import {
  ENTERPRISE_POLICY_ADMIN_OPERATIONS,
  buildPolicyRolloutPlan,
  canTransitionPolicyBundleState,
  checkPolicyActivation,
  checkPolicyRollback,
  resolvePolicyLayerPrecedence,
} from "./enterprise-policy-storage-versioning-model.js";

describe("enterprise policy storage/versioning model (CONCLAW-50)", () => {
  it("defines admin operations for draft, activation, and rollback lifecycle", () => {
    expect(ENTERPRISE_POLICY_ADMIN_OPERATIONS.map((entry) => entry.operationId)).toEqual([
      "create-draft-policy-bundle",
      "request-policy-review",
      "activate-policy-bundle",
      "rollback-active-policy-bundle",
    ]);
  });

  it("models policy state transitions for activation, supersession, and rollback", () => {
    expect(canTransitionPolicyBundleState({ from: "draft", to: "active" })).toBe(true);
    expect(canTransitionPolicyBundleState({ from: "active", to: "superseded" })).toBe(true);
    expect(canTransitionPolicyBundleState({ from: "active", to: "rolled_back" })).toBe(true);
    expect(canTransitionPolicyBundleState({ from: "rolled_back", to: "active" })).toBe(true);
    expect(canTransitionPolicyBundleState({ from: "superseded", to: "active" })).toBe(false);
  });

  it("enforces activation review and active-scope exclusivity checks", () => {
    const notApproved = checkPolicyActivation({
      candidate: {
        state: "draft",
        reviewState: "pending",
        layerScope: "organization",
        organizationId: "org-1",
      },
      existingActive: null,
    });
    expect(notApproved.allowed).toBe(false);
    expect(notApproved.code).toBe("review_not_approved");

    const activeExists = checkPolicyActivation({
      candidate: {
        state: "draft",
        reviewState: "approved",
        layerScope: "workspace",
        organizationId: "org-1",
        workspaceId: "ws-risk",
      },
      existingActive: {
        layerScope: "workspace",
        organizationId: "org-1",
        workspaceId: "ws-risk",
      },
    });
    expect(activeExists.allowed).toBe(false);
    expect(activeExists.code).toBe("active_bundle_exists");
  });

  it("requires scope-matched rollback candidates", () => {
    const mismatch = checkPolicyRollback({
      targetActive: {
        state: "active",
        layerScope: "workspace",
        organizationId: "org-1",
        workspaceId: "ws-risk",
      },
      rollbackCandidate: {
        state: "superseded",
        layerScope: "workspace",
        organizationId: "org-1",
        workspaceId: "ws-ops",
      },
    });
    expect(mismatch.allowed).toBe(false);
    expect(mismatch.code).toBe("scope_mismatch");

    const ok = checkPolicyRollback({
      targetActive: {
        state: "active",
        layerScope: "organization",
        organizationId: "org-1",
      },
      rollbackCandidate: {
        state: "rolled_back",
        layerScope: "organization",
        organizationId: "org-1",
      },
    });
    expect(ok.allowed).toBe(true);
    expect(ok.code).toBe("ok");
  });

  it("builds deterministic layering precedence and phased rollout schedules", () => {
    expect(resolvePolicyLayerPrecedence("org_only")).toEqual(["organization"]);
    expect(resolvePolicyLayerPrecedence("workspace_only")).toEqual(["workspace"]);
    expect(resolvePolicyLayerPrecedence("org_then_workspace")).toEqual([
      "organization",
      "workspace",
    ]);

    const plan = buildPolicyRolloutPlan({
      strategy: "phased",
      startedAt: "2026-04-21T08:00:00.000Z",
      phaseCount: 4,
      intervalMinutes: 30,
    });
    expect(plan.phases).toEqual([
      {
        sequence: 1,
        targetPercent: 25,
        scheduledAt: "2026-04-21T08:00:00.000Z",
      },
      {
        sequence: 2,
        targetPercent: 50,
        scheduledAt: "2026-04-21T08:30:00.000Z",
      },
      {
        sequence: 3,
        targetPercent: 75,
        scheduledAt: "2026-04-21T09:00:00.000Z",
      },
      {
        sequence: 4,
        targetPercent: 100,
        scheduledAt: "2026-04-21T09:30:00.000Z",
      },
    ]);
  });
});
