import { describe, expect, it } from "vitest";
import { verifyLiteBundle } from "../src/bundle.js";
import { SessionRecorderLite } from "../src/SessionRecorderLite.js";
import type { LiteBundle } from "../src/types.js";

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

describe("verifyLiteBundle", () => {
  it("returns PASS for a valid bundle", async () => {
    const bundle = await buildValidBundle();
    const result = verifyLiteBundle(bundle);

    expect(result.status).toBe("PASS");
    expect(result.checks.length).toBeGreaterThanOrEqual(2);
    expect(result.checks.every((c: { passed: boolean }) => c.passed)).toBe(true);
  });

  it("returns FAIL when chain integrity is broken", async () => {
    const bundle = await buildValidBundle();
    bundle.passport_records[1] = {
      ...bundle.passport_records[1],
      payload: { tampered: true }
    };

    const result = verifyLiteBundle(bundle);
    expect(result.status).toBe("FAIL");
    expect(result.checks.find((c: { name: string }) => c.name === "chain_integrity")?.passed).toBe(false);
  });

  it("returns FAIL when manifest chain_hash mismatches", async () => {
    const bundle = await buildValidBundle();
    bundle.manifest = { ...bundle.manifest, chain_hash: "0".repeat(64) };

    const result = verifyLiteBundle(bundle);
    expect(result.status).toBe("FAIL");
    expect(result.checks.find((c: { name: string }) => c.name === "manifest_chain_hash")?.passed).toBe(false);
  });
});
