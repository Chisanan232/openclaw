# ControlClaw Plugin Manifest Enterprise Divergences

Status: draft planning spec for `CONCLAW-32`.

## Goal

Document the enterprise-owned divergences that ControlClaw may impose on native
plugin activation, install source, and runtime assumptions while preserving the
manifest and discovery contract.

This document should be read with:

- `docs/refactor/controlclaw/compatibility-matrix.md`
- `docs/refactor/controlclaw/plugin-manifest-discovery-contract.md`

## Governing Rule

If plugin behavior would force ControlClaw to choose between:

- preserving the upstream assumption that a valid manifest is enough to keep
  runtime behavior low-friction
- and enforcing enterprise governance

enterprise governance wins.

## Enterprise-Owned Divergence Rules

These divergences are part of the supported ControlClaw model even when a
plugin remains manifest-compatible.

### Activation may depend on enterprise controls

ControlClaw may require:

- admission, policy, or signing checks before a discovered plugin becomes
  activatable
- explicit enablement or registry approval before runtime surfaces are exposed
- stricter separation between control-plane activation hints and real runtime
  activation

Why:

- manifest compatibility is not proof of runtime trust
- enterprise runtime needs a separable decision point between discovery and
  execution

### Install source and provenance may become first-class

ControlClaw may require:

- stronger provenance rules for workspace, config, global, or bundled sources
- source-specific trust rules for plugin roots, ownership, or package origin
- visible provenance or support-tier annotations in inventory output

Why:

- identical manifest shapes can arrive from very different trust contexts
- enterprise operators need to reason about where a plugin came from, not just
  what metadata it declared

### Runtime ownership may be narrower than metadata ownership

ControlClaw may require:

- tool, provider, channel, hook, or setup ownership to pass through policy and
  isolation checks before becoming runnable
- runtime restrictions even when manifest metadata still advertises a supported
  surface
- more explicit separation between interface-stable metadata and
  execution-dependent capabilities

Why:

- manifest semantics describe what the plugin claims and what the control plane
  can inspect cheaply
- enterprise runtime still needs room to deny or mediate specific execution
  paths

### Setup and config success may no longer imply runtime success

ControlClaw may require:

- setup descriptors and config validation to remain visible while runtime stays
  blocked
- explicit state transitions that distinguish discover, validate, enable,
  admit, and execute
- operator UX that shows why a plugin is recognizable but not runnable

Why:

- setup and validation are preserved control-plane concepts
- enterprise governance should not collapse those concepts into one opaque
  success or failure result

## Manifest Semantics That Should Remain Interface-Stable

These semantics should remain stable enough for plugin authors and maintainers
to rely on:

- canonical manifest filename and plugin id model
- documented supported manifest field names and value shapes
- manifest-driven config validation and UI hint concepts
- discovery-time visibility of ownership, setup, activation, and capability
  metadata
- candidate/source attribution and diagnostics from discovery

## Manifest Semantics That Are Execution-Dependent

These semantics may diverge at runtime even when the manifest contract remains
intact:

- whether the plugin actually activates
- whether setup descriptors result in runtime availability
- whether install or load source is admitted
- whether owned runtime surfaces are enabled, sandboxed, or denied

## Unsupported Plugin Manifest Assumptions

These behaviors should be documented as unsupported rather than reintroduced by
accident.

### Valid manifest implies trusted runtime

Unsupported:

- treating a schema-valid `openclaw.plugin.json` as sufficient for runtime
  execution
- assuming manifest parse success or registry inclusion means the plugin is
  approved to run

### Discovery implies activation

Unsupported:

- treating candidate discovery as equivalent to runtime enablement
- assuming inventory visibility guarantees the plugin’s runtime hooks, tools,
  providers, or channels will load

### Install source is only a path concern

Unsupported:

- treating plugin source roots as mere filesystem mechanics with no trust or
  provenance meaning
- ignoring ownership, safety, or admission concerns because the plugin path is
  structurally valid

### Manifest metadata bypasses governance

Unsupported:

- using activation or setup hints as a way to bypass policy, admission, audit,
  or isolation checks
- letting metadata-owned capability claims auto-grant runtime power without a
  later governance decision

## Reviewer Questions

Reviewers should ask these questions on later admission, runtime, or registry
tickets:

1. Does the ticket preserve the manifest/discovery contract while adapting only
   activation or runtime control?
2. Does the ticket accidentally blur discovery, validation, activation, and
   execution into one state?
3. Should the behavior remain unsupported because it conflicts with enterprise
   provenance, policy, or runtime isolation?
4. Does the operator-facing outcome clearly distinguish metadata compatibility
   from runtime trust?
