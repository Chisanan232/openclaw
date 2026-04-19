# ControlClaw Compatibility Coverage Map

Status: follow-up coverage map for `CONCLAW-13`.

## Purpose

This map identifies where future implementation tickets should add or extend
tests when they claim compatibility preservation or intentional divergence.

It is deliberately scoped to existing OpenClaw directories so early ControlClaw
work can anchor new tests before a larger enterprise module tree exists.

## Coverage Map

| Surface              | Primary planning doc                                    | Current repo touchpoints                                                                                                                                   | Follow-up expectation                                                                                                         |
| -------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Skills               | `docs/refactor/controlclaw/compatibility-matrix.md`     | `src/agents/skills.ts`, `src/agents/skills-install.ts`, `src/agents/skills-status.ts`, `src/agents/skills-clawhub.ts`, and `src/security/skill-scanner.ts` | add skill-fixture parsing, install/update, and scanner-classification tests before enterprise-only execution changes land     |
| Native plugins       | `docs/refactor/controlclaw/compatibility-matrix.md`     | `src/plugins/contracts/loader.contract.test.ts`, `src/plugins/contracts/registry.contract.test.ts`, `src/plugins/contracts/plugin-sdk-subpaths.test.ts`    | add matrix-backed fixtures for preserved, adapted, diverged, and unsupported plugin scenarios                                 |
| Compatible bundles   | `docs/refactor/controlclaw/compatibility-matrix.md`     | `src/plugins/bundle-manifest.test.ts`, `src/plugins/bundle-mcp.test.ts`, `src/plugins/bundle-commands.test.ts`                                             | add admission-aware parsing tests that keep bundle detection format-compatible while allowing enterprise rejection downstream |
| Tools                | `docs/refactor/controlclaw/conformance-harness-plan.md` | `src/agents/tools/message-tool.test.ts`, `src/agents/tools/web-tools.fetch.test.ts`, `src/agents/tools/sessions-send-tool.a2a.test.ts`                     | add explicit assertions for schema preservation versus runtime mediation outcomes                                             |
| Config habits        | `docs/refactor/controlclaw/compatibility-matrix.md`     | `src/plugins/config-contracts.test.ts`, `src/plugins/config-schema.test.ts`, `src/plugins/config-policy.test.ts`                                           | add tests that keep config discovery stable while documenting identity, secret, or approval gating of applied behavior        |
| Unsupported behavior | both planning docs                                      | `src/plugins/contracts/**` plus targeted tool tests                                                                                                        | add negative fixtures that fail with stable reasons and prevent accidental compatibility creep                                |

## Sequencing Guidance

### Phase 1

Add low-cost fixtures first:

- skill packaging and workspace/install classification
- manifest parsing and bundle layout classification
- SDK subpath and public-surface contract coverage
- tool schema visibility versus execution mediation checks

### Phase 2

Add deeper enterprise mediation checks:

- admission state, signing state, and registry-governed enablement
- approval-gated and identity-aware runtime behavior
- unsupported-path regressions for enterprise control-plane decisions

### Rewrite horizon

Carry the same fixtures forward:

- preserve the compatibility fixture corpus even if runtime owners move into
  new Python or Rust components
- keep format and contract fixtures stable so rewrites are judged against the
  same preserved promises

## Open Follow-Ups

- define the first shared fixture corpus location once the ControlClaw-specific
  module tree exists
- decide whether compatibility fixtures should live beside `src/agents/skills*`,
  `src/plugins`, and `src/agents/tools` tests or in a dedicated enterprise
  contract test package
- add a PR checklist item requiring a compatibility classification whenever a
  ticket claims ecosystem preservation
