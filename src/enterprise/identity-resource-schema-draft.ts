export const ENTERPRISE_PRINCIPAL_TYPES = [
  "user",
  "agent",
  "service-account",
  "plugin",
  "node",
  "system",
] as const;

export type EnterprisePrincipalType = (typeof ENTERPRISE_PRINCIPAL_TYPES)[number];

export const ENTERPRISE_RESOURCE_TYPES = [
  "org",
  "workspace",
  "tool",
  "secret",
  "plugin",
  "artifact",
  "external-target",
] as const;

export type EnterpriseResourceType = (typeof ENTERPRISE_RESOURCE_TYPES)[number];

export type EnterpriseEntityType = EnterprisePrincipalType | EnterpriseResourceType;

export const ENTERPRISE_SCOPE_KINDS = ["org", "workspace"] as const;

export type EnterpriseScopeKind = (typeof ENTERPRISE_SCOPE_KINDS)[number];

export interface EnterpriseScopeRef {
  orgId: string;
  scopeKind: EnterpriseScopeKind;
  workspaceId?: string;
}

export interface EnterprisePrincipalRef extends EnterpriseScopeRef {
  principalType: EnterprisePrincipalType;
  principalId: string;
}

export interface EnterpriseResourceRef extends EnterpriseScopeRef {
  resourceType: EnterpriseResourceType;
  resourceId: string;
}

export interface BuildCanonicalEnterpriseIdInput {
  entityType: EnterpriseEntityType;
  orgId: string;
  workspaceId?: string;
  entityId: string;
}

const CANONICAL_ID_PATTERN =
  /^cc:(?<entityType>[a-z-]+):(?<orgId>[a-z0-9-]+):(?<scopeSegment>org|ws:[a-z0-9-]+):(?<entityId>[a-z0-9-]+)$/;

export function isCanonicalEnterpriseId(input: string): boolean {
  return CANONICAL_ID_PATTERN.test(input);
}

export function buildCanonicalEnterpriseId(input: BuildCanonicalEnterpriseIdInput): string {
  const scopeSegment = input.workspaceId ? `ws:${input.workspaceId}` : "org";
  return `cc:${input.entityType}:${input.orgId}:${scopeSegment}:${input.entityId}`;
}

export interface ParsedCanonicalEnterpriseId {
  entityType: EnterpriseEntityType;
  orgId: string;
  workspaceId?: string;
  entityId: string;
}

export function parseCanonicalEnterpriseId(input: string): ParsedCanonicalEnterpriseId | null {
  const match = CANONICAL_ID_PATTERN.exec(input);
  if (!match?.groups) {
    return null;
  }

  const { entityType, orgId, scopeSegment, entityId } = match.groups;
  const workspaceId = scopeSegment.startsWith("ws:") ? scopeSegment.slice(3) : undefined;

  return {
    entityType: entityType as EnterpriseEntityType,
    orgId,
    workspaceId,
    entityId,
  };
}

export interface EnterpriseCodeTouchpoint {
  area: "gateway" | "plugins" | "agents" | "secrets" | "ui";
  paths: readonly string[];
  purpose: string;
}

export const ENTERPRISE_CODE_TOUCHPOINTS: readonly EnterpriseCodeTouchpoint[] = [
  {
    area: "gateway",
    paths: ["src/gateway"],
    purpose: "Request context ingestion, auth/session normalization, and scope propagation.",
  },
  {
    area: "plugins",
    paths: ["src/plugins"],
    purpose: "Plugin identity declaration, delegated execution identity, and capability mediation.",
  },
  {
    area: "agents",
    paths: ["src/agents"],
    purpose:
      "Agent execution identity, delegated principal tracking, and runtime context propagation.",
  },
  {
    area: "secrets",
    paths: ["src/secrets"],
    purpose: "Workspace-scoped secret mediation and principal-aware secret access checks.",
  },
  {
    area: "ui",
    paths: ["ui/src/ui"],
    purpose: "Admin views and operations that expose org/workspace principal and resource context.",
  },
] as const;
