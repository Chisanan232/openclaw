# ControlClaw Conformance Fixture Matrix

Status: draft planning spec for `CONCLAW-47`.

## Goal

Define the fixture categories, expected result labels, and reporting vocabulary
for the future compatibility conformance suite.

This document exists so later executable tests can share one fixture taxonomy
instead of inventing per-surface labels.

## Fixture Categories

Every compatibility fixture should declare both an artifact family and an
expected result class.

### Artifact families

- `skill`
- `native-plugin`
- `compatible-bundle`
- `install-metadata`
- `tool-schema`

### Fixture case classes

#### Valid

Represents:

- a shape that should remain compatible on the documented contract surface

Use for:

- preserved tool schemas
- supported `SKILL.md` layouts
- valid `openclaw.plugin.json` manifests
- supported bundle layouts and metadata

#### Invalid

Represents:

- malformed or out-of-contract input that should fail parsing, validation, or
  discovery

Use for:

- missing required manifest fields
- malformed skill packaging
- broken bundle markers
- tool-schema inputs that violate the expected interface

#### Legacy

Represents:

- older-but-still-recognized input shapes that should continue to classify in a
  documented way

Use for:

- normalized legacy plugin ids or aliases
- supported older bundle layouts
- older skill-install metadata patterns that still map to a recognized contract

#### Enterprise-constrained

Represents:

- contract-compatible input whose execution or activation semantics are changed
  by enterprise governance

Use for:

- parseable but scanner-blocked skills
- discoverable but admission-blocked plugins
- visible tool schemas with approval-gated execution
- supported bundles that are recognized but rejected downstream

## Expected Result Labels

Every fixture should declare one of these result labels:

- `compatible`
- `diverged`
- `unsupported`

### `compatible`

Meaning:

- the artifact still satisfies the preserved format or contract claim

Notes:

- this does not require identical runtime behavior
- a fixture can be `compatible` at the schema level and still later become
  enterprise-constrained at execution time

### `diverged`

Meaning:

- the artifact remains recognizable, but enterprise behavior intentionally
  changes the expected runtime or operator semantics

Notes:

- this should be reported explicitly rather than shown as a plain failure
- the suite should include the divergence reason, not just the label

### `unsupported`

Meaning:

- the artifact or behavior is outside the documented compatibility promise

Notes:

- unsupported cases should fail with a stable reason code or narrative category
- unsupported must not be reported as an ambiguous generic regression

## Reporting Fields For Each Fixture

Each future executable fixture should report at least:

- `artifactFamily`
- `fixtureClass`
- `compatibilityLayer`
- `expectedLabel`
- `reasonCode`
- `notes`

### Compatibility layers

Use the same layer language as the planning docs:

- `format`
- `contract`
- `runtime`
- `trust-model`

## Example Matrix

| Artifact family     | Fixture class            | Compatibility layer | Expected label | Example                                                           |
| ------------------- | ------------------------ | ------------------- | -------------- | ----------------------------------------------------------------- |
| `skill`             | `valid`                  | `format`            | `compatible`   | readable `SKILL.md` under a supported skill root                  |
| `skill`             | `enterprise-constrained` | `runtime`           | `diverged`     | parseable skill that scanner/policy blocks                        |
| `native-plugin`     | `valid`                  | `contract`          | `compatible`   | manifest-first discovery exposes documented metadata              |
| `native-plugin`     | `invalid`                | `format`            | `unsupported`  | malformed `openclaw.plugin.json` missing required contract fields |
| `compatible-bundle` | `legacy`                 | `format`            | `compatible`   | older supported bundle layout still classifies correctly          |
| `compatible-bundle` | `enterprise-constrained` | `runtime`           | `diverged`     | recognized bundle rejected by enterprise admission                |
| `tool-schema`       | `valid`                  | `contract`          | `compatible`   | supported tool name and schema still invocable by interface       |
| `tool-schema`       | `enterprise-constrained` | `runtime`           | `diverged`     | schema-valid tool call becomes approval-gated                     |

## Fixture Authoring Rules

Future fixture authors should:

- keep fixture inputs minimal and surface-specific
- avoid embedding bundled-only assumptions into third-party compatibility
  fixtures
- separate parse/validation assertions from execution/governance assertions
- prefer one reason code per failure path so release reporting stays coherent

## Release Reporting Expectations

Release and readiness reviews should summarize the suite using these buckets:

- `compatible`: preserved contract still holds
- `diverged`: contract preserved, enterprise semantics intentionally changed
- `unsupported`: not part of the promised compatibility surface

The reporting must make unsupported cases explicit so they do not appear as
silent regressions or accidental pass/fail noise.

## Reviewer Questions

When later tickets add compatibility fixtures, reviewers should ask:

1. Is the fixture tagged with the correct artifact family and case class?
2. Does the expected label distinguish compatible, diverged, and unsupported
   clearly?
3. Is the result proving the right compatibility layer?
4. Would this fixture still make sense for a third-party artifact, or is it
   accidentally coupled to bundled implementation details?
