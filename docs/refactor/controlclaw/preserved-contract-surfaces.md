# ControlClaw Preserved Contract Surfaces

Status: draft planning spec for `CONCLAW-14`.

## Goal

Describe the concrete OpenClaw-facing contract surfaces that ControlClaw should
preserve so later runtime tickets can tell which parts of the ecosystem must
remain byte-compatible, shape-compatible, or operationally recognizable.

This document is the concrete preserved-contract inventory that sits on top of
the broader decision vocabulary from
`docs/refactor/controlclaw/compatibility-matrix.md`.

## Preservation Rule

ControlClaw preserves ecosystem-facing interfaces before it preserves upstream
implementation structure.

That means:

- preserve artifact formats and stable discovery shapes where practical
- preserve documented contract surfaces that external users or artifacts depend
  on
- do not treat internal module layouts or trust assumptions as part of the
  preserved contract unless they are already externalized and documented

## Preserved Surface Inventory

### `SKILL.md` skill contracts

Preserve:

- `SKILL.md` as the canonical skill entry file name and skill identity anchor
- skill packaging as workspace-readable directories that can be discovered,
  summarized, and loaded through the skill ingestion flow
- skill install and update expectations that produce a recognizable skill
  directory under the workspace skill tree
- skill discovery/status behavior that lets operators and automation determine
  whether a skill is present and visible

Primary seams:

- `src/agents/skills.ts`
- `src/agents/skills-install.ts`
- `src/agents/skills-status.ts`
- `src/agents/skills-clawhub.ts`
- `src/security/skill-scanner.ts`

Compatibility bar:

- `format`: preserve `SKILL.md`-based packaging and discovery
- `contract`: preserve install, update, and visible-skill inventory concepts
- `runtime`: may be adapted by policy, approval, secret, or scanner mediation

### Native plugin manifest contracts

Preserve:

- `openclaw.plugin.json` as the canonical native plugin manifest
- manifest-first config validation before plugin runtime executes
- documented manifest fields used for identity, config schema, setup hints,
  activation hints, auth metadata, and capability ownership snapshots
- the distinction between native plugin manifests and compatible bundle
  manifests

Primary seams:

- `docs/plugins/manifest.md`
- `src/plugins/bundled-plugin-metadata.ts`
- `src/plugins/config-contracts.ts`
- `src/plugins/public-surface-loader.ts`

Compatibility bar:

- `format`: preserve manifest file name and schema shape for supported fields
- `contract`: preserve metadata-first discovery and validation
- `runtime`: plugin execution remains adaptable and governance-mediated

### Compatible bundle layout contracts

Preserve:

- bundle detection for Codex, Claude, and Cursor layouts
- support for known bundle manifest markers and manifestless Claude layout
  detection where currently documented
- documented bundle-to-feature mapping concepts for skills, hooks, MCP config,
  LSP defaults, and settings defaults
- the operator expectation that bundle inspection explains what is mapped,
  detected-only, or unsupported

Primary seams:

- `docs/plugins/bundles.md`
- `src/plugins/bundle-manifest.ts`
- `src/plugins/bundle-commands.ts`
- `src/plugins/bundle-mcp.ts`
- `src/plugins/discovery.ts`

Compatibility bar:

- `format`: preserve layout detection and metadata extraction
- `contract`: preserve the mapping contract described in bundle docs
- `runtime`: mapped content may still be gated by enterprise admission and
  execution rules

### Tool schema contracts

Preserve:

- tool names, parameter shapes, and result-shape expectations for supported
  tool surfaces
- inspectable tool catalogs and schema visibility before execution
- the distinction between static tool contracts and mediated runtime execution

Primary seams:

- `src/agents/tools/message-tool.ts`
- `src/agents/tools/web-tools.ts`
- `src/agents/tools/sessions-send-tool.ts`
- `src/agents/tools/owner-only-tools.ts`

Compatibility bar:

- `format`: preserve tool schema serialization and argument naming
- `contract`: preserve callable tool contract for supported tools
- `runtime`: execution can change through policy, approval, secret, and audit
  mediation

## What Is Preserved By Shape Versus By Concept

### Byte or shape compatibility

ControlClaw should preserve these by exact or near-exact shape when it claims
compatibility:

- `SKILL.md` entry-file convention
- `openclaw.plugin.json` manifest file name and documented schema contract
- documented compatible bundle markers and layout conventions
- supported tool schema field names and argument/result envelopes

### Concept compatibility

ControlClaw may preserve these as recognizable concepts rather than identical
runtime behavior:

- skill installation and visibility workflows
- plugin enablement and setup workflows
- bundle inspection and mapping outcomes
- tool execution requests that now pass through governance controls

## Escalation Rule

Later tickets must escalate for an architecture decision if they need to change:

- a documented file name or manifest marker
- a supported schema field name or required field contract
- the documented shape of a supported tool surface
- the existence of a currently preserved discovery or inspection surface

Changing those is a contract change, not a local implementation detail.

## Review Checklist

When a later ticket says it preserves compatibility, reviewers should ask:

1. Is the preserved claim about `SKILL.md`, `openclaw.plugin.json`, bundle
   layout detection, or a tool schema?
2. Is the ticket preserving exact shape, or only preserving the concept?
3. If runtime behavior changes, does the ticket still preserve the discovery or
   schema contract?
4. Is the ticket changing a documented external surface or only an internal
   implementation detail?
