# Tamper Cases

## Why tamper cases matter

Tamper cases make FAIL outcomes interpretable for reviewers and maintainers.
They reduce confusion between data corruption, integration mistakes, and possible malicious edits.

## Canonical cases currently represented or inferable

### Case 1: recorded action payload changed after recording

What happens:
1. Payload content is edited after record creation.
2. Hash fields no longer align with record content.

Expected verification behavior:
1. `verifyLiteBundle()` returns `FAIL`.
2. `chain_integrity` check fails.
3. `reasonCodes` includes `CHAIN_INTEGRITY_FAILED`.

### Case 2: chain link broken

What happens:
1. `prev_hash` is modified, or upstream record hash changes.
2. The next record does not link to expected prior hash.

Expected verification behavior:
1. `verifyLiteBundle()` returns `FAIL`.
2. `chain_integrity` check fails with linkage detail.
3. `reasonCodes` includes `CHAIN_INTEGRITY_FAILED`.

### Case 3: sequence continuity broken

What happens:
1. Sequence values are reordered, duplicated, or skipped.

Expected verification behavior:
1. `verifyLiteBundle()` returns `FAIL`.
2. `chain_integrity` check fails with sequence mismatch detail.
3. `reasonCodes` includes `CHAIN_INTEGRITY_FAILED`.

### Case 4: manifest mismatch

What happens:
1. `manifest.chain_hash` does not match final record hash.

Expected verification behavior:
1. `verifyLiteBundle()` returns `FAIL`.
2. `manifest_chain_hash` check fails.
3. `reasonCodes` includes `MANIFEST_HASH_MISMATCH`.

### Case 5: redacted share artifact verification attempt

What happens:
1. A `safe-demo` or `public-share` redacted bundle is verified directly.
2. Payload content differs from original hashed content.

Expected verification behavior:
1. Verification returns `FAIL`.
2. `reasonCodes` can include `EXPECTED_REDACTION_NON_VERIFIABLE` when redaction markers are present.
3. This is expected behavior, not necessarily malicious tamper.

### Case 6: malformed bundle shape

Natural malformed-input boundary example:
1. Missing required bundle fields.
2. Wrong object shape passed into verification path.

Expected behavior:
1. Verification returns `FAIL` with `reasonCodes` containing `MALFORMED_LITE_BUNDLE`.
2. This is input-structure failure, not an integrity/tamper verdict.

## What a reviewer should expect from verification failure

1. Failure indicates integrity checks did not pass for the provided artifact.
2. Malformed failures indicate boundary/input shape issues.
3. Expected redaction failures indicate share artifact non-verifiability.
2. The checks array indicates which check failed.
3. Context from integration logs can help classify corruption vs workflow issues.
4. Redacted artifacts are a special expected-fail category.

## How to investigate a failure

1. Confirm whether bundle is original or redacted share artifact.
2. Inspect `checks` and failure messages from `verifyLiteBundle()`.
3. Re-run verification on the original unmodified bundle bytes.
4. Compare with a known-good bundle from the same integration path.
5. Review capture flow to confirm expected checkpoint coverage.

## Limits of tamper interpretation

1. FAIL does not prove attacker identity or intent.
2. PASS does not prove runtime policy compliance.
3. PASS does not prove complete environment capture.
4. Interpretation should include operational context outside this library.
