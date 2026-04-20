# ControlClaw Skill Compatibility Contract

Status: draft planning spec for `CONCLAW-31`.

## Goal

Define the exact skill-facing contract surfaces that ControlClaw should preserve
from OpenClaw before runtime migration work begins.

This document narrows the broader compatibility language from
`docs/refactor/controlclaw/compatibility-matrix.md` and
`docs/refactor/controlclaw/preserved-contract-surfaces.md` down to the skill
surface alone.

## Preservation Rule

ControlClaw preserves the externally recognizable skill contract before it
preserves upstream skill runtime freedom.

That means:

- preserve `SKILL.md` as the canonical skill entry file
- preserve recognizable skill directory and discovery assumptions where
  practical
- preserve inventory and prompt-building concepts that let operators and later
  runtime code identify a skill without executing it
- do not preserve upstream assumptions that a well-formed skill is trusted
  enough to run immediately

## Preserved Skill Contract

### Entry file and folder assumptions

Preserve:

- `SKILL.md` as the canonical skill entry filename
- one skill per readable directory rooted in a workspace, managed skill tree,
  bundled skill tree, or plugin-owned exported skill directory
- the expectation that a skill can be reasoned about from its directory,
  `SKILL.md`, and adjacent metadata without first executing its code
- the operator expectation that imported skills still look like skills rather
  than plugin manifests or bundle manifests

Primary seams:

- `src/agents/skills/local-loader.ts`
- `src/agents/skills/workspace.ts`
- `src/agents/skills/bundled-dir.ts`
- `src/agents/skills/plugin-skills.ts`

Compatibility bar:

- `format`: preserve `SKILL.md` and directory-oriented discovery
- `contract`: preserve recognizable skill roots and source attribution
- `runtime`: may be mediated by later enterprise controls

### Discovery and inventory assumptions

Preserve:

- the existence of inventory flows that enumerate visible skills without
  executing them
- the idea that a skill has a stable name, description, source, and file path
- source attribution concepts such as workspace, bundled, plugin, or managed
  skill origin
- the expectation that prompt-building and status commands can decide whether a
  skill is visible, filtered, or hidden before runtime execution

Primary seams:

- `src/agents/skills.ts`
- `src/agents/skills/workspace.ts`
- `src/agents/skills/source.ts`
- `src/agents/skills-status.ts`

Compatibility bar:

- `format`: preserve skill identity fields exposed by inventory flows
- `contract`: preserve visible-skill and filtered-skill concepts
- `runtime`: visibility does not imply admission or execution

### Frontmatter and metadata assumptions

Preserve:

- the expectation that a skill can carry frontmatter-derived metadata alongside
  the markdown body
- recognizable OpenClaw metadata concepts such as install hints, required env
  vars, and invocation policy
- the ability for later control-plane logic to reason about metadata without
  forcing skill execution

Primary seams:

- `src/agents/skills/frontmatter.ts`
- `src/agents/skills/types.ts`
- `src/agents/skills/config.ts`

Compatibility bar:

- `format`: preserve frontmatter-as-metadata expectations for supported fields
- `contract`: preserve metadata-driven filtering and install guidance concepts
- `runtime`: metadata is an input to governance, not a bypass around it

### Prompt and command-surface assumptions

Preserve:

- the idea that eligible skills can be surfaced into the model-facing available
  skills prompt
- the expectation that skill visibility can differ from user-invocable
  behavior
- recognized command-spec concepts for bundle-backed or metadata-backed skill
  commands

Primary seams:

- `src/agents/skills/skill-contract.ts`
- `src/agents/skills/workspace.ts`
- `src/agents/skills/command-specs.ts`
- `src/agents/skills/agent-filter.ts`

Compatibility bar:

- `format`: preserve the existence of a recognizable available-skills prompt
  surface
- `contract`: preserve model-visible versus user-invocable distinctions
- `runtime`: later tickets may gate actual execution paths

## Byte Or Shape Compatibility

ControlClaw should preserve these by exact or near-exact shape when it claims
skill compatibility:

- `SKILL.md` as the entry filename
- directory-oriented skill packaging and discovery
- stable skill name/description/file-path/source concepts
- supported frontmatter and metadata shapes used for install, visibility, and
  invocation policy

## Concept Compatibility

ControlClaw may preserve these as recognizable concepts rather than identical
runtime behavior:

- install and update flows for imported skills
- visible skill inventory and prompt assembly
- command-spec generation for supported skill-backed commands
- source attribution for bundled, workspace, managed, or plugin-exported skills

## Reviewer Questions

When later tickets claim skill compatibility, reviewers should ask:

1. Does the ticket preserve `SKILL.md` and the skill-folder model, or only the
   general idea of a skill?
2. Does the ticket preserve inventory and metadata inspection without runtime
   execution?
3. Is the ticket changing a real skill contract surface, or only an internal
   loading implementation?
4. If runtime behavior changes, does the ticket still preserve the documented
   skill discovery and metadata contract?
