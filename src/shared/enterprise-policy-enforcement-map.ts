export const ENTERPRISE_POLICY_ENFORCEMENT_MAP_SCHEMA_VERSION = "2026-04-20" as const;

export type EnterprisePolicyEnforcementSurface =
  | "gateway_method"
  | "tool_call"
  | "plugin_action"
  | "secret_access"
  | "outbound_egress";

export type EnterprisePolicyEnforcementStage =
  | "request_admission"
  | "pre_execution"
  | "post_execution";

export type EnterprisePolicyBypassSeverity = "high" | "medium" | "low";

export type EnterprisePolicyBypassClosureStatus = "closed" | "tracked_follow_up";

export type EnterprisePolicyBypassRisk = {
  id: string;
  risk: string;
  severity: EnterprisePolicyBypassSeverity;
  closureStatus: EnterprisePolicyBypassClosureStatus;
  closureNotes: string;
};

export type EnterprisePolicyDecisionAttachment = {
  policyDecisionRef: "required";
  approvalRef: "required" | "optional" | "not_applicable";
  auditEventTypes: string[];
};

export type EnterprisePolicyEnforcementPoint = {
  schemaVersion: typeof ENTERPRISE_POLICY_ENFORCEMENT_MAP_SCHEMA_VERSION;
  ticketKey: "CONCLAW-36";
  id: string;
  title: string;
  surface: EnterprisePolicyEnforcementSurface;
  stage: EnterprisePolicyEnforcementStage;
  runtimeAreas: string[];
  requiredContext: string[];
  decisionAttachment: EnterprisePolicyDecisionAttachment;
  bypassRisks: EnterprisePolicyBypassRisk[];
};

