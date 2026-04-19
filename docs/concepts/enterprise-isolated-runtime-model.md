---
summary: "Canonical isolated runtime model for ControlClaw enterprise execution governance"
read_when:
  - You are planning enterprise runtime isolation, sandbox, or execution policy work
  - You need stable runtime tenancy and enforcement terms across gateway, agents, and plugins
title: "Enterprise Isolated Runtime Model"
---

# Enterprise isolated runtime model

## Purpose

This page defines the canonical isolated runtime model for ControlClaw
enterprise planning (`CONCLAW-25`). It provides execution-boundary terms that
later runtime tickets can implement without re-litigating trust assumptions.

This is a design contract, not a completed runtime implementation.

## Runtime objectives

1. Every execution must run inside an explicit runtime boundary with a stable
   identity, policy context, and audit context.
2. Runtime isolation must be tenant-aware by default and must not rely on
   process-level trust assumptions.
3. Compatibility-preserved artifact formats (skills, plugins, tools, bundles)
   must still pass enterprise runtime governance before they can execute.
4. Runtime controls must be composable across CLI, API, and dashboard surfaces.

## Canonical runtime units

All execution is modeled as one `runtimeUnitType`.

| Runtime unit type | Description                                                                                   |
| ----------------- | --------------------------------------------------------------------------------------------- |
| `session-runtime` | Interactive runtime unit for one operator-to-agent execution session.                         |
| `job-runtime`     | Non-interactive runtime unit for scheduled, queued, or automation-triggered execution.        |
| `tool-runtime`    | Child runtime unit used for one tool invocation boundary when stronger isolation is required. |
| `plugin-runtime`  | Runtime unit for plugin-owned execution paths and plugin-mediated capabilities.               |
| `node-runtime`    | Runtime unit bound to a specific node/device execution environment.                           |

## Isolation dimensions

Each runtime unit must be evaluated on all dimensions below.

| Isolation dimension  | Required outcome                                                                                    |
| -------------------- | --------------------------------------------------------------------------------------------------- |
| Identity isolation   | The active principal and delegated identities are explicit and immutable for the unit lifetime.     |
| Tenant isolation     | `orgId` and `workspaceId` scope cannot be mixed implicitly across runtime units.                    |
| Policy isolation     | Policy decisions are bound to the runtime unit context and cannot be bypassed by caller shape.      |
| Secret isolation     | Secret material is resolved via scoped references and never copied into unrestricted runtime state. |
| Network isolation    | Outbound targets and transport classes are controlled by policy and runtime capabilities.           |
| Filesystem isolation | Runtime-accessible paths are explicit, minimal, and policy-governed per unit.                       |
| Audit isolation      | All privileged or externally visible actions emit audit events with stable runtime identifiers.     |

## Runtime identity envelope

Every runtime unit must carry a runtime identity envelope with these required
fields:

- `runtimeUnitId`: stable runtime unit identifier
- `runtimeUnitType`: canonical runtime unit type
- `orgId`: organization scope
- `workspaceId`: workspace scope when applicable
- `principalId`: canonical principal id from enterprise identity model
- `delegatedPrincipalId`: optional delegated identity when execution is on
  behalf of another principal
- `policySnapshotId`: immutable policy snapshot reference used during admission
- `admissionDecisionId`: admission decision reference for the runtime unit
- `auditTraceId`: audit correlation id used across runtime events

## Admission-to-runtime contract

Runtime execution can start only after an admission decision is materialized.

Required contract:

1. Admission emits a decision with `allow`, `deny`, or `allow-with-constraints`.
2. Runtime startup consumes that decision and binds it to one immutable
   `policySnapshotId`.
3. If the decision is `allow-with-constraints`, runtime must enforce every
   listed constraint before first tool execution.
4. Runtime must fail closed when admission metadata is missing, stale, or
   unverifiable.

## Runner lifecycle and handshake model

Enterprise out-of-process plugin execution is modeled as a runner lifecycle.
Each runner instance owns one process boundary and may host one or more runtime
units according to policy.

### Lifecycle states

