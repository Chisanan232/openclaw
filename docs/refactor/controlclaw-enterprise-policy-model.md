# ControlClaw Enterprise Policy Decision Model

## Goal

Define one shared authorization decision format and capability model that downstream enterprise enforcement work can consume across tools, gateway methods, plugin registration, and runtime surfaces.

This is the `CONCLAW-17` planning artifact and is intentionally model-first. It does not change enforcement behavior on its own.

## Decision schema

The canonical decision object is represented in code by `src/shared/enterprise-policy-model.ts` as `EnterprisePolicyDecision`.

### Required fields

- `subject`: who is requesting access
- `action`: what operation is requested
- `resource`: which concrete target is touched
- `context`: request/session metadata used for policy evaluation
- `result`: allow, deny, or conditional
- `rationale`: structured reason records with policy/rule evidence

### Shape summary

```ts
type EnterprisePolicyDecision = {
  schemaVersion: "2026-04-17";
  subject: { type; id; tenantId?; roleIds?; attributes? };
  action: { category; id; parameters? };
  resource: { kind; id; ownerPluginId?; attributes? };
  context: { requestId; sessionKey?; channelId?; agentId?; source?; occurredAt?; extra? };
  result: "allow" | "deny" | "conditional";
  rationale: Array<{ code; message; matchedPolicyId?; matchedRuleId?; evidence? }>;
};
```

## Capability model

The baseline capability/resource kinds are:

- `tool`
- `plugin`
- `gateway_method`
- `runtime_surface`
- `external_target`

The action category dimension is intentionally separate from resource kind:

- `tool.execute`
- `plugin.activate`
- `gateway.method`
- `runtime.surface`
- `external.target`

This keeps policy evaluation expressive enough for mixed checks like:

- allow a plugin capability registration but deny specific runtime methods
- allow a gateway method class but deny privileged parameter sets

## Parameter-aware and resource-aware checks

For enterprise policy evaluation, checks should be compiled into deterministic targets:

1. action target (`<category>:<actionId>`)
2. resource target (`<kind>:<resourceId>`)
3. parameter targets (`<actionId>:<parameterKey>`, sorted)

The helper `collectEnterprisePolicyCheckTargets` in `src/shared/enterprise-policy-model.ts` provides this target extraction so downstream enforcement tickets can apply the same ordering and key format.

## Mapping from current OpenClaw policy surfaces

### Tool allowlist/denylist and owner-only behavior

Current source:

- `src/agents/tool-policy.ts`
- `src/agents/tool-policy-shared.ts`

Mapping:

- `allow` -> explicit allowlist grant
- `deny` -> explicit denylist block
- `ownerOnly` -> subject role constraint
- tool groups -> capability set aliases

### Gateway method scopes

Current source:

- `src/gateway/method-scopes.ts`
- `src/gateway/operator-scopes.ts`

Mapping:

- `operator.read` -> `gateway.method:read`
- `operator.write` -> `gateway.method:write`
- `operator.admin` -> `gateway.method:admin`
- `operator.approvals` -> `gateway.method:approvals`
- `operator.pairing` -> `gateway.method:pairing`
- `operator.talk.secrets` -> `gateway.method:secrets`

### Plugin capability declarations

Current source:

- `src/plugins/types.ts`
- `src/plugins/registry.ts`
- `src/plugins/loader.ts`

Mapping:

- plugin capability keywords map into enterprise resource kinds through `mapLegacyPluginCapability`
- unknown capability labels default to `runtime_surface` until an explicit contract is added

## Follow-up implementation touchpoints

This model is expected to be consumed by follow-up enforcement tickets in:

- `src/agents/tool-policy.ts` and related policy pipeline helpers
- `src/gateway/method-scopes.ts` plus gateway request authorization
- `src/plugins` capability registration and policy metadata

The intended next step is to emit `EnterprisePolicyDecision` records at authorization points and keep all deny reasons in structured `rationale` entries instead of freeform-only strings.

## Related acceptance scenario contract

`CONCLAW-22` defines the minimum enterprise data-governance acceptance scenarios
for outbound destination restrictions and secret-access mediation.

Canonical reference:

- `docs/refactor/controlclaw/outbound-data-secret-governance-scenario.md`
- `src/shared/enterprise-data-governance-scenarios.ts`
- `docs/refactor/controlclaw/secret-access-review-revoke-governance-scenario.md`
- `src/shared/enterprise-secret-access-governance-scenarios.ts`
