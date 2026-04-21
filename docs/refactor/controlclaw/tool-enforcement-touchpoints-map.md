# ControlClaw Tool Enforcement Touchpoints Map

Status: draft planning spec for `CONCLAW-33`.

## Goal

Map the concrete OpenClaw tool schema, policy, and invocation code surfaces
that later ControlClaw tickets must preserve, adapt, or wrap when implementing
enterprise enforcement.

This document is not a runtime design. It is a follow-up implementation map so
later tickets do not scatter tool-compatibility work across unrelated
subsystems.

## Primary Ownership Split

### Tool schema and result-envelope definitions

Primary seams:

- `src/agents/tools/common.ts`
- `src/agents/tools/message-tool.ts`
- `src/agents/tools/web-tools.ts`
- `src/agents/tools/owner-only-tools.ts`

Why it matters:

- these files define the actual tool names, parameter schemas, result helpers,
  and owner-only metadata that shape the external contract
- later tickets that change schema semantics should anchor here rather than
  burying contract changes in policy or gateway code

### Tool catalog and inventory semantics

Primary seams:

- `src/agents/tool-catalog.ts`
- `src/gateway/tool-resolution.ts`

Why it matters:

- these files define how tools are grouped, profiled, surfaced, and scoped
  before execution
- later governance tickets should preserve the distinction between visible tool
  inventory and executable tool authority

### Policy and owner-only gating

Primary seams:

- `src/agents/tool-policy.ts`
- `src/agents/tool-policy-pipeline.ts`
- `src/agents/pi-tools.policy.js`

Why it matters:

- these files define the current policy layers that filter, deny, or reshape
  the effective tool set before execution
- later enterprise policy work should build on these seams rather than
  introducing parallel tool-allow logic elsewhere

### Hook, approval, and pre-execution governance

Primary seams:

- `src/agents/pi-tools.before-tool-call.ts`
- `src/agents/pi-tools.before-tool-call.runtime.ts`
- `src/plugins/hook-runner-global.ts`

Why it matters:

- these files define the current before-tool-call mediation path, including
  block, approval, and adjusted-params behavior
- later audit and approval tickets should preserve this explicit pre-execution
  lifecycle instead of collapsing it into hidden execution side effects

### Gateway invocation and transport enforcement

Primary seams:

- `src/gateway/tools-invoke-http.ts`
- `src/gateway/tool-resolution.ts`
- `src/gateway/http-utils.ts`

Why it matters:

- these files define the HTTP invocation contract, sender/owner context, scoped
  tool resolution, and transport-level policy behavior
- later enterprise gateway work should preserve the stable invoke interface
  while extending execution governance

## Follow-Up Ticket Guidance

### Policy and approval tickets

Future tickets should preserve:

- stable tool names and schemas
- the distinction between discovery, validation, authorization, and approval
- owner-only and scoped-policy semantics as explicit control-plane concepts

Likely future tickets:

- policy and approval integrations that refine execution rights without
  mutating schemas
- audit producer integrations that observe or gate tool calls before execution

### Audit and egress-governance tickets

Future tickets should preserve:

- the schema-visible call shape
- explicit hook and approval mediation points
- the separation between invocation contract and downstream execution side
  effects

Likely future tickets:

- audit trail production for tool requests and decisions
- egress or data-governance work that constrains execution after schema
  validation

### Conformance and compatibility-test tickets

Future tickets should verify:

- supported tool names and parameter shapes remain stable
- inventories and gateway invoke paths still expose the same basic contract
- enterprise controls do not silently mutate the preserved schema/interface
  surface
- policy, approval, and audit steps remain distinguishable from plain input
  validation failures

Likely future tickets:

- compatibility conformance harness work following `CONCLAW-13`
- policy and gateway tests that prove schema compatibility despite execution
  mediation

## Reviewer Questions

When later implementation tickets touch tool compatibility, reviewers should
ask:

1. Did the ticket change a real tool schema or invocation seam, or only an
   execution path behind it?
2. Is the ticket preserving tool inventory and validation semantics while
   changing only governance?
3. Did the ticket accidentally move schema semantics into hidden policy or
   transport logic?
4. Can the claimed compatibility still be validated by a cheap discovery or
   contract test before executing the tool?