| State         | Meaning                                                               | Allowed next states               |
| ------------- | --------------------------------------------------------------------- | --------------------------------- |
| `created`     | Runner process is launched but has not proven protocol compatibility. | `handshaking`, `failed`           |
| `handshaking` | Runner and host are exchanging protocol/version/capability metadata.  | `ready`, `failed`                 |
| `ready`       | Runner is admitted for execution but has no active runtime unit.      | `executing`, `draining`, `failed` |
| `executing`   | Runner is serving one or more active execution requests.              | `ready`, `draining`, `failed`     |
| `draining`    | Runner stops accepting new work and finishes in-flight requests.      | `terminated`, `failed`            |
| `terminated`  | Runner is closed cleanly and cannot process requests.                 | none                              |
| `failed`      | Runner violated protocol, policy, health, or liveness expectations.   | `terminated`                      |

### Handshake phases

1. `hello`: runner sends protocol version, runner id, plugin manifest digest,
   and declared capabilities.
2. `challenge`: host returns policy snapshot reference, required capability
   constraints, and optional nonce/challenge metadata.
3. `attest`: runner proves it can satisfy the requested constraints and returns
   resolved capability plan.
4. `accept`: host issues `admissionDecisionId`, runtime envelope defaults, and
   heartbeat requirements.
5. `ready`: runner transitions to `ready`; host may dispatch execution requests.

Any phase timeout, schema violation, or policy mismatch transitions to `failed`.

### Bootstrap sequence (logical)

```text
host -> runner: launch + connect
runner -> host: hello(protocolVersion, runnerId, pluginDigest, capabilities)
host -> runner: challenge(policySnapshotId, constraints, heartbeatSpec)
runner -> host: attest(capabilityPlan, constraintProof)
host -> runner: accept(admissionDecisionId, runtimeEnvelopeDefaults)
runner -> host: ready(runnerState=ready)
```

### Liveness and failure handling

- Runner must emit heartbeat frames at the negotiated interval.
- Host marks runner unhealthy if heartbeat deadline is exceeded.
- Unhealthy runners are removed from scheduling and moved to `failed`.
- Any in-flight request tied to a failed runner returns a typed failure result
  (defined in RPC contract below) with `retryable` metadata.

## Execution classes and default isolation stance

| Execution class                  | Examples                                             | Default stance                                                         |
| -------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------- |
| Read-only metadata operations    | manifest inspection, inventory listing, schema read  | `allow-with-constraints` with strict no-mutation policy                |
| Internal compute-only operations | local transforms without outbound effects            | `allow-with-constraints` with scoped filesystem and memory limits      |
| External side-effect operations  | outbound API calls, message sends, repository writes | `allow-with-constraints` plus explicit target and action policy checks |
| Privileged host operations       | shell exec, elevated tooling, system mutation        | `deny` unless explicit policy and approval grants are present          |

## Runtime state and data boundaries

Runtime-managed state is split into the following classes:

- `control-state`: policy snapshot references, admission decisions, and runtime
  lifecycle metadata
- `execution-state`: task-local working state for the active runtime unit
- `shared-state`: explicitly governed cross-runtime state with typed access
  contracts
- `audit-state`: append-only event records and immutable decision traces

Rules:

1. `execution-state` must not become implicit `shared-state`.
2. `shared-state` access must be policy-addressable by resource type and action.
3. `audit-state` is write-only for runtime executors; reads flow through
   dedicated audit/query surfaces.

## Failure and containment model

ControlClaw runtime failures are modeled with one containment scope:

| Containment scope | Required behavior                                                                                   |
| ----------------- | --------------------------------------------------------------------------------------------------- |
| `unit`            | Failure terminates only the current runtime unit and emits terminal audit event.                    |
| `session`         | Failure can terminate a session-level runtime group when policy marks the event as non-recoverable. |
| `workspace`       | Failure can trigger workspace circuit-breaker controls for repeated high-risk violations.           |
| `org`             | Reserved for severe policy or security events requiring org-level containment hooks.                |

Default rule: contain at the smallest viable scope (`unit`) unless policy
explicitly escalates.

## Initial implementation touchpoints

Later runtime tickets should apply this model to:

- `src/gateway` runtime lifecycle and request-context propagation
- `src/agents` execution loop lifecycle boundaries and delegated execution paths
- `src/agents/tools` runtime mediation hooks for tool-level policy and
  containment behavior
- `src/plugins` plugin-runtime startup and policy-aware activation boundaries
- `src/secrets` secret resolution interfaces keyed by runtime identity envelope

## Non-goals for this ticket

- defining a final production sandbox implementation per platform
- replacing existing OpenClaw runtime architecture in one ticket
- shipping enterprise policy engines or approval UI in this doc
- defining vendor-specific security product integration details
