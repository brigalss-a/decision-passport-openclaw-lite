/**
 * Append-only invariant tests for decision-passport-openclaw-lite.
 *
 * Verifies that:
 * - SessionRecorderLite only appends records, never modifies prior ones
 * - Finalized bundles are not affected by subsequent recorder mutations
 * - Any tampering with a recorded bundle breaks verification
 * - The wrapper and middleware only append events
 */

import { describe, it, expect } from "vitest";
import { SessionRecorderLite } from "../src/SessionRecorderLite.js";
import { verifyLiteBundle } from "../src/bundle.js";
import { verifyChain } from "../src/chain.js";
import type { LiteBundle, PassportRecord } from "../src/types.js";

// JSON round-trip strips readonly — intentional tamper helper for tests only
function cloneForTamper(bundle: LiteBundle): {
  bundle_version: "1.4-openclaw-lite";
  exported_at_utc: string;
  summary?: string;
  passport_records: PassportRecord[];
  manifest: { chain_id: string; record_count: number; first_record_id: string; last_record_id: string; chain_hash: string };
} {
  return JSON.parse(JSON.stringify(bundle));
}

async function buildBundle(): Promise<LiteBundle> {
  const recorder = new SessionRecorderLite({
    chainId: "ao-ocl-test",
    actorId: "agent-1",
    purpose: "append-only-test",
    model: "test-model",
  });
  await recorder.record("reasoning_summary", { summary: "thinking" });
  await recorder.record("tool_intent", { tool: "doWork" });
  await recorder.record("tool_result", { result: "done" });
  return recorder.finalize("completed");
}

describe("SessionRecorderLite: append-only invariants", () => {
  it("getRecords() returns a snapshot — mutations to the returned array do not affect the recorder", async () => {
    const recorder = new SessionRecorderLite({
      chainId: "ao-ocl-test",
      actorId: "agent-1",
      purpose: "test",
    });
    await recorder.record("reasoning_summary", { s: "step 0" });

    const snapshot = recorder.getRecords();
    const originalLength = snapshot.length;

    // Attempt to push to the returned array — should not affect the recorder
    // because getRecords() returns a copy
    (snapshot as PassportRecord[]).push({} as PassportRecord);

    const afterPush = recorder.getRecords();
    expect(afterPush.length).toBe(originalLength);
  });

  it("records are strictly sequential — each new record increments sequence by 1", async () => {
    const recorder = new SessionRecorderLite({
      chainId: "ao-ocl-test",
      actorId: "agent-1",
      purpose: "test",
    });
    await recorder.record("reasoning_summary", { s: "0" });
    await recorder.record("tool_intent", { s: "1" });
    await recorder.record("tool_result", { s: "2" });

    const records = recorder.getRecords();
    for (let i = 0; i < records.length; i++) {
      expect(records[i].sequence).toBe(i);
    }
  });

  it("each record chains prev_hash from the prior record_hash", async () => {
    const recorder = new SessionRecorderLite({
      chainId: "ao-ocl-test",
      actorId: "agent-1",
      purpose: "test",
    });
    await recorder.record("reasoning_summary", { s: "0" });
    await recorder.record("tool_intent", { s: "1" });
    await recorder.record("tool_result", { s: "2" });

    const records = recorder.getRecords();
    const result = verifyChain(records);
    expect(result.valid).toBe(true);
  });

  it("finalized bundle is not affected by subsequent records appended after finalize", async () => {
    const recorder = new SessionRecorderLite({
      chainId: "ao-ocl-test",
      actorId: "agent-1",
      purpose: "test",
    });
    await recorder.record("reasoning_summary", { s: "0" });
    const bundleAfterOne = await recorder.finalize("snapshot");

    // Append more records after export
    await recorder.record("tool_intent", { s: "1" });
    await recorder.record("tool_result", { s: "2" });
    const bundleAfterThree = await recorder.finalize("full");

    // First bundle is a snapshot — it still has 1 record
    expect(bundleAfterOne.passport_records.length).toBe(1);
    expect(bundleAfterThree.passport_records.length).toBe(3);
  });
});

describe("LiteBundle: tamper detection (append-only enforcement via verification)", () => {
  it("fails verification when record 0 payload is changed", async () => {
    const bundle = cloneForTamper(await buildBundle());
    bundle.passport_records[0] = {
      ...bundle.passport_records[0],
      payload: { TAMPERED: true },
    };
    const result = verifyLiteBundle(bundle as LiteBundle);
    expect(result.status).toBe("FAIL");
  });

  it("fails verification when a middle record payload is changed", async () => {
    const bundle = cloneForTamper(await buildBundle());
    bundle.passport_records[1] = {
      ...bundle.passport_records[1],
      payload: { injected: "EVIL" },
    };
    const result = verifyLiteBundle(bundle as LiteBundle);
    expect(result.status).toBe("FAIL");
  });

  it("fails verification when a record is deleted from the chain", async () => {
    const base = await buildBundle();
    // Remove record at index 1
    const tampered: LiteBundle = {
      ...base,
      passport_records: [base.passport_records[0], base.passport_records[2]],
    };
    const result = verifyLiteBundle(tampered);
    expect(result.status).toBe("FAIL");
  });

  it("fails verification when records are reordered", async () => {
    const base = await buildBundle();
    const tampered: LiteBundle = {
      ...base,
      passport_records: [
        base.passport_records[0],
        base.passport_records[2],
        base.passport_records[1],
      ],
    };
    const result = verifyLiteBundle(tampered);
    expect(result.status).toBe("FAIL");
  });

  it("fails verification when manifest chain_hash is changed", async () => {
    const base = await buildBundle();
    const tampered: LiteBundle = {
      ...base,
      manifest: { ...base.manifest, chain_hash: "0".repeat(64) },
    };
    const result = verifyLiteBundle(tampered);
    expect(result.status).toBe("FAIL");
  });

  it("fails verification when a record prev_hash is rewritten", async () => {
    const bundle = cloneForTamper(await buildBundle());
    bundle.passport_records[1] = {
      ...bundle.passport_records[1],
      prev_hash: "0".repeat(64),
    };
    const result = verifyLiteBundle(bundle as LiteBundle);
    expect(result.status).toBe("FAIL");
  });

  it("passes verification for a legitimately extended bundle", async () => {
    const recorder = new SessionRecorderLite({
      chainId: "ao-ocl-test",
      actorId: "agent-1",
      purpose: "test",
    });
    await recorder.record("reasoning_summary", { s: "0" });
    await recorder.record("tool_intent", { s: "1" });
    await recorder.record("tool_result", { s: "2" });
    const bundle = await recorder.finalize("complete");

    const result = verifyLiteBundle(bundle);
    expect(result.status).toBe("PASS");
  });
});
