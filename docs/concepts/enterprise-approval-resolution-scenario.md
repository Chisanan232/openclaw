---
summary: "Role-facing enterprise approval scenario for high-risk action review"
read_when:
  - You are designing enterprise approvals, audit capture, or policy resolution UX
  - You need acceptance criteria for high-risk action approval flows
title: "Enterprise Approval Resolution Scenario"
---

# Enterprise approval resolution scenario

## Goal

Define the minimum structured approval scenario for high-risk actions so product,
UI, API, and backend tickets can validate against one shared acceptance shape.

This scenario intentionally differs from local exec approvals. It targets
enterprise approver workflows with explicit identity, scope, expiry, and audit
recording semantics.

## Scenario statement

As an approver, I receive a structured request for a high-risk action and can
approve or deny it with enough context to make a defensible decision.

## Required request information

A valid enterprise approval request includes:

1. requesting principal identity
2. affected resource and workspace
3. requested action and scope
4. reason or justification
5. expiry or timeout
6. result visibility for later audit

The canonical request and resolution model is implemented in:

- `src/shared/enterprise-approval-scenario.ts`

## Acceptance tests mapped from story criteria

The following unit tests represent the scenario acceptance baseline:

- `approval request contains actor, action, target, and expiry`
- `expired requests cannot be resolved as successful approvals`
- `denial records rationale and resolution identity`
- `approval outcome is suitable for downstream audit capture`

Coverage:

- `src/shared/enterprise-approval-scenario.test.ts`

## Distinction from local exec-approval prompts

Enterprise approval resolution differs from local exec approvals by requiring:

- approver-facing structured context, not only execution prompt state
- workspace and resource targeting as first-class fields
- expiry-driven outcome handling that can resolve as `expired`
- audit visibility classification for downstream compliance workflows
- explicit resolver identity and denial rationale capture

## Follow-up implementation touchpoints

Later implementation can wire this scenario into:

- approval request model storage and retrieval
- gateway approval APIs and status transitions
- chat/admin approval UX
- audit event emission pipelines
