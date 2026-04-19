# ControlClaw Artifact Scanning, Signing, Repackaging, And Publication Workflow

Status: draft architecture specification for `CONCLAW-40`.

## Goal

Define one governed operational workflow for moving external artifacts through scanning, signing, optional repackaging, and internal publication.

## Scope

This specification covers:

- scan and risk-assessment stages
- signature and provenance handling rules
- repackage and re-sign workflow when required
- publication handoff into internal registry
- failure and rejection handling

This specification does not implement runtime enforcement yet.

## End-to-end Workflow

### Stage sequence

1. `intake`: receive artifact and record source identity.
2. `scan`: run integrity, security, and policy analysis.
3. `sign-verify`: validate upstream signatures and trust roots.
4. `repackage`: normalize or sanitize artifact when policy requires it.
5. `re-sign`: sign repackaged artifact with enterprise signing identity.
6. `publish`: publish approved artifact to internal registry channel.
7. `handoff`: expose published record to install and discovery consumers.

### Stage outcomes

| Stage         | Success outcome                                            | Failure outcome                                     |
| ------------- | ---------------------------------------------------------- | --------------------------------------------------- |
| `intake`      | Artifact admitted into analysis queue.                     | Reject as malformed or unsupported source.          |
| `scan`        | Risk and policy report generated.                          | Reject on hard-fail findings.                       |
| `sign-verify` | Signature trust status recorded.                           | Reject when required signature verification fails.  |
| `repackage`   | New artifact identity generated with lineage link.         | Reject when repackaging policy cannot be satisfied. |
| `re-sign`     | Enterprise signature attached to publish candidate.        | Reject when signing key/policy checks fail.         |
| `publish`     | Internal registry record created in controlled channel.    | Quarantine or reject publish request.               |
| `handoff`     | Install/discovery consumers can resolve approved artifact. | Hold in non-installable state pending remediation.  |

## Scanning And Risk-assessment Stages

### Required scan checks

Each artifact scan must include:

- integrity checks (digest and format validation)
- static security checks (vulnerability and malware indicators)
- policy checks (allowed capabilities and source compliance)
- risk-scoring summary aligned with `CONCLAW-23` risk model

### Risk decision rules

| Risk level / finding                   | Required action                                      |
| -------------------------------------- | ---------------------------------------------------- |
| `critical` or hard-deny policy finding | Immediate rejection; no publish path.                |
| `high` with conditional policy result  | Require explicit approval and potential repackaging. |
| `medium` or `low` with pass result     | Continue through signing and publish pipeline.       |

## Signature And Provenance Handling Rules

### Signature handling

- Upstream signature verification result must be recorded at `sign-verify`.
- Missing upstream signatures may be allowed only when policy explicitly permits unsigned intake for selected sources.
- Any artifact published internally must carry enterprise-signature metadata directly or by signed registry manifest association.

### Provenance requirements

Every workflow run must preserve:

- source artifact reference and submitter identity
- artifact digests for pre- and post-repackage payloads
- signature verification evidence and signer identity
- lineage link from original intake artifact to published artifact ID

## Repackage And Re-sign Workflow

### When repackaging is required

Repackaging is required when:

- source format normalization is needed for policy-compliant install
- blocked components must be removed or replaced
- enterprise metadata/signature wrapping is mandatory for publication

### Repackaging controls

- Repackaging must create a new artifact identity and keep `sourceArtifactId` linkage.
- Original artifact remains non-installable when repackaging was required for compliance.
- Repackaged artifact must re-enter scan/sign checks before publication.

### Re-sign controls

- Re-sign operation is performed only after repackaged artifact passes scan and policy checks.
- Enterprise signing key identity and timestamp must be recorded.
- Re-sign failure blocks publication and routes artifact to reject/quarantine handling.

## Publication Handoff Into Internal Registry

### Handoff contract

Publication step must emit:

- internal registry record ID
- channel assignment (`candidate | approved | quarantined | revoked`)
- digest, provenance summary, and signature metadata
- policy snapshot and approval references
- publish audit event for install/discovery subsystems

### Install-path linkage

This workflow supplies the publish-time guarantees consumed by `CONCLAW-24` install source policy:

- only governed internal registry artifacts are installable in enterprise production
- non-approved channels (`quarantined`, `revoked`) remain non-installable

## Failure And Rejection Handling

### Failure classes

| Failure class                       | Handling path                                        |
| ----------------------------------- | ---------------------------------------------------- |
| intake/format failure               | Reject and record unsupported artifact reason.       |
| security or policy hard fail        | Reject and block republish without remediation.      |
| transient scanner or signer failure | Move to retry queue with bounded retry policy.       |
| publish service failure             | Hold in candidate state and retry publish operation. |

### Rejection requirements

Rejected artifacts must include:

- explicit rejection reason code and human-readable explanation
- stage where rejection occurred
- remediation guidance when repackage/resubmit is allowed
- audit record for operator visibility

## Implementation Touchpoint Mapping

Later implementation phases should align these surfaces:

- admission service orchestration for stage transitions and retry controls
- registry metadata model for signature/provenance/lineage storage
- install and update tooling for consuming publish channel guarantees
- admin admission visibility for scan outcomes, rejection reasons, and publication status

## Verification Criteria

This specification is complete when:

- admission implementation work can follow one deterministic workflow across external sources
- provenance and signature requirements are explicit at each stage
- internal publication handoff is tied to governed channel and audit semantics
