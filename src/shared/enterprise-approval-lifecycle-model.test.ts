import { describe, expect, it } from "vitest";
import {
  ENTERPRISE_APPROVAL_LIFECYCLE_SCHEMA_VERSION,
  ENTERPRISE_APPROVAL_OPERATION_MAPPINGS,
  ENTERPRISE_APPROVAL_PERSISTENCE_REQUIREMENTS,
  applyApprovalLifecycleEvent,
  canApplyApprovalLifecycleTrigger,
  deriveApprovalAutomaticLifecycleActions,
  type EnterpriseApprovalLifecycleRecord,
} from "./enterprise-approval-lifecycle-model.js";

function buildRecord(
  overrides: Partial<EnterpriseApprovalLifecycleRecord> = {},
): EnterpriseApprovalLifecycleRecord {
  return {
    schemaVersion: ENTERPRISE_APPROVAL_LIFECYCLE_SCHEMA_VERSION,
    ticketKey: "CONCLAW-37",
    requestId: "apr-037-001",
    workspaceId: "ws-risk",
    status: "pending_review",
    createdAt: "2026-04-21T08:00:00.000Z",
    expiresAt: "2026-04-21T10:00:00.000Z",
    escalationAt: "2026-04-21T09:00:00.000Z",
    revision: 1,
    auditHandoff: "pending",
    ...overrides,
  };
}

describe("enterprise approval lifecycle model (CONCLAW-37)", () => {
  it("exposes persistence requirements and operation mappings for downstream API/UI work", () => {
    expect(ENTERPRISE_APPROVAL_PERSISTENCE_REQUIREMENTS.map((item) => item.id)).toEqual([
      "approval-request-snapshot",
      "approval-transition-log",
      "approval-escalation-timeout-log",
      "approval-audit-handoff-log",
    ]);
    expect(ENTERPRISE_APPROVAL_OPERATION_MAPPINGS.map((item) => item.operationId)).toEqual([
      "create-request",
      "approve-request",
      "deny-request",
      "request-reapproval",
      "supersede-request",
      "publish-audit-handoff",
    ]);
  });

  it("derives automatic escalation and expiry actions deterministically", () => {
    const escalatedActions = deriveApprovalAutomaticLifecycleActions({
      record: buildRecord(),
      now: "2026-04-21T09:10:00.000Z",
    });
    expect(escalatedActions).toEqual([
      {
        trigger: "auto_escalate",
        happenedAt: "2026-04-21T09:10:00.000Z",
        reason: "approval reached escalation threshold before resolution",
      },
    ]);

    const expiredActions = deriveApprovalAutomaticLifecycleActions({
      record: buildRecord({ status: "escalated" }),
      now: "2026-04-21T10:05:00.000Z",
    });
    expect(expiredActions).toEqual([
      {
        trigger: "auto_expire",
        happenedAt: "2026-04-21T10:05:00.000Z",
        reason: "approval lifetime exceeded expiry threshold",
      },
    ]);
  });

  it("supports re-approval after denial with revision and expiry refresh", () => {
    const deniedRecord = applyApprovalLifecycleEvent({
      record: buildRecord(),
      event: {
        trigger: "resolve_deny",
        actorId: "user:approver-1",
        happenedAt: "2026-04-21T08:30:00.000Z",
        resolutionReason: "Missing compliance attachment.",
      },
    });
    expect(deniedRecord.status).toBe("denied");
    expect(deniedRecord.auditHandoff).toBe("handoff_ready");

    const reapprovalRecord = applyApprovalLifecycleEvent({
      record: deniedRecord,
      event: {
        trigger: "request_reapproval",
        actorId: "user:requester-1",
        happenedAt: "2026-04-21T08:45:00.000Z",
        nextExpiresAt: "2026-04-21T12:00:00.000Z",
      },
    });
    expect(reapprovalRecord.status).toBe("pending_review");
    expect(reapprovalRecord.revision).toBe(2);
    expect(reapprovalRecord.expiresAt).toBe("2026-04-21T12:00:00.000Z");
    expect(reapprovalRecord.resolvedAt).toBeUndefined();
    expect(reapprovalRecord.auditHandoff).toBe("pending");
  });

  it("records supersession and supports audit handoff publication", () => {
    const superseded = applyApprovalLifecycleEvent({
      record: buildRecord(),
      event: {
        trigger: "supersede_request",
        actorId: "user:approver-2",
        happenedAt: "2026-04-21T09:20:00.000Z",
        supersededByRequestId: "apr-037-002",
      },
    });
    expect(superseded.status).toBe("superseded");
    expect(superseded.supersededByRequestId).toBe("apr-037-002");
    expect(superseded.auditHandoff).toBe("handoff_ready");

    const published = applyApprovalLifecycleEvent({
      record: superseded,
      event: {
        trigger: "handoff_audit",
        actorId: "system:audit-pipeline",
        happenedAt: "2026-04-21T09:21:00.000Z",
      },
    });
    expect(published.auditHandoff).toBe("published");
  });

  it("rejects invalid lifecycle transitions", () => {
    expect(canApplyApprovalLifecycleTrigger("approved", "request_reapproval")).toBe(false);
    expect(() =>
      applyApprovalLifecycleEvent({
        record: buildRecord({ status: "approved" }),
        event: {
          trigger: "resolve_approve",
          actorId: "user:approver-1",
          happenedAt: "2026-04-21T08:20:00.000Z",
        },
      }),
    ).toThrow("invalid lifecycle transition");
  });
});
