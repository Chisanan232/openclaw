# ControlClaw Conformance Suite Operations

Status: draft planning spec for `CONCLAW-47`.

## Goal

Define when the future compatibility conformance suite should run in local
development, CI, and release readiness, and how its results should be consumed
without creating false confidence.

## Local Development Usage

The conformance suite should support a cheap local workflow first.

### Default local expectation

Developers should be able to run the smallest relevant conformance layer for
the surface they touched:

- format/contract checks for manifest, bundle, or skill-shape changes
- schema/interface checks for tool changes
- enterprise mediation checks only when the ticket actually changes policy,
  approval, audit, or runtime gating behavior

### Local goals

- detect compatibility regressions close to the changed surface
- avoid forcing heavy full-runtime runs for metadata-only changes
- encourage tickets to state which conformance layers they expect to affect

### Local anti-goal

The suite should not make local developers run the entire compatibility corpus
for every small metadata change when a narrower proof would be sufficient.

## CI Usage

The conformance suite should run in CI in layers.

### CI lane 1: fast compatibility contracts

Purpose:

- run cheap format and contract checks on preserved surfaces

Examples:

- manifest parsing
- skill packaging classification
- bundle detection
- tool schema and inventory contract checks

Preferred placement:

- alongside or adjacent to existing contract-focused lanes such as
  `test/vitest/vitest.contracts.config.ts`

### CI lane 2: deeper mediation checks

Purpose:

- verify enterprise-constrained cases when policy, approval, audit, or
  governance semantics change

Examples:

- approval-gated tool invocation behavior
- admission-blocked plugin or bundle scenarios
- scanner-constrained skill behavior

Preferred placement:

- targeted shards or suites tied to the relevant enforcement surface

### CI reporting rule

CI should report:

- preserved compatible results
- intentional diverged results
- explicit unsupported results

It should not collapse those into one generic pass/fail number with no semantic
explanation.

## Release-Readiness Usage

Release reviews should use the conformance suite as an explicit compatibility
signal.

### Release-readiness goals

- provide a repeatable summary of preserved versus diverged versus unsupported
  semantics
- replace informal "looks compatible" judgment with a named compatibility
  report
- expose which contract families were verified and which were intentionally out
  of scope

### Release summary expectations

Every future release-readiness report should answer:

- which artifact families were covered
- which compatibility layers were exercised
- which cases remained compatible
- which cases diverged for enterprise reasons
- which cases are unsupported by design

### Release anti-goal

The suite must not create false confidence by reporting bundled first-party
success as ecosystem-wide compatibility proof.

Release summaries should explicitly distinguish:

- bundled first-party compatibility
- third-party contract compatibility
- enterprise-constrained but still supported semantics

## Third-Party Confidence Rule

To avoid false confidence from only testing bundled plugins, future
implementation should require:

- at least one third-party-like fixture per major artifact family where the
  surface is supposed to be public
- explicit labeling when a check only proves bundled behavior
- release summaries that state whether the signal applies to ecosystem-facing
  compatibility or only first-party artifacts

## Adoption Plan For Later Tickets

Later executable conformance work should stage adoption in this order:

1. add fixture taxonomy and reporting vocabulary
2. wire cheap format and contract checks into local and CI contract lanes
3. add enterprise-constrained mediation cases for touched surfaces
4. add a release-readiness compatibility summary that consumes the suite output

## Reviewer Questions

When later tickets operationalize the conformance suite, reviewers should ask:

1. Does the chosen execution point match the cost of the compatibility layer?
2. Is the suite output semantic enough for release review, or only raw pass/fail
   noise?
3. Does the CI plan distinguish compatible, diverged, and unsupported outcomes?
4. Does the suite still avoid bundled-only false confidence and represent
   third-party compatibility expectations explicitly?
