---
summary: "Canonical ControlClaw audit event taxonomy, schema, retention, replay, and producer map"
read_when:
  - Defining or implementing enterprise audit logging and replay in ControlClaw
title: "ControlClaw Audit Event Model"
---

# ControlClaw audit event model

## Goal

Define one internal audit contract so ControlClaw can emit, retain, and replay
policy, approval, secret, plugin, and execution events consistently across
gateway, runtime, plugin, and operator surfaces.

This page is the canonical model for `CONCLAW-19` and is intended for
engineering implementation work in follow-up tickets.

## Contract scope

This model covers:

- audit event categories and naming
- required envelope fields for all events
- evidence payload and redaction rules
- retention classes and replay guarantees
- producer-source mapping for current codebase surfaces

This model does not define storage engine implementation details.

## Canonical event envelope

Every emitted audit event must follow the same envelope.

```json
{
  "eventId": "01JWZQ2Q8V6X4Y93PSG0HEHWRN",
  "occurredAt": "2026-04-18T11:25:08.120Z",
  "ingestedAt": "2026-04-18T11:25:08.190Z",
  "category": "approval",
  "type": "approval.requested",
  "outcome": "pending",
  "severity": "info",
  "actor": {
    "kind": "user",
    "id": "user_123",
    "display": "bryant.liu@example.com"
  },
  "subject": {
    "kind": "command",
    "id": "cmd_abc123",
    "display": "node.system.run"
  },
  "resource": {
    "kind": "gateway.method",
    "id": "node.invoke",
    "display": "Gateway node invoke endpoint"
  },
  "tenant": {
    "orgId": "org_42",
    "projectId": "prod-control-plane"
  },
  "trace": {
    "requestId": "req_7f5f",
    "sessionId": "session_9981",
    "runId": "run_2433",
    "correlationId": "corr_028"
  },
  "policy": {
    "policyId": "policy_exec_001",
    "policyVersion": "2026-04-10",
    "decisionId": "dec_6718"
  },
  "evidence": [],
  "tags": ["gateway", "approval", "system-run"],
  "schemaVersion": "1.0.0"
}
```

### Required fields

All events must include:

- `eventId`: globally unique, immutable, stable replay key
- `occurredAt`: producer event time (UTC)
- `ingestedAt`: audit pipeline ingest time (UTC)
- `category`: one of the canonical categories below
- `type`: dotted event verb, namespaced by category
- `outcome`: `pending | allowed | denied | success | failure | error | skipped`
- `actor`, `subject`, and `resource`
- `trace.requestId` or `trace.correlationId` (both preferred)
- `schemaVersion`

## Canonical event categories

| Category    | Purpose                                                       | Example types                                                                   |
| ----------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `policy`    | policy evaluation and authorization decisions                 | `policy.evaluated`, `policy.denied`                                             |
| `approval`  | human or delegated approval lifecycle                         | `approval.requested`, `approval.resolved`, `approval.expired`                   |
| `secret`    | secret access, resolution, masking, and refusal               | `secret.resolve.attempt`, `secret.resolve.denied`                               |
| `plugin`    | plugin admission, load, enablement, and contract validation   | `plugin.admission.checked`, `plugin.activated`, `plugin.blocked`                |
| `execution` | run lifecycle and command/tool execution outcomes             | `execution.run.started`, `execution.tool.completed`, `execution.command.failed` |
| `gateway`   | control-plane request and response boundaries                 | `gateway.request.accepted`, `gateway.request.rejected`                          |
| `identity`  | identity, authentication, and role binding outcomes           | `identity.auth.succeeded`, `identity.role.denied`                               |
| `config`    | runtime control-plane config mutations with actor attribution | `config.updated`, `config.rollback.applied`                                     |

## Evidence payload rules

### Evidence object

Each evidence item must be structured and typed:

```json
{
  "kind": "command_output",
  "format": "text/plain",
  "hash": "sha256:4db5...",
  "sizeBytes": 10432,
  "redaction": "partial",
  "storageRef": "audit://evidence/2026/04/18/evt_01JW...",
  "inline": false
}
```

### Evidence requirements

- Evidence must be append-only once an event is ingested.
- Evidence should be externalized by `storageRef`; avoid large inline payloads.
- Inline evidence is only allowed for payloads up to `16 KiB`.
- Evidence larger than `16 KiB` must use `storageRef` with `hash` and
  `sizeBytes`.
- Secret values, access tokens, private keys, and raw credential material must
  never be stored in clear text evidence.
- Redaction must record intent with `redaction: none | partial | full`.
- Any evidence transformation must preserve `hash` provenance chain metadata.

## Retention and replay requirements

### Retention classes

| Class         | Applicable categories            | Minimum retention   |
| ------------- | -------------------------------- | ------------------- |
| `regulatory`  | `policy`, `approval`, `identity` | 2555 days (7 years) |
| `security`    | `secret`, `plugin`, `gateway`    | 365 days            |
| `operational` | `execution`, `config`            | 180 days            |

Retention windows are minimum defaults. Environment policy may increase
durations but must not shorten them below this baseline without an explicit
documented exception process.

### Replay contract

Replay must satisfy:

- deterministic ordering by `occurredAt`, then `eventId` as tiebreaker
- immutable event body for a given `eventId`
- idempotent re-ingestion by `eventId`
- correlation-preserving lookup by `trace.requestId`, `trace.runId`,
  `trace.sessionId`, and `trace.correlationId`
- replay filtering by `category`, `type`, `actor.id`, `subject.id`, and time
  range
- replay response integrity checks against evidence `hash` values

## Event source map for current codebase

The map below identifies expected producer surfaces for implementation phases.

| Surface                                         | Expected categories                                    | Candidate source areas                                                                                                               |
| ----------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| Gateway request handling                        | `gateway`, `policy`, `identity`                        | `src/gateway/server-methods.ts`, `src/gateway/server-request-context.ts`, `src/gateway/server.ts`                                    |
| Operator approvals and gated execution          | `approval`, `execution`, `policy`                      | `src/gateway/exec-approval-manager.ts`, `src/gateway/node-invoke-system-run-approval.ts`, `src/gateway/operator-approvals-client.ts` |
| Agent runtime and tool lifecycle                | `execution`, `policy`                                  | `src/agents/openclaw-tools.ts`, `src/agents/internal-events.ts`, `src/agents/subagent-lifecycle-events.ts`                           |
| Plugin admission and activation                 | `plugin`, `policy`                                     | `src/plugins/install.ts`, `src/plugins/manifest-registry.ts`, `src/plugins/runtime.ts`                                               |
| Secret resolution and secret-aware config paths | `secret`, `policy`                                     | `src/gateway/resolve-configured-secret-input-string.ts`, `src/gateway/secret-input-paths.ts`, `src/plugins/provider-auth-input.ts`   |
| Audit query and display surfaces                | `gateway`, `execution`, `approval`, `secret`, `plugin` | `src/gateway/control-ui.ts`, `src/gateway/control-ui-contract.ts`, `ui/src/ui/*`                                                     |

## Verification criteria

`CONCLAW-19` is complete when:

- downstream tasks emit against this single envelope and category contract
- evidence retention classes and replay guarantees are explicit and testable
- producer mapping is concrete enough for implementation tickets to assign code
  ownership
- SIEM and UI teams can depend on one canonical internal event schema

## Related

- [ControlClaw Audit Event Producer Map](/concepts/controlclaw-audit-producer-map)
- [ControlClaw Audit Investigation Scenario](/concepts/controlclaw-audit-investigation-scenario)
- [ControlClaw Audit Query and Retention Model](/concepts/controlclaw-audit-query-retention-model)
