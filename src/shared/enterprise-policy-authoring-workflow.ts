export const ENTERPRISE_POLICY_AUTHORING_SCENARIO_VERSION = "2026-04-21" as const;

export type EnterprisePolicyAuthoringLayerScope = "organization" | "workspace";

export type EnterprisePolicyAuthoringEntry = {
  id: string;
  targetKey: string;
  effect: "allow" | "deny" | "conditional";
  reasonCode: string;
};

export type EnterprisePolicyDraft = {
  schemaVersion: typeof ENTERPRISE_POLICY_AUTHORING_SCENARIO_VERSION;
  draftId: string;
  organizationId: string;
  workspaceId?: string;
  layerScope: EnterprisePolicyAuthoringLayerScope;
  versionLabel: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  entries: EnterprisePolicyAuthoringEntry[];
};

export type EnterprisePolicyActiveState = {
  documentId: string;
  version: number;
  organizationId: string;
  workspaceId?: string;
  layerScope: EnterprisePolicyAuthoringLayerScope;
  entries: EnterprisePolicyAuthoringEntry[];
  activatedAt: string;
  activatedBy: string;
};

export type EnterprisePolicyValidationIssue = {
  code:
    | "empty_entries"
    | "duplicate_target_key"
    | "missing_target_key"
    | "missing_reason_code"
    | "invalid_workspace_scope";
  message: string;
  entryId?: string;
  targetKey?: string;
};

export type EnterprisePolicyValidationResult = {
  isValid: boolean;
  checkedAt: string;
  issues: EnterprisePolicyValidationIssue[];
};

export type EnterprisePolicyActivationImpact = {
  addedTargetKeys: string[];
  removedTargetKeys: string[];
  changedTargetKeys: string[];
  totalEntryDelta: number;
};

export type EnterprisePolicyDraftSaveResult = {
  draftSaved: true;
  draftId: string;
  activePolicyDocumentIdAtSave: string | null;
  activePolicyVersionAtSave: number | null;
};

export type EnterprisePolicyActivationResult =
  | {
      allowed: false;
      code: "validation_failed";
      message: string;
      validation: EnterprisePolicyValidationResult;
    }
  | {
      allowed: true;
      code: "ok";
      message: string;
      newActiveState: EnterprisePolicyActiveState;
      impact: EnterprisePolicyActivationImpact;
    };

export type EnterprisePolicyLifecycleAuditRecord = {
  eventType: "policy.authoring.activated";
  organizationId: string;
  workspaceId?: string;
  draftId: string;
  activeDocumentId: string;
  activeVersion: number;
  activatedAt: string;
  activatedBy: string;
  impactedTargetCount: number;
};

export function savePolicyDraftWithoutActivation(params: {
  draft: Pick<EnterprisePolicyDraft, "draftId">;
  activePolicy: Pick<EnterprisePolicyActiveState, "documentId" | "version"> | null;
}): EnterprisePolicyDraftSaveResult {
  return {
    draftSaved: true,
    draftId: params.draft.draftId,
    activePolicyDocumentIdAtSave: params.activePolicy?.documentId ?? null,
    activePolicyVersionAtSave: params.activePolicy?.version ?? null,
  };
}

export function validatePolicyDraftForActivation(params: {
  draft: Pick<EnterprisePolicyDraft, "layerScope" | "workspaceId" | "entries">;
  checkedAt: string;
}): EnterprisePolicyValidationResult {
  const issues: EnterprisePolicyValidationIssue[] = [];
  if (params.draft.entries.length === 0) {
    issues.push({
      code: "empty_entries",
      message: "policy draft must include at least one policy entry",
    });
  }

  if (params.draft.layerScope === "workspace" && !params.draft.workspaceId) {
    issues.push({
      code: "invalid_workspace_scope",
      message: "workspace-scoped drafts must include a workspace id",
    });
  }

  const seenTargets = new Set<string>();
  for (const entry of params.draft.entries) {
    const targetKey = entry.targetKey.trim();
    if (!targetKey) {
      issues.push({
        code: "missing_target_key",
        message: "policy entry target key cannot be empty",
        entryId: entry.id,
      });
      continue;
    }
    if (seenTargets.has(targetKey)) {
      issues.push({
        code: "duplicate_target_key",
        message: `duplicate policy target key: ${targetKey}`,
        entryId: entry.id,
        targetKey,
      });
    } else {
      seenTargets.add(targetKey);
    }
    if (!entry.reasonCode.trim()) {
      issues.push({
        code: "missing_reason_code",
        message: "policy entry reason code is required",
        entryId: entry.id,
        targetKey,
      });
    }
  }

  return {
    isValid: issues.length === 0,
    checkedAt: params.checkedAt,
    issues,
  };
}

