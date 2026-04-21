---
summary: "Org and workspace boundary enforcement model for OpenClaw enterprise planning"
read_when:
  - You are designing org/workspace scope enforcement for gateway, runtime, plugins, secrets, or audit
  - You need cross-workspace restrictions and workspace-scoped sensitive operation rules
title: "Enterprise Org and Workspace Boundary Enforcement Model"
---

# Enterprise org and workspace boundary enforcement model

## Purpose

This page defines the planning contract for org and workspace boundary
enforcement across enterprise request, runtime, and governance surfaces.

This is a design/spec output for `CONCLAW-35`, not runtime enforcement code.

## Boundary model and invariants

Canonical boundary scopes:

- `org`: organization-level governance boundary
- `workspace`: execution and data isolation boundary

Core invariants:

- every enterprise request resolves to exactly one `orgId` before side effects
- sensitive operations must include explicit `workspaceId` context
- cross-workspace actions require explicit policy approval and declared source/target workspaces
- workspace context must propagate into audit and secret producer payloads

## Cross-workspace expectations and restrictions

Allowed only with explicit policy context:

- declared source workspace and target workspace
- explicit approval/policy decision reference
- auditable request/session correlation fields

Disallowed by default:

- implicit workspace inference from org-level membership
- forwarding runtime or plugin actions to a different workspace without policy context
- reading or mutating workspace-bound resources using only org scope

## Required context propagation by subsystem

| Subsystem        | Required boundary context                         |
| ---------------- | ------------------------------------------------- |
| Gateway          | `orgId`, `workspaceId`, `requestId`, `authMethod` |
| Runtime session  | `orgId`, `workspaceId`, `sessionId`, `requestId`  |
| Plugin execution | `orgId`, `workspaceId`, `pluginId`, `requestId`   |
| Secrets          | `orgId`, `workspaceId`, `requestId`, `decisionId` |
| Audit            | `orgId`, `workspaceId`, `requestId`, `sessionId`  |
| Admin UI         | `orgId`, `workspaceId`, `viewerRole`              |

## Sensitive operations that must be workspace-scoped

- secret read
- secret write
- plugin install
- plugin capability grant
- runtime command dispatch

## Follow-up implementation touchpoints

Later runtime work should integrate this model into:

- gateway auth and request context normalization
- session and runtime context propagation
- plugin execution context and capability mediation
- audit and secret producer fields
- admin UI workspace-scoped views and filters

## Downstream ticket cross-reference map

Parent and direct dependencies:

- `CONCLAW-15` enterprise identity/resource baseline
- `CONCLAW-16` zero-trust auth/session context baseline
- `CONCLAW-35` org/workspace boundary enforcement model (this ticket)

Related follow-up tickets:

- `CONCLAW-17` policy decision schema for scope decisions
- `CONCLAW-21` secret broker scope mediation
- `CONCLAW-36` policy enforcement point map
- `CONCLAW-38` audit producer mapping with workspace attribution
- `CONCLAW-49` admin workspace-role UX and API surfaces
