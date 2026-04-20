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
