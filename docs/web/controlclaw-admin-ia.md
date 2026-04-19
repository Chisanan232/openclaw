---
summary: "ControlClaw admin information architecture for policy, approvals, audit, registry, and workspaces"
read_when:
  - You are planning enterprise admin UI or API surfaces for ControlClaw
  - You are implementing CONCLAW-27 or dependent tickets
title: "ControlClaw Admin IA"
---

# ControlClaw admin information architecture

This document is the implementation artifact for `CONCLAW-27`.

It defines the enterprise admin UX information architecture for policy, approvals, audit, registry, and workspace governance surfaces so UI and backend work can converge on one control-plane model.

## Scope and framing

The target product is ControlClaw as an OpenClaw-compatible enterprise control plane.

This page defines:

- admin personas and role map
- top-level navigation model
- backend service and permission dependency map per admin area
- MVP versus later-phase UI cut lines
- follow-up engineering notes

This page does not define detailed visual design, API schemas, or implementation sequencing by sprint.

## Admin personas and role map

### Personas

| Persona         | Primary goals                                               | Typical actions                                                                      |
| --------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Platform Admin  | Configure enterprise-wide governance and runtime boundaries | Set policy defaults, manage registry trust rules, define workspace templates         |
| Security Admin  | Reduce risk and improve traceability                        | Review audit events, tune secret handling controls, approve sensitive policy changes |
| Workspace Admin | Operate one org or workspace safely                         | Manage workspace members, enforce workspace policy overlays, review local approvals  |
| Approver        | Authorize sensitive actions without full admin access       | Process approval queue decisions and leave reasoned audit notes                      |
| Auditor         | Verify behavior and investigate incidents                   | Search audit trails, export evidence, verify policy and approval lineage             |

### Capability by role

| Capability area                        | Platform Admin | Security Admin           | Workspace Admin       | Approver             | Auditor   |
| -------------------------------------- | -------------- | ------------------------ | --------------------- | -------------------- | --------- |
| Policy authoring and global guardrails | Full           | Limited by policy domain | Workspace-scoped only | None                 | Read only |
| Approval queue operations              | Full           | Full                     | Workspace-scoped      | Assigned queue scope | Read only |
| Audit search and export                | Full           | Full                     | Workspace-scoped      | Limited              | Full      |
| Registry trust and admission config    | Full           | Full                     | Read only             | None                 | Read only |
| Organization and workspace management  | Full           | Read only                | Workspace-scoped      | None                 | Read only |

## Navigation model

The enterprise admin surface should use a control-plane-first navigation model.

Top-level navigation:

1. `Overview`
2. `Policy`
3. `Approvals`
4. `Audit`
5. `Registry`
6. `Organization`
7. `Workspaces`
8. `System`

### Section map and intent

| Section      | Primary operator questions                        | Core views                                                                   |
| ------------ | ------------------------------------------------- | ---------------------------------------------------------------------------- |
| Overview     | What needs action now                             | Risk and queue summary, recent incidents, policy drift indicators            |
| Policy       | What rules are active and why                     | Policy catalog, inheritance graph, simulation or dry-run outcomes            |
| Approvals    | What actions are waiting for governance decisions | Queue, SLA status, decision detail with reason and evidence                  |
| Audit        | What happened and who approved it                 | Timeline, event detail, filter and export workspace                          |
| Registry     | Which artifacts are trusted and admissible        | Source registry list, signing or verification status, admission outcomes     |
| Organization | How tenant level controls are configured          | Org metadata, role bindings, default guardrail profiles                      |
| Workspaces   | How per-workspace governance is configured        | Workspace list, workspace policy overlays, member and role assignment        |
| System       | Is the control plane healthy and enforceable      | Health, integration status, policy engine state, version and migration state |

## Backend and permission dependency matrix

The admin IA depends on explicit backend service boundaries. UI pages must call shared control-plane APIs instead of embedding surface-specific logic.

| Section      | Required backend services                                                          | Permission model requirements                                         |
| ------------ | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Overview     | `admin-summary`, `policy-status`, `approval-queue`, `audit-summary`                | Role-aware aggregation and workspace scoping                          |
| Policy       | `policy-catalog`, `policy-evaluation`, `policy-diff`, `policy-versioning`          | Domain-scoped write permissions and change provenance                 |
| Approvals    | `approval-requests`, `approval-decision`, `approval-routing`, `approval-sla`       | Queue assignment, delegated approver rules, reason-required decisions |
| Audit        | `audit-events`, `audit-export`, `audit-retention`, `evidence-linking`              | Read scopes by workspace and immutable export authorization           |
| Registry     | `artifact-registry`, `artifact-signature`, `admission-policy`, `admission-results` | Registry-admin scope with explicit trust boundary actions             |
| Organization | `org-directory`, `org-role-binding`, `org-policy-defaults`                         | Tenant-admin scope and protected role mutation paths                  |
| Workspaces   | `workspace-service`, `workspace-membership`, `workspace-policy-overlay`            | Workspace-admin scope with inheritance-aware validation               |
| System       | `control-plane-health`, `integration-health`, `migration-status`                   | Platform-admin and read-only audit views for other roles              |

### Permission invariants

1. Every write action must carry actor identity, role scope, and reason metadata.
2. Approval decisions must be auditable with immutable decision context.
3. Workspace-level admins must not mutate tenant-level global controls.
4. Audit read permissions must be broad enough for auditors but still tenant-bounded.

## MVP versus later-phase UI cuts

### MVP cut

MVP should ship enough surface area to make governance enforceable and operable:

- Overview: queue and risk summary cards
- Policy: list, detail, enable or disable, basic simulation
- Approvals: queue, detail, approve or reject with reason
- Audit: searchable timeline and event detail
- Workspaces: list and role management essentials

### Later-phase cut

Later phases should deepen enterprise completeness:

- advanced policy composition, staged rollouts, and conflict diagnosis
- delegated approval routing rules and escalation automations
- audit exports with evidence bundles and retention policies
- registry admission dashboards with signature and provenance drill-down
- organization templates, workspace bootstrap blueprints, and cross-workspace operations

### Rewrite-horizon notes

For rewrite-horizon architecture evolution, preserve the same IA contract and role semantics even when backend implementations change runtime language or process boundaries.

## Follow-up engineering notes

### UI structure notes

Later implementation under `ui/src/ui` should keep the navigation structure above as the canonical route map for enterprise admin surfaces.

### API ownership notes

Dashboard and CLI must consume shared admin APIs for policy, approvals, audit, registry, and workspace actions. Do not duplicate control logic in surface-specific handlers.

### Ticket linkage

- Depends on `CONCLAW-15`, `CONCLAW-17`, `CONCLAW-19`, `CONCLAW-21`, and `CONCLAW-24`
- Provides IA and dependency inputs for later approver, auditor, workspace-admin, and platform-admin implementation stories

## Verification checklist for this ticket

`CONCLAW-27` is satisfied when:

1. UI stories can map to the defined navigation sections without creating parallel admin flows.
2. Backend teams can identify required service owners and permission seams per section.
3. Role capabilities are explicit enough to gate visibility and actions in dashboard and CLI surfaces.
4. MVP versus later-phase cuts are documented and can classify follow-up tickets.
