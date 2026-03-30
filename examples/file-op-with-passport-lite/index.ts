import { OpenClawPassportWrapperLite } from "../../src/OpenClawPassportWrapperLite.js";
import { verifyLiteBundle } from "../../src/bundle.js";
import { TerminalFormatter, printBlock } from "../../scripts/lib/terminal.js";

const term = new TerminalFormatter();

async function main() {
  const wrapper = new OpenClawPassportWrapperLite({
    chainId: `file-chain-${Date.now()}`,
    actorId: "openclaw-agent-file",
    purpose: "FILE_OP_DEMO",
    model: "claude-4"
  });

  await wrapper.recordReasoningSummary("The agent is preparing a file operation.", 0.84);
  await wrapper.recordToolIntent("write_file", { path: "/tmp/demo.txt" });
  await wrapper.recordToolResultSummary("write_file", { ok: true, path: "/tmp/demo.txt" });

  const bundle = await wrapper.finalize("File operation demo completed");
  const verification = verifyLiteBundle(bundle);
  console.log(JSON.stringify({ bundle, verification }, null, 2));

  printBlock("");
  printBlock(term.heading(" OpenClaw Passport Lite — File-Op Demo Summary"));
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
