# Quickstart: Decision Passport OpenClaw Lite

Add a verifiable audit trail to your OpenClaw agent.

## 1. Clone and install

```bash
git clone https://github.com/brigalss-a/decision-passport-openclaw-lite.git
cd decision-passport-openclaw-lite
pnpm install --frozen-lockfile
```

## 2. Run the email demo

```bash
pnpm tsx examples/email-with-passport-lite/index.ts
```

You will see: reasoning recorded → tool intent → result → chain VALID → PASS ✓

## 3. Integrate into your agent

```typescript
import { OpenClawPassportWrapperLite, verifyLiteBundle } from 'decision-passport-openclaw-lite';

const passport = new OpenClawPassportWrapperLite({
  chainId: `session-${Date.now()}`,
  actorId: 'my-openclaw-agent',
  purpose: 'MY_WORKFLOW',
  captureMode: 'checkpoint',
  defaultScreenshotPolicy: 'selective'
});

await passport.recordReasoningSummary('Policy approved.', 0.92);
await passport.recordToolIntent('send_email', { to: 'user@co.com' });
await passport.recordCheckpoint({
  checkpointType: 'send_email',
  context: {
    summary: 'Outbound message boundary',
    target: 'user@co.com',
    actorIntent: 'notify user about order update'
  },
  // Screenshot fields are capture-policy metadata only.
  screenshotCaptured: false,
  screenshotReason: 'no screenshot hook in this runtime'
});
await passport.recordToolResultSummary('send_email', { success: true });

const bundle = await passport.finalize();
const result = verifyLiteBundle(bundle);
console.log(result.status); // PASS
```

Checkpoint mode captures meaningful transitions with bounded context. It is not a claim of full runtime truth or policy enforcement.

## 4. Next steps

- Full API reference → [README](../README.md)
- Enterprise features → <contact@bespea.com>
