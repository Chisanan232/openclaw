# ControlClaw Plugin Manifest And Discovery Contract

Status: draft planning spec for `CONCLAW-32`.

## Goal

Define the exact plugin manifest and discovery-facing contract surfaces that
ControlClaw should preserve from OpenClaw before runtime and admission
rewrites begin.

This document narrows the broader compatibility language from
`docs/refactor/controlclaw/compatibility-matrix.md` and
`docs/refactor/controlclaw/preserved-contract-surfaces.md` down to the native
plugin manifest and discovery surface.

## Preservation Rule

ControlClaw preserves plugin metadata and discovery interfaces before it
preserves unrestricted plugin runtime behavior.

That means:

- preserve `openclaw.plugin.json` as the canonical native plugin manifest
- preserve manifest-first validation and discovery behavior that works without
  executing plugin runtime
- preserve inventory and setup concepts that plugin authors and operators can
  inspect from metadata alone
- do not preserve the upstream assumption that a valid manifest implies direct
  activation or unrestricted execution

## Preserved Manifest And Discovery Contract

### Manifest file and identity assumptions

Preserve:

- `openclaw.plugin.json` as the canonical native plugin manifest filename
- manifest-rooted plugin identity through `id`, manifest path, source path, and
  plugin root concepts
- the distinction between native plugin manifests and compatible bundle
  manifests
- the expectation that manifest parsing can fail fast before plugin runtime is
  imported

Primary seams:

- `docs/plugins/manifest.md`
- `src/plugins/manifest.ts`
- `src/plugins/manifest-types.ts`

Compatibility bar:

- `format`: preserve `openclaw.plugin.json` and supported manifest field names
- `contract`: preserve manifest-first parsing and validation
- `runtime`: valid metadata does not guarantee immediate runtime activation

### Preserved manifest field semantics

Preserve as interface-stable:

- identity and informational fields such as `id`, `name`, `description`, and
  `version`
- `configSchema` as the metadata source for config validation without booting
  plugin runtime
- field groups that are explicitly documented as cheap control-plane metadata,
  including activation hints, setup descriptors, auth-choice metadata, config
  UI hints, skills roots, channel ownership, provider ownership, and static
  capability ownership snapshots
- the expectation that documented manifest fields are readable through
  discovery and registry surfaces before runtime code executes

Primary seams:

- `docs/plugins/manifest.md`
- `src/plugins/manifest.ts`
- `src/plugins/config-contracts.ts`
- `src/plugins/manifest-registry.ts`

Compatibility bar:

- `format`: preserve supported manifest field names and value shapes
- `contract`: preserve metadata-first config and discovery usage
- `runtime`: actual execution remains separable from the manifest contract

### Discovery and candidate selection assumptions

Preserve:

- the existence of a discovery phase that finds plugin candidates before
  runtime loading
- candidate concepts such as origin, root directory, source entry, setup
  source, manifest format, and bundle format
- root-based discovery across workspace, global, config-owned, and bundled
  plugin sources where currently documented
- the expectation that manifest-driven discovery emits diagnostics when a
  candidate is malformed, unsafe, or blocked

Primary seams:

- `src/plugins/discovery.ts`
- `src/plugins/roots.ts`
- `src/plugins/bundled-plugin-metadata.ts`

Compatibility bar:

- `format`: preserve candidate metadata fields that diagnostics and inventory
  rely on
- `contract`: preserve manifest-first discovery and source attribution
- `runtime`: discovered does not imply activated or executable

### Registry and public-surface assumptions

Preserve:

- the existence of a manifest registry that turns discovery output into a
  stable metadata inventory
- the expectation that discovery, setup, and validation flows can read plugin
  ownership and config metadata without importing full runtime barrels
- the distinction between public-surface lookup and heavy runtime loading

Primary seams:

- `src/plugins/manifest-registry.ts`
- `src/plugins/public-surface-loader.ts`
- `src/plugins/public-surface-runtime.ts`

Compatibility bar:

- `format`: preserve metadata inventory shapes used by higher-level helpers
- `contract`: preserve manifest-first registry and public-surface lookup
- `runtime`: loading the plugin code remains a later, separately governed step

## Interface-Stable Versus Execution-Dependent Semantics

### Interface-stable semantics

ControlClaw should preserve these by exact or near-exact shape when it claims
plugin manifest compatibility:

- `openclaw.plugin.json` as the entry manifest filename
- documented supported manifest field names and JSON shapes
- manifest-first config validation and metadata inspection
- candidate/source attribution concepts exposed by discovery and manifest
  registry flows

### Execution-dependent semantics

ControlClaw may preserve these as recognizable concepts rather than identical
runtime behavior:

- plugin enablement and activation outcomes
- plugin setup success as a precondition for runtime access
- runtime ownership of tools, providers, channels, and hooks after discovery
- compatibility decisions that depend on admission, isolation, or signing

## Reviewer Questions

When later tickets claim plugin manifest compatibility, reviewers should ask:

1. Does the ticket preserve `openclaw.plugin.json` and manifest-first
   discovery, or only the general idea of plugin metadata?
2. Does the ticket keep config validation and cheap discovery on the metadata
   path without importing plugin runtime?
3. Is the ticket changing a real manifest/discovery contract surface, or only
   an internal loading detail?
4. If runtime behavior changes, does the ticket still preserve the documented
   manifest and discovery contract?
