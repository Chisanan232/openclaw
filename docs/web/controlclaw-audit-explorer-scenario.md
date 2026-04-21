---
summary: "Enterprise audit explorer scenario for investigators and governance teams"
read_when:
  - You are implementing audit explorer UX or query APIs for ControlClaw
  - You are working on CONCLAW-44 and dependent enterprise audit tickets
title: "ControlClaw Audit Explorer Scenario"
---

# ControlClaw audit explorer scenario

This document is the implementation artifact for `CONCLAW-44`.

It defines the minimum viable enterprise audit-explorer flow so auditors can investigate control-plane activity without manual log extraction.

## Goal

Define the core audit-explorer scenario for enterprise ControlClaw.

## Scenario

As an auditor,  
I want to browse audit records by workspace, actor, action, and time range,  
so that I can investigate control-plane activity without manually extracting raw logs.

## Expected behavior

The audit explorer should support:

- filtering by workspace, actor, action, and time range
- understanding links between requests, policy decisions, approvals, and execution
- reviewing enough metadata to continue an investigation

## Test cases

- an auditor can isolate events for one workspace and actor
- related policy and approval records are discoverable from a starting event
- the browsing flow works without needing implementation-level log parsing

## How to verify

- later audit UI and backend query tickets can use this story as their acceptance scenario
- stakeholders can identify the minimum viable audit-explorer behavior

## Expected implementation areas

Likely future code touchpoints:

- audit query APIs
- admin audit UI
- audit storage and indexing

## Dependencies

- parent epic `CONCLAW-10`
- depends on `CONCLAW-20` and `CONCLAW-27`

## Relationships

- supports audit/governance and SIEM export planning

## Related references

- [ControlClaw Admin IA](/web/controlclaw-admin-ia)
