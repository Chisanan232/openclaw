# ControlClaw Unsupported And Diverged Semantics

Status: draft planning spec for `CONCLAW-14`.

## Goal

Document the upstream-looking behaviors that ControlClaw does not preserve as
runtime guarantees, either because they are intentionally unsupported or
because enterprise governance deliberately changes their execution semantics.

This document should be read with:

- `docs/refactor/controlclaw/compatibility-matrix.md`
- `docs/refactor/controlclaw/preserved-contract-surfaces.md`

## Decision Rule

If a behavior would force ControlClaw to choose between:

- preserving the upstream trust model
- and enforcing enterprise governance

enterprise governance wins.

## Unsupported Semantics

These behaviors should be documented as unsupported rather than allowed to
re-enter later by accident.

### Untrusted artifact execution without mediation

Unsupported:

- treating a valid `SKILL.md`, bundle, or plugin manifest as sufficient proof
  that the artifact is safe to execute
- loading compatible artifacts directly into privileged runtime paths just
  because the packaging format parses successfully

Why:

- format compatibility is not a trust decision
- ControlClaw must allow scanning, admission, approval, and audit boundaries to
  block otherwise well-formed artifacts

### Trusting operators or automation to bypass governance by default

Unsupported:

- direct execution paths that skip approval, policy, identity, or audit because
  the caller is assumed to be trusted
- claiming compatibility based on operator convenience when the path would
  create an unreviewable control-plane bypass

Why:

- operator surface consistency is part of the enterprise product model
- dashboard, CLI, and API cannot become separate governance regimes

### Preserving internal implementation structure as a contract

Unsupported:

- treating current `src/**` module shapes as something external users can rely
  on
- requiring future runtime work to keep upstream internal loader or execution
  structure only because a compatibility claim was written too loosely

Why:

- ControlClaw preserves external contracts, not incidental source layout
- later rewrite work needs room to move internals without breaking real
  promises

## Enterprise-Diverged Runtime Semantics

These behaviors are expected to diverge at runtime even when format or contract
compatibility is preserved.

### Skills

Likely divergence:

- install or execution can be blocked by scanning, policy, or approval
- skill visibility may include enterprise status or trust annotations
- skill execution can require a more explicit identity or audit trail than
  upstream assumptions

Preserved contract:

- `SKILL.md` packaging, discovery, and install/update concepts

### Native plugins

Likely divergence:

- enablement can depend on enterprise admission or signing state
- execution may be sandboxed, remote, or policy-gated
- setup success may no longer mean immediate unrestricted runtime access

Preserved contract:

- `openclaw.plugin.json` manifest shape and manifest-first discovery contract

### Compatible bundles

Likely divergence:

- successful bundle detection does not guarantee that all bundle content will be
  admitted or executed
- mapped content can be selectively allowed, denied, or routed through managed
  registries
- detected-but-not-executed bundle features may remain visible in diagnostics
  while staying blocked in runtime

Preserved contract:

- bundle layout detection and documented mapping model

### Tools

Likely divergence:

- schemas remain callable, but execution may return approval-required or
  policy-denied outcomes
- tool execution can require secret mediation or enterprise routing
- tool results can include explicit governance outcomes rather than silent
  pass-through behavior

Preserved contract:

- tool name and schema contract for supported surfaces

## Escalation Path For Compatibility Breaks

Later runtime tickets should not silently widen this unsupported list or narrow
it through implementation drift.

When a ticket needs to change one of these decisions, it should state:

- which surface changes
- whether the change upgrades an unsupported behavior to adapted/preserved or
  downgrades a preserved surface into unsupported
- what enterprise pressure forced the change
- whether `CONCLAW-14` and `CONCLAW-13` need updates before the runtime change
  lands

## Reviewer Prompts

Reviewers should ask these questions whenever a runtime PR claims
"OpenClaw-compatible":

1. Is the PR preserving the external contract, or only restoring upstream-like
   runtime behavior?
2. Does the PR accidentally weaken approval, policy, audit, secret, or
   identity controls?
3. Should the behavior remain unsupported because it conflicts with the
   ControlClaw trust model?
4. If runtime divergence is intentional, is that divergence explicit and
   documented?
