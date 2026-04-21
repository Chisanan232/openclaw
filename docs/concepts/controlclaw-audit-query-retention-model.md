---
summary: "Canonical audit query, indexing, retention partitioning, and storage-layer model for ControlClaw"
read_when:
  - Defining audit storage, investigation query APIs, explorer UX, or SIEM export paths
title: "ControlClaw Audit Query and Retention Model"
---

# ControlClaw audit query and retention model

## Goal

Define how ControlClaw audit records are stored for investigation query speed,
retention control, replay support, and SIEM export compatibility, without
changing the canonical event contract.

This page is the canonical storage and query contract for `CONCLAW-52`.

## Scope and boundaries

This model defines:

- query dimensions and indexing strategy
- retention and partitioning for append-only audit records
- replay-friendly grouping and correlation expectations
- separation between canonical storage, derived indexes, and export-ready views

This model does not redefine event taxonomy or producer emission timing.

## Query dimensions and indexing strategy

Audit query support must optimize for common investigation pivots.

| Dimension family | Required fields                                                      | Query intent                                 | Index baseline                                                                 |
| ---------------- | -------------------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------ |
| Tenant/workspace | `tenant.orgId`, `tenant.projectId`                                   | isolate one enterprise/workspace             | composite `(tenant.orgId, tenant.projectId, occurredAt desc)`                  |
| Actor identity   | `actor.kind`, `actor.id`, `actor.display`                            | attribute who initiated or resolved actions  | composite `(tenant.orgId, actor.id, occurredAt desc)`                          |
| Action/type      | `category`, `type`, `outcome`, `severity`                            | filter by control domain and result          | composite `(tenant.orgId, category, type, occurredAt desc)`                    |
| Resource target  | `resource.kind`, `resource.id`, `resource.display`, `subject.id`     | analyze impact on one resource or command    | composite `(tenant.orgId, resource.id, occurredAt desc)`                       |
| Time window      | `occurredAt`, `ingestedAt`                                           | timeline and incident window queries         | clustered/sorted by `(tenant.orgId, occurredAt, eventId)`                      |
| Correlation      | `trace.requestId`, `trace.correlationId`, `trace.runId`, `sessionId` | reconstruct replay chain and adjacent events | dedicated lookup indexes per correlation key with `(tenant.orgId, occurredAt)` |

Minimum query requirements:

- all filter dimensions above are available together with time-range filters
- pagination is deterministic by `occurredAt`, then `eventId`
- sorting options are constrained to stable indexed forms to avoid full scans

## Append-only retention and partitioning model

The canonical audit event store is append-only and immutable by `eventId`.

### Partition strategy

- primary partition key: `tenant.orgId + occurredAt` monthly partitions
- secondary clustering: `eventId` for deterministic tiebreak and replay
- partitions are never rewritten; compaction is metadata-only
- retention enforcement deletes whole eligible partitions or tombstones records
  by retention class policy, never mutating surviving event payloads

### Retention policy baseline

Retention classes inherit baseline windows from the audit event model:

- `regulatory`: 2555 days (7 years)
- `security`: 365 days
- `operational`: 180 days

Operational requirements:

- each event must carry or derive a retention class at ingest
- retention expiry evaluation must be auditable and reproducible
- legal hold markers must suspend deletion without mutating event payloads

## Replay-friendly grouping and correlation rules

Replay and investigation services must support chain reconstruction with these
rules:

- one correlation chain can be resolved by any of:
  - `trace.requestId`
  - `trace.correlationId`
  - `trace.runId`
  - `trace.sessionId`
- replay responses include contiguous events for matched keys ordered by
  `occurredAt`, then `eventId`
- missing links must surface explicit evidence-gap markers rather than silent
  omissions
- grouping queries support both strict chain mode (single key) and expanded
  adjacency mode (neighbor events sharing at least one correlation key)

## Storage layer boundaries

Audit storage must remain layered so downstream consumers do not alter canonical
records.

| Layer                      | Responsibility                                                               | Mutability  |
| -------------------------- | ---------------------------------------------------------------------------- | ----------- |
| Canonical event store      | append-only source of truth for audit envelope and evidence metadata         | immutable   |
| Derived investigation view | query-optimized projections and denormalized pivots for explorer/API latency | rebuildable |
| Export-ready view          | SIEM- and compliance-oriented schemas mapped from canonical + derived data   | rebuildable |

Boundary rules:

- canonical store schema changes must remain backward compatible by
  `schemaVersion`
- derived and export layers can evolve independently as long as they preserve
  canonical traceability to `eventId`
- export formatting must not introduce new source-of-truth fields that are not
  backed by canonical events

## Expected implementation areas

Likely downstream touchpoints:

- audit storage and query services
- admin audit explorer APIs and UI query endpoints
- replay/evidence workflow services
- SIEM export adapters and connector pipelines

## Verification criteria

`CONCLAW-52` is complete when:

- investigation query dimensions and index baselines are explicit enough to
  implement without redesign
- retention and partition behavior is deterministic for append-only audit data
- replay grouping and correlation expectations are concrete and testable
- canonical-versus-derived-versus-export boundaries are clear for future teams

## Related

- [ControlClaw Audit Event Model](/concepts/controlclaw-audit-model)
- [ControlClaw Audit Event Producer Map](/concepts/controlclaw-audit-producer-map)
- [ControlClaw Audit Investigation Scenario](/concepts/controlclaw-audit-investigation-scenario)
