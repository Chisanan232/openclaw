---
summary: "Primary enterprise admin-management scenario for workspace policy and approval control without raw config edits"
read_when:
  - You are implementing CONCLAW-28 or dependent enterprise admin workflow tickets
  - You are validating dashboard and admin API behavior against a concrete story
title: "ControlClaw Admin Management Scenario"
---

# ControlClaw admin management scenario

This document is the implementation artifact for `CONCLAW-28`.

It defines the primary enterprise admin-management scenario for workspace policy and approval control in the ControlClaw control plane.

## Goal

Define a minimum credible enterprise admin workflow where a platform admin can manage workspace policy and approval behavior without editing raw configuration files.

## Canonical scenario

As a platform admin, I can manage workspace policies and approval behavior through the control plane so I do not need raw config edits or undocumented procedures.

## Scenario flow

1. The admin opens workspace governance for a target workspace.
2. The admin views current workspace policy assignments and approval requirements.
3. The admin changes one policy or approval setting for a governed action.
4. The system shows impacted identities, resources, and effective behavior change.
5. The admin submits the change through a governed workflow.
6. The system records an attributable, auditable, and reviewable change event.

## Expected behavior contract

The workflow must support all of the following:

- viewing workspace-specific policy assignments
- changing approval requirements for governed actions
- understanding affected identities and resources before change submission
- producing attributable and auditable change records
- completing the flow without direct raw file edits

## Test cases for downstream implementation

### Test case 1

An admin can see workspace-specific policy state.

Expected result:

- the current workspace policy and approval configuration is visible through control-plane surfaces.

### Test case 2

A policy or approval setting change is attributable and auditable.

Expected result:

- mutation records include actor identity, workspace scope, change summary, and audit event linkage.

### Test case 3

The management task does not require raw file edits.

Expected result:

- the full workflow is available through dashboard and shared admin APIs, with CLI as a governed alternative surface.

## Verification model

`CONCLAW-28` should be considered satisfied when:

1. stakeholders agree this scenario is the minimum credible enterprise admin workflow.
2. UI and backend tickets can validate against this scenario without inventing alternative baseline behaviors.
3. review outcomes can determine pass or fail using the expected behavior and test cases above.

## Expected implementation areas

Likely future touchpoints:

- admin UI workflow screens for workspace policy and approvals
- shared admin APIs for policy and approval operations
- audit event emission and evidence retrieval for administrative mutations
- workspace and identity services used for impact and scope evaluation

## Dependencies and relationships

- Depends on `CONCLAW-27`
- Feeds enterprise admin UX and rollout validation workstreams

## Related planning references

- [ControlClaw Admin IA](/web/controlclaw-admin-ia)
- [ControlClaw Admin API Contract](/gateway/controlclaw-admin-api-contract)
- [ControlClaw Enterprise CLI Taxonomy](/cli/controlclaw-enterprise-taxonomy)
