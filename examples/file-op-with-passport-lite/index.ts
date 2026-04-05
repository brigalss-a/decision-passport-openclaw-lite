import { writeFileSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { OpenClawPassportWrapperLite } from "../../src/OpenClawPassportWrapperLite.js";
import { verifyLiteBundle } from "../../src/bundle.js";
import { renderLiteHtmlReport } from "../../src/html-export.js";
import { TerminalFormatter, printBlock } from "../../scripts/lib/terminal.js";

const term = new TerminalFormatter();
const __dirname = dirname(fileURLToPath(import.meta.url));
const artifactsDir = join(__dirname, "..", "..", "artifacts");
mkdirSync(artifactsDir, { recursive: true });

async function main() {
  const wrapper = new OpenClawPassportWrapperLite({
    chainId: `file-chain-${Date.now()}`,
    actorId: "openclaw-agent-file",
    purpose: "FILE_OP_DEMO",
    model: "claude-4",
    captureMode: "checkpoint",
    defaultScreenshotPolicy: "selective",
  });

  await wrapper.recordReasoningSummary("The agent is preparing a file operation.", 0.84);
  await wrapper.recordToolIntent("write_file", { path: "/tmp/demo.txt" });
  await wrapper.recordCheckpoint({
    checkpointType: "irreversible_mutation",
    context: {
      summary: "File overwrite boundary",
      target: "/tmp/demo.txt",
      actorIntent: "persist generated output",
      inputSummary: { operation: "write_file" },
      riskHint: "high",
    },
    screenshotCaptured: false,
    screenshotReason: "CLI demo without screenshot integration",
  });
  await wrapper.recordToolResultSummary("write_file", { ok: true, path: "/tmp/demo.txt" });

  const bundle = await wrapper.finalize("File operation demo completed");
  const verification = verifyLiteBundle(bundle);
  console.log(JSON.stringify({ bundle, verification }, null, 2));

  // Write artifacts
  const generatedAt = new Date().toISOString();
  const htmlReport = renderLiteHtmlReport({ bundle, verification, generatedAt });
  writeFileSync(join(artifactsDir, "passport-lite-file-op-report.html"), htmlReport);

  const summaryJson = {
    generatedAt,
    captureMode: bundle.captureMode,
    status: verification.status,
    records: bundle.passport_records.length,
    checks: verification.checks.length,
    chainId: bundle.manifest.chain_id,
  };
  writeFileSync(join(artifactsDir, "passport-lite-file-op-summary.json"), JSON.stringify(summaryJson, null, 2));

  printBlock("");
  printBlock(term.heading(" OpenClaw Passport Lite - File-Op Demo Summary"));
  printBlock(
    term.list([
      term.kv("Session", bundle.manifest.chain_id),
      term.kv("Records", bundle.passport_records.length),
      term.kv("Bundle", "EXPORTED"),
      term.kv("Verification", verification.status === "PASS"
        ? term.status("check", "PASS")
        : term.status("cross", "FAIL")),
      term.kv("Artifacts", "passport-lite-file-op-report.html, passport-lite-file-op-summary.json"),
    ]),
  );
  printBlock(term.rule("heavyLine"));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
