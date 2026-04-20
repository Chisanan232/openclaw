# ControlClaw Skill Enterprise Constraints

Status: draft planning spec for `CONCLAW-31`.

## Goal

Document the enterprise-only controls, unsupported assumptions, and operator
migration guidance that define how ControlClaw stays skill-compatible without
reusing the upstream trust model.

This document should be read with:

- `docs/refactor/controlclaw/compatibility-matrix.md`
- `docs/refactor/controlclaw/skill-compatibility-contract.md`

## Governing Rule

If a skill behavior would force ControlClaw to choose between:

- preserving the upstream expectation of low-friction skill execution
- and applying enterprise governance

enterprise governance wins.

## Enterprise Constraints That May Adapt Runtime Behavior

These constraints are part of the supported ControlClaw model even when a skill
remains contract-compatible.

### Linting and static validation

ControlClaw may require:

- markdown and frontmatter validation before a skill is admitted
- policy-aware linting for commands, metadata, or referenced paths
- deterministic rejection of malformed or incomplete skill packages before they
  become runnable

Why:

- preserving `SKILL.md` does not require preserving permissive ingest behavior
- enterprise rollout needs predictable validation outcomes instead of ad hoc
  operator judgment

### Risk scoring and scanner outcomes

ControlClaw may require:

- risk scoring derived from static findings, origin, or enterprise provenance
- scanner-mediated allow, review, or deny outcomes before runtime use
- visible trust annotations on otherwise compatible skills

Why:

- a well-formed skill package is not proof of safe execution
- enterprise operators need an explicit control-plane decision, not a silent
  runtime assumption

### Tool-usage and execution restrictions

ControlClaw may require:

- narrower tool availability for imported skills
- policy or approval gates around skill-triggered tool use
- environment, secret, or runtime isolation boundaries that differ from
  upstream expectations

Why:

- the skill contract includes discoverability and metadata, not unrestricted
  tool authority
- enterprise governance must be able to constrain model-triggered actions

### Identity and audit requirements

ControlClaw may require:

- auditable operator or service identity for skill admission and execution
- explicit records for who imported, approved, or executed a skill
- state transitions that distinguish parse, ingest, admit, and execute

Why:

- enterprise workflows cannot rely on implicit trust or unverifiable operator
  intent
- later admission and runtime tickets need stable state concepts to build on

## Unsupported Skill Assumptions

These behaviors should be documented as unsupported rather than accidentally
reintroduced later.

### Packaging success implies runtime trust

Unsupported:

- treating a readable `SKILL.md` directory as sufficient for runtime use
- assuming successful import or inventory listing means the skill is approved
  for execution

### Direct execution without enterprise mediation

Unsupported:

- execution paths that bypass linting, scoring, approval, audit, or policy
  because the skill looks upstream-compatible
- operator-only bypasses that create a second governance regime outside the
  main control plane

### Unlimited tool behavior inherited from upstream assumptions

Unsupported:

- assuming skill-authored instructions retain upstream tool freedom by default
- treating model-initiated tool use as automatically safe because the skill was
  imported from a known ecosystem format

### Ad hoc migration judgment

Unsupported:

- approving or denying imported skills based only on operator intuition
- re-deciding the meaning of skill compatibility ticket by ticket without one
  stable contract

## Migration Notes For Imported Skills

Operators bringing existing OpenClaw skills into ControlClaw should expect two
layers of compatibility:

- the skill should still look recognizable as a `SKILL.md`-based artifact
- enterprise controls may still change whether it is admitted, how it is
  labeled, and which runtime actions it may take

### What should feel familiar

- skills remain centered on `SKILL.md`
- skills remain directory-based artifacts that can be discovered and inventoried
- frontmatter and metadata remain the main compatibility surface for install
  hints, visibility, and invocation policy
- visible-skill and user-invocable concepts remain recognizable even if later
  governance narrows them

### What operators must relearn

- import success does not imply runtime approval
- scanner or lint results can leave a skill visible but blocked
- tool restrictions can change runtime behavior without changing the skill’s
  basic packaging
- enterprise provenance and audit data can become part of the normal skill
  lifecycle

## Reviewer Questions

Reviewers should ask these questions on later runtime or admission tickets:

1. Does the ticket preserve the documented skill contract while adapting only
   runtime control?
2. Does the ticket accidentally weaken linting, scoring, tool restrictions, or
   auditability?
3. Should the behavior remain unsupported because it conflicts with enterprise
   governance?
4. Does the operator-facing outcome clearly distinguish compatibility from
   trust?
