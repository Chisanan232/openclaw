# ControlClaw Compatibility Matrix

Status: draft planning spec for `CONCLAW-13`.

## Purpose

This document turns the ControlClaw compatibility policy into a reviewable
matrix that later implementation tickets can cite without re-litigating first
principles from `CONCLAW-63`, `CONCLAW-64`, `CONCLAW-2`, `CONCLAW-12`,
`CONCLAW-46`, `CONCLAW-58`, and `CONCLAW-30`.

The governing rule is unchanged:

- preserve ecosystem value where practical
- preserve interfaces before preserving implementation details
- when compatibility conflicts with enterprise governance, enterprise
  governance wins

## Decision Vocabulary

Every later ticket that changes an ecosystem-facing behavior should classify the
change with one of these outcomes:

- `preserved`: ControlClaw keeps the upstream-facing format and the normal
  contract expectations for consumers.
- `adapted`: ControlClaw preserves the format or entry surface, but introduces
  enterprise mediation such as policy checks, identity checks, audit capture,
  admission rules, or runtime isolation.
- `diverged`: ControlClaw intentionally changes runtime semantics or operator
  expectations because the upstream behavior conflicts with enterprise trust or
  control-plane goals.
- `unsupported`: ControlClaw does not promise the behavior at all, either
  because it is outside the phase target or because supporting it would require
  architectural exceptions that violate the ControlClaw model.

Each classification must also state which compatibility layer is affected:

- `format`: file layout, manifest keys, schema shape, command shape, and data
  encoding
- `contract`: discovery, install, enablement, and API expectations that a
  consumer can rely on
- `runtime`: observable execution behavior after the artifact is accepted
- `trust-model`: assumptions about who is trusted, what may execute directly,
  and which controls may block or gate behavior

## Matrix

| Surface | Upstream-facing promise to preserve where practical | Expected ControlClaw stance | Preserved semantics | Adapted or diverged semantics |
| --- | --- | --- | --- | --- |
| Skills | `SKILL.md` packaging, discovery, and ingestion conventions remain recognizable to users and artifact pipelines. | `adapted` | Skill packaging layout, metadata ingestion, docs-facing skill identity, and basic discovery should stay format-compatible so migration and catalog tooling still work. | Skill execution can become policy-gated, identity-aware, approval-gated, audited, and sandbox-mediated. Skills are not trusted because they are packaged correctly. |
| Native plugins | `openclaw.plugin.json`, documented SDK subpaths, and manifest-first discovery remain the primary compatibility contract. | `adapted` | Manifest shape, config schema ingestion, activation hints, and documented SDK entrypoints should remain contract-compatible enough for plugin authors to reason about migration. | Plugin load, activation, and execution may require admission checks, signing, registry policy, explicit enablement, sandboxing, or remote execution. Manifest compatibility does not imply unrestricted runtime behavior. |
| Compatible bundles | Bundle layout detection for Codex, Claude, and Cursor style artifacts remains part of ecosystem leverage. | `adapted` | Bundle detection, metadata extraction, and compatible layout parsing should remain format-compatible where practical. | Bundle admission can require provenance, scanning, policy review, translation to enterprise-managed registries, or blocked capabilities. A bundle can parse successfully and still be rejected from execution. |
| Tools | Tool schemas, argument shapes, and result contracts remain the primary ecosystem-facing promise. | `adapted` | Tool name, schema shape, and invocation contracts should remain stable where ControlClaw claims compatibility. Tool callers should be able to tell what arguments are required and what result shape to expect. | Tool execution may become approval-gated, policy-scoped, rate-limited, secret-mediated, or routed through enterprise brokers. Identical schemas do not imply identical execution freedom. |
| Config habits | Familiar config structure, plugin entry layout, and installation/enablement concepts remain useful migration anchors. | `adapted` | Familiar entry points such as `plugins.entries.<id>`, manifest-derived config validation, and documented install/enable flows remain valid planning anchors. | Direct config edits may no longer be sufficient to activate privileged behavior. Identity, policy, secret indirection, environment restrictions, and control-plane approval can become required before a config change takes effect. |
| Discovery and inventory | Users and operators still need to inspect what artifacts exist and what they claim to provide. | `preserved` | Discovery, inventory, and cheap metadata inspection should remain manifest-first and should not require eager runtime execution. | Inventory may expose enterprise state such as admission status, trust level, signing state, or support tier that upstream does not model today. |

## Preserved Versus Diverged Semantics

### Preserve by default

- artifact packaging conventions that allow users to identify a skill, plugin,
  or bundle without runtime execution
- manifest-first discovery and config validation behavior described in
  `docs/plugins/manifest.md`
- documented plugin SDK entrypoints and import-map expectations described in
  `docs/plugins/sdk-overview.md`
- tool schema visibility and argument/result introspection expectations
- the ability to classify a change at the format and contract layers without
  running the artifact

### Adapt by default

- install and enablement flows that need enterprise registry, signing, or
  admission checks
- tool execution flows that need policy, approval, audit, rate, or identity
  mediation
- runtime plugin activation when the platform must separate discovery from
  execution
- config application when secret indirection, approval, or operator ownership
  applies

### Diverge intentionally when needed

- any execution path that assumes artifact authors, operators, or model outputs
  are trusted by default
- any runtime behavior that bypasses policy, approval, or audit only to look
  upstream-compatible
- any install or runtime path that treats private registries or sandboxing as a
  complete enterprise trust answer
- any compatibility claim that depends on preserving upstream internal module
  layouts instead of preserving the actual ecosystem-facing contract

## Criteria For Intentionally Unsupported Behavior

Mark a behavior as `unsupported` only when at least one of these is true:

- the behavior requires a trust-model exception that bypasses policy, approval,
  identity, audit, or secret mediation
- the behavior depends on preserving upstream implementation details rather than
  a documented ecosystem-facing contract
- the behavior creates conflicting governance models across dashboard, CLI, and
  API surfaces
- the behavior belongs to a later phase or rewrite horizon and would create a
  false Phase 1 promise
- the behavior cannot be tested at the format, contract, or runtime layer with
  a bounded conformance harness

Unsupported decisions should record:

- the artifact type and exact behavior being declined
- whether the decline is phase-scoped or architecture-scoped
- whether a future adapted path is expected
- which constitutional principle forced the rejection

## Review Checklist For Later Tickets

Use this checklist in ticket descriptions, code review, and PR summaries:

1. Which surface changed: skills, plugins, bundles, tools, config habits, or a
   shared discovery layer?
2. Which compatibility layers changed: format, contract, runtime, trust-model?
3. Is the change `preserved`, `adapted`, `diverged`, or `unsupported`?
4. If adapted or diverged, which enterprise control required the change?
5. Can the claim be tested by a cheap discovery or contract harness before
   runtime?
6. Does the ticket belong in Phase 1, Phase 2, or rewrite horizon?
