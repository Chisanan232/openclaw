# ControlClaw Skill Code Touchpoints Map

Status: draft planning spec for `CONCLAW-31`.

## Goal

Map the concrete OpenClaw skill code surfaces that later ControlClaw tickets
must preserve, adapt, or wrap when implementing enterprise skill governance.

This document is not a runtime design. It is a follow-up map so later tickets
do not spread skill compatibility work across unrelated subsystems.

## Primary Ownership Split

### Skill discovery and prompt assembly

Primary seams:

- `src/agents/skills.ts`
- `src/agents/skills/workspace.ts`
- `src/agents/skills/local-loader.ts`
- `src/agents/skills/filter.ts`
- `src/agents/skills/agent-filter.ts`

Why it matters:

- these files own how skills are loaded, filtered, compacted, and surfaced to
  runtime prompts
- later tickets that change visible skill inventory or prompt eligibility
  should anchor here rather than inventing a parallel registry

### Skill source and packaging attribution

Primary seams:

- `src/agents/skills/source.ts`
- `src/agents/skills/bundled-dir.ts`
- `src/agents/skills/bundled-context.ts`
- `src/agents/skills/plugin-skills.ts`

Why it matters:

- these files define where a skill came from and which roots are considered
  valid skill sources
- later tickets that add enterprise provenance, signing, or registry mapping
  should preserve these source concepts instead of replacing them with opaque
  runtime-only labels

### Skill metadata and invocation policy

Primary seams:

- `src/agents/skills/frontmatter.ts`
- `src/agents/skills/types.ts`
- `src/agents/skills/config.ts`
- `src/agents/skills/command-specs.ts`
- `src/agents/skills/skill-contract.ts`

Why it matters:

- these files define the metadata and prompt-facing structures that later
  governance work will consume
- enterprise controls should build on these seams for linting, policy, and
  invocation restrictions rather than bypassing them

### Skill status, install, and import lifecycle

Primary seams:

- `src/agents/skills-status.ts`
- `src/agents/skills-install.ts`
- `src/agents/skills-clawhub.ts`

Why it matters:

- these files already model the operator-facing lifecycle for install, update,
  and visible status
- later admission work should preserve recognizable lifecycle stages instead of
  collapsing them into one opaque outcome

### Skill scanning and admission prerequisites

Primary seams:

- `src/security/skill-scanner.ts`
- `src/agents/skills/refresh.ts`
- `src/agents/skills/refresh-state.ts`

Why it matters:

- these files are the closest current seams for static inspection and
  refresh-time bookkeeping
- later enterprise admission tickets should layer risk, lint, and review
  outcomes here rather than bolting them onto unrelated tool or plugin paths

## Follow-Up Ticket Guidance

### Admission and risk tickets

Future tickets should preserve:

- `SKILL.md` entry-file recognition
- source attribution for workspace, bundled, managed, and plugin-exported
  skills
- the distinction between visible and runnable skills

Likely future tickets:

- registry and admission planning that consumes scanner and source data
- provenance and review state that attaches to imported skills without changing
  their basic packaging contract

### Runtime and tool-governance tickets

Future tickets should preserve:

- prompt-facing skill inventory and metadata concepts
- user-invocable versus model-visible distinctions
- stable tool and invocation policy semantics derived from skill metadata

Likely future tickets:

- tool-governance changes that restrict skill-triggered execution
- runtime isolation that keeps the skill contract recognizable while changing
  execution freedom

### Conformance and compatibility-test tickets

Future tickets should verify:

- `SKILL.md` and directory-based discovery still work for supported skill roots
- frontmatter and metadata remain readable without runtime execution
- source attribution remains stable enough for operator diagnostics
- enterprise controls do not silently mutate the preserved skill contract

Likely future tickets:

- compatibility conformance harness work following `CONCLAW-13`
- admission/runtime implementation work that must prove contract preservation

## Reviewer Questions

When later implementation tickets touch skill compatibility, reviewers should
ask:

1. Did the ticket change a real skill seam in `src/agents/skills*` or only add
   a wrapper around it?
2. Is the ticket preserving source attribution and metadata inspection?
3. Did the ticket accidentally move skill governance into unrelated plugin or
   tool subsystems?
4. Can the claimed compatibility still be validated by a cheap discovery or
   contract test before runtime execution?
