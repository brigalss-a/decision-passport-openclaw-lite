# Redaction Modes

## Overview

The `redactLiteBundle()` function produces a redacted copy of a `LiteBundle` for sharing, demos, or public display. The original bundle is never mutated.

Three modes are available: `none`, `safe-demo`, and `public-share`.

---

## Mode: `none`

Returns a deep copy of the original bundle with no changes.

| Aspect | Behaviour |
| --- | --- |
| Payload content | Unchanged |
| Actor IDs | Unchanged |
| Metadata | Unchanged |
| Hashes | Unchanged |
| Verification | PASS (identical to original) |

Use when you need a copy but do not need redaction.

---

## Mode: `safe-demo`

Replaces payload leaf values with `[REDACTED]` while preserving payload structure (keys are kept). Redacts the bundle summary if present. Redacts metadata values if metadata is present.

| Aspect | Behaviour |
| --- | --- |
| Payload keys | Preserved |
| Payload values | Replaced with `[REDACTED]` |
| Nested objects | Recursively redacted (keys kept, values replaced) |
| Actor IDs | Preserved |
| Action types | Preserved |
| Sequence and timestamps | Preserved |
| Hashes | Preserved from original (will not match redacted content) |
| Metadata values | Replaced with `[REDACTED]` |
| Bundle summary | Replaced with `[REDACTED]` |
| Verification | **FAIL** |

Use for screenshots, demos, and internal presentations where you want to show the chain structure without exposing sensitive payload data.

---

## Mode: `public-share`

Aggressively removes payload content and metadata. Replaces actor IDs with `[REDACTED]`. Preserves only action types, sequence order, timestamps, and chain structure.

| Aspect | Behaviour |
| --- | --- |
| Payload | Replaced with `{ redacted: true }` |
| Actor IDs | Replaced with `[REDACTED]` |
| Action types | Preserved |
| Sequence and timestamps | Preserved |
| Hashes | Preserved from original (will not match redacted content) |
| Metadata | Removed entirely |
| Bundle summary | Replaced with `[REDACTED]` |
| Verification | **FAIL** |

Use for public sharing, external documentation, or any context where payload content and actor identities must not be exposed.

---

## Verification after redaction

Redaction in `safe-demo` and `public-share` modes changes payload content. Because `payload_hash` and `record_hash` are computed from the original payload, these hashes will not match the redacted content.

Running `verifyLiteBundle()` on a redacted bundle will return `FAIL`. This is expected.

When redaction markers are detected, verification may include `EXPECTED_REDACTION_NON_VERIFIABLE` in `reasonCodes` to distinguish expected redaction failure from generic integrity tamper outcomes.

The `RedactedBundleResult` object includes:

- `verifiable`: `false` for `safe-demo` and `public-share`
- `verificationNote`: explains exactly what changed and why verification fails

If you need to prove that the original bundle was valid, verify it before redacting.

---

## What redaction does NOT do

- Redaction does not sign or re-hash the redacted bundle
- Redaction does not create a new valid chain from the redacted content
- Redaction does not guarantee that all sensitive data has been removed from nested payload structures (deeply nested arrays are replaced as leaf values, not traversed)
- Redaction does not remove timestamps, sequence numbers, or chain IDs

---

## Usage

```typescript
import { redactLiteBundle, verifyLiteBundle } from "decision-passport-openclaw-lite";

// Verify the original first
const verification = verifyLiteBundle(bundle);
console.log(verification.status); // PASS

// Then redact for sharing
const result = redactLiteBundle(bundle, { mode: "safe-demo" });
console.log(result.verifiable);       // false
console.log(result.verificationNote); // explains why
console.log(result.bundle);           // redacted bundle
```
