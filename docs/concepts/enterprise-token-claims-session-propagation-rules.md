---
summary: "Enterprise token claims, session propagation, and impersonation rules for OpenClaw planning"
read_when:
  - You are defining enterprise token/session context propagation between gateway, runtime, approval, audit, and admin APIs
  - You need requester/approver/executor attribution rules for delegated or impersonated execution
title: "Enterprise Token Claims and Session Propagation Rules"
---

# Enterprise token claims and session propagation rules

## Purpose

This page defines the planning contract for enterprise token claims, request
context propagation, and impersonation/delegated-execution semantics.

This is a design/spec output for `CONCLAW-48`, not runtime enforcement code.

## Token claim model

Enterprise token subjects:

- `user`
- `service-account`
- `agent`
- `system`

Required claim fields:

- `sub`
- `subjectType`
- `orgId`
- `roles`
- `scopes`
- `sessionId`
- `requestId`

Optional claim fields:

- `workspaceId`
- `delegation`
- `impersonation`

## Session context reuse vs enterprise additions

Reused from zero-trust baseline:

- actor/subject principal ids and types
- `orgId`, `workspaceId`
- `sessionId`, `requestId`
- `delegationChain`
- auth method classification

Enterprise-specific additions:

- `effectiveRoles`
- `originalRequestPrincipalId`
- `approvalBindingId`
- `impersonationReason`
- `executorPrincipalId`
- `auditCorrelationId`

## Impersonation and delegated execution rules

- impersonation is valid only with explicit policy decision
- original requester identity must remain attached end to end
- impersonation cannot widen effective role/scope grants
- approval and audit records must include impersonation reason/binding context

## Propagation expectations by surface

| Surface       | Required context highlights                                                   |
| ------------- | ----------------------------------------------------------------------------- |
| Control plane | org/workspace scope, request id, subject id, effective roles                  |
| Runtime       | session/request ids, actor id, executor id, delegation chain                  |
| Approval      | request id, original requester id, delegated subject id, approval binding id  |
| Audit         | request/session ids, original requester id, executor id, audit correlation id |
| Admin APIs    | org/workspace scope, effective roles, request correlation id                  |

## Implementation touchpoints and compatibility concerns

Primary follow-up touchpoints:

- `src/gateway/device-auth.ts`
- `src/gateway/operator-scopes.ts`
- `src/gateway/role-policy.ts`
- protocol request-context schemas
- admin and audit APIs that consume actor/session context

Compatibility notes:

- preserve existing zero-trust session fields while adding enterprise-specific context keys
- retain original requester identity when delegated actors execute downstream actions
- keep approval and audit attribution schema-compatible during phased rollout

## Downstream ticket cross-reference map

Dependencies and adjacent tickets:

- `CONCLAW-15` enterprise identity/resource baseline
- `CONCLAW-16` zero-trust auth/session baseline
- `CONCLAW-34` non-human identity mapping model
- `CONCLAW-48` token claims/session propagation rules (this ticket)

Related follow-up tickets:

- `CONCLAW-17` policy decision schema
- `CONCLAW-36` policy enforcement point map
- `CONCLAW-38` audit producer mapping
- `CONCLAW-49` admin role-management workflow
