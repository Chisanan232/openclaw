export const ENTERPRISE_POLICY_DECISION_SCHEMA_VERSION = "2026-04-17" as const;

export type EnterprisePolicyDecisionResult = "allow" | "deny" | "conditional";

export type EnterprisePolicySubjectType =
  | "operator"
  | "agent"
  | "plugin"
  | "gateway_client"
  | "node"
  | "service";

export type EnterprisePolicyActionCategory =
  | "tool.execute"
  | "plugin.activate"
  | "gateway.method"
  | "runtime.surface"
  | "external.target";

export type EnterprisePolicyResourceKind =
  | "tool"
  | "plugin"
  | "gateway_method"
  | "runtime_surface"
  | "external_target";

export type EnterprisePolicyReasonCode =
  | "allowlist_match"
  | "denylist_match"
  | "missing_scope"
  | "capability_not_registered"
  | "resource_restricted"
  | "parameter_restricted"
  | "plugin_disabled"
  | "default_deny";

export type EnterprisePolicySubject = {
  type: EnterprisePolicySubjectType;
  id: string;
  tenantId?: string;
  roleIds?: string[];
  attributes?: Record<string, string | number | boolean>;
};

export type EnterprisePolicyAction = {
  category: EnterprisePolicyActionCategory;
  id: string;
  parameters?: Record<string, unknown>;
};

export type EnterprisePolicyResource = {
  kind: EnterprisePolicyResourceKind;
  id: string;
  ownerPluginId?: string;
  attributes?: Record<string, unknown>;
};

export type EnterprisePolicyContext = {
  requestId: string;
  sessionKey?: string;
  channelId?: string;
  agentId?: string;
  source?: "interactive" | "automation" | "system";
  occurredAt?: string;
  extra?: Record<string, unknown>;
};

export type EnterprisePolicyRationale = {
  code: EnterprisePolicyReasonCode;
  message: string;
  matchedPolicyId?: string;
  matchedRuleId?: string;
  evidence?: Record<string, unknown>;
};

export type EnterprisePolicyDecision = {
  schemaVersion: typeof ENTERPRISE_POLICY_DECISION_SCHEMA_VERSION;
  subject: EnterprisePolicySubject;
  action: EnterprisePolicyAction;
  resource: EnterprisePolicyResource;
  context: EnterprisePolicyContext;
  result: EnterprisePolicyDecisionResult;
  rationale: EnterprisePolicyRationale[];
};

export type EnterprisePolicyCheckTarget = {
  type: "action" | "resource" | "parameter";
  key: string;
};

export function collectEnterprisePolicyCheckTargets(
  decision: Pick<EnterprisePolicyDecision, "action" | "resource">,
): EnterprisePolicyCheckTarget[] {
  const targets: EnterprisePolicyCheckTarget[] = [
    {
      type: "action",
      key: `${decision.action.category}:${decision.action.id}`,
    },
    {
      type: "resource",
      key: `${decision.resource.kind}:${decision.resource.id}`,
    },
  ];

  const parameterKeys = Object.keys(decision.action.parameters ?? {}).toSorted((a, b) =>
    a.localeCompare(b),
  );
  for (const key of parameterKeys) {
    targets.push({
      type: "parameter",
      key: `${decision.action.id}:${key}`,
    });
  }
  return targets;
}

export const LEGACY_TOOL_POLICY_MAPPING = {
  allow: "explicit allowlist grant",
  deny: "explicit denylist block",
  ownerOnly: "subject role constraint (owner)",
  groupEntry: "capability set alias",
} as const;

export const LEGACY_GATEWAY_SCOPE_MAPPING = {
  "operator.read": "gateway.method:read",
  "operator.write": "gateway.method:write",
  "operator.admin": "gateway.method:admin",
  "operator.approvals": "gateway.method:approvals",
  "operator.pairing": "gateway.method:pairing",
  "operator.talk.secrets": "gateway.method:secrets",
} as const;

export const LEGACY_PLUGIN_CAPABILITY_MAPPING = {
  tools: "tool",
  channels: "runtime_surface",
  commands: "runtime_surface",
  mcpServers: "runtime_surface",
  providers: "external_target",
  hooks: "plugin",
  apps: "external_target",
  settings: "plugin",
} as const satisfies Record<string, EnterprisePolicyResourceKind>;

export function mapLegacyPluginCapability(capability: string): EnterprisePolicyResourceKind {
  if (capability in LEGACY_PLUGIN_CAPABILITY_MAPPING) {
    return LEGACY_PLUGIN_CAPABILITY_MAPPING[
      capability as keyof typeof LEGACY_PLUGIN_CAPABILITY_MAPPING
    ];
  }
  return "runtime_surface";
}
