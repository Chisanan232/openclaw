---
summary: "Canonical enterprise principal and resource model for ControlClaw planning"
read_when:
  - You are planning enterprise identity, policy, audit, or secret work
  - You need stable org and workspace boundary terms across subsystems
title: "Enterprise Identity and Resource Model"
---

# Enterprise identity and resource model

## Purpose

This page defines the canonical enterprise identity and resource vocabulary for
ControlClaw planning. It is a design contract for architecture and implementation
tickets, not a full runtime implementation.

## Principal types

All enterprise callers and executors are normalized to one `principalType`.

| Principal type    | Description                                                                 |
| ----------------- | --------------------------------------------------------------------------- |
| `user`            | Human identity authenticated through enterprise identity providers.         |
| `agent`           | Runtime agent identity acting within a scoped execution context.            |
| `service-account` | Non-human account used for automation and system integrations.              |
| `plugin`          | Plugin-owned identity for delegated plugin operations and capability checks.|
| `node`            | Device or runtime node identity connected through gateway control channels. |
| `system`          | Reserved internal platform identity for framework-owned control operations. |

## Resource types

All governed targets are normalized to one `resourceType`.

| Resource type      | Description                                                        |
| ------------------ | ------------------------------------------------------------------ |
| `org`              | Organization-level control and governance boundary.                |
| `workspace`        | Workspace-level execution and data isolation boundary.             |
| `tool`             | Tool capability, invocation surface, or tool configuration object. |
| `secret`           | Secret reference, secret material handle, or secret policy object. |
| `plugin`           | Plugin package, plugin runtime surface, or plugin configuration.   |
| `artifact`         | Versioned build, bundle, model package, or promoted registry item. |
| `external-target`  | Outbound system target such as APIs, queues, registries, or hosts. |

## Ownership and scoping rules

1. Every principal must be attached to exactly one `orgId`.
2. Every workspace-scoped operation must include exactly one `workspaceId`.
3. A resource can be `org`-scoped or `workspace`-scoped, but never both in a
   single authorization decision.
4. Workspace-scoped principals can only operate on workspace-scoped resources
   within the same `workspaceId` unless explicit delegated policy allows it.
5. Org-scoped principals can perform workspace actions only when their context
   includes the target `workspaceId` and an explicit workspace grant.
6. Cross-workspace actions must be modeled as explicit multi-resource requests;
   they must not be inferred from broad org-level membership.

## Canonical identifiers and mapping rules

Canonical identifiers use a typed, stable format:

`cc:<resource-or-principal-type>:<org-id>:<scope-segment>:<entity-id>`

Rules:

- `resource-or-principal-type` must be one of the canonical types in this doc.
- `org-id` is always required.
- `scope-segment` is either `org` or `ws:<workspace-id>`.
- `entity-id` is the stable logical id from the owning system.
- Legacy upstream ids can be preserved as aliases, but enterprise evaluation
  always operates on canonical ids.

Examples:

- `cc:user:acme:ws:payments:alice`
- `cc:service-account:acme:org:ci-bot`
- `cc:workspace:acme:org:payments`
- `cc:secret:acme:ws:payments:stripe-api-key`

## Initial implementation touchpoints

Later runtime work should wire this vocabulary into:

- `src/gateway` request context and authentication propagation
- `src/plugins` and `src/agents` delegated execution identity propagation
- `src/secrets` scoped secret mediation and enforcement
- `ui/src/ui` admin displays for principal and workspace context
