import { describe, expect, it } from "vitest";
import { OpenClawPassportWrapperLite } from "../src/OpenClawPassportWrapperLite.js";

describe("OpenClawPassportWrapperLite", () => {
  const config = {
    chainId: "wrapper-test",
    actorId: "agent-1",
    purpose: "wrapper-unit-test",
    model: "gpt-4"
  };

  it("records reasoning summary", async () => {
    const wrapper = new OpenClawPassportWrapperLite(config);
    const record = await wrapper.recordReasoningSummary("Analyzing data", 0.95);

    expect(record.action_type).toBe("AI_RECOMMENDATION");
    expect(record.payload).toMatchObject({
      summary: "Analyzing data",
      confidence: 0.95
    });
  });

  it("records tool intent", async () => {
    const wrapper = new OpenClawPassportWrapperLite(config);
    const record = await wrapper.recordToolIntent("sendEmail", { to: "user@example.com" });

    expect(record.action_type).toBe("EXECUTION_PENDING");
    expect(record.payload).toMatchObject({
      tool: "sendEmail",
      payload_summary: { to: "user@example.com" }
    });
  });

  it("records tool result summary with hash", async () => {
    const wrapper = new OpenClawPassportWrapperLite(config);
    const record = await wrapper.recordToolResultSummary("sendEmail", { sent: true });

    expect(record.action_type).toBe("EXECUTION_SUCCEEDED");
    expect(record.payload).toHaveProperty("tool", "sendEmail");
    expect(record.payload).toHaveProperty("result_summary");
    const summary = record.payload.result_summary as Record<string, unknown>;
    expect(summary).toHaveProperty("kind");
    expect(summary).toHaveProperty("size_bytes");
    expect(summary).toHaveProperty("result_hash");
  });

  it("finalizes into a complete bundle", async () => {
    const wrapper = new OpenClawPassportWrapperLite(config);
    await wrapper.recordReasoningSummary("Think", 0.9);
    await wrapper.recordToolIntent("action", { x: 1 });
    await wrapper.recordToolResultSummary("action", "done");

    const bundle = await wrapper.finalize("completed test");

    expect(bundle.bundle_version).toBe("1.4-openclaw-lite");
    expect(bundle.passport_records).toHaveLength(3);
    expect(bundle.manifest.record_count).toBe(3);
    expect(bundle.summary).toBe("completed test");
  });
});
