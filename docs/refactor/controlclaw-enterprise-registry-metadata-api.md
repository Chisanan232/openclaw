# ControlClaw Enterprise Registry Metadata Model And API Expectations

Status: draft architecture specification for `CONCLAW-41`.

## Goal

Define one metadata and API model for the internal enterprise registry so install, admin UI, admission publication, and audit consumers share the same artifact record contract.

## Scope

This specification covers:

- registry record shape
- artifact metadata and provenance fields
- approval and publication linkage
- API and query expectations for install, admin UI, and audit references

This specification does not implement runtime registry services yet.

## Registry Record Model

### Identity and versioning fields

Each registry record must carry:

- `artifactId`: stable artifact identity across lifecycle transitions
- `versionId`: immutable published version identity
- `sourceArtifactId`: original external artifact identity (when applicable)
- `repackagedFromVersionId`: prior version link when repackaging occurred
- `digest`: canonical payload digest used by install verification

### Lifecycle and publication fields

Each record must include:

- `lifecycleState`: aligned with `CONCLAW-23` state vocabulary
- `publicationChannel`: `candidate | approved | quarantined | revoked`
- `publicationStatus`: `pending | published | blocked`
- `publishedAt` and `publishedBy`
- `admissionRunId` used to trace from intake to publication

### Provenance and signature fields

Each record must include:

- `provenance.source` (kind + reference)
- `provenance.submitterIdentity`
- `provenance.signatureVerification` result and signer details
- `enterpriseSignature` metadata when re-signing is required
- lineage map linking source, repackaged, and published identities

### Approval and policy linkage fields

Each record must include:

- `approvalLogRefs`: one or more approval decision references
- `policySnapshotRef`: policy bundle and decision context reference
- `riskSummary`: risk score/level used for admission decision
- `decisionReasonCodes`: normalized codes for publish block/allow outcomes

## Canonical Record Shape

```ts
type EnterpriseRegistryRecord = {
  artifactId: string;
  versionId: string;
  sourceArtifactId?: string | null;
  repackagedFromVersionId?: string | null;
  digest: string;
  lifecycleState: "ingest" | "analyze" | "approve" | "reject" | "publish" | "install" | "enable";
  publicationChannel: "candidate" | "approved" | "quarantined" | "revoked";
  publicationStatus: "pending" | "published" | "blocked";
  publishedAt?: string | null;
  publishedBy?: string | null;
  admissionRunId: string;
  provenance: {
    source: { kind: string; reference: string };
    submitterIdentity: string;
    signatureVerification: { result: string; signer?: string | null };
  };
  enterpriseSignature?: { signer: string; signedAt: string } | null;
  approvalLogRefs: string[];
  policySnapshotRef: string;
  riskSummary: { score: number; level: "low" | "medium" | "high" | "critical" };
  decisionReasonCodes: string[];
};
```

## API Expectations

### Required read APIs

| API                                                         | Purpose                                                                     | Primary consumers                        |
| ----------------------------------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------- |
| `GET /registry/artifacts/{artifactId}/versions/{versionId}` | Fetch authoritative record for install verification and admin detail views. | install tooling, admin UI, audit queries |
| `GET /registry/artifacts/{artifactId}/versions`             | List versions and channel states for upgrade and rollback decisions.        | install tooling, admin UI                |
| `GET /registry/artifacts`                                   | Query by channel, lifecycle state, and approval metadata.                   | admin UI, operations automation          |
| `GET /registry/audit-links/{versionId}`                     | Resolve approval/policy/publication references by artifact version.         | audit workflows, compliance exports      |

### Required write APIs (publication side)

| API                                         | Purpose                                                  | Producer                           |
| ------------------------------------------- | -------------------------------------------------------- | ---------------------------------- |
| `POST /registry/publications`               | Register publish intent and create pending record.       | admission publication layer        |
| `POST /registry/publications/{id}/finalize` | Finalize record with channel + signature + policy links. | admission publication layer        |
| `POST /registry/publications/{id}/channel`  | Move channel state (for quarantine/revoke controls).     | governance and security operations |

### Query and filter expectations

Registry queries must support:

- by `publicationChannel` and `publicationStatus`
- by `lifecycleState`
- by `approvalLogRefs` and `policySnapshotRef`
- by `digest` and identity lineage fields
- by time range (`publishedAt`, admission timestamps)

## Consumer Use-case Mapping

### Install and discovery clients

Install/discovery consumers need:

- exact record by `artifactId + versionId`
- channel and publication status to gate eligibility
- digest + signature metadata for integrity verification
- lineage fields for upgrade and rollback safety decisions

### Admin registry views

Admin views need:

- searchable lists by channel/state/risk
- record detail with provenance and approval linkage
- channel transition visibility (`approved` -> `quarantined` -> `revoked`)

### Audit and compliance references

Audit consumers need:

- stable artifact and version identifiers
- direct links to approval and policy snapshot records
- decision reason codes and actor/timestamp fields

## Responsibility Boundary

Registry responsibilities include:

- immutable artifact record storage
- publication state and channel governance metadata
- provenance/approval/policy linkage references

Registry responsibilities do not include:

- runtime execution orchestration
- install execution logic
- policy evaluation execution itself (only storing references/outcomes)

## Implementation Touchpoint Mapping

Later implementation phases should align:

- install/discovery registry clients to the read API contract
- admission publication layer to publication write APIs
- admin registry views to list/detail/filter use cases
- audit tooling to approval/policy linkage references

## Verification Criteria

This specification is complete when:

- one record model can satisfy install, admin, and audit consumers
- artifact identity and provenance remain stable across lifecycle transitions
- registry metadata scope is clearly separated from runtime execution scope
