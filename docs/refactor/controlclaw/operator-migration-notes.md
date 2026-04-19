# ControlClaw Operator Migration Notes

Status: draft planning spec for `CONCLAW-14`.

## Goal

Give operators a concrete migration frame for bringing upstream OpenClaw
artifacts into ControlClaw without assuming that "compatible" means "runs with
identical trust semantics."

This is not an end-user install guide. It is a planning note for later
admission, rollout, and operator documentation work.

## Core Message

Operators should read ControlClaw compatibility in two layers:

- upstream artifacts can remain recognizable by packaging and schema
- enterprise governance may still change how those artifacts are admitted,
  enabled, and executed

## Migration Notes By Surface

### Skills

What should feel familiar:

- skills still center on `SKILL.md`
- skills are still installed into and discovered from the workspace skill tree
- operators can still reason about install, update, and visible-skill status as
  the main operational concepts

What operators must relearn:

- a skill that parses or installs successfully may still be blocked by scanner,
  policy, or approval outcomes
- a skill can remain discoverable while carrying enterprise trust metadata
- execution success is not implied by packaging success

### Native plugins

What should feel familiar:

- native plugins still declare `openclaw.plugin.json`
- config validation still begins from manifest metadata before runtime
- enablement and setup remain recognizable control-plane concepts

What operators must relearn:

- plugin admission, signing, or registry policy can become a prerequisite for
  runtime use
- runtime permissions may be narrower than the upstream plugin expected
- plugin compatibility does not promise unrestricted in-process execution

### Compatible bundles

What should feel familiar:

- Codex, Claude, and Cursor bundle formats remain the compatibility entry path
- bundle inspection should still explain detected format and mapped features
- mapped skills, hooks, MCP settings, and bundle defaults remain recognizable
  concepts

What operators must relearn:

- bundle detection is not bundle admission
- some mapped content may be denied or mediated even when the bundle layout is
  supported
- diagnostics should be treated as an explanation surface, not as a guarantee
  that all detected bundle features will execute

### Tools

What should feel familiar:

- supported tools still expose recognizable names and schemas
- operators can still reason about tool capability from discovery or catalog
  output

What operators must relearn:

- tool calls may now require approval, policy satisfaction, secret mediation,
  or enterprise routing
- runtime-denied tool calls are part of the supported enterprise model, not
  necessarily a compatibility failure

## Recommended Operator Warnings For Later Docs

Later operator-facing docs should state these warnings explicitly:

- "format-compatible" does not mean "trusted"
- "discoverable" does not mean "admitted"
- "schema-compatible" does not mean "ungoverned execution"
- "installed" does not mean "approved for runtime use"

## Rollout Guidance For Later Tickets

When later rollout or admission tickets build operator UX, they should preserve
these explanations:

- show the artifact format or contract surface that was recognized
- show the governance decision that changed runtime behavior
- separate parse, install, enable, admit, and execute states so operators do
  not collapse them into one success/failure concept

## Cross-Links For Future Planning

This migration framing should be referenced by later work in:

- admission and registry planning
- runtime isolation planning
- rollout and operator UX planning
- any future contract tests or docs that explain ControlClaw compatibility to
  stakeholders