export const CONCLAW_36_ENFORCEMENT_POINTS = [
  {
    schemaVersion: ENTERPRISE_POLICY_ENFORCEMENT_MAP_SCHEMA_VERSION,
    ticketKey: "CONCLAW-36",
    id: "gateway-method-admission",
    title: "Gateway method admission policy check",
    surface: "gateway_method",
    stage: "request_admission",
    runtimeAreas: [
      "src/gateway/server.ts",
      "src/gateway/server-methods.ts",
      "src/gateway/server-request-context.ts",
    ],
    requiredContext: [
      "requestId",
      "sessionId",
      "actorId",
      "actorType",
      "workspaceId",
      "gatewayMethod",
      "originChannel",
    ],
    decisionAttachment: {
      policyDecisionRef: "required",
      approvalRef: "optional",
      auditEventTypes: ["gateway.request.accepted", "policy.evaluated", "policy.denied"],
    },
    bypassRisks: [
      {
        id: "gateway-method-untyped-plugin-method",
        risk: "Plugin-provided methods can bypass strict policy classification when method ids are not normalized.",
        severity: "high",
        closureStatus: "tracked_follow_up",
        closureNotes:
          "Follow-up implementation must normalize plugin method ids before scope resolution and reject unknown scope categories.",
      },
    ],
  },
  {
    schemaVersion: ENTERPRISE_POLICY_ENFORCEMENT_MAP_SCHEMA_VERSION,
    ticketKey: "CONCLAW-36",
    id: "tool-call-pre-execution",
    title: "Tool invocation pre-execution policy gate",
    surface: "tool_call",
    stage: "pre_execution",
    runtimeAreas: ["src/agents/openclaw-tools.ts", "src/agents/tool-policy.ts"],
    requiredContext: [
      "requestId",
      "runId",
      "actorId",
      "workspaceId",
      "toolId",
      "toolParameters",
      "resourceHints",
    ],
    decisionAttachment: {
      policyDecisionRef: "required",
      approvalRef: "optional",
      auditEventTypes: ["execution.tool.started", "policy.evaluated", "policy.denied"],
    },
    bypassRisks: [
      {
        id: "tool-parameter-redaction-gap",
        risk: "Policy evaluator can receive over-broad parameter payloads when sensitive keys are not pre-redacted.",
        severity: "medium",
        closureStatus: "tracked_follow_up",
        closureNotes:
          "Attach parameter redaction profile before policy evaluation and record hashed evidence for denied calls.",
      },
    ],
  },
  {
    schemaVersion: ENTERPRISE_POLICY_ENFORCEMENT_MAP_SCHEMA_VERSION,
    ticketKey: "CONCLAW-36",
    id: "plugin-action-admission",
    title: "Plugin admission and activation policy gate",
    surface: "plugin_action",
    stage: "pre_execution",
    runtimeAreas: [
      "src/plugins/install.ts",
      "src/plugins/runtime.ts",
      "src/plugins/manifest-registry.ts",
    ],
    requiredContext: [
      "requestId",
      "actorId",
      "workspaceId",
      "pluginId",
      "pluginVersion",
      "capabilitySet",
      "actionType",
    ],
    decisionAttachment: {
      policyDecisionRef: "required",
      approvalRef: "optional",
      auditEventTypes: ["plugin.admission.checked", "plugin.activated", "plugin.blocked"],
    },
    bypassRisks: [
      {
        id: "plugin-runtime-dynamic-capability-drift",
        risk: "Runtime capability drift after install can allow actions not covered at admission time.",
        severity: "high",
        closureStatus: "tracked_follow_up",
        closureNotes:
          "Re-evaluate policy at activation and deny capability deltas without an approved manifest update.",
      },
    ],
  },
  {
    schemaVersion: ENTERPRISE_POLICY_ENFORCEMENT_MAP_SCHEMA_VERSION,
    ticketKey: "CONCLAW-36",
    id: "secret-access-resolution",
    title: "Secret resolution policy mediation",
    surface: "secret_access",
    stage: "pre_execution",
    runtimeAreas: [
      "src/gateway/resolve-configured-secret-input-string.ts",
      "src/gateway/secret-input-paths.ts",
      "src/plugins/provider-auth-input.ts",
    ],
    requiredContext: [
      "requestId",
      "actorId",
      "actorType",
      "workspaceId",
      "secretRefId",
      "secretPurpose",
      "resolutionPath",
    ],
    decisionAttachment: {
      policyDecisionRef: "required",
      approvalRef: "not_applicable",
      auditEventTypes: ["secret.resolve.attempt", "secret.resolve.denied", "policy.denied"],
    },
    bypassRisks: [
      {
        id: "secret-ref-fallback-env-read",
        risk: "Legacy fallback paths can read environment secrets outside governed SecretRef resolution.",
        severity: "high",
        closureStatus: "tracked_follow_up",
        closureNotes:
          "Restrict fallback environment reads and route all secret material access through policy-mediated SecretRef handling.",
      },
    ],
  },
  {
    schemaVersion: ENTERPRISE_POLICY_ENFORCEMENT_MAP_SCHEMA_VERSION,
    ticketKey: "CONCLAW-36",
    id: "outbound-egress-policy-check",
    title: "Outbound network egress policy gate",
    surface: "outbound_egress",
    stage: "pre_execution",
    runtimeAreas: [
      "src/agents/tool-policy.ts",
      "src/infra/process-spawn.ts",
      "src/web/web-fetch.ts",
    ],
    requiredContext: [
      "requestId",
      "actorId",
      "workspaceId",
      "destinationHost",
      "destinationPort",
      "protocol",
      "egressReason",
    ],
    decisionAttachment: {
      policyDecisionRef: "required",
      approvalRef: "required",
      auditEventTypes: [
        "governance.outbound.allowed",
        "governance.outbound.denied",
        "policy.denied",
      ],
    },
    bypassRisks: [
      {
        id: "subprocess-egress-unclassified",
        risk: "Subprocess shells can initiate network access without explicit destination metadata capture.",
        severity: "high",
        closureStatus: "tracked_follow_up",
        closureNotes:
          "Introduce subprocess egress metadata extraction and enforce destination classification before spawn.",
      },
    ],
  },
] as const satisfies readonly EnterprisePolicyEnforcementPoint[];

export type Conclaw36EnforcementPointId = (typeof CONCLAW_36_ENFORCEMENT_POINTS)[number]["id"];

export function listConclaw36EnforcementPointIds(): Conclaw36EnforcementPointId[] {
  return CONCLAW_36_ENFORCEMENT_POINTS.map((point) => point.id);
}

export function getConclaw36EnforcementPoint(id: string): EnterprisePolicyEnforcementPoint | null {
  return CONCLAW_36_ENFORCEMENT_POINTS.find((point) => point.id === id) ?? null;
}

export function collectConclaw36RequiredContextBySurface(
  surface: EnterprisePolicyEnforcementSurface,
): string[] {
  const contextKeys = new Set<string>();
  for (const point of CONCLAW_36_ENFORCEMENT_POINTS) {
    if (point.surface !== surface) {
      continue;
    }
    for (const key of point.requiredContext) {
      contextKeys.add(key);
    }
  }
  return [...contextKeys].toSorted((a, b) => a.localeCompare(b));
}

export function listConclaw36BypassesNeedingFollowUp(): EnterprisePolicyBypassRisk[] {
  return CONCLAW_36_ENFORCEMENT_POINTS.flatMap((point) =>
    point.bypassRisks.filter((risk) => risk.closureStatus === "tracked_follow_up"),
  );
}
