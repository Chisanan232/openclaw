# ControlClaw Conformance Harness Plan

Status: draft planning spec for `CONCLAW-13`.

## Goal

Define how ControlClaw should test compatibility claims so future implementation
tickets can prove whether a behavior is preserved, adapted, diverged, or
unsupported.

This plan is intentionally split across cheap metadata checks and more
expensive runtime checks. That matches the existing OpenClaw boundary rules in
`docs/plugins/manifest.md`, `docs/plugins/sdk-overview.md`, `src/plugins`, and
`src/agents/tools`.

## Harness Principles

- test the smallest compatibility layer that can prove the claim
- keep discovery and contract checks manifest-first whenever possible
- do not require full plugin or channel runtime startup for static compatibility
  claims
- isolate enterprise divergence checks so reviewers can see exactly which
  policy or trust rule changed behavior
- prefer contract fixtures that work for bundled and third-party artifacts

## Harness Lanes

### Lane 1: format conformance

Purpose:

- verify that artifacts still parse and classify correctly before runtime

Primary ownership:

- `src/plugins/bundle-manifest.ts`
- `src/plugins/bundle-config-shared.ts`
- `src/plugins/bundled-plugin-metadata.ts`
- `src/plugins/contracts/package-manifest.contract.test.ts`
- `src/plugins/bundle-manifest.test.ts`

What this lane should prove:

- supported bundle layouts still parse into the expected metadata shape
- `openclaw.plugin.json` surfaces still satisfy the documented manifest
  contract
- skill packaging conventions still classify correctly at the metadata layer
- config-facing metadata needed by enterprise admission remains available
  without runtime imports

Recommended fixture shape:

- one fixture per artifact family: skill, native plugin, compatible bundle, and
  tool schema package
- expected parse result with explicit classification outcome:
  `preserved`, `adapted`, `diverged`, or `unsupported`

### Lane 2: contract conformance

Purpose:

- verify discovery, activation planning, and SDK-facing contracts without
  running the full enterprise runtime path

Primary ownership:

- `src/plugins/activation-planner.ts`
- `src/plugins/contracts/registry.ts`
- `src/plugins/public-surface-loader.ts`
- `src/plugins/contracts/loader.contract.test.ts`
- `src/plugins/contracts/registry.contract.test.ts`
- `src/plugins/contracts/plugin-sdk-subpaths.test.ts`
- `src/plugins/contracts/runtime-seams.contract.test.ts`

What this lane should prove:

- manifest-first discovery remains lazy
- documented SDK subpaths remain intact for supported compatibility claims
- discovery and activation still operate on lightweight artifacts before full
  runtime execution
- enterprise-specific metadata such as admission tier or signing state can be
  added without breaking the underlying contract surface

Recommended assertion style:

- assert whether the claim is about format-only or full contract compatibility
- assert import laziness when a test only needs public metadata
- assert that any new enterprise-only metadata remains additive instead of
  mutating existing contract keys silently

### Lane 3: tool and runtime mediation conformance

Purpose:

- verify where ControlClaw intentionally changes runtime semantics while
  preserving the tool or artifact contract

Primary ownership:

- `src/agents/tools/message-tool.ts`
- `src/agents/tools/web-tools.ts`
- `src/agents/tools/sessions-send-tool.ts`
- `src/agents/tools/owner-only-tools.ts`
- `src/agents/tools/message-tool.test.ts`
- `src/agents/tools/web-tools.fetch.test.ts`
- `src/agents/tools/sessions-send-tool.a2a.test.ts`

What this lane should prove:

- a preserved tool schema can still produce adapted runtime behavior
- enterprise controls such as approval, identity, policy, or secret mediation
  are explicit in the observed result
- unsupported behavior fails with a documented reason instead of silently
  degrading
- runtime mediation does not accidentally mutate the static discovery contract

Recommended assertion style:

- assert schema or discovery shape separately from execution behavior
- assert the mediation reason in the runtime result or error code
- assert that enterprise divergence is deliberate and reviewable

### Lane 4: unsupported-behavior regression tests

Purpose:

- keep intentionally unsupported behavior from drifting back in through a
  compatibility shortcut

Primary ownership:

- new contract tests under `src/plugins/contracts/**`
- targeted tool tests under `src/agents/tools/*.test.ts`
- future enterprise-policy tests in the eventual ControlClaw control-plane
  modules

What this lane should prove:

- unsupported claims stay rejected for the documented reason
- a later ticket cannot silently upgrade `unsupported` behavior to
  `preserved` or `adapted` without changing the planning docs and the test
  fixture

## Claim Template For Future Tickets

Each implementation ticket that touches compatibility should include a short
claim block:

```md
Compatibility surface: plugins
Compatibility layers: contract, runtime
Expected stance: adapted
Harness lanes: Lane 2, Lane 3
Reason for divergence: execution now passes through policy and audit mediation
```

This keeps code review aligned with the matrix instead of relying on vague
phrases like "mostly compatible."

## Ownership Boundaries

### `src/plugins`

Owns:

- metadata parsing
- discovery and activation planning
- public-surface and registry contracts
- fixture-based compatibility classification for skills, plugins, and bundles

Must not own:

- enterprise-only runtime policy decisions that require a live execution path
- ad hoc tool execution assertions that belong in `src/agents/tools`

### `src/agents/tools`

Owns:

- tool schema exposure versus execution behavior checks
- runtime mediation assertions for approvals, policy, secrets, and identity
- regression tests that prove a tool stayed contract-compatible while runtime
  semantics adapted

Must not own:

- manifest parsing or bundle discovery logic that belongs in `src/plugins`
- heavy plugin runtime startup for static descriptor tests

## Exit Criteria For This Plan

The conformance harness is ready for implementation when:

- every compatibility claim can be mapped to at least one harness lane
- reviewers can tell whether a test should live in `src/plugins` or
  `src/agents/tools`
- unsupported behavior has a stable rejection vocabulary
- future tickets can add enterprise mediation without weakening manifest-first
  discovery guarantees
