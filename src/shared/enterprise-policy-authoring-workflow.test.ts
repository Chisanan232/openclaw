import { describe, expect, it } from "vitest";
import {
  ENTERPRISE_POLICY_AUTHORING_SCENARIO_VERSION,
  activateValidatedPolicyDraft,
  createPolicyAuthoringActivationAuditRecord,
  savePolicyDraftWithoutActivation,
  summarizePolicyActivationImpact,
  validatePolicyDraftForActivation,
  type EnterprisePolicyActiveState,
  type EnterprisePolicyDraft,
} from "./enterprise-policy-authoring-workflow.js";

function buildDraft(overrides: Partial<EnterprisePolicyDraft> = {}): EnterprisePolicyDraft {
  return {
    schemaVersion: ENTERPRISE_POLICY_AUTHORING_SCENARIO_VERSION,
    draftId: "draft-ops-17",
    organizationId: "org-01",
    workspaceId: "ws-risk",
    layerScope: "workspace",
    versionLabel: "2026.04.21-risk-guard",
    createdBy: "user:policy-author-1",
    createdAt: "2026-04-21T09:00:00.000Z",
    updatedAt: "2026-04-21T09:10:00.000Z",
    entries: [
      {
        id: "entry-1",
        targetKey: "runner.exec.shell",
        effect: "deny",
        reasonCode: "security.block-shell-prod",
      },
      {
        id: "entry-2",
        targetKey: "connector.github.write",
        effect: "conditional",
        reasonCode: "approval.required",
      },
    ],
    ...overrides,
  };
}

function buildActivePolicy(
  overrides: Partial<EnterprisePolicyActiveState> = {},
): EnterprisePolicyActiveState {
  return {
    documentId: "org-01:policy:v4",
    version: 4,
    organizationId: "org-01",
    workspaceId: "ws-risk",
    layerScope: "workspace",
    entries: [
      {
        id: "entry-a",
        targetKey: "runner.exec.shell",
        effect: "allow",
        reasonCode: "legacy.allow",
      },
    ],
    activatedAt: "2026-04-20T08:00:00.000Z",
    activatedBy: "user:policy-admin-1",
    ...overrides,
  };
}

describe("enterprise policy authoring workflow (CONCLAW-51)", () => {
  it("allows saving draft changes without mutating active policy enforcement", () => {
    const active = buildActivePolicy();
    const saved = savePolicyDraftWithoutActivation({
      draft: buildDraft(),
      activePolicy: active,
    });
    expect(saved).toEqual({
      draftSaved: true,
      draftId: "draft-ops-17",
      activePolicyDocumentIdAtSave: "org-01:policy:v4",
      activePolicyVersionAtSave: 4,
    });
  });

  it("rejects malformed policy definitions before activation", () => {
    const draft = buildDraft({
      workspaceId: undefined,
      entries: [
        {
          id: "entry-1",
          targetKey: "",
          effect: "deny",
          reasonCode: "",
        },
        {
          id: "entry-2",
          targetKey: "runner.exec.shell",
          effect: "allow",
          reasonCode: "ops.allow",
        },
        {
          id: "entry-3",
          targetKey: "runner.exec.shell",
          effect: "deny",
          reasonCode: "ops.block",
        },
      ],
    });
    const validation = validatePolicyDraftForActivation({
      draft,
      checkedAt: "2026-04-21T09:20:00.000Z",
    });
    expect(validation.isValid).toBe(false);
    expect(validation.issues.map((issue) => issue.code)).toEqual([
      "invalid_workspace_scope",
      "missing_target_key",
      "duplicate_target_key",
    ]);

    const activation = activateValidatedPolicyDraft({
      draft,
      validation,
      activePolicy: buildActivePolicy(),
      activatedAt: "2026-04-21T09:30:00.000Z",
      activatedBy: "user:policy-admin-2",
    });
    expect(activation.allowed).toBe(false);
    expect(activation.code).toBe("validation_failed");
  });

  it("shows activation impact so reviewers can inspect enforcement changes", () => {
    const impact = summarizePolicyActivationImpact({
      activeEntries: buildActivePolicy().entries,
      draftEntries: buildDraft().entries,
    });
    expect(impact).toEqual({
      addedTargetKeys: ["connector.github.write"],
      removedTargetKeys: [],
      changedTargetKeys: ["runner.exec.shell"],
      totalEntryDelta: 1,
    });
  });

  it("activates a validated draft into a versioned active state with audit linkage", () => {
    const draft = buildDraft();
    const validation = validatePolicyDraftForActivation({
      draft,
      checkedAt: "2026-04-21T09:21:00.000Z",
    });
    const activation = activateValidatedPolicyDraft({
      draft,
      validation,
      activePolicy: buildActivePolicy(),
      activatedAt: "2026-04-21T09:40:00.000Z",
      activatedBy: "user:policy-admin-2",
    });
    expect(activation.allowed).toBe(true);
    if (!activation.allowed) {
      throw new Error("expected activation to succeed");
    }

    expect(activation.newActiveState.version).toBe(5);
    expect(activation.newActiveState.documentId).toBe("org-01:draft-ops-17:v5");
    const audit = createPolicyAuthoringActivationAuditRecord({
      draft,
      activeState: activation.newActiveState,
    });
    expect(audit).toEqual({
      eventType: "policy.authoring.activated",
      organizationId: "org-01",
      workspaceId: "ws-risk",
      draftId: "draft-ops-17",
      activeDocumentId: "org-01:draft-ops-17:v5",
      activeVersion: 5,
      activatedAt: "2026-04-21T09:40:00.000Z",
      activatedBy: "user:policy-admin-2",
      impactedTargetCount: 2,
    });
  });
});
