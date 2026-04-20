# OpenClaw Secret Access Review and Revocation Governance Scenario

Status: draft planning spec for `CONCLAW-53`.

## Goal

Define the enterprise secret-governance scenario for reviewing and revoking
mediated secret access grants by workspace and principal.

This ticket is scenario-first and does not introduce runtime revocation
enforcement on its own.

## Canonical scenario contract

The canonical acceptance scenario set is defined in:

- `src/shared/enterprise-secret-access-governance-scenarios.ts`

That contract captures review filters, revocation request semantics, and
required post-revocation policy and audit outcomes.

## Scenario coverage required by this ticket

### 1) Review principals with workspace-scoped secret access

Acceptance requirement:

- a secrets administrator can identify principals with access to a
  workspace-scoped secret

Canonical scenario id:

- `review-workspace-secret-principal-access`

Expectation:

- review flows can filter and enumerate grant paths and principals for the
  requested workspace secret scope

### 2) Revocation blocks future mediated secret requests

Acceptance requirement:

- revoking access prevents future mediated secret requests under revoked scope

Canonical scenario id:

- `revoke-workspace-principal-secret-grant`

Expectation:

- revoked workspace + principal + scope combinations produce future deny
  decisions with explicit revocation reason codes

### 3) Revocation actions emit investigation-grade audit context

Acceptance requirement:

- revocation actions create enough audit context for later investigation

Canonical scenario id:

- `revoke-secret-class-policy-path-with-audit-context`

Expectation:

- revocation audit records include principal, scope, grant path, reason, and
  effect-window context required for incident reconstruction

## Required governance dimensions

Every scenario in the canonical contract includes:

- workspace scope (`workspaceId`)
- principal context (`principal.type`, `principal.id`)
- secret scope (`scope.kind`, `scope.id`)
- grant path identity (`grantPath.kind`, `grantPath.id`) for revocations
- revocation effect window (`future-only` or `live-and-future`)

Every scenario expectation includes:

- review result identity (`reviewMatchedPrincipalIds`,
  `reviewMatchedGrantPathIds`)
- expected future decision (`futureSecretResolveDecision`)
- expected policy rationale (`futurePolicyReasonCode`)
- in-flight execution impact semantics (`inFlightExecutionImpact`)
- required audit event classes and required audit context fields

## Downstream implementation touchpoints

This scenario contract is intended for follow-up tickets in:

- secret broker admin review/revocation APIs
- grant and policy-path storage plus revocation indexing
- admin secret-governance UI for review and revoke actions
- audit event producers and investigation surfaces

Likely code touchpoints:

- `src/secrets/runtime.ts`
- policy and grant-resolution surfaces under `src/infra`
- gateway-admin API surfaces
- enterprise admin UI flows

## Verification contract for later tickets

Later tickets that claim this story should verify:

1. workspace + principal review filters return expected grant visibility.
2. revocation state is applied for future mediated secret requests.
3. effect-window semantics are explicit for in-flight and future behavior.
4. audit payloads contain enough structured context for investigations.

## Dependency alignment

- Depends on `CONCLAW-21` secret-broker mediation contract.
- Depends on `CONCLAW-22` outbound and secret governance acceptance scenarios.
- Depends on `CONCLAW-39` classification-aware egress decision context.
