---
summary: "ControlClaw enterprise CLI taxonomy and operator workflow model for governed administration"
read_when:
  - You are planning enterprise admin CLI commands for ControlClaw
  - You are implementing CONCLAW-59 or dependent CLI governance tickets
title: "ControlClaw Enterprise CLI Taxonomy"
---

# ControlClaw enterprise CLI taxonomy

This document is the implementation artifact for `CONCLAW-59`.

It defines the enterprise command taxonomy, naming and grouping boundaries, operator workflow expectations, and automation output rules for governed administration tasks.

## Scope and intent

The taxonomy in this page is a target model for future implementation. It does not claim every command below already exists.

This page defines:

- command taxonomy for bootstrap, policy, approvals, audit, registry, identity, and secret governance
- command-group boundaries and naming rules
- interactive versus non-interactive workflow expectations
- machine-readable output guidance for scripting and automation
- command-group mapping to backend API domains and admin roles

## Command taxonomy

Use a top-level enterprise namespace:

- `openclaw admin <group> <action>`

Primary enterprise groups:

| Group        | Scope                                                   | Typical tasks                                                                   |
| ------------ | ------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `bootstrap`  | Initial enterprise setup and tenant baseline            | Initialize org controls, seed default policies, verify governance prerequisites |
| `policy`     | Guardrail and policy lifecycle                          | List, inspect, validate, stage, and apply policy definitions                    |
| `approvals`  | Governance decision queue                               | List pending requests, inspect context, approve or reject with reason           |
| `audit`      | Traceability and evidence                               | Query events, inspect decision lineage, export evidence bundles                 |
| `registry`   | Artifact trust and admission governance                 | Manage registries, trust anchors, admission rules, and verification states      |
| `identity`   | Roles and access governance                             | Manage org and workspace role bindings, inspect effective permissions           |
| `secrets`    | Secret governance operations                            | Validate SecretRef coverage, rotate providers, audit unresolved refs            |
| `workspace`  | Workspace governance operations                         | Create workspace baselines, manage overlays, enforce workspace-level controls   |
| `breakglass` | Emergency operations with explicit risk acknowledgement | Temporary bypasses, emergency recovery operations, forced rollback paths        |

## Command-group boundaries and naming rules

### Boundaries

1. `bootstrap` is for one-time or infrequent initialization flows, not daily operations.
2. `policy`, `approvals`, `audit`, `registry`, `identity`, and `secrets` are ongoing governance groups.
3. `workspace` is workspace-scoped governance and must not mutate tenant-global controls without elevated scope.
4. `breakglass` is isolated from normal operations and must require explicit risk confirmation plus audit metadata.

### Naming rules

Use a consistent shape:

- `openclaw admin <group> <verb>`

Verb conventions:

- read-only: `list`, `get`, `show`, `describe`, `validate`
- mutating: `create`, `apply`, `update`, `remove`, `rotate`, `enable`, `disable`
- governance decisions: `approve`, `reject`, `escalate`
- exports and reports: `export`, `report`
- emergency flows: `force-*` verbs only in `breakglass`

Flags and option conventions:

- use `--workspace <id>` for workspace-scoped actions
- use `--org <id>` for tenant or organization scope
- use `--reason <text>` for all governance mutations
- use `--json` for machine-readable output
- use `--non-interactive` and `--yes` together for automation-safe mutation paths

## Operator workflow model

### Interactive workflows

Interactive mode is recommended for:

- bootstrap and first-time setup
- policy change review and simulation
- approval decision review when context inspection is needed
- break-glass paths that require explicit operator acknowledgement

Interactive behavior expectations:

- prompt for missing required context
- render human-readable summaries before mutating actions
- show impact preview before apply operations
- require reason capture for governance-sensitive mutations

### Non-interactive workflows

Non-interactive mode is required for automation and CI/CD.

Non-interactive behavior expectations:

- never prompt; fail fast on missing required input
- stable exit codes for success, validation failures, policy denials, and runtime errors
- deterministic `--json` output contracts
- idempotent update semantics where practical

Required non-interactive conventions:

- mutating commands support `--non-interactive --yes`
- automation-safe payload input through explicit flags or `--from <file>`
- all automation-facing commands support `--json`

## Machine-readable output and scripting guidance

### Output contract

All enterprise admin groups should emit a common envelope under `--json`:

```json
{
  "ok": true,
  "group": "policy",
  "action": "apply",
  "scope": { "org": "default", "workspace": "wksp-prod" },
  "result": {},
  "warnings": [],
  "errors": []
}
```

### Exit code guidance

- `0`: success
- `1`: validation or input error
- `2`: policy or authorization denied
- `3`: runtime or dependency unavailable
- `4`: partial completion requiring operator attention

### Automation safety

Automation guidance for enterprise CLI users:

1. Prefer read-before-write flow (`get` or `list` then `apply` or `update`).
2. Use scoped flags (`--org`, `--workspace`) on every automation command.
3. Treat `warnings` as actionable telemetry; do not ignore them by default.
4. Avoid `breakglass` commands in unattended automation unless explicitly approved and monitored.

## API and role mapping

Map command groups to backend API domains and primary admin personas.

| Command group | Backend API domain                                                      | Primary roles                             |
| ------------- | ----------------------------------------------------------------------- | ----------------------------------------- |
| `bootstrap`   | `admin-bootstrap`, `org-defaults`, `workspace-template`                 | Platform Admin                            |
| `policy`      | `policy-catalog`, `policy-evaluation`, `policy-versioning`              | Platform Admin, Security Admin            |
| `approvals`   | `approval-queue`, `approval-decision`, `approval-routing`               | Approver, Security Admin, Workspace Admin |
| `audit`       | `audit-events`, `audit-export`, `evidence-linking`                      | Auditor, Security Admin, Platform Admin   |
| `registry`    | `artifact-registry`, `signature-verification`, `admission-results`      | Platform Admin, Security Admin            |
| `identity`    | `role-binding`, `permission-evaluation`, `org-directory`                | Platform Admin, Workspace Admin           |
| `secrets`     | `secretref-audit`, `secret-provider`, `credential-rotation`             | Security Admin, Platform Admin            |
| `workspace`   | `workspace-service`, `workspace-policy-overlay`, `workspace-membership` | Workspace Admin, Platform Admin           |
| `breakglass`  | `emergency-controls`, `incident-recovery`, `audit-critical`             | Platform Admin, Security Admin            |

Shared API contract reference:

- [ControlClaw Admin API Contract](/gateway/controlclaw-admin-api-contract)

## Workflow buckets required by the ticket

This taxonomy explicitly distinguishes:

- bootstrap and setup commands: `admin bootstrap *`
- ongoing operations commands: `admin policy *`, `admin approvals *`, `admin audit *`, `admin registry *`, `admin identity *`, `admin secrets *`, `admin workspace *`
- read-only inspection commands: `list/get/show/describe/validate/report`
- break-glass or emergency operations: `admin breakglass *`

## Verification checklist for this ticket

`CONCLAW-59` is satisfied when:

1. Later CLI implementation tickets can map to a stable group and naming model.
2. Operators can distinguish interactive governance workflows from automation-safe workflows.
3. Automation users have explicit `--json`, exit code, and non-interactive behavior guidance.
4. Backend teams can map each command group to expected API domains and admin role ownership.