function resolveEntrySignature(entry: EnterprisePolicyAuthoringEntry): string {
  return `${entry.effect}::${entry.reasonCode}`;
}

export function summarizePolicyActivationImpact(params: {
  activeEntries: EnterprisePolicyAuthoringEntry[];
  draftEntries: EnterprisePolicyAuthoringEntry[];
}): EnterprisePolicyActivationImpact {
  const activeByTarget = new Map<string, string>();
  const draftByTarget = new Map<string, string>();
  for (const entry of params.activeEntries) {
    activeByTarget.set(entry.targetKey, resolveEntrySignature(entry));
  }
  for (const entry of params.draftEntries) {
    draftByTarget.set(entry.targetKey, resolveEntrySignature(entry));
  }

  const addedTargetKeys: string[] = [];
  const removedTargetKeys: string[] = [];
  const changedTargetKeys: string[] = [];

  for (const [targetKey, draftSignature] of draftByTarget) {
    if (!activeByTarget.has(targetKey)) {
      addedTargetKeys.push(targetKey);
      continue;
    }
    if (activeByTarget.get(targetKey) !== draftSignature) {
      changedTargetKeys.push(targetKey);
    }
  }
  for (const targetKey of activeByTarget.keys()) {
    if (!draftByTarget.has(targetKey)) {
      removedTargetKeys.push(targetKey);
    }
  }

  addedTargetKeys.sort();
  removedTargetKeys.sort();
  changedTargetKeys.sort();

  return {
    addedTargetKeys,
    removedTargetKeys,
    changedTargetKeys,
    totalEntryDelta: params.draftEntries.length - params.activeEntries.length,
  };
}

export function activateValidatedPolicyDraft(params: {
  draft: EnterprisePolicyDraft;
  validation: EnterprisePolicyValidationResult;
  activePolicy: EnterprisePolicyActiveState | null;
  activatedAt: string;
  activatedBy: string;
}): EnterprisePolicyActivationResult {
  if (!params.validation.isValid) {
    return {
      allowed: false,
      code: "validation_failed",
      message: "policy activation blocked because validation failed",
      validation: params.validation,
    };
  }

  const impact = summarizePolicyActivationImpact({
    activeEntries: params.activePolicy?.entries ?? [],
    draftEntries: params.draft.entries,
  });
  const nextVersion = (params.activePolicy?.version ?? 0) + 1;
  const newActiveState: EnterprisePolicyActiveState = {
    documentId: `${params.draft.organizationId}:${params.draft.draftId}:v${nextVersion}`,
    version: nextVersion,
    organizationId: params.draft.organizationId,
    workspaceId: params.draft.workspaceId,
    layerScope: params.draft.layerScope,
    entries: params.draft.entries.map((entry) => ({ ...entry })),
    activatedAt: params.activatedAt,
    activatedBy: params.activatedBy,
  };

  return {
    allowed: true,
    code: "ok",
    message: "policy draft activated as a new immutable active version",
    newActiveState,
    impact,
  };
}

export function createPolicyAuthoringActivationAuditRecord(params: {
  draft: Pick<EnterprisePolicyDraft, "draftId" | "organizationId" | "workspaceId">;
  activeState: Pick<
    EnterprisePolicyActiveState,
    "documentId" | "version" | "activatedAt" | "activatedBy" | "entries"
  >;
}): EnterprisePolicyLifecycleAuditRecord {
  return {
    eventType: "policy.authoring.activated",
    organizationId: params.draft.organizationId,
    workspaceId: params.draft.workspaceId,
    draftId: params.draft.draftId,
    activeDocumentId: params.activeState.documentId,
    activeVersion: params.activeState.version,
    activatedAt: params.activeState.activatedAt,
    activatedBy: params.activeState.activatedBy,
    impactedTargetCount: params.activeState.entries.length,
  };
}
