---
summary: "Process-level runtime model for enterprise isolated execution components"
read_when:
  - You are defining process boundaries for control plane, broker, and runner
  - You need explicit lifecycle and trust boundaries before runtime implementation
title: "Enterprise Isolated Runtime Process Model"
---

# Enterprise isolated runtime process model

## Purpose

This page defines `CONCLAW-42`: the process-level execution model for
ControlClaw isolated enterprise runtime components.

It extends prior runtime contract planning by clarifying process roles, trust
boundaries, communication boundaries, and lifecycle states so implementation and
operations work can proceed with explicit assumptions.

## Process roles and boundaries

| Process role        | Primary responsibility                                                            | Boundaries                                                    |
| ------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `control-plane`     | policy evaluation, admission decisions, rollout controls, lifecycle orchestration | does not execute plugin business logic directly               |
| `capability-broker` | mediation of privileged capability access (tools, secrets, network, filesystem)   | does not decide org/workspace policy outside provided context |
| `runner`            | isolated plugin execution and request handling                                    | does not bypass broker for privileged host operations         |
| `telemetry-audit`   | append-only audit/event ingestion and correlation                                 | does not mutate runtime execution outcomes                    |

### Boundary invariants

1. Plugin business logic runs in `runner` processes only.
2. Privileged capability access flows through `capability-broker` only.
3. Policy and admission are authored by `control-plane` only.
4. Audit records are append-only and correlated by stable trace identifiers.

## Trust and communication boundaries

### Trust model

- `control-plane` is trusted to issue policy/admission context.
- `runner` is treated as constrained and must continuously prove compliance with
  protocol and liveness requirements.
- `capability-broker` is trusted to enforce mediated capability policies but is
  constrained by runtime envelopes and policy snapshots.

### Communication boundaries

| From              | To                  | Communication type          | Required properties                                                      |
| ----------------- | ------------------- | --------------------------- | ------------------------------------------------------------------------ |
| `control-plane`   | `runner`            | lifecycle and execution RPC | versioned protocol, admission-bound context, request correlation         |
| `runner`          | `capability-broker` | mediated capability RPC     | policy-scoped calls, typed allow/deny results, auditable decisions       |
| `control-plane`   | `capability-broker` | policy and rollout sync     | snapshot consistency, bounded staleness, explicit version ids            |
| all runtime roles | `telemetry-audit`   | event emission              | append-only writes, trace correlation ids, loss-aware delivery semantics |

No process may communicate with privileged host integrations using ad hoc or
out-of-band channels that bypass these boundaries.

## Isolated runtime process lifecycle states

The lifecycle below models process-level states (not plugin lifecycle states).

| State          | Meaning                                                        | Allowed next states            |
| -------------- | -------------------------------------------------------------- | ------------------------------ |
| `provisioning` | process is allocated and bootstrapped with config and identity | `initializing`, `failed`       |
| `initializing` | process validates protocol version and runtime prerequisites   | `ready`, `failed`              |
| `ready`        | process is healthy and can receive work                        | `active`, `draining`, `failed` |
| `active`       | process is handling one or more in-flight requests             | `ready`, `draining`, `failed`  |
| `draining`     | process is completing in-flight work and refusing new work     | `terminated`, `failed`         |
| `terminated`   | process is cleanly stopped                                     | none                           |
| `failed`       | process violated health, protocol, or policy requirements      | `terminated`                   |

### Lifecycle invariants

1. Only `ready` and `active` processes are schedulable.
2. `draining` is mandatory before routine shutdown to protect in-flight work.
3. `failed` processes are never re-used; recovery occurs through fresh process
   provisioning.

## Failure semantics and containment expectations

Failures are classified by blast radius and containment requirements.

| Failure class      | Typical trigger                                                                | Expected containment                                               |
| ------------------ | ------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| `request-scoped`   | malformed request payload, request timeout, per-request policy deny            | fail only the request; process remains `ready` or `active`         |
| `process-scoped`   | protocol violation, heartbeat/liveness failure, unrecoverable runner exception | transition process to `failed`; terminate and reprovision process  |
| `component-scoped` | broker outage, control-plane policy snapshot unavailability                    | pause affected scheduling path; preserve healthy independent paths |
| `workspace-scoped` | repeated policy violations or correlated runtime instability in one workspace  | apply workspace-level circuit breaker and rollout hold             |
| `org-scoped`       | severe systemic security or trust-boundary breach                              | enforce org-level emergency controls and block expansion           |

### Containment rules

1. Contain at the smallest viable scope that protects trust boundaries.
2. Fail closed for policy, identity, or admission ambiguity.
3. Preserve deterministic request error codes for operators and automation.
4. Do not silently downgrade isolated paths to in-process execution.

### Retry and recovery expectations

| Condition                                     | Retryability                                      | Recovery path                                              |
| --------------------------------------------- | ------------------------------------------------- | ---------------------------------------------------------- |
| typed request timeout with healthy process    | retryable                                         | bounded request retry with same policy snapshot            |
| runner process in `failed` state              | not retryable on same process                     | reprovision runner, then retry by scheduling policy        |
| broker unavailable with stale fallback denied | not retryable until broker healthy                | restore broker health; re-evaluate admission and queue     |
| control-plane snapshot mismatch               | not retryable until snapshot consistency restored | refresh snapshot version, then restart affected lifecycles |

### Containment and state transitions

```text
request failure (scoped) -> return typed error -> process stays schedulable
process failure -> state=failed -> terminate -> provision new process
component failure -> pause scheduling path -> recover component -> resume
```

### Operational expectations

- Every containment action must emit an auditable event with scope and reason.
- Circuit-breaker events must include explicit release criteria.
- Recovery workflows must prefer controlled resumption over bulk unfreeze.
