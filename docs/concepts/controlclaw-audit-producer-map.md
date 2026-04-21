---
summary: "Canonical subsystem-level producer map for ControlClaw audit events, emission timing, evidence fallback, and replay traceability"
read_when:
  - Implementing audit event producers in gateway, runtime, approvals, plugins, or secrets
title: "ControlClaw Audit Event Producer Map"
---

# ControlClaw audit event producer map

## Goal

Translate the ControlClaw audit taxonomy into a concrete producer map so
implementation work knows where each event class originates and how replay
coverage should be measured.

This page is the canonical producer map contract for `CONCLAW-38`.

## Scope and assumptions

This map defines:

- producer inventory by subsystem
- required event emission timing and required fields per producer
- fallback behavior when evidence is incomplete
- producer-to-replay trace mapping

It does not define storage engine internals or UI rendering behavior.

## Producer inventory by subsystem

| Subsystem                                 | Producer area                                                                                                                        | Primary categories                |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------- |
| Gateway request control-plane             | `src/gateway/server-methods.ts`, `src/gateway/server-request-context.ts`, `src/gateway/server.ts`                                    | `gateway`, `policy`, `identity`   |
| Runtime and tool execution                | `src/agents/openclaw-tools.ts`, `src/agents/internal-events.ts`, `src/agents/subagent-lifecycle-events.ts`                           | `execution`, `policy`             |
| Approval lifecycle                        | `src/gateway/exec-approval-manager.ts`, `src/gateway/node-invoke-system-run-approval.ts`, `src/gateway/operator-approvals-client.ts` | `approval`, `policy`, `execution` |
| Plugin admission and runtime flows        | `src/plugins/install.ts`, `src/plugins/manifest-registry.ts`, `src/plugins/runtime.ts`                                               | `plugin`, `policy`                |
| Secret broker and egress control surfaces | `src/gateway/resolve-configured-secret-input-string.ts`, `src/gateway/secret-input-paths.ts`, `src/plugins/provider-auth-input.ts`   | `secret`, `policy`, `gateway`     |

## Emission timing and required fields per producer

Each producer must emit events at the following lifecycle points.

| Producer stage                         | Emit timing                                    | Required event fields                                                                                    |
| -------------------------------------- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Request ingress accepted/rejected      | Immediately after ingress validation result    | `eventId`, `occurredAt`, `category=gateway`, `type`, `outcome`, `actor`, `resource`, `trace.requestId`   |
| Policy decision finalized              | Immediately when allow/deny is determined      | ingress fields + `category=policy`, `policy.policyId`, `policy.policyVersion`, `policy.decisionId`       |
| Approval requested                     | Immediately when approval gating is activated  | ingress fields + `category=approval`, `type=approval.requested`, `subject`, `trace.correlationId`        |
| Approval resolved/expired              | Immediately when approval outcome is final     | approval-request fields + `outcome`, resolver actor metadata                                             |
| Execution started/completed/failed     | At dispatch start and terminal outcome         | `category=execution`, `type`, `outcome`, `subject`, `resource`, `trace.runId`, `trace.sessionId`         |
| Plugin admitted/blocked/activated      | At each admission and activation decision      | `category=plugin`, `type`, `outcome`, `subject`, `policy.*`, `trace.requestId`                           |
| Secret resolution attempt/deny/success | At secret lookup boundary and final resolution | `category=secret`, `type`, `outcome`, `resource`, `trace.requestId`, redaction-aware `evidence` metadata |

## Fallback behavior for incomplete evidence

When a producer cannot attach expected evidence, the producer must still emit a
traceable event and mark the gap explicitly.

Required fallback rules:

- never drop the base event because evidence is missing
- emit event with `outcome=error` or `outcome=skipped` as appropriate
- include structured evidence gap markers in `evidence`:
  - `kind=evidence_gap`
  - `redaction=full | partial` when sensitive source blocked attachment
  - diagnostic reason code in tags (example: `evidence_missing`, `evidence_unavailable`, `evidence_redacted`)
- preserve `trace` correlation fields so replay chains remain intact
- include stable producer identity in `resource`/`subject` so coverage gaps can
  be attributed to a concrete subsystem

## Producer-to-replay trace mapping

Replay coverage should be estimated by validating these required links:

| Replay step               | Required producer event(s)                               | Correlation key(s)                                  |
| ------------------------- | -------------------------------------------------------- | --------------------------------------------------- |
| Request origin            | `gateway.request.accepted` or `gateway.request.rejected` | `trace.requestId`, `trace.correlationId`            |
| Decision rationale        | `policy.evaluated` plus terminal policy outcome          | `trace.requestId`, `policy.decisionId`              |
| Approval context          | `approval.requested` and terminal approval event         | `trace.correlationId`, `trace.requestId`            |
| Runtime action            | `execution.*` start + terminal outcome                   | `trace.runId`, `trace.sessionId`, `trace.requestId` |
| Plugin/security mediation | `plugin.*` and/or `secret.*` path events                 | `trace.requestId`, `trace.correlationId`            |

Coverage is insufficient if any required link is absent and no explicit
`evidence_gap` fallback event explains the absence.

## Verification criteria

`CONCLAW-38` is complete when:

- implementation teams can identify concrete producer ownership for each audit
  category
- required emission timing and required fields are explicit per producer stage
- incomplete evidence handling is standardized and replay-safe
- replay coverage can be estimated against this producer map before UI/SIEM
  integration work starts

## Related

- [ControlClaw Audit Event Model](/concepts/controlclaw-audit-model)
- [ControlClaw Audit Investigation Scenario](/concepts/controlclaw-audit-investigation-scenario)
- [ControlClaw Audit Query and Retention Model](/concepts/controlclaw-audit-query-retention-model)
