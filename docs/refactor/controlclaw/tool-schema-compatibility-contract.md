# ControlClaw Tool Schema Compatibility Contract

Status: draft planning spec for `CONCLAW-33`.

## Goal

Define the exact tool-schema and invocation-interface surfaces that
ControlClaw should preserve from OpenClaw before policy, approval, audit, and
egress-governance rewrites begin.

This document narrows the broader compatibility language from
`docs/refactor/controlclaw/compatibility-matrix.md` and
`docs/refactor/controlclaw/preserved-contract-surfaces.md` down to the tool
surface alone.

## Preservation Rule

ControlClaw preserves tool schemas and invocation interfaces before it
preserves upstream execution freedom.

That means:

- preserve stable tool names, parameter names, and result-shape expectations
  where ControlClaw claims compatibility
- preserve discoverability and inventory of tool schemas before execution
- preserve the distinction between a callable schema contract and a separately
  governed runtime invocation decision
- do not preserve the upstream assumption that a valid tool call is entitled to
  execute without enterprise mediation

## Preserved Tool Contract

### Tool identity and schema assumptions

Preserve:

- stable tool identity through tool name and schema shape
- the expectation that tool definitions publish a parameter schema before
  runtime execution
- the ability to inspect whether a tool is core-owned, plugin-owned, or
  owner-only without calling the tool
- the distinction between static schema compatibility and execution-time policy

Primary seams:

- `src/agents/tools/common.ts`
- `src/agents/tool-catalog.ts`
- `src/agents/tools/message-tool.ts`
- `src/agents/tools/web-tools.ts`
- `src/agents/tools/owner-only-tools.ts`

Compatibility bar:

- `format`: preserve tool names, parameter keys, and result-envelope concepts
- `contract`: preserve discoverable schema and callable interface expectations
- `runtime`: actual invocation remains governable by later enterprise controls

### Invocation interface assumptions

Preserve:

- the expectation that tools can be invoked through a stable name plus
  structured args payload
- the idea that transport surfaces such as HTTP invocation still operate on the
  same basic tool/action/args contract
- the expectation that input validation failures are distinct from transport or
  policy failures
- the ability to reason about owner-only or other restricted tools from the
  interface layer without fully executing them

Primary seams:

- `src/gateway/tools-invoke-http.ts`
- `src/gateway/tool-resolution.ts`
- `src/agents/tools/common.ts`
- `src/agents/tool-policy.ts`

Compatibility bar:

- `format`: preserve invocation payload shape for supported tool surfaces
- `contract`: preserve the callable interface and validation model
- `runtime`: success may be blocked or mediated by policy, approval, audit, or
  governance state

### Discovery and inventory assumptions

Preserve:

- the existence of tool catalogs and scoped tool inventories before invocation
- the idea that profiles, policy filters, and gateway scoping change visible
  tool sets without mutating the underlying schema contract
- the expectation that tools can be filtered, denied, or hidden while remaining
  recognizable to the control plane

Primary seams:

- `src/agents/tool-catalog.ts`
- `src/gateway/tool-resolution.ts`
- `src/agents/tool-policy.ts`

Compatibility bar:

- `format`: preserve recognizable tool ids and display-summary concepts
- `contract`: preserve inventory and policy-filtering concepts
- `runtime`: visibility still does not guarantee execution

## Interface-Stable Versus Execution-Dependent Semantics

### Interface-stable semantics

ControlClaw should preserve these by exact or near-exact shape when it claims
tool compatibility:

- supported tool names
- supported parameter keys and schema shapes
- recognizable result-envelope concepts for success or failure payloads
- the transport-level invocation contract of tool name plus args

### Execution-dependent semantics

ControlClaw may preserve these as recognizable concepts rather than identical
runtime behavior:

- whether a visible tool is actually invocable
- whether a valid request executes immediately or pauses for approval
- whether a call is blocked by owner-only, policy, audit, or egress rules
- whether the execution path runs locally, through the gateway, or through a
  later enterprise broker

## Reviewer Questions

When later tickets claim tool compatibility, reviewers should ask:

1. Does the ticket preserve the tool name and schema contract, or only the
   general idea of the tool?
2. Does the ticket keep tool discoverability and validation separate from
   execution decisions?
3. Is the ticket changing a real tool contract surface, or only an internal
   execution path?
4. If runtime behavior changes, does the ticket still preserve the documented
   schema and invocation interface?
