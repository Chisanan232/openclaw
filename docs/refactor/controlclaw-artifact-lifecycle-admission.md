# ControlClaw Artifact Lifecycle And Admission Policy

Status: draft architecture specification for `CONCLAW-23`.

## Goal

Define one lifecycle and admission vocabulary for enterprise artifacts entering ControlClaw so registry, install, and admin surfaces use the same state model.

## Scope

This specification covers:

- artifact lifecycle states
- stage-level provenance and signature requirements
- risk-scoring and policy checkpoints
- mapping to future registry APIs and UI visibility

This specification does not implement runtime enforcement yet.

## Artifact Lifecycle State Machine

### States

| State     | Owner                 | Description                                                         | Entry condition                                                   | Exit condition                                |
| --------- | --------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------- | --------------------------------------------- |
| `ingest`  | intake service        | Artifact bytes and declared metadata were received.                 | Artifact source accepted for processing.                          | Integrity and format checks complete.         |
| `analyze` | admission engine      | Security and policy analyzers evaluate the artifact.                | `ingest` succeeded.                                               | Risk score and policy findings are finalized. |
| `approve` | policy and approver   | Artifact is approved for enterprise distribution.                   | `analyze` passed policy gates plus required approvals.            | Artifact publication metadata is written.     |
| `reject`  | policy and approver   | Artifact is denied and cannot enter runtime install paths.          | `analyze` fails hard policy gates or explicit approver rejection. | Terminal state.                               |
| `publish` | registry service      | Approved artifact is materialized into enterprise registry records. | `approve` succeeded.                                              | Registry record reaches publish-ready state.  |
| `install` | runtime installer     | Artifact payload is installed into a managed runtime.               | `publish` succeeded and install policy allows target scope.       | Install health and integrity checks pass.     |
| `enable`  | runtime control plane | Installed artifact is activated and callable by allowed principals. | `install` succeeded and runtime policy allows activation.         | Terminal operational state.                   |

### Allowed Transitions

- `ingest -> analyze`
- `analyze -> approve`
- `analyze -> reject`
- `approve -> publish`
- `publish -> install`
- `install -> enable`

No direct transition is allowed to `enable` without passing `publish` and `install`.

### Terminal Outcomes

- `enable` means enterprise-admitted and operational.
- `reject` means denied and blocked from publish/install/enable.
- `repackaged` is represented as a new artifact identity that re-enters `ingest` with a provenance link to the original rejected or superseded artifact.

## Provenance And Signature Requirements

| Stage     | Minimum required evidence                                                                   | Signature expectation                                                                  |
| --------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `ingest`  | source URI or registry reference, artifact digest, submitter identity, submission timestamp | If upstream signature exists, store verification result and signer identity.           |
| `analyze` | analyzer versions, policy bundle version, full finding set, computed risk score             | Verify signature chain against trusted roots when signature material exists.           |
| `approve` | approver identity, approval decision record, approval reason, approval time                 | Approval decision record must be integrity-protected and bound to artifact digest.     |
| `publish` | immutable registry record ID, published digest, channel label, retention policy             | Enterprise registry signs published metadata and digest mapping.                       |
| `install` | target runtime identity, install actor identity, install time, install result               | Installer verifies published digest and metadata signature before materializing files. |
| `enable`  | enabled principal or policy context, activation timestamp, runtime target                   | Runtime activation record is signed or tamper-evident in the audit ledger.             |

## Admission Policy And Risk Checkpoints

### Checkpoint Model

Each artifact admission run must produce:

- `risk.score`: normalized integer `0-100`
- `risk.level`: `low | medium | high | critical`
- `policy.result`: `pass | conditional | fail`
- `approval.result`: `approved | rejected | pending`

### Checkpoint Gates

| Checkpoint                 | Required fields                                           | Gate result                                                                           |
| -------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `integrity`                | digest match, format parse success                        | `pass` allows `analyze`; `fail` moves to `reject`.                                    |
| `provenance`               | source identity, signer trust result                      | `pass` or `conditional` allows `analyze`; `fail` moves to `reject`.                   |
| `security-analysis`        | vulnerability findings, malware/static checks, risk score | `critical` risk or hard deny finding moves to `reject`.                               |
| `policy-admission`         | policy bundle evaluation and exceptions                   | `pass` continues; `conditional` requires explicit approval; `fail` moves to `reject`. |
| `human-or-system-approval` | approver identity and decision record                     | `approved` continues to `publish`; `rejected` moves to `reject`.                      |

### Decision Rule

When compatibility convenience conflicts with enterprise governance, governance wins and the artifact must remain blocked.

## Registry API And Admin UI Mapping

### Future Registry API Field Model

Each artifact record should expose:

- `artifactId`: stable enterprise artifact identity
- `sourceArtifactId`: optional previous artifact identity for repackaging lineage
- `lifecycleState`: one of `ingest | analyze | approve | reject | publish | install | enable`
- `admissionDecision`: `approved | rejected | pending`
- `riskScore` and `riskLevel`
- `provenance`: source, signer, digest, verification summary
- `policySnapshot`: policy bundle ID and evaluation summary
- `approvalLog`: approver identities and decisions
- `registryVisibility`: `hidden | internal | published`

### Admin UI Visibility Mapping

| Lifecycle state | Registry visibility | Admin UI expectation                                              |
| --------------- | ------------------- | ----------------------------------------------------------------- |
| `ingest`        | `hidden`            | Intake queue with submission metadata.                            |
| `analyze`       | `hidden`            | Admission review view with findings and risk rollup.              |
| `approve`       | `internal`          | Approved pending publication board.                               |
| `reject`        | `internal`          | Rejected artifacts board with rationale and remediation guidance. |
| `publish`       | `published`         | Registry catalog entry with immutable digest and provenance.      |
| `install`       | `internal`          | Deployment progress and target runtime status.                    |
| `enable`        | `published`         | Active artifact inventory and runtime usage surface.              |

## Implementation Touchpoint Mapping

This state model is the shared vocabulary for upcoming implementation work in:

- plugin and bundle install and update flows
- manifest and discovery surfaces under `src/plugins`
- admission service and registry metadata persistence
- admin and admission dashboard and API surfaces

Future tickets should reference this lifecycle directly instead of defining local state names.

## Verification Criteria

This specification is complete when:

- approved, rejected, and repackaged artifacts are unambiguously distinguishable
- registry APIs and install paths can use the same lifecycle names
- policy and approval checkpoints are explicit enough for deterministic admission decisions
