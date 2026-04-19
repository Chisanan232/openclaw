---
summary: "Staged migration path from in-process plugin execution to isolated enterprise runner execution"
read_when:
  - You are planning plugin runtime migration sequencing
  - You need to split MVP isolation scope from later hardening scope
title: "Enterprise Plugin Runtime Migration Path"
---

# Enterprise plugin runtime migration path

## Purpose

This page defines `CONCLAW-26`: a staged migration path from current
in-process plugin execution assumptions to enterprise isolated execution, while
preserving compatibility contracts defined by the ControlClaw planning model.

It is a sequencing and scope contract for implementation tickets, not an
immediate runtime replacement.

## Migration goals

1. Move plugin execution onto isolated runner boundaries without breaking
   preserved format/contract surfaces.
2. Keep a credible MVP path that can ship before full hardening is complete.
3. Make execution mode explicit and policy-driven instead of implicit runtime
   behavior.
4. Keep rollout reversible through staged controls and compatibility fallback
   policy.

## Staged migration path

| Stage                             | Primary outcome                                                                            | Default execution mode                          | Exit criteria                                                    |
| --------------------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------- | ---------------------------------------------------------------- |
| `S0: baseline`                    | Current runtime behavior is inventoried and tagged by plugin class and capability profile. | in-process                                      | execution inventory and compatibility tags are complete          |
| `S1: dual-mode foundation`        | Runtime adds explicit execution mode selection and envelope propagation seams.             | in-process (default), isolated (opt-in)         | mode selection, runtime envelope, and telemetry are wired        |
| `S2: MVP isolated lane`           | First selected plugin classes run through isolated runners with broker mediation.          | class-dependent                                 | pilot classes pass policy, reliability, and compatibility checks |
| `S3: controlled expansion`        | Isolated mode expands to additional plugin classes with staged rollout controls.           | isolated for approved classes                   | expansion playbooks and rollback controls are validated          |
| `S4: hardened enterprise default` | Isolated mode becomes enterprise default with strict policy and containment posture.       | isolated (default), in-process (exception only) | hardening controls and exception governance are in place         |

## MVP isolation scope versus later hardening scope

### MVP scope (`S1-S2`)

- explicit execution mode field in runtime planning path
- runner handshake + request/response contract adoption
- capability broker mediation for high-risk operations
- limited plugin-class onboarding with allowlisted rollout
- observability baseline for runner health and request outcomes

### Later hardening scope (`S3-S4`)

- stronger provenance and attestation requirements
- strict policy-by-default for privileged capabilities
- broader containment and circuit-breaker automation
- org and workspace-level rollout governance controls
- deprecation path for general in-process execution in enterprise mode

## Mode selection model

Execution mode is selected per plugin runtime request using explicit policy and
artifact metadata.

```text
plugin request
  -> classify plugin class + capability risk
  -> evaluate policy + rollout gate
  -> select execution mode: in-process | isolated
  -> execute with runtime envelope + audit trace
```

Mode selection must be deterministic for a given policy snapshot and rollout
state.

## Compatibility risks and mitigation plan

| Risk                                                       | Why it matters                                                                 | Mitigation                                                                               |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| Implicit in-process assumptions inside plugin runtime code | Plugins may depend on direct host behavior not available in isolated runners.  | add class-based migration gates and explicit adapter seams before migration cutover      |
| Contract drift between in-process and isolated paths       | Callers may observe inconsistent behavior for the same plugin capability.      | define and enforce versioned request/result envelopes and conformance checks             |
| Performance regressions during runner mediation            | Added broker and IPC hops can increase latency and timeout risk.               | baseline S0 metrics, enforce S2 latency budgets, and use staged rollout thresholds       |
| Incomplete policy coverage for brokered capabilities       | High-risk operations might escape intended enterprise controls.                | fail-closed policy defaults, deny-by-default for privileged operations, and audit checks |
| Rollback complexity in mixed-mode operation                | Fast rollback is required if isolated execution causes production impact.      | keep deterministic mode toggles and per-class fallback controls with clear ownership     |
| Operational overhead from runner lifecycle failures        | Runner instability can reduce execution reliability if not isolated correctly. | health checks, draining states, and typed retryable/non-retryable failure semantics      |

## Rollout mitigation controls

### Guardrails required before expansion from `S2` to `S3`

- conformance checks for preserved/adapted behavior per migrated plugin class
- runner availability SLO and timeout budget tracking
- policy deny and broker error rate thresholds with automatic hold rules
- reversible rollout controls at org and workspace scope

### Fallback and rollback policy

1. Roll forward only when migration-class metrics are within thresholds for a
   full evaluation window.
2. On threshold violation, freeze class expansion first, then route impacted
   class back to in-process mode via policy toggle.
3. Keep migration-state changes auditable with explicit reason codes.

### Cross-ticket alignment requirements

- admission and registry tickets must publish metadata required for execution
  mode decisions
- runtime tickets must preserve envelope and error-code semantics
- compatibility tickets must classify behavior as preserved, adapted, diverged,
  or unsupported before rollout promotion

## First-migration plugin class selection criteria

Select early plugin classes using the criteria below:

1. low host-privilege dependency compared to other classes
2. clear capability boundaries that map cleanly to broker mediation
3. observable request/response behavior suitable for conformance checks
4. reversible rollout impact if class-specific fallback is needed

## Candidate first-migration classes

| Plugin class                              | Why move early                                                                       | Primary touchpoints                                                                                                                |
| ----------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| Provider and model adapter plugins        | Typically structured request/response behavior with clearer mediation seams.         | `src/plugins/provider-runtime.ts`, `src/plugins/provider-public-artifacts.ts`, `src/agents/model-selection.plugin-runtime.test.ts` |
| Read-mostly registry and metadata plugins | Lower direct host mutation risk; good for validating envelope and broker plumbing.   | `src/plugins/registry.ts`, `src/plugins/discovery.ts`, `src/plugins/activation-planner.ts`                                         |
| Bounded tool-proxy plugins                | Strong candidate when capability surface is explicit and already policy-addressable. | `src/agents/tool-policy.ts`, `src/agents/openclaw-plugin-tools.ts`, `src/plugins/capability-provider-runtime.ts`                   |

Defer classes with heavy direct host mutation or complex side effects until
`S3` hardening controls are proven.

## Follow-up engineering questions

- Which existing plugin classes require compatibility adapters to preserve
  runtime-visible behavior under isolated execution?
- Which broker calls need strict timeout budgets versus async completion paths?
- How should mode selection metadata be represented in plugin manifest and
  admission outputs without breaking preserved contract surfaces?
- Which conformance fixtures must be mandatory gates before class promotion from
  `S2` to `S3`?
- What minimum rollback telemetry is required for safe class-level reversion?
