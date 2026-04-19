# ControlClaw Internal Registry Publishing And Enterprise Install Path

Status: draft architecture specification for `CONCLAW-24`.

## Goal

Define how approved artifacts are published to an internal enterprise registry and how production ControlClaw installs only from governed sources.

## Scope

This specification covers:

- internal registry publishing model
- enterprise-only install and enable flow
- source-selection and provenance rules
- migration path from public install patterns to governed install paths

This specification does not implement runtime enforcement yet.

## Internal Registry Publishing Model

### Publishing prerequisites

An artifact is publish-eligible only when:

- lifecycle state from `CONCLAW-23` reached `approve`
- policy admission result is not `fail`
- approval record is present and integrity-protected
- provenance record includes digest and source identity

### Publishing flow

1. Admission service emits a publish request for an approved artifact identity.
2. Registry publisher writes immutable artifact metadata and digest mapping.
3. Registry publisher records signer and policy snapshot metadata.
4. Registry marks artifact distribution channel according to environment and release policy.
5. Registry emits publish audit event for install-discovery consumers.

### Registry channels

| Channel       | Intended usage                                     | Install eligibility                             |
| ------------- | -------------------------------------------------- | ----------------------------------------------- |
| `candidate`   | Pre-production verification and rollout rehearsal. | Not installable in production tenants.          |
| `approved`    | Enterprise-validated artifact set.                 | Installable when policy and tenant scope allow. |
| `quarantined` | Temporarily blocked after post-publish findings.   | Not installable in any environment.             |
| `revoked`     | Permanently blocked artifact lineage.              | Not installable in any environment.             |

### Required publish metadata

Each published artifact record must include:

- `artifactId` and optional `sourceArtifactId`
- immutable `digest`
- `channel` and tenant visibility
- `provenance` summary (source, submitter, signer verification)
- `approvalLog` and `policySnapshot`
- publish actor identity and publish timestamp

## Enterprise-only Install And Enable Flow

### Install flow

1. Install request resolves artifact from internal registry only for enterprise production mode.
2. Installer verifies artifact digest and registry metadata integrity.
3. Installer evaluates target runtime policy for tenant, environment, and capability scope.
4. Installer materializes artifact and records install audit entry.
5. Enable step activates artifact only after install health checks succeed.

### Enable flow guardrails

- Enable must reference an installed artifact record, not an external package reference.
- Enable is blocked when channel is `quarantined` or `revoked`.
- Enable is blocked when provenance verification is missing or failed.
- Enable outcome is written to audit and operator visibility surfaces.

## Source Selection Rules And Provenance Expectations

### Source selection by environment

| Environment mode        | Allowed sources                                                            | Disallowed sources                                                    |
| ----------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `local-dev`             | local path, archive path, explicit public registry spec, internal registry | none by default, policy may still restrict                            |
| `staging`               | internal registry, explicitly allowlisted mirror registries                | unmanaged public registry specs and arbitrary URLs                    |
| `enterprise-production` | internal registry only                                                     | local path, archive path, unmanaged public registries, arbitrary URLs |

### Provenance requirements for install eligibility

For enterprise production installs, source resolution must include:

- artifact digest from internal registry record
- source lineage linking to admission-approved artifact ID
- signature verification summary from admission and publish stages
- tenant and policy scope proving the artifact is allowed in target environment

If any required provenance field is missing, installation is denied.

## Migration Notes From Public Install Patterns

### Current public-first patterns

Current install flows may use:

- npm registry specs
- local path and archive installs
- ad hoc source selection based on operator convenience

### Target enterprise behavior

Enterprise production flow should shift to:

- internal registry publication as the default source of truth
- install-by-artifact-ID or approved channel reference
- policy-governed resolution that prevents unmanaged sources

### Planned migration sequence

1. Add registry publish and source metadata fields without removing existing install commands.
2. Add environment-aware source policy gates in install and enable flows.
3. Update CLI and plugin-install docs to make enterprise production registry-only behavior explicit.
4. Keep local-dev and staging exceptions behind explicit mode/policy control, not implicit fallback.

## Implementation Touchpoint Mapping

Later implementation phases should align these surfaces:

- `docs/cli/plugins.md` and plugin install docs for mode-specific source rules
- install and update flows in `src/plugins`
- manifest and discovery registry logic for governed source resolution
- future registry client and admission publish modules

## Verification Criteria

This specification is complete when:

- install work can distinguish local dev versus enterprise production source rules
- provenance requirements are explicit for production install eligibility
- rollout planning can treat internal-registry install as first-class enterprise behavior
