# ControlClaw Registry Reviewer Approval And Rejection Scenario

Status: draft scenario specification for `CONCLAW-54`.

## Goal

Define the human review scenario where a registry reviewer decides whether a submitted plugin artifact is approved or rejected before it can become installable in enterprise ControlClaw.

## Scope

This scenario specification covers:

- reviewer-facing artifact context required for decision making
- approval and rejection decision flow
- publish and installability gating behavior after decision
- audit context produced by the review action

This specification does not implement UI or runtime admission APIs yet.

## Reviewer Decision Scenario

### Actor and objective

- Actor: `registry reviewer`
- Objective: evaluate artifact trust and policy posture, then approve or reject with an explicit reason
- Outcome: only governed artifacts progress to publication and installability

### Reviewer must be able to inspect

Before deciding, reviewer views:

- artifact identity and version (`artifactId`, `versionId`, `digest`)
- submitter and provenance context (`submitterIdentity`, source reference, lineage)
- scan and signing results (risk summary, signature verification, policy findings)
- publication and approval linkage context (prior approvals, policy snapshot references)

### Reviewer action options

| Action    | Required inputs                                              | Result                                                                               |
| --------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| `approve` | decision reason, reviewer identity, decision timestamp       | artifact can continue to publication and later install eligibility checks            |
| `reject`  | rejection reason code, reviewer identity, decision timestamp | artifact is blocked from publication/installability until remediated and resubmitted |

## Decision Workflow

### Workflow steps

1. Reviewer opens submitted artifact review record.
2. System loads metadata from registry/admission record (`CONCLAW-41` model).
3. Reviewer inspects scan, signature, provenance, and policy context.
4. Reviewer records decision (`approve` or `reject`) with reason.
5. System persists decision and emits audit event.
6. System applies publication/installability gating based on decision.

### Decision outcomes

| Decision  | Publication status                           | Installability status                                       |
| --------- | -------------------------------------------- | ----------------------------------------------------------- |
| `approve` | eligible to publish to approved channel      | may become installable after publication and channel checks |
| `reject`  | blocked from publication to approved channel | non-installable; remains blocked until new review cycle     |

## Gating And Safety Rules

- Approval is required before an artifact can enter the approved publication path.
- Rejected artifacts cannot be treated as installable through any enterprise production path.
- Decision updates must be atomic with audit event creation.
- Reviewer decision record must reference the exact artifact version reviewed.
- Later resubmissions must create a new review decision record, not overwrite historical decisions.

## Test-case Alignment

### Clean vs blocked artifact distinction

- Reviewer can identify clean artifact status via low/acceptable risk + passing policy/signature results.
- Reviewer can identify blocked artifact status via hard-deny findings, failed signature checks, or policy fail outcomes.

### Rejection blocks enterprise publication

- Rejected decision forces artifact publication status to blocked/non-approved channel.
- Rejected decision keeps installability flag false for enterprise production consumers.

### Audit context for later flows

Approval/rejection produces audit context that includes:

- artifact identity + version
- reviewer identity
- decision result and reason code
- timestamps and linked policy/scan references

This context is required for install investigations and governance reviews.

## API/Model Expectations For Later Implementation

### Decision payload expectation

```ts
type RegistryReviewDecision = {
  artifactId: string;
  versionId: string;
  reviewerIdentity: string;
  decision: "approve" | "reject";
  reasonCode: string;
  reasonDetail?: string;
  decidedAt: string;
  referencedScanResultId: string;
  referencedPolicySnapshotRef: string;
};
```

### Resulting record fields

After decision write, record should expose:

- `reviewDecision.status`
- `reviewDecision.reasonCode`
- `reviewDecision.reviewerIdentity`
- `reviewDecision.decidedAt`
- `publicationEligibility`
- `installEligibility.enterpriseProduction`

## Implementation Touchpoint Mapping

Later implementation phases should align:

- admission service APIs for decision persistence and gating
- registry review UI for decision capture and evidence display
- artifact publication workflow for decision-driven publication eligibility
- audit event producers for decision traceability

## Verification Criteria

This scenario specification is complete when:

- reviewers can evaluate artifacts using one explicit evidence set
- approval and rejection decisions deterministically control publication and installability
- audit/install investigation flows can reference decision records without ambiguity
