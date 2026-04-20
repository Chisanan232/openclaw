---
summary: "Capability mediation, decision outputs, and governed failure mapping for isolated enterprise runners"
read_when:
  - You are defining broker mediation behavior for isolated execution
  - You need stable error and recovery vocabulary across control plane, broker, and runner
title: "Enterprise Runner Capability Mediation Model"
---

# Enterprise runner capability mediation model

## Purpose

This page defines `CONCLAW-55`: how enterprise capability mediation should work
between control plane, broker, and isolated runners, and how those decisions
map to governed execution outcomes.

It provides a stable contract for later runtime implementation, diagnostics, and
audit/admin surfaces.

## Capability mediation states

Every mediated action follows one broker decision state.

| Mediation state | Meaning                                                                                 | Next states                              |
| --------------- | --------------------------------------------------------------------------------------- | ---------------------------------------- |
| `received`      | Broker accepted a mediation request with runtime envelope context.                      | `validating`, `rejected`                 |
| `validating`    | Broker validates schema, identity, policy snapshot, and capability target scope.        | `allowed`, `denied`, `blocked`, `failed` |
| `allowed`       | Request is permitted with explicit constraints and execution bounds.                    | `executing`, `completed`, `failed`       |
| `denied`        | Request is denied by policy or missing grant.                                           | `completed`                              |
| `blocked`       | Request is blocked by governance controls (quarantine, rollout hold, emergency policy). | `completed`                              |
| `executing`     | Broker is invoking downstream capability path.                                          | `completed`, `failed`, `timed_out`       |
| `timed_out`     | Broker execution exceeded bounded timeout policy.                                       | `completed`                              |
| `failed`        | Broker or downstream capability path encountered non-policy failure.                    | `completed`                              |
| `rejected`      | Request was malformed or missing required runtime context.                              | `completed`                              |
| `completed`     | Final decision output emitted to runner and audit stream.                               | none                                     |

## Decision outputs and semantics

Each mediated action emits one decision output envelope:

- `decisionId`
- `requestId`
- `runtimeEnvelope` (`orgId`, `workspaceId`, `admissionDecisionId`, `policySnapshotId`, `auditTraceId`)
- `mediationState`
- `decisionClass` (`allow`, `deny`, `block`, `error`)
- `decisionCode`
- `retryable` flag
- `operatorActionRequired` flag
- `evidenceRefs` (policy rule ids, capability target ids, and diagnostics refs)

### Decision-class rules

| Decision class | Required interpretation                                                                           |
| -------------- | ------------------------------------------------------------------------------------------------- |
| `allow`        | Runner may proceed within returned constraints only.                                              |
| `deny`         | Runner must not execute action; no automatic escalation to alternate capability path.             |
| `block`        | Action is governance-blocked; runner must treat as policy terminal unless control-plane unblocks. |
| `error`        | Non-policy failure; retry and recovery behavior follows governed taxonomy below.                  |

## Capability mediation boundaries

1. Control plane owns policy and admission source-of-truth.
2. Broker owns capability mediation decisions and constraints enforcement.
3. Runner owns execution of approved plugin code paths only.
4. Runner cannot reinterpret `deny` or `block` as `allow`.

### Mediation responsibilities by component

| Component           | Must do                                                        | Must not do                                                     |
| ------------------- | -------------------------------------------------------------- | --------------------------------------------------------------- |
| `control-plane`     | issue policy snapshots and rollout/quarantine controls         | directly execute capability calls on runner behalf              |
| `capability-broker` | evaluate requests against policy and return governed decisions | mutate policy source-of-truth or bypass runtime envelope checks |
| `runner`            | request mediated capabilities and honor final decision outputs | bypass broker for privileged capabilities                       |

## Failure and error taxonomy

The runtime must distinguish error classes by source and governance meaning.

| Error class           | Source                   | Example conditions                                          | Default decision class |
| --------------------- | ------------------------ | ----------------------------------------------------------- | ---------------------- |
| `POLICY_DENIED`       | broker-policy            | missing grant, disallowed target, policy-rule deny          | `deny`                 |
| `GOVERNANCE_BLOCKED`  | control-plane governance | quarantine, rollout hold, emergency shutdown gate           | `block`                |
| `REQUEST_INVALID`     | request contract         | malformed payload, missing runtime envelope fields          | `error`                |
| `PLUGIN_EXEC_FAILURE` | plugin code path         | plugin logic exception after allowed capability access      | `error`                |
| `BROKER_EXEC_FAILURE` | broker runtime           | mediation pipeline failure, dependency service failure      | `error`                |
| `RUNNER_UNHEALTHY`    | process isolation layer  | runner failed health checks or protocol/liveness invariants | `error`                |
| `CAPABILITY_TIMEOUT`  | bounded execution        | broker or mediated capability execution exceeded timeout    | `error`                |
| `CAPABILITY_FAILED`   | downstream capability    | capability path returned terminal failure                   | `error`                |

## Recovery expectations

### Retry model

| Error class           | Retryable         | Recovery expectation                                            |
| --------------------- | ----------------- | --------------------------------------------------------------- |
| `POLICY_DENIED`       | no                | requires policy/admin change before reattempt                   |
| `GOVERNANCE_BLOCKED`  | no                | requires explicit unblock action from governance owner          |
| `REQUEST_INVALID`     | no                | caller must fix request contract                                |
| `PLUGIN_EXEC_FAILURE` | conditional       | retry only if class policy allows and idempotency is guaranteed |
| `BROKER_EXEC_FAILURE` | conditional       | retry after broker health signal recovers                       |
| `RUNNER_UNHEALTHY`    | no (same process) | reprovision runner, then reschedule according to rollout policy |
| `CAPABILITY_TIMEOUT`  | conditional       | bounded retry with timeout/backoff controls                     |
| `CAPABILITY_FAILED`   | conditional       | retry policy depends on capability class and failure reason     |

### Recovery actions

- `restart`: replace unhealthy runner process and rebind lifecycle state.
- `quarantine`: remove runner/class from scheduling until operator release.
- `retry`: bounded automatic or operator-triggered reattempt under policy.
- `operator-intervention`: manual triage required before resumption.

### Recovery invariants

1. `deny` and `block` outcomes are not auto-retried.
2. Retries must preserve `auditTraceId` linkage to original attempt chain.
3. Reprovisioned runners start with fresh lifecycle state; they do not inherit
   failed in-memory execution context.
