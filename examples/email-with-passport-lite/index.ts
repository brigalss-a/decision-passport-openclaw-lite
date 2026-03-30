import { OpenClawPassportWrapperLite } from "../../src/OpenClawPassportWrapperLite.js";
import { OpenClawPassportMiddlewareLite } from "../../src/OpenClawPassportMiddlewareLite.js";
import { verifyLiteBundle } from "../../src/bundle.js";
import { TerminalFormatter, printBlock } from "../../scripts/lib/terminal.js";

const term = new TerminalFormatter();

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
    model: "claude-4"
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

  const bundle = await middleware.finalize("Email demo completed");
  const verification = verifyLiteBundle(bundle);

  console.log(JSON.stringify({ result, bundle, verification }, null, 2));

  printBlock("");
  printBlock(term.heading(" OpenClaw Passport Lite — Email Demo Summary"));
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
