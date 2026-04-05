import { writeFileSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { OpenClawPassportWrapperLite } from "../../src/OpenClawPassportWrapperLite.js";
import { OpenClawPassportMiddlewareLite } from "../../src/OpenClawPassportMiddlewareLite.js";
import { verifyLiteBundle } from "../../src/bundle.js";
import { renderLiteHtmlReport } from "../../src/html-export.js";
import { redactLiteBundle } from "../../src/redact-lite-bundle.js";
import { TerminalFormatter, printBlock } from "../../scripts/lib/terminal.js";

const term = new TerminalFormatter();
const __dirname = dirname(fileURLToPath(import.meta.url));
const artifactsDir = join(__dirname, "..", "..", "artifacts");
mkdirSync(artifactsDir, { recursive: true });

async function sendEmail(params: { to: string; subject: string; body: string }) {
  return {
    success: true,
    delivered_to: params.to,
    message_id: `msg-${Date.now()}`
  };
}

async function main() {
  const wrapper = new OpenClawPassportWrapperLite({
    chainId: `demo-chain-${Date.now()}`,
    actorId: "openclaw-agent-01",
    purpose: "EMAIL_DEMO",
    model: "claude-4",
    captureMode: "checkpoint",
    defaultScreenshotPolicy: "selective",
  });

  const middleware = new OpenClawPassportMiddlewareLite(wrapper);

  const toolCall = await middleware.beforeToolCall({
    tool: "send_email",
    payload: {
      to: "client@example.com",
      subject: "Confirmation",
      body: "All good."
    }
  });

  const result = await middleware.afterToolResult(
    toolCall,
    await sendEmail(toolCall.payload as { to: string; subject: string; body: string })
  );

  await wrapper.recordCheckpoint({
    checkpointType: "send_email",
    context: {
      summary: "Outbound email boundary",
      target: "client@example.com",
      actorIntent: "deliver confirmation email",
      inputSummary: {
        subject: "Confirmation",
      },
      outputSummary: {
        success: true,
      },
      riskHint: "medium",
      triggerMetadata: {
        channel: "email",
      },
    },
    screenshotCaptured: false,
    screenshotReason: "headless demo runtime",
  });

  const bundle = await middleware.finalize("Email demo completed");
  const verification = verifyLiteBundle(bundle);

  console.log(JSON.stringify({ result, bundle, verification }, null, 2));

  // Write artifacts
  const generatedAt = new Date().toISOString();
  const htmlReport = renderLiteHtmlReport({ bundle, verification, generatedAt });
  writeFileSync(join(artifactsDir, "passport-lite-report.html"), htmlReport);

  const summaryJson = {
    generatedAt,
    captureMode: bundle.captureMode,
    status: verification.status,
    records: bundle.passport_records.length,
    checks: verification.checks.length,
    chainId: bundle.manifest.chain_id,
  };
  writeFileSync(join(artifactsDir, "passport-lite-summary.json"), JSON.stringify(summaryJson, null, 2));

  // -- Redacted share artifacts --
  // safe-demo: preserves structure, redacts payload values.
  // Verification will FAIL on redacted bundles; this is expected and documented.
  const safeDemoResult = redactLiteBundle(bundle, { mode: "safe-demo" });
  const safeDemoVerification = verifyLiteBundle(safeDemoResult.bundle);
  const safeDemoHtml = renderLiteHtmlReport({ bundle: safeDemoResult.bundle, verification: safeDemoVerification, generatedAt });
  writeFileSync(join(artifactsDir, "passport-lite-report.safe-demo.html"), safeDemoHtml);
  writeFileSync(join(artifactsDir, "passport-lite-summary.safe-demo.json"), JSON.stringify({
    generatedAt,
    redactionMode: "safe-demo",
    verifiable: safeDemoResult.verifiable,
    verificationNote: safeDemoResult.verificationNote,
    records: safeDemoResult.bundle.passport_records.length,
    chainId: safeDemoResult.bundle.manifest.chain_id,
  }, null, 2));

  // public-share: removes all payload content and actor IDs.
  const publicShareResult = redactLiteBundle(bundle, { mode: "public-share" });
  writeFileSync(join(artifactsDir, "passport-lite-summary.public-share.json"), JSON.stringify({
    generatedAt,
    redactionMode: "public-share",
    verifiable: publicShareResult.verifiable,
    verificationNote: publicShareResult.verificationNote,
    records: publicShareResult.bundle.passport_records.length,
    chainId: publicShareResult.bundle.manifest.chain_id,
  }, null, 2));

  printBlock("");
  printBlock(term.heading(" OpenClaw Passport Lite - Email Demo Summary"));
  printBlock(
    term.list([
      term.kv("Session", bundle.manifest.chain_id),
      term.kv("Records", bundle.passport_records.length),
      term.kv("Bundle", "EXPORTED"),
      term.kv("Verification", verification.status === "PASS"
        ? term.status("check", "PASS")
        : term.status("cross", "FAIL")),
      term.kv("Artifacts", "passport-lite-report.html, passport-lite-summary.json"),
      term.kv("Redacted (safe-demo)", "passport-lite-report.safe-demo.html, passport-lite-summary.safe-demo.json"),
      term.kv("Redacted (public-share)", "passport-lite-summary.public-share.json"),
    ]),
  );
  printBlock(term.rule("heavyLine"));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
