---
summary: "Zero-trust enterprise auth/session model and gateway migration plan for OpenClaw"
read_when:
  - You are planning enterprise gateway auth, session context, or delegated runtime identity
  - You need a migration map away from trusted-operator assumptions
title: "Enterprise Zero-Trust Auth Session Model"
---

# Enterprise zero-trust auth session model

## Purpose

This page defines the planning contract for enterprise zero-trust authentication
and session context across gateway, runtime, and node interactions.

This is a design/spec output for `CONCLAW-16`, not runtime enforcement code.

## Token and session model for enterprise principals

Each authenticated request carries an explicit actor token plus a normalized
session context. The session context is stable across gateway methods, runtime
execution, and audit/approval attribution.

Token claim model:

- `sub`: canonical principal id (`cc:<type>:...`)
- `principalType`: one of `user`, `service-account`, `agent`, `plugin`, `node`, `system`
- `orgId`: required organization boundary id
- `workspaceId`: required for workspace-scoped actions
- `roles`: effective role claims at org/workspace scope
- `scopes`: granted action scopes for method/tool access
- `delegation`: optional delegated actor chain with explicit source principal
- `sessionId`: logical session identifier used for downstream correlation
- `requestId`: per-request identifier for replay-safe audit linkage

Session context model:

- `actor`: authenticated caller principal reference
- `subject`: effective subject principal after delegation/impersonation checks
- `org`: required organization scope
- `workspace`: optional workspace scope
- `trustLevel`: derived trust posture (`external`, `managed-node`, `system`)
- `authMethod`: transport/auth source classification
- `policyContext`: policy-evaluation inputs resolved before side effects

## Gateway trust-boundary analysis and migration plan

Current model risk:

- gateway historically assumes a trusted operator boundary in several local or
  identity-bearing paths
- session identity can be inferred from transport/deployment context instead of
  explicit principal claims

Target model:

- all caller identity must be explicit and validated
- every privileged operation must bind to principal + scope + policy context
- request/session context must survive transport boundaries without implicit trust

Migration steps:

1. Introduce request-context normalization before method dispatch.
2. Enforce principal/scopes checks on gateway method entry.
3. Require delegated actor metadata where runtime executes on behalf of another principal.
4. Bind node interactions to explicit authenticated principal + node identity.
5. Remove or downgrade trust shortcuts to explicit policy-gated compatibility paths.

## Auth-context propagation requirements

The same context envelope must flow through all action surfaces:

| Surface                      | Required context                                                       |
| ---------------------------- | ---------------------------------------------------------------------- |
| Gateway method dispatch      | actor, org/workspace scope, auth method, scopes                        |
| Tool execution               | subject principal, `delegationChain`, policy context, request id       |
| Plugin action dispatch       | plugin principal + source actor, workspace boundary, capability grant  |
| Node command dispatch        | caller principal, `nodeIdentityId`, approved command scope, request id |
| Audit and approval producers | actor/subject ids, decision scope, session id, request id              |

## Trusted-operator assumptions to remove or downgrade

- assumption that localhost or deployment-local access implies trusted operator identity
- assumption that control-plane auth can be derived from transport origin alone
- assumption that node pairing identity is sufficient without caller session context
- assumption that delegated/plugin actions do not require original actor attribution
- assumption that session context can be omitted when request is considered "internal"

## Implementation touchpoints for later runtime tickets

- `src/gateway/device-auth.ts`
- `src/gateway/role-policy.ts`
- `src/gateway/method-scopes.ts`
- `ui/src/ui/gateway.ts`
- future seams under `src/enterprise/auth/**`

## Downstream ticket cross-reference map

Parent and direct dependencies:

- `CONCLAW-15` enterprise identity/resource vocabulary baseline
- `CONCLAW-16` zero-trust auth/session model (this ticket)
- `CONCLAW-14` enterprise auth baseline dependency

Policy, secret, and admin follow-up planning:

- `CONCLAW-17` policy decision schema using auth/session context
- `CONCLAW-21` secret broker mediation bound to authenticated principal scope
- `CONCLAW-35` workspace/org boundary enforcement expectations
- `CONCLAW-48` token claim and delegated actor propagation details
- `CONCLAW-49` workspace admin role-management scenario
