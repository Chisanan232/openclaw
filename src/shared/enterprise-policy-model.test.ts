import { describe, expect, it } from "vitest";
import {
  collectEnterprisePolicyCheckTargets,
  mapLegacyPluginCapability,
} from "./enterprise-policy-model.js";

describe("enterprise policy model", () => {
  it("collects deterministic parameter-aware check targets", () => {
    expect(
      collectEnterprisePolicyCheckTargets({
        action: {
          category: "tool.execute",
          id: "system.run",
          parameters: {
            cwd: "/tmp",
            command: "ls",
          },
        },
        resource: {
          kind: "tool",
          id: "system.run",
        },
      }),
    ).toEqual([
      { type: "action", key: "tool.execute:system.run" },
      { type: "resource", key: "tool:system.run" },
      { type: "parameter", key: "system.run:command" },
      { type: "parameter", key: "system.run:cwd" },
    ]);
  });

  it("maps plugin capability names to enterprise resource kinds", () => {
    expect(mapLegacyPluginCapability("tools")).toBe("tool");
    expect(mapLegacyPluginCapability("providers")).toBe("external_target");
    expect(mapLegacyPluginCapability("unknown-capability")).toBe("runtime_surface");
  });
});
