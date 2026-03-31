# Demo

## Quick Start

```bash
pnpm install
pnpm demo
```

## What It Does

The demo runs the **email-with-passport-lite** example:

1. An AI agent decides to send an email (reasoning summary recorded)
2. The agent declares intent to call `send_email` (tool intent recorded)
3. The email is sent and the result captured (tool result recorded)
4. A tamper-evident proof bundle is exported and verified

## Sample Output

```text
Session:        demo-chain-1749...
Records:        3
Bundle:         EXPORTED
Verification:   PASS ✓
```

The full JSON bundle is also printed, containing:

- `passport_records`: the immutable chain of 3 records
- `manifest`: chain summary with record count and chain hash
- `verification`: PASS/FAIL status with individual check results

## Sample Bundle

See [sample-bundle.json](sample-bundle.json) for an example of the exported proof bundle structure.

## Other Examples

- **Browser navigation**: `npx tsx examples/browser-with-passport-lite/index.ts`
- **File operation**: `npx tsx examples/file-op-with-passport-lite/index.ts`
