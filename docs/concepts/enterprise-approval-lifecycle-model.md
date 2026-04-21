---
summary: "Canonical enterprise approval lifecycle state machine, persistence model, escalation, and supersession rules"
read_when:
  - You are implementing enterprise approval APIs, storage, admin UX, or audit producers
  - You need state, timeout, escalation, re-approval, and supersession semantics before runtime wiring
title: "Enterprise Approval Lifecycle Model"
---

# Enterprise approval lifecycle model

## Goal

Define one lifecycle contract for enterprise approvals from request creation to
resolution, timeout, supersession, and audit handoff so backend, API, and UI
implementation tracks the same state semantics.

The canonical lifecycle model is implemented in:

- `src/shared/enterprise-approval-lifecycle-model.ts`

## State model

`CONCLAW-37` uses these lifecycle states:

- `pending_review`
- `escalated`
- `approved`
- `denied`
- `expired`
- `superseded`

Finalized states (`approved`, `denied`, `expired`, `superseded`) are eligible
for explicit audit handoff publishing.

## Transition contract

Primary transitions:

- `pending_review` -> `escalated` (`auto_escalate`)
- `pending_review|escalated` -> `approved|denied` (resolver decision)
- `pending_review|escalated` -> `expired` (`auto_expire`)
- `pending_review|escalated` -> `superseded` (`supersede_request`)
- `denied|expired` -> `pending_review` (`request_reapproval`)

Audit handoff transition:

- finalized status + `handoff_audit` -> audit handoff state `published`

## Timeout and escalation behavior

The lifecycle model derives automatic actions from request time metadata:

- escalation when `now >= escalationAt` and request is still `pending_review`
- expiry when `now >= expiresAt` and request remains unresolved

This behavior is defined in:

- `deriveApprovalAutomaticLifecycleActions(...)`

## Re-approval and supersession rules

Re-approval:

- allowed only after `denied` or `expired`
- increments `revision`
- requires `nextExpiresAt`
- clears previous resolution fields
- resets audit handoff to `pending`

Supersession:

- allowed from active states (`pending_review`, `escalated`)
- requires `supersededByRequestId`
- records closure reason and marks request `superseded`
- marks audit handoff `handoff_ready`

## Persistence requirements

`CONCLAW-37` defines baseline persistence shapes:

- request snapshot record
- append-only transition log
- escalation/timeout event log
- audit handoff publication log

Each requirement includes required fields, index keys, and retention class in:

- `ENTERPRISE_APPROVAL_PERSISTENCE_REQUIREMENTS`

## API and UI mapping guidance

The model maps expected operations to statuses and lifecycle triggers:

- create request
- approve
- deny
- request re-approval
- supersede request
- publish audit handoff

Operation mapping is encoded in:

- `ENTERPRISE_APPROVAL_OPERATION_MAPPINGS`

## Verification baseline

Acceptance checks for this lifecycle contract are encoded in:

- `src/shared/enterprise-approval-lifecycle-model.test.ts`

The tests validate:

- state transition validity and invalid-transition rejection
- deterministic escalation/expiry derivation
- re-approval revision and field reset behavior
- supersession metadata and audit handoff publication behavior

## Related

- [Enterprise Approval Resolution Scenario](/concepts/enterprise-approval-resolution-scenario)
- [Enterprise Policy Enforcement Point Map](/concepts/enterprise-policy-enforcement-point-map)
- [ControlClaw Audit Event Model](/concepts/controlclaw-audit-model)
