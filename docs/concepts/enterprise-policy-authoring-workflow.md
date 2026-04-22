---
summary: "Enterprise policy-author workflow for draft staging, validation, impact review, and safe activation"
read_when:
  - You are implementing policy-authoring UI or policy activation APIs
  - You need a concrete lifecycle for staging and validating policy changes before production enforcement
title: "Enterprise Policy Authoring Workflow"
---

# Enterprise policy authoring workflow

## Goal

Define the minimum enterprise-safe workflow for policy authors to stage, validate,
review impact, and activate policy changes without causing unreviewed enforcement
changes in production.

The canonical scenario model is implemented in:

- `src/shared/enterprise-policy-authoring-workflow.ts`

## Scenario statement

As a policy author, I can stage, validate, and activate policy changes safely so
governance rules can evolve without malformed or unreviewed production impact.

## Workflow baseline

`CONCLAW-51` defines four baseline workflow capabilities:

1. save draft policy changes while keeping current active enforcement unchanged
2. validate draft syntax/semantics before allowing activation
3. review activation impact (added, removed, changed policy targets)
4. activate validated draft as a new immutable active version

## Validation and activation rules

Validation (`validatePolicyDraftForActivation(...)`) enforces:

- at least one policy entry in a draft
- workspace-scoped drafts must include `workspaceId`
- each entry must have a non-empty `targetKey`
- each entry must include a `reasonCode`
- duplicate `targetKey` values are rejected

Activation (`activateValidatedPolicyDraft(...)`) enforces:

- activation blocked when validation fails
- successful activation creates a new versioned active document id
- activation returns structured impact details for reviewer/operator visibility

## Versioned active-state visibility

Successful activation returns:

- immutable active document identity (`documentId`)
- numeric active version
- activator identity and activation timestamp
- resulting policy entries

This creates a stable policy version handle for audit and operational attribution.

## Audit linkage

Activation audit records are normalized by:

- `createPolicyAuthoringActivationAuditRecord(...)`

The record carries draft id, resulting active version/document id, activator
identity, and impacted target count.

## Verification baseline

Acceptance checks are encoded in:

- `src/shared/enterprise-policy-authoring-workflow.test.ts`

These tests assert:

- draft save does not mutate active enforcement state
- invalid policy definitions are rejected before activation
- impact summaries support activation scope review
- activation yields versioned state suitable for audit references

## Related

- [Enterprise Policy Storage and Versioning Model](/concepts/enterprise-policy-storage-versioning-model)
- [Enterprise Policy Enforcement Point Map](/concepts/enterprise-policy-enforcement-point-map)
- [Enterprise Approval Lifecycle Model](/concepts/enterprise-approval-lifecycle-model)
