import { OpenClawPassportWrapperLite } from "../../src/OpenClawPassportWrapperLite.js";
import { verifyLiteBundle } from "../../src/bundle.js";
import { TerminalFormatter, printBlock } from "../../scripts/lib/terminal.js";

const term = new TerminalFormatter();

async function main() {
  const wrapper = new OpenClawPassportWrapperLite({
    chainId: `browser-chain-${Date.now()}`,
    actorId: "openclaw-agent-browser",
    purpose: "BROWSER_DEMO",
    model: "claude-4"
  });

  await wrapper.recordReasoningSummary("The agent is preparing a browser action.", 0.87);
  await wrapper.recordToolIntent("browser_navigate", { url: "https://example.com" });
  await wrapper.recordToolResultSummary("browser_navigate", { ok: true, url: "https://example.com" });

  const bundle = await wrapper.finalize("Browser demo completed");
  const verification = verifyLiteBundle(bundle);
  console.log(JSON.stringify({ bundle, verification }, null, 2));

  printBlock("");
  printBlock(term.heading(" OpenClaw Passport Lite — Browser Demo Summary"));
  printBlock(
    term.list([
      term.kv("Session", bundle.manifest.chain_id),
      term.kv("Records", bundle.passport_records.length),
      term.kv("Bundle", "EXPORTED"),
      term.kv("Verification", verification.status === "PASS"
        ? term.status("check", "PASS")
        : term.status("cross", "FAIL")),
    ]),
  );
  printBlock(term.rule("heavyLine"));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
