---
summary: "Shared ControlClaw admin API contract for dashboard and CLI enterprise workflows"
read_when:
  - You are designing enterprise admin APIs for dashboard and CLI surfaces
  - You are implementing CONCLAW-62 or dependent admin workflow tickets
title: "ControlClaw Admin API Contract"
---

# ControlClaw admin API contract

This document is the implementation artifact for `CONCLAW-62`.

It defines the shared control-plane admin API contract that dashboard and CLI workflows must use for enterprise administration.

## Goal and scope

This contract exists to prevent dashboard and CLI teams from implementing separate backend behavior or bypassing policy and audit flows.

This page defines:

- admin API capability map for identity, policy, approvals, audit, registry, and secret governance
- request and response expectations for interactive and automation clients
- centralized rules for authorization, audit emission, and error handling
- guidance for long-running actions, pagination, filtering, and structured outputs
- consumer mapping for dashboard and CLI integration boundaries

## Capability map

Shared admin API domains:

| Domain      | Core operations                                                                      | Typical consumers                                                  |
| ----------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| `identity`  | role binding, effective permission evaluation, org and workspace member governance   | dashboard admin pages, CLI admin identity commands                 |
| `policy`    | policy listing, diff, validation, simulation, apply, and version history             | dashboard policy editor, CLI policy workflows                      |
| `approvals` | queue listing, detail inspection, approve or reject decisions, escalation metadata   | dashboard approval queue, CLI approval actions                     |
| `audit`     | event search, timeline detail, export jobs, evidence retrieval                       | dashboard audit explorer, CLI audit exports                        |
| `registry`  | registry source management, admission policy checks, signature and provenance status | dashboard registry views, CLI registry governance                  |
| `secrets`   | SecretRef governance audit, provider health, rotation or remediation actions         | dashboard secret governance panels, CLI secret governance commands |

## Request and response expectations

### Request model

All admin API requests should include:

- actor context (resolved identity and role claims)
- scope context (`org`, optional `workspace`)
- deterministic operation id (`requestId`)
- optional idempotency key for mutating and retry-prone requests
- explicit client mode metadata (`interactive` or `automation`)

Canonical request envelope:

```json
{
  "requestId": "req_01H...",
  "idempotencyKey": "admin-policy-apply-2026-04-19",
  "clientMode": "automation",
  "scope": { "org": "default", "workspace": "wksp-prod" },
  "actor": { "subjectId": "user:ops-01", "roleIds": ["platform_admin"] },
  "payload": {}
}
```

### Response model

All admin API responses should provide:

- operation status
- structured result payload
- warnings and policy notes
- stable machine-readable error codes when unsuccessful

Canonical response envelope:

```json
{
  "ok": true,
  "requestId": "req_01H...",
  "result": {},
  "warnings": [],
  "meta": { "nextCursor": null, "durationMs": 23 }
}
```

Automation-safe failures:

```json
{
  "ok": false,
  "requestId": "req_01H...",
  "error": {
    "code": "AUTHORIZATION_DENIED",
    "message": "Actor is not allowed to approve for this scope",
    "details": { "requiredRole": "security_admin", "scope": "wksp-prod" }
  }
}
```

## Authorization, audit emission, and error rules

### Authorization rules

1. Authorization decisions must be centralized in control-plane policy evaluation, not duplicated in dashboard or CLI clients.
2. Scope evaluation must enforce tenant and workspace boundaries for every mutating call.
3. Role claims are authorization inputs, not authorization conclusions. The API remains the source of truth for allow or deny.

### Audit emission rules

1. Every mutating admin API call must emit a structured audit record.
2. Approval decisions must include actor, scope, decision, reason, and policy evidence metadata.
3. Audit emission failure behavior must be explicit: fail closed for governance-critical mutations.

### Error handling rules

Use stable error code families:

- `VALIDATION_*` for malformed input
- `AUTHENTICATION_*` for missing or invalid identity
- `AUTHORIZATION_*` for policy or role denies
- `CONFLICT_*` for version drift or idempotency conflicts
- `DEPENDENCY_*` for backend or provider outages
- `INTERNAL_*` for unclassified server faults

Do not branch client behavior on freeform error message text.

## Long-running actions, pagination, filtering, and structured output

### Long-running operations

For export, reconciliation, and admission scan workflows:

- return `202`-style accepted responses with operation handles
- expose status and result retrieval endpoints
- preserve idempotency for retried submit calls
- support cancellation when the operation type allows it

### Pagination and filtering

List endpoints should support:

- cursor-based pagination for large datasets
- deterministic sort options for stable automation use
- filter objects for scope, actor, action type, status, and time range

### Structured outputs

API contracts consumed by CLI and dashboard must:

- remain JSON-first and schema-documented
- keep field naming stable across equivalent views
- include machine-safe metadata (`nextCursor`, `totalApprox`, `durations`, and operation ids)

## Dashboard and CLI consumer mapping

| Consumer surface | Contract usage expectations                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------------------ |
| Dashboard        | Use shared admin API methods through a dedicated data-access layer; no surface-private admin endpoints |
| CLI              | Use the same shared admin API methods with automation-safe request shaping and JSON output passthrough |
| Both             | Reuse the same authorization, audit, pagination, and error semantics; no duplicated policy logic       |

## Anti-ad hoc rule

Dashboard and CLI implementation tickets should be rejected in review when they introduce private backend paths that bypass this contract model for identity, policy, approval, audit, registry, or secret governance.

## Dependencies and relationship notes

- Depends on `CONCLAW-58`, `CONCLAW-59`, `CONCLAW-48`, and `CONCLAW-50`
- Supports downstream dashboard and CLI implementation tickets that require shared admin APIs

## Verification checklist for this ticket

`CONCLAW-62` is satisfied when:

1. Dashboard and CLI planning can cite one shared admin API contract model.
2. Authorization and audit behavior is defined as centralized API behavior, not client behavior.
3. Long-running, paginated, and filterable workflows have explicit contract expectations.
4. Error handling semantics are stable and machine-readable for automation consumers.
