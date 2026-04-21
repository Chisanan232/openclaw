# ControlClaw Tool Invocation Enterprise Lifecycle

Status: draft planning spec for `CONCLAW-33`.

## Goal

Document the enterprise invocation lifecycle that ControlClaw may impose on
tool execution while preserving the upstream-facing tool schema contract.

This document should be read with:

- `docs/refactor/controlclaw/compatibility-matrix.md`
- `docs/refactor/controlclaw/tool-schema-compatibility-contract.md`

## Governing Rule

If tool behavior would force ControlClaw to choose between:

- preserving the upstream expectation of low-friction tool execution
- and enforcing enterprise governance

enterprise governance wins.

## Enterprise Invocation Lifecycle

ControlClaw should treat tool execution as a staged lifecycle rather than a
single yes/no action.

### 1. Discover

What remains compatible:

- tool names and schemas remain inspectable
- scoped inventories can still show which tools are available on a surface

Enterprise difference:

- discovery may include profile, sender, owner-only, or enterprise support
  context without implying execution authority

### 2. Validate

What remains compatible:

- tool input is still validated against a stable parameter contract
- malformed requests still fail as input problems rather than silent policy
  outcomes

Enterprise difference:

- enterprise transport or policy layers may normalize, annotate, or reject the
  request before it reaches the final executor

### 3. Authorize

What remains compatible:

- a valid tool call is still recognizable as a request for a known tool

Enterprise difference:

- owner-only, scoped-policy, group-policy, subagent-policy, or surface-specific
  rules may deny the call
- authorization becomes an explicit lifecycle step rather than an implicit
  assumption

### 4. Approve

What remains compatible:

- the tool request itself remains the same call against the same schema

Enterprise difference:

- approval workflows may block or defer execution even when validation and
  authorization succeeded
- approval outcomes may change the final params or deny execution entirely

### 5. Audit and govern egress

What remains compatible:

- the tool schema still describes the call shape that was requested

Enterprise difference:

- audit capture, policy hooks, and future egress/data-governance checks may
  observe or transform execution before the tool runs
- a call can remain contract-compatible while becoming more tightly governed

### 6. Execute

What remains compatible:

- the underlying tool still represents the same named capability

Enterprise difference:

- execution may be local, gateway-mediated, sandboxed, or brokered
- runtime behavior may diverge from upstream convenience semantics while
  keeping the schema intact

## Documented Differences From Upstream Execution Semantics

### Valid schema does not imply execution

ControlClaw may reject or defer a schema-valid request because execution trust
is a separate concern from interface validity.

### Visibility does not imply authority

ControlClaw may show a tool in inventories or catalogs while still blocking it
for a given sender, session, or policy context.

### Owner-only and policy-scoped tools remain compatible by interface

Owner-only and restricted tools can remain schema-compatible even when
enterprise callers impose narrower execution rights than upstream usage did.

### Hook and approval mediation are part of the supported model

Before-tool-call hooks, approval requests, and future audit or governance
producers are not compatibility failures. They are the enterprise execution
model layered on top of the preserved schema contract.

## Unsupported Tool Assumptions

These behaviors should be documented as unsupported rather than reintroduced by
accident.

### Schema-valid means always executable

Unsupported:

- treating a valid args payload as sufficient to force execution
- assuming a tool call should bypass enterprise controls because the schema
  parsed correctly

### Discovery means permission

Unsupported:

- treating tool visibility as proof that the current caller may execute it
- collapsing catalog presence and execution authority into one state

### Direct execution without governance

Unsupported:

- execution paths that bypass owner-only policy, scoped policy, approval, audit
  capture, or future data-governance controls
- alternate operator paths that create a second, less-governed invocation model

### Transport contract equals runtime guarantee

Unsupported:

- treating the HTTP or internal invoke shape as a promise of upstream execution
  freedom
- assuming gateway-mediated invocation cannot add enterprise lifecycle steps

## Reviewer Questions

Reviewers should ask these questions on later policy, gateway, or audit
tickets:

1. Does the ticket preserve the tool schema contract while adapting only
   invocation governance?
2. Does the ticket accidentally blur discover, validate, authorize, approve,
   audit, and execute into one opaque outcome?
3. Should the behavior remain unsupported because it weakens enterprise policy
   or audit boundaries?
4. Does the operator-facing outcome clearly distinguish schema compatibility
   from execution compatibility?
