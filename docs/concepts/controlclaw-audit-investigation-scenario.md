---
summary: "Canonical auditor investigation journey for reconstructing policy and approval context around sensitive agent actions"
read_when:
  - Defining audit query APIs, evidence UX, or SIEM export flows for ControlClaw
title: "ControlClaw Audit Investigation Scenario"
---

# ControlClaw audit investigation scenario

## Goal

Define the operator and auditor investigation story that validates the ControlClaw
audit and replay direction, and give downstream API, storage, and UI tickets a
single target journey.

This page is the canonical scenario contract for `CONCLAW-20`.

## User story

As an auditor, I want to reconstruct an agent action sequence with policy
decisions and approvals, so I can explain why a sensitive action happened and
whether it followed enterprise controls.

## Investigation questions that must be answerable

An investigation flow must be able to answer:

- who initiated the action
- which workspace and resources were involved
- which policy decision allowed or denied the action
- whether approval was required and how it was resolved
- what subsequent runtime effects occurred

## Canonical trace journey

The scenario is complete only when one sensitive action can be traced through
the full chain:

1. request received (`gateway.request.accepted`)
2. policy evaluated (`policy.evaluated` and final decision outcome)
3. approval requested and resolved (if required)
4. execution dispatched and completed or rejected
5. follow-on runtime effects captured

```text
[actor request]
  -> [gateway request event]
  -> [policy decision event]
  -> [approval lifecycle event?]
  -> [execution event]
  -> [runtime side-effect events]
```

## Scenario acceptance criteria

The investigation journey is considered supportable only if:

- all linked events can be retrieved with stable correlation keys
- missing evidence is explicit and visible, not silently dropped
- event payloads are understandable by auditors without raw runtime logs
- policy and approval context is available next to execution outcomes

## Required query and replay behavior

Downstream implementation must support this scenario with:

- timeline replay by correlation keys (`requestId`, `correlationId`, `runId`,
  `sessionId`) and deterministic ordering
- query filters for actor, workspace, policy decision, approval outcome, and
  resource identity
- ability to pivot from one event to adjacent events in the same chain
- clear missing-evidence markers when expected event links do not exist

## Test cases for downstream implementation

- an investigation can trace one action through request, decision, approval, and
  execution records
- missing evidence is detectable and reported as a gap
- investigation output remains understandable without direct runtime log access

## How to verify support for this scenario

This scenario is considered validated when:

- product, security, and engineering stakeholders agree the flow is supportable
  by the implemented audit model
- audit UI and SIEM/export tickets can reference this page as the target
  investigation journey
- implementation tickets can map each required answer and chain stage to a
  concrete event/query capability

## Expected implementation areas

Likely downstream touchpoints:

- audit query APIs
- audit storage and indexing
- admin investigation UI
- event producers in gateway, runtime, and approval flows

## Related

- [ControlClaw Audit Event Model](/concepts/controlclaw-audit-model)
- [ControlClaw Audit Event Producer Map](/concepts/controlclaw-audit-producer-map)
- [Gateway Protocol](/gateway/protocol)
