import { describe, expect, it } from "vitest";
import { OpenClawPassportMiddlewareLite } from "../src/OpenClawPassportMiddlewareLite.js";
import { OpenClawPassportWrapperLite } from "../src/OpenClawPassportWrapperLite.js";

describe("OpenClawPassportMiddlewareLite", () => {
  function createMiddleware() {
    const wrapper = new OpenClawPassportWrapperLite({
      chainId: "middleware-test",
      actorId: "agent-1",
      purpose: "middleware-unit-test"
    });
    return new OpenClawPassportMiddlewareLite(wrapper);
  }

  it("beforeToolCall records reasoning + intent (2 records)", async () => {
    const mw = createMiddleware();
    const toolCall = { tool: "sendEmail", payload: { to: "a@b.com" } };

    const returned = await mw.beforeToolCall(toolCall);

    expect(returned).toBe(toolCall);
    const bundle = await mw.finalize();
    expect(bundle.passport_records).toHaveLength(2);
    expect(bundle.passport_records[0].action_type).toBe("AI_RECOMMENDATION");
    expect(bundle.passport_records[1].action_type).toBe("EXECUTION_PENDING");
  });

  it("afterToolResult records tool result (1 record)", async () => {
    const mw = createMiddleware();
    const toolCall = { tool: "readFile", payload: { path: "/tmp/test" } };
    const result = { content: "file data" };

    const returned = await mw.afterToolResult(toolCall, result);

    expect(returned).toBe(result);
    const bundle = await mw.finalize();
    expect(bundle.passport_records).toHaveLength(1);
    expect(bundle.passport_records[0].action_type).toBe("EXECUTION_SUCCEEDED");
  });

  it("full before/after flow produces 3 chained records", async () => {
    const mw = createMiddleware();
    const toolCall = { tool: "writeFile", payload: { path: "/tmp/out" } };

    await mw.beforeToolCall(toolCall);
    await mw.afterToolResult(toolCall, { written: true });

    const bundle = await mw.finalize("middleware test done");

    expect(bundle.passport_records).toHaveLength(3);
    expect(bundle.passport_records[0].sequence).toBe(0);
    expect(bundle.passport_records[1].sequence).toBe(1);
    expect(bundle.passport_records[2].sequence).toBe(2);
    expect(bundle.summary).toBe("middleware test done");

    // Verify chain linkage
    expect(bundle.passport_records[1].prev_hash).toBe(bundle.passport_records[0].record_hash);
    expect(bundle.passport_records[2].prev_hash).toBe(bundle.passport_records[1].record_hash);
  });
});
