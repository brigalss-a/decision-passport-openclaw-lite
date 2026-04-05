# Verification Model

## What verification checks

`verifyLiteBundle()` currently checks:

1. Chain integrity through sequence, prev_hash, and record_hash consistency.
2. Manifest integrity through manifest chain hash match with terminal record hash.
3. Checkpoint payload shape for checkpoint records (checkpointType and screenshot metadata types).

## What verification does not check

1. Runtime authorization or pre-execution guard decisions.
2. Policy compliance or policy correctness.
3. Environment truth outside recorded checkpoints.
4. Identity provenance without external signing controls.
5. Whether screenshot files actually exist or prove visual runtime truth.

## Inputs to verification

1. A parsed LiteBundle object.
2. Bundle records with hash fields.
3. Bundle manifest with chain hash fields.
4. Optional checkpoint payload metadata fields when checkpoint mode is used.

## Expected outputs and statuses

Current output contains:

1. `status`: `PASS` or `FAIL`.
2. `summary`: human-readable verification interpretation.
3. `reasonCodes`: stable machine-readable reason taxonomy.
2. `checks`: structured check rows with `name`, `passed`, and optional `message`.
4. `nextSteps`: reviewer guidance for follow-up inspection.
5. Optional `redactionAssessment` when redaction markers are detected.

### Stable reason code taxonomy

1. `MALFORMED_LITE_BUNDLE`: input structure is invalid for Lite verification.
2. `EMPTY_OR_MISSING_RECORDS`: no records are present for chain verification.
3. `CHAIN_INTEGRITY_FAILED`: chain verification failed.
4. `MANIFEST_HASH_MISMATCH`: manifest terminal hash does not match final record hash.
5. `EXPECTED_REDACTION_NON_VERIFIABLE`: likely expected FAIL due to redaction markers.
6. `UNKNOWN_VERIFICATION_ERROR`: fallback code when no specific category applies.

## PASS vs FAIL semantics

1. PASS means current integrity checks succeeded on the provided bundle.
2. FAIL means at least one integrity check failed.
3. `MALFORMED_LITE_BUNDLE` means input boundary failure, not tamper signal.
4. `EXPECTED_REDACTION_NON_VERIFIABLE` means FAIL may be expected for share artifacts.
5. PASS does not prove runtime permission.
6. FAIL does not by itself prove malicious intent.
7. FAIL does not by itself prove runtime compromise.
8. FAIL does not by itself prove policy violation.
9. Screenshot policy metadata indicates capture expectations, not screenshot proof.

## Common verification misunderstandings

1. Verifying a bundle is not the same as trusting the full execution environment.
2. Verifying a bundle is not proving authorization occurred.
3. Verifying a bundle is not proving policy compliance.
4. Logging events is not equivalent to cryptographic integrity verification.

## Reproducibility vs determinism

1. Verification outcomes are deterministic for identical input bytes.
2. Bundle generation can vary because UUID and timestamp values are runtime-derived.
3. Reproducible flow means the same process and checks can be rerun, not that all generated JSON bytes are identical.

## How to interpret results safely

1. Use PASS as integrity evidence for the provided artifact only.
2. Preserve original bundles and checksums for repeat review.
3. Treat redacted copies as communication artifacts, not equivalent original evidence.
4. Pair verification with stronger controls when runtime risk is high.
5. Treat checkpoint context as bounded reviewer context, not complete environment reconstruction.

## Redaction and verification

1. `redactLiteBundle()` intentionally changes payload content for sharing.
2. Because hashes are not recomputed during redaction, redacted bundles are expected to fail verification.
3. Verification can include `EXPECTED_REDACTION_NON_VERIFIABLE` when redaction markers are detected.
4. Verify original bundle first, then generate redacted outputs for distribution.
