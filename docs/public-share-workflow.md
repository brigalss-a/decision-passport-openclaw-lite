# Public Share Workflow

When you run an OpenClaw Passport Lite session, you get a bundle that can serve different purposes depending on your audience. This page explains which artifact to use in which context.

---

## What gets produced

After running the email demo (`pnpm demo`), the `artifacts/` directory contains:

| File | Content | Verifiable |
| --- | --- | --- |
| `passport-lite-report.html` | Full verification report with all payload content | Yes |
| `passport-lite-summary.json` | Compact summary of verification result | Yes (by re-running) |
| `passport-lite-report.safe-demo.html` | HTML report with payload values replaced by `[REDACTED]` | **No** |
| `passport-lite-summary.safe-demo.json` | Summary with mode, verificationNote, record count | **No** |
| `passport-lite-summary.public-share.json` | Summary with all payload and actor IDs removed | **No** |

The file-op example produces the same pattern under different filenames (`passport-lite-file-op-*.html/json`).

---

## Choosing which artifact to share

### For internal review or audit

Use the **original bundle** (`passport-lite-summary.json` + `passport-lite-report.html`).

This is the full, verifiable record. Chain integrity can be confirmed by re-running `verifyLiteBundle()` on the original bundle JSON or by loading it in the browser verifier.

### For screenshots, demos, and presentations

Use the **safe-demo** artifacts (`passport-lite-report.safe-demo.html`, `passport-lite-summary.safe-demo.json`).

Payload values are replaced with `[REDACTED]`. Chain structure, action types, actor types, sequences, and timestamps are preserved. These are illustrative — they show **that a chain happened and what kind**, not the content. Verification will return FAIL because the hashes no longer match the redacted content.

### For public posts, issues, or external documentation

Use the **public-share** summary (`passport-lite-summary.public-share.json`).

All payload content and actor IDs are removed. Only action types, sequence order, chain structure, and the chain ID remain. This is safe to paste in public contexts where no operational data should be visible.

---

## What redaction does NOT do

Redaction is **not** cryptographic erasure. The original bundle and its hashes are not modified. Redaction produces a new object with different content — the original bundle still contains the original data.

Key things to understand:

- A redacted bundle **will fail verification**. This is expected and correct. Running `verifyLiteBundle()` on a `safe-demo` or `public-share` bundle returns `FAIL` because the payload hashes no longer match the new content.
- Redacted bundles are **not suitable as proof**. They cannot demonstrate that the original chain was valid.
- The `verificationNote` field in the summary JSON explains exactly what was changed and why verification fails.
- If you need to demonstrate that the original bundle was valid, verify it **before** redacting and share the verification result separately.

---

## Redaction modes summary

| Mode | Payload | Actor IDs | Structure | Verifiable |
| --- | --- | --- | --- | --- |
| `none` | Unchanged | Unchanged | Unchanged | Yes |
| `safe-demo` | Values replaced with `[REDACTED]` | Preserved | Preserved | No |
| `public-share` | Replaced with `{ redacted: true }` | Replaced with `[REDACTED]` | Preserved | No |

See [redaction-modes.md](redaction-modes.md) for full per-field detail on each mode.

---

## Programmatic usage

```typescript
import { redactLiteBundle } from "@decision-passport/openclaw-lite";

const safeDemoResult = redactLiteBundle(bundle, { mode: "safe-demo" });
// safeDemoResult.bundle      — redacted LiteBundle
// safeDemoResult.verifiable  — false
// safeDemoResult.verificationNote — explains why

const publicShareResult = redactLiteBundle(bundle, { mode: "public-share" });
```

---

## What to say when sharing a redacted artifact

When sharing a `safe-demo` or `public-share` artifact, be explicit:

> "This is a redacted view of the session chain for illustration. Payload values have been replaced. The original bundle was verified as PASS before redaction."

Do not imply that a redacted artifact proves chain validity. It does not. The original bundle does.
