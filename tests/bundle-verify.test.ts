import { describe, expect, it } from "vitest";
import { verifyLiteBundle } from "../src/bundle.js";
import { SessionRecorderLite } from "../src/SessionRecorderLite.js";
import type { LiteBundle, PassportRecord } from "../src/types.js";

async function buildValidBundle(): Promise<LiteBundle> {
  const recorder = new SessionRecorderLite({
    chainId: "test-chain",
    actorId: "agent-1",
    purpose: "test"
  });
  await recorder.record("reasoning_summary", { summary: "test reasoning" });
  await recorder.record("tool_intent", { tool: "doSomething" });
  await recorder.record("tool_result", { result: "success" });
  return recorder.finalize("test run");
}

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

describe("verifyLiteBundle", () => {
  it("returns PASS for a valid bundle", async () => {
    const bundle = await buildValidBundle();
    const result = verifyLiteBundle(bundle);

    expect(result.status).toBe("PASS");
    expect(result.checks.length).toBeGreaterThanOrEqual(2);
    expect(result.checks.every((c: { passed: boolean }) => c.passed)).toBe(true);
  });

  it("returns FAIL when chain integrity is broken", async () => {
    const base = await buildValidBundle();
    const tampered = cloneForTamper(base);
    tampered.passport_records[1] = {
      ...tampered.passport_records[1],
      payload: { tampered: true }
    };

    const result = verifyLiteBundle(tampered as LiteBundle);
    expect(result.status).toBe("FAIL");
    expect(result.checks.find((c: { name: string }) => c.name === "chain_integrity")?.passed).toBe(false);
  });

  it("returns FAIL when manifest chain_hash mismatches", async () => {
    const base = await buildValidBundle();
    const tampered: LiteBundle = { ...base, manifest: { ...base.manifest, chain_hash: "0".repeat(64) } };

    const result = verifyLiteBundle(tampered);
    expect(result.status).toBe("FAIL");
    expect(result.checks.find((c: { name: string }) => c.name === "manifest_chain_hash")?.passed).toBe(false);
  });
});

