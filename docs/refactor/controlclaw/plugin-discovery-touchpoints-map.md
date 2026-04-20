# ControlClaw Plugin Discovery Touchpoints Map

Status: draft planning spec for `CONCLAW-32`.

## Goal

Map the concrete OpenClaw plugin manifest and discovery code surfaces that
later ControlClaw tickets must preserve, adapt, or wrap when implementing
enterprise admission and isolated-runtime behavior.

This document is not a runtime design. It is a follow-up implementation map so
later tickets do not scatter plugin compatibility work across unrelated
subsystems.

## Primary Ownership Split

### Manifest parsing and schema ownership

Primary seams:

- `src/plugins/manifest.ts`
- `src/plugins/manifest-types.ts`
- `docs/plugins/manifest.md`

Why it matters:

- these files define the native manifest filename, supported field shapes, and
  parsing contract
- later tickets that change manifest semantics should anchor here rather than
  smuggling manifest meaning into runtime-only loaders

### Discovery candidate enumeration and diagnostics

Primary seams:

- `src/plugins/discovery.ts`
- `src/plugins/roots.ts`
- `src/plugins/path-safety.ts`

Why it matters:

- these files define how plugin candidates are found, normalized, and blocked
  before runtime loading
- later provenance or admission work should preserve candidate/source
  attribution instead of replacing it with opaque runtime labels

### Bundled plugin metadata and source rewriting

Primary seams:

- `src/plugins/bundled-plugin-metadata.ts`
- `src/plugins/bundled-plugin-scan.ts`
- `src/plugins/bundled-dir.ts`

Why it matters:

- these files define the metadata path for bundled plugins, including source
  entry rewriting and light public-surface artifacts
- later enterprise support tiers or signed-bundle policies should build on this
  metadata path rather than bypass it with eager runtime imports

### Manifest registry and config-contract inventory

Primary seams:

- `src/plugins/manifest-registry.ts`
- `src/plugins/config-contracts.ts`
- `src/plugins/manifest-registry-state.ts`

Why it matters:

- these files turn discovery output into a stable metadata inventory for config
  validation, contract lookups, and setup-state reasoning
- later admission and compatibility tests should anchor here for manifest-owned
  semantics instead of interrogating full runtime registries first

### Public-surface loading versus runtime loading

Primary seams:

- `src/plugins/public-surface-loader.ts`
- `src/plugins/public-surface-runtime.ts`
- `src/plugins/registry.ts`

Why it matters:

- these files preserve the boundary between cheap metadata/public-surface
  lookup and heavy runtime registration
- later isolated-runtime tickets should keep that separation explicit rather
  than letting discovery paths import runtime barrels accidentally

## Follow-Up Ticket Guidance

### Admission and provenance tickets

Future tickets should preserve:

- `openclaw.plugin.json` recognition
- source and origin attribution for discovered candidates
- manifest-first diagnostics before runtime load
- the distinction between discovered, validated, admitted, and activated

Likely future tickets:

- admission flow work that consumes manifest registry and provenance metadata
- policy and signing work layered onto candidate/source attribution

### Runtime and isolation tickets

Future tickets should preserve:

- manifest-owned metadata and discovery contracts
- public-surface lookup that stays lighter than full runtime activation
- stable meaning for activation hints, setup descriptors, and ownership
  metadata

Likely future tickets:

- isolated runtime work that separates metadata compatibility from execution
  authority
- internal registry changes that must keep manifest semantics stable while
  narrowing runtime access

### Conformance and compatibility-test tickets

Future tickets should verify:

- `openclaw.plugin.json` parsing and supported field shapes remain stable
- plugin discovery still exposes source/origin and manifest diagnostics without
  runtime imports
- manifest registry still exposes the metadata needed by config validation and
  setup flows
- enterprise controls do not silently mutate the preserved manifest/discovery
  contract

Likely future tickets:

- compatibility conformance harness work following `CONCLAW-13`
- admission validation and discovery contract tests for plugin metadata paths

## Reviewer Questions

When later implementation tickets touch plugin manifest compatibility,
reviewers should ask:

1. Did the ticket change a real manifest/discovery seam in `src/plugins`, or
   only add a wrapper around it?
2. Is the ticket preserving source attribution, manifest parsing, and cheap
   diagnostics?
3. Did the ticket accidentally move manifest semantics into runtime-only code
   paths?
4. Can the claimed compatibility still be validated by a cheap discovery or
   contract test before plugin runtime execution?
