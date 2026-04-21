# OpenClaw Outbound and Secret Governance Scenario

Status: draft planning spec for `CONCLAW-22`.

## Goal

Define the minimum enterprise data-governance scenario for outbound destination
control and secret access mediation so downstream implementation tickets can
validate against one acceptance contract.

This ticket is scenario-first and does not introduce runtime enforcement on its
own.

## Canonical scenario contract

The canonical acceptance scenario set is defined in:

- `src/shared/enterprise-data-governance-scenarios.ts`

That contract captures required request context and expected policy and audit
outcomes for this story.

## Scenario coverage required by this ticket

### 1) Workspace-specific outbound destination policy

Acceptance requirement:

- one workspace can access an approved destination while another cannot

Canonical scenario ids:

- `workspace-allowed-destination-allow`
- `workspace-denied-destination-deny`

Expectation:

- the same destination can produce opposite decisions based on workspace scope
  and policy

### 2) Secret-access denial despite secret existence

Acceptance requirement:

- an agent can be denied secret access even when the secret exists

Canonical scenario id:

- `secret-exists-but-denied-for-principal-action`

Expectation:

- secret presence does not bypass principal and action policy constraints

### 3) Denied outbound action is traceable

Acceptance requirement:

- a denied outbound action produces a traceable governance record

Canonical scenario id:

- `outbound-deny-emits-traceable-governance-record`

Expectation:

- denied outbound decisions include required governance audit event classes

## Required scenario dimensions

Every governance request in the canonical scenario contract includes:

- workspace scope (`workspaceId`)
- principal context (`principal.type`, `principal.id`)
- governed surface (`outbound` or `secret`)
- action id (`outbound.request` or `secret.resolve`)
- governed target (`destination` or `secretTarget`)

Every scenario expectation includes:

- explicit decision (`allow` or `deny`)
- policy rationale code (`policyReasonCode`)
- audit requirement (`auditRequired`)
- required audit event classes (`requiredAuditEventTypes`)

## Downstream implementation touchpoints

This scenario contract is intended to be consumed by follow-up tickets in:

- policy engine decision evaluation and reason-code emission
- secret broker decision mediation
- outbound egress and destination governance
- audit event taxonomy and evidence payload pipelines
- admin policy UI simulation and explanation surfaces

Likely code touchpoints:

- `src/shared/enterprise-policy-model.ts`
- `src/secrets/runtime.ts`
- outbound network and delivery policy surfaces under `src/infra` and
  `src/media`
- gateway policy and audit request handling
- enterprise admin UI flows

## Verification contract for later tickets

Later tickets that claim to satisfy this story should verify:

1. workspace-scoped destination policy can produce allow/deny divergence for
   the same destination.
2. secret existence and secret permission are evaluated independently.
3. denied outbound actions emit traceable governance/audit records.
4. policy and audit reasoning can be surfaced without freeform-only strings.

## Dependencies and relationship context

- Depends on `CONCLAW-21` for brokered secret-access contract alignment.
- Consumes `CONCLAW-17` policy decision vocabulary and capability model.
- Consumes `CONCLAW-19` audit taxonomy and evidence framing.
- Feeds DLP or CASB-oriented integration and admin UX work.

## Related egress decision model

`CONCLAW-39` extends this scenario contract with data-classification touchpoints
and a typed egress decision model:

- `docs/refactor/controlclaw/data-classification-egress-decision-model.md`
- `src/shared/enterprise-egress-decision-model.ts`

## Related secret review and revocation model

`CONCLAW-53` extends this governance surface with a review/revocation scenario
contract for workspace- and principal-scoped secret grants:

- `docs/refactor/controlclaw/secret-access-review-revoke-governance-scenario.md`
- `src/shared/enterprise-secret-access-governance-scenarios.ts`
