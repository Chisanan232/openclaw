---
summary: "Enterprise planning contract for mediated secret broker access, scoped authorization, and SecretRef migration"
read_when:
  - Planning enterprise secret broker integration and policy hooks
  - Designing secret access mediation by principal, workspace, resource, and action
  - Mapping current SecretRef runtime behavior to broker-backed access patterns
title: "Secret Broker Contract"
---

# Secret broker contract

This page defines the enterprise planning contract for brokered secret access in ControlClaw.

ControlClaw secret access must move from broad in-process possession toward mediated broker usage with explicit scope, policy, and audit semantics.

This is a specification contract for architecture and implementation planning. It is not yet a runtime implementation toggle.

## Goal

Define a stable secret broker contract so later implementation tickets can:

- request secrets through a mediated access path
- enforce scope constraints by principal, workspace, resource, and action
- emit consistent audit events for approvals, denials, and materialization
- migrate existing SecretRef behavior without breaking ecosystem compatibility

## Contract scope

This contract applies to enterprise secret access requests triggered by:

- model provider credentials
- channel credentials
- plugin credentials
- tool credentials
- gateway auth and remote credentials
- runtime sandbox credential material when those fields are credential-bearing

Out of scope:

- direct credential storage backends and vault product selection
- transport-specific implementation details for any single secret manager
- replacing all SecretRef behavior in one phase

## Core model

### 1) Access is brokered, not ambient

Runtime components must not assume unrestricted access to plaintext secrets.

All secret reads in enterprise mode should flow through an explicit broker request contract.

### 2) Scope is explicit

Every request must carry scope dimensions:

- principal
- workspace
- resource
- action

Missing scope dimensions are contract-invalid unless the contract version explicitly marks them optional.

### 3) Policy and audit are first-class

Broker evaluation is policy-aware and audit-emitting by default.

A denied decision is a first-class outcome, not an exceptional transport failure.

## Request contract

Versioned request shape:

```json5
{
  protocolVersion: 1,
  requestId: "srq_01J...",
  issuedAt: "2026-04-18T00:00:00.000Z",
  context: {
    principal: {
      type: "user" | "service" | "agent" | "system",
      id: "principal-id",
      authnContext: {
        method: "token" | "password" | "proxy" | "session",
        sessionId: "optional-session-id",
      },
    },
    workspace: {
      id: "workspace-id",
      environment: "prod" | "staging" | "dev",
    },
    actor: {
      surface: "gateway" | "cli" | "dashboard" | "api",
      component: "component-name",
      hostId: "optional-host-id",
    },
  },
  target: {
    class: "provider" | "channel" | "plugin" | "gateway" | "sandbox",
    provider: "optional-provider-name",
    id: "logical-secret-id",
    path: "canonical-credential-path",
  },
  action: "resolve" | "materialize" | "sign" | "decrypt",
  usage: {
    reason: "short-human-readable-reason",
    ttlSeconds: 300,
    oneTime: true,
    allowCache: false,
  },
  constraints: {
    maxBytes: 65536,
    requiredTags: ["pci:allowed"],
    redactionLevel: "default" | "strict",
  },
}
```

### Required request semantics

- `requestId` must be unique per broker request.
- `target.path` must map to a known credential surface.
- `action` must be explicit; no implicit default action.
- `usage.reason` must be present for audit explainability.
- `usage.ttlSeconds` must be bounded by policy.

## Response contract

Versioned response shape:

```json5
{
  protocolVersion: 1,
  requestId: "srq_01J...",
  decision: {
    outcome: "allow" | "deny" | "error",
    code: "ALLOW" | "DENY_POLICY" | "DENY_SCOPE" | "BROKER_UNAVAILABLE",
    reason: "human-readable policy/runtime reason",
    evaluatedAt: "2026-04-18T00:00:00.500Z",
    policyVersion: "policy-bundle-version",
  },
  secret: {
    mode: "inline" | "reference" | "handle" | "none",
    value: "optional-secret-material",
    reference: "optional-broker-reference-id",
    expiresAt: "optional-expiry",
  },
  audit: {
    eventId: "audit-event-id",
    traceId: "optional-trace-id",
    emitted: true,
  },
}
```

### Required response semantics

- `decision.outcome` is always present.
- `secret.mode = "none"` for denied decisions.
- `decision.code` must come from a closed code set.
- `audit.eventId` must be emitted for both allow and deny outcomes when audit is enabled.

## Scoping rules

The minimum scope tuple is:

- principal id and type
- workspace id
- target class and id
- requested action

Policy may add optional dimensions such as:

- environment tier
- data-classification tags
- time-window constraints
- network-boundary assertions

Requests without required scope values are rejected as `DENY_SCOPE` before secret resolution.

## Relationship to existing SecretRef behavior

Current OpenClaw SecretRef behavior remains the compatibility baseline:

- `source: "env" | "file" | "exec"` object model
- active-surface filtering
- startup/reload fail-fast with last-known-good snapshot
- `secrets.reload` activation semantics

ControlClaw migration principle:

- keep SecretRef format and credential-surface compatibility
- route enterprise secret reads through broker-mediated adapters where policy/audit is required
- preserve additive rollout so existing non-broker SecretRef paths continue to function during migration windows

### SecretRef migration path

1. Preserve current SecretRef contract as compatibility input.
2. Introduce broker adapter seam at secret resolution boundary.
3. Add scope-rich request context from gateway and command surfaces.
4. Emit broker decision/audit events alongside existing diagnostics.
5. Move eligible credential classes from direct value materialization to broker reference/handle flows.

## Event model

The contract expects stable event classes:

- `secret.requested`
- `secret.allowed`
- `secret.denied`
- `secret.materialized`
- `secret.expired`
- `secret.broker.error`

Event payload minimum:

- `requestId`
- principal metadata
- workspace id
- target class/id/path
- action
- decision code
- timestamp

## Code touchpoint map for follow-up implementation

- `src/secrets/runtime.ts`
  - add broker adapter interface and contract translation layer
  - preserve existing snapshot semantics for compatibility
- `docs/gateway/secrets.md`
  - keep compatibility baseline and link enterprise broker mode behavior
- `docs/gateway/secrets-plan-contract.md`
  - align plan/apply semantics with broker-aware target classification where needed
- gateway request context and policy seams
  - pass principal/workspace/action context into secret requests

## Verification criteria for this contract

This spec is successful when later implementation tickets can:

- separate secret storage concerns from secret usage mediation
- use a stable request/response schema for policy and audit integration
- state principal/workspace/resource/action scope decisions explicitly
- map SecretRef compatibility behavior to broker adoption phases without ambiguous semantics

## Related docs

- [Secrets Management](/gateway/secrets)
- [Secrets Apply Plan Contract](/gateway/secrets-plan-contract)
- [Authentication](/gateway/authentication)
- [Gateway Security](/gateway/security)
