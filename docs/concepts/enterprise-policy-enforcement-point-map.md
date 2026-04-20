---
summary: "Canonical enterprise policy enforcement-point inventory for gateway, tools, plugins, secrets, and egress"
read_when:
  - You are implementing enterprise policy enforcement in gateway, agent, or plugin runtime flows
  - You need request-context requirements and policy-to-audit/approval attachment guidance
title: "Enterprise Policy Enforcement Point Map"
---

# Enterprise policy enforcement point map

## Goal

Define the canonical policy enforcement points that enterprise implementation
tickets must use for consistent authorization, approval integration, and audit
attachment across ControlClaw runtime surfaces.

## Scope

This map covers five action surfaces:

1. gateway methods
2. tool execution
3. plugin admission/activation actions
4. secret access resolution
5. outbound network egress

The canonical map model is implemented in:

- `src/shared/enterprise-policy-enforcement-map.ts`

## Enforcement-point inventory

`CONCLAW-36` defines one baseline enforcement point per required surface:

- `gateway-method-admission`
- `tool-call-pre-execution`
- `plugin-action-admission`
- `secret-access-resolution`
- `outbound-egress-policy-check`

Each point includes:

- runtime areas where policy hooks must be attached
- required request context fields
- required policy-decision attachment expectations
- approval reference requirement (`required`, `optional`, or `not_applicable`)
- audit event types that must be emitted with each decision
- bypass risk record with closure status and closure notes

## Required request context model

Every enforcement point requires a deterministic request context subset.

Common baseline context:

- `requestId`
- `actorId`
- `workspaceId`

Surface-specific context extends the baseline, for example:

- gateway: method id, channel origin, actor type, session id
- tool: run id, tool id, parameter summary, resource hints
- plugin: plugin id/version, action type, capability set
- secret: secret ref id, purpose, resolution path
- egress: destination host/port/protocol and egress reason

## Bypass and closure analysis

`CONCLAW-36` records bypass vectors and closure guidance directly in each
enforcement point so implementation tickets can track residual risk explicitly.

Current tracked follow-up themes:

- plugin/gateway identifier normalization gaps
- parameter/evidence redaction sequencing
- runtime capability drift after plugin admission
- secret fallback paths outside policy-mediated resolution
- subprocess egress metadata capture before process spawn

## Policy decision attachment guidance

At every enforcement point:

- `policyDecisionRef` is required
- audit event emission is required

Approval references vary by surface:

- outbound egress: required
- gateway/tool/plugin actions: optional (required for high-risk requests)
- secret resolution: not applicable by default

This attachment guidance is intended to align:

- policy enforcement tickets
- approval workflow tickets
- audit producer tickets

without introducing divergent assumptions per subsystem.

## Verification baseline

Acceptance checks are encoded in:

- `src/shared/enterprise-policy-enforcement-map.test.ts`

The test suite verifies:

- stable/unique enforcement-point IDs and required surface coverage
- non-empty policy decision + audit attachment metadata for each point
- deterministic required-context aggregation by surface
- tracked bypass follow-up visibility and closure-note presence

## Related

- [Enterprise Identity and Resource Model](/concepts/enterprise-identity-resource-model)
- [ControlClaw Audit Event Model](/concepts/controlclaw-audit-model)
