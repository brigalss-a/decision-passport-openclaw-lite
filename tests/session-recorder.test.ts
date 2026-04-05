import { describe, expect, it } from "vitest";
import { SessionRecorderLite } from "../src/SessionRecorderLite.js";

describe("SessionRecorderLite", () => {
  const config = {
    chainId: "test-chain",
    actorId: "agent-1",
    purpose: "unit-test",
    model: "test-model"
  };

  it("creates a recorder with empty records", () => {
    const recorder = new SessionRecorderLite(config);
    expect(recorder.getRecords()).toEqual([]);
  });

  it("records a reasoning_summary as AI_RECOMMENDATION", async () => {
    const recorder = new SessionRecorderLite(config);
    const record = await recorder.record("reasoning_summary", { summary: "I think X" });

    expect(record.action_type).toBe("AI_RECOMMENDATION");
    expect(record.sequence).toBe(0);
    expect(record.chain_id).toBe("test-chain");
    expect(record.actor_type).toBe("ai_agent");
    expect(record.payload).toMatchObject({
      summary: "I think X",
      type: "reasoning_summary",
      purpose: "unit-test",
      model: "test-model"
    });
  });

  it("records a tool_intent as EXECUTION_PENDING", async () => {
    const recorder = new SessionRecorderLite(config);
    const record = await recorder.record("tool_intent", { tool: "sendEmail" });
    expect(record.action_type).toBe("EXECUTION_PENDING");
  });

  it("records a tool_result as EXECUTION_SUCCEEDED", async () => {
    const recorder = new SessionRecorderLite(config);
    const record = await recorder.record("tool_result", { result: "done" });
    expect(record.action_type).toBe("EXECUTION_SUCCEEDED");
  });

  it("builds a proper chain with incrementing sequences", async () => {
    const recorder = new SessionRecorderLite(config);
    await recorder.record("reasoning_summary", { s: "step 0" });
    await recorder.record("tool_intent", { s: "step 1" });
    await recorder.record("tool_result", { s: "step 2" });

    const records = recorder.getRecords();
    expect(records).toHaveLength(3);
    expect(records[0].sequence).toBe(0);
    expect(records[1].sequence).toBe(1);
    expect(records[2].sequence).toBe(2);
    expect(records[1].prev_hash).toBe(records[0].record_hash);
    expect(records[2].prev_hash).toBe(records[1].record_hash);
  });

  it("finalizes into a valid LiteBundle", async () => {
    const recorder = new SessionRecorderLite(config);
    await recorder.record("reasoning_summary", { s: "test" });
    await recorder.record("tool_result", { r: "ok" });

    const bundle = await recorder.finalize("test summary");

    expect(bundle.bundle_version).toBe("1.4-openclaw-lite");
    expect(bundle.summary).toBe("test summary");
    expect(bundle.passport_records).toHaveLength(2);
    expect(bundle.manifest.record_count).toBe(2);
    expect(bundle.manifest.chain_id).toBe("test-chain");
    expect(bundle.manifest.chain_hash).toBe(bundle.passport_records[1].record_hash);
    expect(bundle.exported_at_utc).toBeTruthy();
  });

  it("finalizes without summary", async () => {
    const recorder = new SessionRecorderLite(config);
    await recorder.record("reasoning_summary", { s: "test" });
    const bundle = await recorder.finalize();
    expect(bundle.summary).toBeUndefined();
  });

  it("uses event capture mode by default", async () => {
    const recorder = new SessionRecorderLite(config);
    await recorder.record("tool_intent", { tool: "sendEmail" });
    const bundle = await recorder.finalize("event flow");

    expect(bundle.captureMode).toBe("event");
  });

  it("records checkpoint with default screenshot policy and normalized metadata", async () => {
    const recorder = new SessionRecorderLite({
      ...config,
      defaultScreenshotPolicy: "selective",
    });

    const record = await recorder.recordCheckpoint({
      checkpointType: "send_email",
      context: {
        summary: "Send to customer",
        target: "customer@example.com",
      },
      screenshotReason: "   ",
    });

    expect(record.payload).toMatchObject({
      type: "checkpoint",
      checkpointType: "send_email",
      screenshotPolicy: "selective",
      screenshotCaptured: false,
    });
    expect(record.payload).not.toHaveProperty("screenshotReason");

    const bundle = await recorder.finalize("checkpoint flow");
    expect(bundle.captureMode).toBe("checkpoint");
  });

  it("records explicit screenshot metadata on checkpoints", async () => {
    const recorder = new SessionRecorderLite(config);
    const record = await recorder.recordCheckpoint({
      checkpointType: "submit_form",
      screenshotPolicy: "always",
      screenshotCaptured: true,
      screenshotReason: "  user confirmation screen  ",
    });

    expect(record.payload).toMatchObject({
      type: "checkpoint",
      checkpointType: "submit_form",
      screenshotPolicy: "always",
      screenshotCaptured: true,
      screenshotReason: "user confirmation screen",
    });
  });
});
