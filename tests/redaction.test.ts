import { describe, it, expect } from "vitest";
import { SessionRecorderLite } from "../src/SessionRecorderLite.js";
import { redactLiteBundle } from "../src/redact-lite-bundle.js";
import { verifyLiteBundle } from "../src/bundle.js";
import type { LiteBundle } from "../src/types.js";

async function buildTestBundle(): Promise<LiteBundle> {
  const recorder = new SessionRecorderLite({
    chainId: "redact-test-chain",
    actorId: "test-agent",
    purpose: "redaction-test",
    model: "test-model",
  });

  await recorder.record("reasoning_summary", {
    summary: "Customer wants order status",
    confidence: 0.95,
    internal_note: "PII: john.doe@example.com",
  });

  await recorder.record("tool_intent", {
    tool: "lookup_order",
    order_id: "ORD-12345",
    customer_email: "john.doe@example.com",
  });

  await recorder.record("tool_result", {
    tool: "lookup_order",
    result: { status: "shipped", tracking: "TRK-98765" },
  });

  return recorder.finalize("Test session complete");
}

describe("redactLiteBundle", () => {
  describe("mode: none", () => {
    it("returns an equivalent bundle", async () => {
      const original = await buildTestBundle();
      const result = redactLiteBundle(original, { mode: "none" });

      expect(result.mode).toBe("none");
      expect(result.verifiable).toBe(true);
      expect(result.bundle).toEqual(original);
    });

    it("does not mutate the original bundle", async () => {
      const original = await buildTestBundle();
      const originalJson = JSON.stringify(original);
      redactLiteBundle(original, { mode: "none" });

      expect(JSON.stringify(original)).toBe(originalJson);
    });

    it("produces a bundle that still passes verification", async () => {
      const original = await buildTestBundle();
      const result = redactLiteBundle(original, { mode: "none" });
      const verification = verifyLiteBundle(result.bundle);

      expect(verification.status).toBe("PASS");
    });
  });

  describe("mode: safe-demo", () => {
    it("replaces payload values with [REDACTED]", async () => {
      const original = await buildTestBundle();
      const result = redactLiteBundle(original, { mode: "safe-demo" });

      // Payload keys preserved, values replaced
      const rec0 = result.bundle.passport_records[0];
      expect(rec0.payload.summary).toBe("[REDACTED]");
      expect(rec0.payload.confidence).toBe("[REDACTED]");
      expect(rec0.payload.internal_note).toBe("[REDACTED]");

      // Payload still has the same keys
      expect(Object.keys(rec0.payload)).toContain("summary");
      expect(Object.keys(rec0.payload)).toContain("confidence");
    });

    it("preserves chain structure and action types", async () => {
      const original = await buildTestBundle();
      const result = redactLiteBundle(original, { mode: "safe-demo" });

      expect(result.bundle.passport_records.length).toBe(3);
      expect(result.bundle.passport_records[0].action_type).toBe("AI_RECOMMENDATION");
      expect(result.bundle.passport_records[1].action_type).toBe("EXECUTION_PENDING");
      expect(result.bundle.passport_records[2].action_type).toBe("EXECUTION_SUCCEEDED");
      expect(result.bundle.passport_records[0].sequence).toBe(0);
      expect(result.bundle.passport_records[1].sequence).toBe(1);
      expect(result.bundle.passport_records[2].sequence).toBe(2);
    });

    it("preserves original hashes (making verification FAIL)", async () => {
      const original = await buildTestBundle();
      const result = redactLiteBundle(original, { mode: "safe-demo" });

      // Hashes are preserved from the original
      expect(result.bundle.passport_records[0].record_hash).toBe(
        original.passport_records[0].record_hash
      );

      // But verification fails because payload content changed
      expect(result.verifiable).toBe(false);
      const verification = verifyLiteBundle(result.bundle);
      expect(verification.status).toBe("FAIL");
      expect(verification.reasonCodes).toContain("EXPECTED_REDACTION_NON_VERIFIABLE");
    });

    it("redacts the bundle summary", async () => {
      const original = await buildTestBundle();
      const result = redactLiteBundle(original, { mode: "safe-demo" });

      expect(result.bundle.summary).toBe("[REDACTED]");
    });

    it("does not mutate the original bundle", async () => {
      const original = await buildTestBundle();
      const originalJson = JSON.stringify(original);
      redactLiteBundle(original, { mode: "safe-demo" });

      expect(JSON.stringify(original)).toBe(originalJson);
    });
  });

  describe("mode: public-share", () => {
    it("removes payload content entirely", async () => {
      const original = await buildTestBundle();
      const result = redactLiteBundle(original, { mode: "public-share" });

      const rec0 = result.bundle.passport_records[0];
      expect(rec0.payload).toEqual({ redacted: true });
      expect(rec0.payload).not.toHaveProperty("summary");
    });

    it("redacts actor_id", async () => {
      const original = await buildTestBundle();
      const result = redactLiteBundle(original, { mode: "public-share" });

      for (const record of result.bundle.passport_records) {
        expect(record.actor_id).toBe("[REDACTED]");
      }
    });

    it("removes metadata", async () => {
      const original = await buildTestBundle();
      const result = redactLiteBundle(original, { mode: "public-share" });

      for (const record of result.bundle.passport_records) {
        expect(record.metadata).toBeUndefined();
      }
    });

    it("preserves action types and sequence order", async () => {
      const original = await buildTestBundle();
      const result = redactLiteBundle(original, { mode: "public-share" });

      expect(result.bundle.passport_records[0].action_type).toBe("AI_RECOMMENDATION");
      expect(result.bundle.passport_records[0].sequence).toBe(0);
      expect(result.bundle.passport_records.length).toBe(3);
    });

    it("marks bundle as not verifiable", async () => {
      const original = await buildTestBundle();
      const result = redactLiteBundle(original, { mode: "public-share" });

      expect(result.verifiable).toBe(false);
      expect(result.verificationNote).toContain("Verification will return FAIL");
      const verification = verifyLiteBundle(result.bundle);
      expect(verification.reasonCodes).toContain("EXPECTED_REDACTION_NON_VERIFIABLE");
    });

    it("does not mutate the original bundle", async () => {
      const original = await buildTestBundle();
      const originalJson = JSON.stringify(original);
      redactLiteBundle(original, { mode: "public-share" });

      expect(JSON.stringify(original)).toBe(originalJson);
    });
  });

  describe("nested payload redaction", () => {
    it("recursively redacts nested objects in safe-demo mode", async () => {
      const recorder = new SessionRecorderLite({
        chainId: "nested-test",
        actorId: "agent",
        purpose: "test",
      });

      await recorder.record("tool_result", {
        tool: "search",
        result: {
          items: "three results",
          details: {
            source: "database",
            query: "SELECT * FROM users",
          },
        },
      });

      const bundle = await recorder.finalize();
      const result = redactLiteBundle(bundle, { mode: "safe-demo" });

      const payload = result.bundle.passport_records[0].payload;
      expect(payload.tool).toBe("[REDACTED]");
      expect((payload.result as Record<string, unknown>).items).toBe("[REDACTED]");
      expect(
        ((payload.result as Record<string, unknown>).details as Record<string, unknown>).source
      ).toBe("[REDACTED]");
    });
  });

  describe("checkpoint redaction", () => {
    async function buildCheckpointBundle(): Promise<LiteBundle> {
      const recorder = new SessionRecorderLite({
        chainId: "checkpoint-redact",
        actorId: "agent-checkpoint",
        purpose: "checkpoint-redaction-test",
        captureMode: "checkpoint",
        defaultScreenshotPolicy: "selective",
      });

      await recorder.recordCheckpoint({
        checkpointType: "external_post",
        context: {
          summary: "Posting public status",
          target: "status-page",
          inputSummary: { visibility: "public" },
        },
        screenshotCaptured: true,
        screenshotReason: "before publish",
      });

      return recorder.finalize("checkpoint bundle");
    }

    it("safe-demo preserves checkpoint identity and policy metadata", async () => {
      const original = await buildCheckpointBundle();
      const result = redactLiteBundle(original, { mode: "safe-demo" });
      const payload = result.bundle.passport_records[0].payload as Record<string, unknown>;

      expect(payload.type).toBe("checkpoint");
      expect(payload.checkpointType).toBe("external_post");
      expect(payload.screenshotPolicy).toBe("selective");
      expect(payload.screenshotCaptured).toBe(true);
      expect(payload.screenshotReason).toBe("[REDACTED]");
      expect(payload.redaction_marker).toBe("[REDACTED]");

      const verification = verifyLiteBundle(result.bundle);
      expect(verification.status).toBe("FAIL");
      expect(verification.reasonCodes).toContain("EXPECTED_REDACTION_NON_VERIFIABLE");
    });

    it("public-share keeps minimal checkpoint semantics with redacted payload marker", async () => {
      const original = await buildCheckpointBundle();
      const result = redactLiteBundle(original, { mode: "public-share" });
      const payload = result.bundle.passport_records[0].payload as Record<string, unknown>;

      expect(payload.type).toBe("checkpoint");
      expect(payload.checkpointType).toBe("external_post");
      expect(payload.screenshotPolicy).toBe("selective");
      expect(payload.screenshotCaptured).toBe(false);
      expect(payload.redacted).toBe(true);

      const verification = verifyLiteBundle(result.bundle);
      expect(verification.status).toBe("FAIL");
      expect(verification.reasonCodes).toContain("EXPECTED_REDACTION_NON_VERIFIABLE");
    });
  });
});
