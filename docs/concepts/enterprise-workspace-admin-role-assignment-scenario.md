---
summary: "Workspace-admin role assignment scenario for enterprise OpenClaw planning"
read_when:
  - You are designing workspace-scoped role management for users and service accounts
  - You need acceptance criteria for anti-escalation and auditable role assignment flows
title: "Enterprise Workspace Admin Role Assignment Scenario"
---

# Enterprise workspace admin role assignment scenario

## Goal

Define the minimum role-assignment scenario for workspace-scoped administration
so admin UI, IAM API, policy, and audit tickets can validate one shared flow.

This scenario is a design/spec output for `CONCLAW-49`, not runtime
authorization code.

## Scenario statement

As a workspace admin, I can assign or remove supported workspace roles for users
and service accounts inside one workspace without escalating organization-level
permissions.

## Expected behavior

The role-management scenario must support:

- explicit workspace target selection
- user and service-account principal differentiation
- workspace-scoped role grant and removal actions
- anti-escalation checks that block org-scoped role assignment
- attributable audit context for every role change

## Acceptance tests mapped from ticket criteria

- workspace admin can grant a supported workspace role to a service account
- workspace admin cannot assign organization-scoped permissions from workspace scope
- role changes are attributable to acting admin and target principal

## Required audit context

A valid role assignment event includes:

- acting admin principal id and type
- target principal id and type
- workspace id
- role and action (`grant` or `remove`)
- request/session correlation ids

## Follow-up implementation touchpoints

Later implementation should integrate this scenario into:

- `src/admin` workspace role-management surfaces
- `src/gateway/role-policy.ts` policy checks for admin mutations
- `src/audit` role assignment event producers
- `src/plugins` capability mediation where workspace roles affect plugin actions

## Downstream ticket cross-reference map

Dependencies and adjacent tickets:

- `CONCLAW-15` enterprise identity/resource model
- `CONCLAW-35` org/workspace boundary enforcement model
- `CONCLAW-46` target topology and module boundary plan
- `CONCLAW-49` workspace-admin role assignment scenario (this ticket)

Related follow-up tickets:

- `CONCLAW-17` policy decision schema for administrative actions
- `CONCLAW-38` audit producer mapping for role-assignment attribution
- `CONCLAW-48` token/session propagation model for actor/executor context
