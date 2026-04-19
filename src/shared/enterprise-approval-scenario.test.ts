import { describe, expect, it } from "vitest";
import {
  ENTERPRISE_APPROVAL_SCENARIO_VERSION,
  createEnterpriseApprovalAuditRecord,
  resolveEnterpriseApproval,
  type EnterpriseApprovalRequest,
} from "./enterprise-approval-scenario.js";

function buildRequest(
  overrides: Partial<EnterpriseApprovalRequest> = {},
): EnterpriseApprovalRequest {
  return {
    schemaVersion: ENTERPRISE_APPROVAL_SCENARIO_VERSION,
    id: "apr-001",
    createdAt: "2026-04-19T09:00:00.000Z",
    expiresAt: "2026-04-19T10:00:00.000Z",
    workspaceId: "ws-payments",
    requester: {
      type: "agent",
      id: "agent:finance-ops",
    },
    resource: {
      kind: "external_target",
      id: "billing-prod",
    },
    action: {
      category: "external.target",
      id: "wire.transfer.execute",
      scope: ["payments", "high-risk"],
    },
    justification: "Urgent vendor payment before cutoff.",
    auditVisibility: "org-auditors",
    ...overrides,
  };
}

describe("enterprise approval scenario", () => {
  it("keeps actor, action, target, and expiry in the request shape", () => {
    const request = buildRequest();
    expect(request.requester.id).toBe("agent:finance-ops");
    expect(request.action.id).toBe("wire.transfer.execute");
    expect(request.resource.id).toBe("billing-prod");
    expect(request.expiresAt).toBe("2026-04-19T10:00:00.000Z");
  });

  it("does not allow successful approvals after expiry", () => {
    const request = buildRequest();
    const outcome = resolveEnterpriseApproval({
      request,
      resolution: {
        decision: "approve",
        decidedAt: "2026-04-19T10:05:00.000Z",
        resolver: {
          type: "operator",
          id: "user:approver-1",
        },
      },
    });
    expect(outcome.status).toBe("expired");
    expect(outcome.reason).toContain("expired");
  });

  it("records denial rationale and resolution identity", () => {
    const request = buildRequest();
    const outcome = resolveEnterpriseApproval({
      request,
      resolution: {
        decision: "deny",
        decidedAt: "2026-04-19T09:30:00.000Z",
        resolver: {
          type: "operator",
          id: "user:approver-2",
        },
        rationale: "Missing second-signature evidence.",
      },
    });
    expect(outcome.status).toBe("denied");
    expect(outcome.resolvedBy.id).toBe("user:approver-2");
    expect(outcome.reason).toBe("Missing second-signature evidence.");
  });

  it("produces an audit-ready outcome record", () => {
    const request = buildRequest();
    const outcome = resolveEnterpriseApproval({
      request,
      resolution: {
        decision: "approve",
        decidedAt: "2026-04-19T09:20:00.000Z",
        resolver: {
          type: "operator",
          id: "user:approver-3",
        },
      },
    });
    const record = createEnterpriseApprovalAuditRecord({ request, outcome });
    expect(record).toMatchObject({
      eventType: "enterprise.approval.outcome",
      requestId: "apr-001",
      workspaceId: "ws-payments",
      requesterId: "agent:finance-ops",
      resolverId: "user:approver-3",
      actionId: "wire.transfer.execute",
      resourceId: "billing-prod",
      status: "approved",
      visibility: "org-auditors",
    });
  });
});
