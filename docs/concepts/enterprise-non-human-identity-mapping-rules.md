---
summary: "Service-account, agent, and plugin identity mapping rules for OpenClaw enterprise planning"
read_when:
  - You are defining non-human principal mapping for enterprise policy, audit, secrets, or runtime
  - You need delegation and impersonation constraints across user, service-account, agent, and plugin identities
title: "Enterprise Non-Human Identity Mapping Rules"
---

# Enterprise non-human identity mapping rules

## Purpose

This page defines the planning contract for non-human identity mapping across
service-account, agent, and plugin execution paths.

This is a design/spec output for `CONCLAW-34`, not runtime enforcement code.

## Scope and principal model

The mapping model focuses on the principal types most relevant to delegated
non-human execution:

- `user`: human source principal that can delegate to non-human executors
- `service-account`: automation principal for system and integration workflows
- `agent`: runtime principal used for bounded execution sessions
- `plugin`: plugin-owned principal used for capability-scoped operations

## Mapping rules

Identity mapping modes that must be supported:

| Mapping mode                           | Source -> target              | Required context                                                |
| -------------------------------------- | ----------------------------- | --------------------------------------------------------------- |
| `service-account-to-agent-session`     | `service-account` -> `agent`  | org/workspace scope, session/request ids, scope grant id        |
| `user-to-agent-delegation`             | `user` -> `agent`             | org/workspace scope, session/request ids, approval id           |
| `user-to-plugin-delegation`            | `user` -> `plugin`            | org/workspace scope, request id, capability grant id, plugin id |
| `service-account-to-plugin-delegation` | `service-account` -> `plugin` | org/workspace scope, request id, scope grant id, plugin id      |
| `plugin-to-agent-execution`            | `plugin` -> `agent`           | org/workspace scope, request id, plugin id, executor agent id   |

## Delegation and impersonation constraints

Delegation requirements:

- delegation must include explicit source principal identity
- delegation chains must preserve the original user principal when present
- delegation must remain inside the declared org/workspace boundary
- sensitive delegated actions must include approval reference ids
- delegated context must flow into audit and secret producer payloads

Impersonation guardrails:

- impersonation is disabled by default
- when enabled, impersonation requires policy approval and audit justification
- impersonation cannot remove delegation-chain claims
- impersonation cannot expand scope beyond source-principal grants

## Follow-up implementation touchpoints

Later runtime work should integrate these rules into:

- `src/gateway` request context normalization and principal mapping
- `src/agents` session/caller/executor identity propagation
- `src/plugins` runtime registration and capability mediation
- `src/secrets` secret access decision context
- `src/audit` audit producer attribution fields

## Downstream ticket cross-reference map

Parent and dependency context:

- `CONCLAW-15` enterprise identity/resource baseline
- `CONCLAW-16` zero-trust auth/session propagation model
- `CONCLAW-34` non-human identity mapping rules (this ticket)

Related follow-up tickets:

- `CONCLAW-17` policy decision schema alignment for caller/executor identity
- `CONCLAW-21` secret broker mediation using mapped principal context
- `CONCLAW-38` audit event producer mapping for delegated principal attribution
- `CONCLAW-49` workspace admin role controls for delegated non-human actions
