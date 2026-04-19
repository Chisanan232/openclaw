# OpenClaw Data Classification and Egress Decision Model

Status: draft planning spec for `CONCLAW-39`.

## Goal

Define how OpenClaw identifies sensitive data contexts and applies outbound
governance decisions using a stable platform-native contract.

This ticket is model-first and does not implement enforcement behavior by
itself.

## Canonical decision contract

The typed contract for this ticket is defined in:

- `src/shared/enterprise-egress-decision-model.ts`

The contract covers:

- data-classification touchpoints
- egress-decision input model
- destination and resource attributes for policy evaluation
- relation between egress control, policy, secret use, and audit capture

## Data-classification touchpoints

OpenClaw must treat these surfaces as classification-aware by contract:

- `outbound.web.request`
- `outbound.connector.call`
- `outbound.saas.call`
- `plugin.capability.broker`
- `secret.broker.resolve`

These touchpoints represent likely policy interception seams for web/network
tools, connector integrations, plugin capability brokers, and secret-mediated
flows.

## Egress-decision model

Each decision request should include:

- workspace scope and principal identity
- operation identity and surface hook
- destination kind/id plus optional destination attributes
- resource id/type plus data classification labels
- secret-use metadata when a secret context is involved
- audit request context

Each decision output should include:

- decision result (`allow`, `deny`, or `conditional`)
- reason code and rationale
- required controls (approval, redaction, tokenization, secret-binding block,
  audit enrichment)
- required audit event classes
- policy evidence metadata (`policyId`, `ruleId`, matched attributes)

## Destination and resource attributes required for decisions

Minimum required attributes:

- `workspaceId`
- `principal.id`
- `action.id`
- `destination.kind`
- `destination.id`
- `resource.id`
- `resource.type`
- `resource.classifications`
- `auditContext.requestId`

Optional attributes can refine policy decisions without changing base schema:

- destination attributes such as region, trust tier, and ownership class
- resource attributes such as PII indicators, retention constraints, and export
  restrictions

## Relation between egress, policy, secret use, and audit

This ticket defines the integration contract:

1. classification-aware outbound surfaces produce egress decision inputs.
2. policy evaluation returns a typed decision with explicit controls.
3. secret use is modeled as decision context, not a side-channel.
4. audit event requirements are attached to the decision contract itself.

This keeps egress governance broader than simple destination allowlists.

## Follow-up enforcement touchpoints

Likely implementation areas:

- outbound web/network tools and connector/SaaS call paths
- plugin capability broker request mediation
- policy engine decision producers
- audit event producers and evidence pipelines

Reference surfaces:

- `src/shared/enterprise-policy-model.ts`
- `src/shared/enterprise-data-governance-scenarios.ts`
- `src/secrets/runtime.ts`
- outbound request plumbing under `src/infra` and `src/media`

## Risks and follow-up notes

Primary risk:

- egress governance degenerates into host-level allowlists without
  classification context or secret-use awareness.

Mitigation:

- require decision contracts to include classification and secret context
  fields.
- require explicit reason codes and required audit event classes.
- keep `conditional` decision pathways first-class for approval-gated and
  redaction-gated flows.

## Verification expectations

`CONCLAW-39` is satisfied when:

- later egress-control implementation can consume one stable decision contract
- DLP/CASB integration planning can bind to this native model
- outbound governance decisions are explainable by reason code + evidence fields

## Dependency alignment

- Depends on `CONCLAW-17` policy decision schema.
- Depends on `CONCLAW-21` secret broker contract.
- Supports `CONCLAW-22` security-admin governance scenario and downstream
  integration work.
