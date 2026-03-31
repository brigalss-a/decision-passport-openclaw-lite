import { describe, it, expect } from "vitest";
import { SessionRecorderLite } from "../src/SessionRecorderLite.js";
import { verifyLiteBundle } from "../src/bundle.js";
import { renderLiteHtmlReport } from "../src/html-export.js";
import type { LiteBundle } from "../src/types.js";

async function buildValidBundle(): Promise<LiteBundle> {
  const recorder = new SessionRecorderLite({
    chainId: "html-test-chain",
    actorId: "agent-1",
    purpose: "test",
  });
  await recorder.record("reasoning_summary", { summary: "test reasoning" });
  await recorder.record("tool_intent", { tool: "doSomething" });
  await recorder.record("tool_result", { result: "success" });
  return recorder.finalize("html export test");
}

describe("renderLiteHtmlReport", () => {
  it("generates valid HTML for a passing bundle", async () => {
    const bundle = await buildValidBundle();
    const verification = verifyLiteBundle(bundle);
    const html = renderLiteHtmlReport({
      bundle,
      verification,
      generatedAt: "2026-01-15T12:00:00.000Z",
    });

    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("PASS");
    expect(html).toContain("chain_integrity");
    expect(html).toContain("manifest_chain_hash");
    expect(html).toContain("html-test-chain");
    expect(html).toContain("1.4-openclaw-lite");
    expect(html).toContain("html export test");
  });

  it("generates HTML with FAIL status for a tampered bundle", async () => {
    const bundle = await buildValidBundle();
    bundle.passport_records[1] = {
      ...bundle.passport_records[1],
      payload: { tampered: true },
    };
    const verification = verifyLiteBundle(bundle);
    const html = renderLiteHtmlReport({
      bundle,
      verification,
      generatedAt: "2026-01-15T12:00:00.000Z",
    });

    expect(html).toContain("FAIL");
    expect(html).toContain("#ef4444");
  });

  it("renders all records in the table", async () => {
    const bundle = await buildValidBundle();
    const verification = verifyLiteBundle(bundle);
    const html = renderLiteHtmlReport({
      bundle,
      verification,
      generatedAt: "2026-01-15T12:00:00.000Z",
    });

    expect(html).toContain("AI_RECOMMENDATION");
    expect(html).toContain("EXECUTION_PENDING");
    expect(html).toContain("EXECUTION_SUCCEEDED");
    expect(html).toContain("agent-1");
  });

  it("escapes HTML in payload content", async () => {
    const recorder = new SessionRecorderLite({
      chainId: "escape-test",
      actorId: "agent-<script>",
      purpose: "test",
    });
    await recorder.record("reasoning_summary", { summary: "<b>bold</b>" });
    const bundle = await recorder.finalize("test");
    const verification = verifyLiteBundle(bundle);
    const html = renderLiteHtmlReport({
      bundle,
      verification,
      generatedAt: "2026-01-15T12:00:00.000Z",
    });

    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<b>bold</b>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("handles bundle without summary", async () => {
    const recorder = new SessionRecorderLite({
      chainId: "no-summary",
      actorId: "agent-1",
      purpose: "test",
    });
    await recorder.record("reasoning_summary", { summary: "test" });
    const bundle = await recorder.finalize();
    const verification = verifyLiteBundle(bundle);
    const html = renderLiteHtmlReport({
      bundle,
      verification,
      generatedAt: "2026-01-15T12:00:00.000Z",
    });

    expect(html).toContain("<!DOCTYPE html>");
    expect(html).not.toContain("Summary");
  });

  it("includes generatedAt in footer", async () => {
    const bundle = await buildValidBundle();
    const verification = verifyLiteBundle(bundle);
    const html = renderLiteHtmlReport({
      bundle,
      verification,
      generatedAt: "2026-06-01T00:00:00Z",
    });

    expect(html).toContain("2026-06-01T00:00:00Z");
    expect(html).toContain("decision-passport-openclaw-lite");
  });
});
