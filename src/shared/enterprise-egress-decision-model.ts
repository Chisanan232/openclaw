export const ENTERPRISE_EGRESS_DECISION_MODEL_SCHEMA_VERSION = "2026-04-19" as const;

export type EnterpriseDataClassification =
  | "public"
  | "internal"
  | "confidential"
  | "restricted"
  | "regulated";

export type EnterpriseDataClassificationHook =
  | "outbound.web.request"
  | "outbound.connector.call"
  | "outbound.saas.call"
  | "plugin.capability.broker"
  | "secret.broker.resolve";

export type EnterpriseDestinationKind = "hostname" | "service" | "connector" | "saas";

export type EnterpriseEgressDecisionResult = "allow" | "deny" | "conditional";

export type EnterpriseEgressDecisionReasonCode =
  | "destination_allowlist_match"
  | "destination_not_approved"
  | "classification_policy_denied"
  | "secret_scope_denied"
  | "approval_required"
  | "audit_required"
  | "default_deny";

export type EnterpriseEgressDecisionControl =
  | "require_approval"
  | "redact_payload"
  | "tokenize_payload"
  | "block_secret_binding"
  | "force_audit_enrichment";

export type EnterpriseEgressDecisionInput = {
  schemaVersion: typeof ENTERPRISE_EGRESS_DECISION_MODEL_SCHEMA_VERSION;
  hook: EnterpriseDataClassificationHook;
  workspaceId: string;
  principal: {
    type: "user" | "agent" | "service-account";
    id: string;
  };
  action: {
    id: string;
    operation: "read" | "write" | "execute" | "send";
  };
  destination: {
    kind: EnterpriseDestinationKind;
    id: string;
    attributes?: Record<string, string | number | boolean>;
  };
  resource: {
    id: string;
    type: "message" | "artifact" | "dataset" | "secret-reference" | "tool-output";
    classifications: EnterpriseDataClassification[];
    attributes?: Record<string, string | number | boolean>;
  };
  secretUse?: {
    referenced: boolean;
    secretId?: string;
    purpose?: string;
  };
  auditContext: {
    requestId: string;
    traceId?: string;
    sourceSurface: "gateway" | "cli" | "dashboard" | "api";
  };
};

export type EnterpriseEgressDecisionOutput = {
  schemaVersion: typeof ENTERPRISE_EGRESS_DECISION_MODEL_SCHEMA_VERSION;
  result: EnterpriseEgressDecisionResult;
  reasonCode: EnterpriseEgressDecisionReasonCode;
  rationale: string;
  requiredControls: EnterpriseEgressDecisionControl[];
  requiredAuditEventTypes: string[];
  policyEvidence: {
    policyId?: string;
    ruleId?: string;
    matchedAttributes: string[];
  };
};

export const ENTERPRISE_DATA_CLASSIFICATION_TOUCHPOINTS = [
  "outbound.web.request",
  "outbound.connector.call",
  "outbound.saas.call",
  "plugin.capability.broker",
  "secret.broker.resolve",
] as const satisfies readonly EnterpriseDataClassificationHook[];

export const ENTERPRISE_EGRESS_DECISION_REQUIRED_ATTRIBUTE_KEYS = [
  "workspaceId",
  "principal.id",
  "action.id",
  "destination.kind",
  "destination.id",
  "resource.id",
  "resource.type",
  "resource.classifications",
  "auditContext.requestId",
] as const;

export function collectEnterpriseEgressDecisionAttributeKeys(
  input: Pick<EnterpriseEgressDecisionInput, "destination" | "resource">,
): string[] {
  const keys = new Set<string>([
    "destination.kind",
    "destination.id",
    "resource.id",
    "resource.type",
  ]);

  const destinationAttributeKeys = Object.keys(input.destination.attributes ?? {}).toSorted(
    (a, b) => a.localeCompare(b),
  );
  for (const key of destinationAttributeKeys) {
    keys.add(`destination.attributes.${key}`);
  }

  const resourceAttributeKeys = Object.keys(input.resource.attributes ?? {}).toSorted((a, b) =>
    a.localeCompare(b),
  );
  for (const key of resourceAttributeKeys) {
    keys.add(`resource.attributes.${key}`);
  }

  return [...keys];
}

export const CONCLAW_39_SAMPLE_DECISIONS = [
  {
    schemaVersion: ENTERPRISE_EGRESS_DECISION_MODEL_SCHEMA_VERSION,
    result: "deny",
    reasonCode: "classification_policy_denied",
    rationale:
      "Restricted data cannot be sent to destination class outside approved workspace policy.",
    requiredControls: ["force_audit_enrichment"],
    requiredAuditEventTypes: ["governance.egress.denied", "governance.policy.denied"],
    policyEvidence: {
      policyId: "policy.egress.workspace.default",
      ruleId: "rule.restricted.block-untrusted-destination",
      matchedAttributes: ["workspaceId", "destination.kind", "resource.classifications"],
    },
  },
  {
    schemaVersion: ENTERPRISE_EGRESS_DECISION_MODEL_SCHEMA_VERSION,
    result: "conditional",
    reasonCode: "approval_required",
    rationale:
      "Confidential payload may proceed only with approval and payload redaction controls.",
    requiredControls: ["require_approval", "redact_payload", "force_audit_enrichment"],
    requiredAuditEventTypes: [
      "governance.egress.approval.required",
      "governance.policy.conditional",
    ],
    policyEvidence: {
      policyId: "policy.egress.workspace.finance",
      ruleId: "rule.confidential.partner-approval",
      matchedAttributes: [
        "workspaceId",
        "destination.attributes.trustTier",
        "resource.classifications",
      ],
    },
  },
] as const satisfies readonly EnterpriseEgressDecisionOutput[];
