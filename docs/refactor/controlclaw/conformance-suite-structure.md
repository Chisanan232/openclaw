# ControlClaw Compatibility Conformance Suite Structure

Status: draft planning spec for `CONCLAW-47`.

## Goal

Define how ControlClaw should verify compatibility against preserved
OpenClaw-facing contracts using a repeatable conformance suite instead of ad
hoc manual checks.

This document turns the earlier compatibility planning docs into a test-suite
structure that later executable tests can implement without redesign.

## Suite Principles

- test the smallest compatibility layer that can prove the claim
- keep static compatibility checks metadata-first whenever possible
- separate format and contract conformance from enterprise runtime mediation
- make unsupported behavior explicit and reportable instead of treating it as a
  generic failure
- cover both bundled and third-party expectations so the suite does not create
  false confidence from only testing first-party artifacts

## Preserved Contract Categories

The suite should organize preserved compatibility claims by contract category:

### Skills

What the suite must cover:

- `SKILL.md` packaging and skill-folder assumptions
- skill discovery, install/update expectations, and scanner-visible outcomes
- preserved versus enterprise-constrained skill semantics

Primary future seams:

- `src/agents/skills*`
- `src/security/skill-scanner.ts`

### Native plugin manifests and discovery

What the suite must cover:

- `openclaw.plugin.json` parsing and documented manifest field semantics
- plugin discovery, source attribution, and manifest registry inventory
- preserved manifest metadata versus execution-dependent plugin runtime

Primary future seams:

- `src/plugins/manifest.ts`
- `src/plugins/discovery.ts`
- `src/plugins/manifest-registry.ts`
- `src/plugins/contracts/**`

### Compatible bundles and install metadata

What the suite must cover:

- bundle layout detection for supported bundle families
- bundle metadata extraction, install/discovery expectations, and mapping
  contracts
- preserved layout compatibility versus enterprise rejection or downstream
  mediation

Primary future seams:

- `src/plugins/bundle-manifest.ts`
- `src/plugins/bundle-mcp.ts`
- `src/plugins/bundle-commands.ts`
- install/discovery contract tests and helper fixtures

### Tool schemas and invocation interfaces

What the suite must cover:

- stable tool names, parameter shapes, and invocation payload contracts
- scoped tool discovery and visible inventory
- preserved schema compatibility versus policy-, approval-, or audit-mediated
  execution semantics

Primary future seams:

- `src/agents/tools/**`
- `src/agents/tool-policy.ts`
- `src/agents/pi-tools.before-tool-call.ts`
- `src/gateway/tools-invoke-http.ts`

## Conformance Suite Layers

The suite should be structured in layers rather than one flat bucket.

### Layer 1: format conformance

Purpose:

- verify that an artifact parses and classifies correctly before runtime

Examples:

- `SKILL.md` parses as a skill package
- `openclaw.plugin.json` satisfies the documented manifest contract
- bundle layouts classify into the expected supported family
- tool schemas still expose the expected parameter keys

Preferred execution model:

- cheap local runs
- contract-focused CI shard

### Layer 2: contract conformance

Purpose:

- verify discovery, inventory, install, setup, and invocation interfaces
  without requiring full runtime execution

Examples:

- manifest registry still exposes ownership metadata
- skill inventory still exposes the expected source and visibility concepts
- bundle discovery still explains what was recognized
- tool catalogs still expose the expected callable interface

Preferred execution model:

- local contract runs
- dedicated contracts CI shard

### Layer 3: enterprise mediation conformance

Purpose:

- verify where ControlClaw intentionally changes runtime semantics while
  preserving the external contract

Examples:

- a valid tool call becomes approval-gated
- a visible plugin remains undiscoverable for runtime activation because of
  admission policy
- a skill remains parseable but scanner-blocked
- a supported bundle remains format-compatible but enterprise-rejected

Preferred execution model:

- targeted local checks for touched surfaces
- selective CI lanes tied to enterprise enforcement work

### Layer 4: unsupported-behavior regression conformance

Purpose:

- keep intentionally unsupported semantics from drifting back in silently

Examples:

- discovery is not treated as execution permission
- valid schemas do not bypass policy
- manifest compatibility does not imply trusted runtime
- third-party plugin compatibility claims stay constrained to documented
  surfaces

Preferred execution model:

- contract-heavy CI
- release-readiness compatibility summary

## Suite Topology In The Repo

The suite should reuse the current contract-test topology rather than inventing
an unrelated tree.

### Existing contract lanes to build on

- `src/plugins/contracts/**`
- `test/vitest/vitest.contracts.config.ts`
- `test/vitest/vitest.full-core-contracts.config.ts`
- shared helpers under `test/helpers/plugins/**` and channel/test helper
  directories where relevant

### Recommended dedicated compatibility fixture area

Plan a dedicated compatibility fixture area for later implementation, such as:

- `test/fixtures/compatibility/skills/**`
- `test/fixtures/compatibility/plugins/**`
- `test/fixtures/compatibility/bundles/**`
- `test/fixtures/compatibility/tools/**`

The exact implementation path can change later, but the fixture corpus should
be separated from one-off bundled-plugin cases so the suite can represent
third-party compatibility expectations explicitly.

## Third-Party Coverage Rule

The suite must avoid treating bundled-plugin success as proof of ecosystem
compatibility.

Future tests should always include:

- bundled first-party fixtures
- third-party-like fixtures that exercise only documented public contracts
- legacy fixtures that preserve recognized older-but-supported shapes

If a scenario only passes for bundled plugins because it relies on incidental
internal behavior, it should not count as compatibility proof.

## Reviewer Questions

When later tickets add executable conformance tests, reviewers should ask:

1. Does the test prove format, contract, mediation, or unsupported-behavior
   conformance?
2. Is the fixture category first-party only, or does it represent third-party
   contract expectations too?
3. Does the test rely on runtime execution when a metadata-first proof would
   have been enough?
4. Does the test outcome report preserved, diverged, or unsupported semantics
   explicitly?
