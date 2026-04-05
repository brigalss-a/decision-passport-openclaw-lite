# Threat Model

## Scope

This document covers integrity and interpretation threats for Lite proof bundle capture, export, redaction, and verification.

## Assets being protected

1. Integrity of recorded checkpoint records.
2. Integrity of chain links and manifest chain hash.
3. Reviewer understanding of PASS and FAIL outcomes.
4. Safe sharing posture for redacted artifacts.

## Threats addressed

1. Payload tampering after record creation.
2. Record hash tampering.
3. Chain-link tampering through prev_hash or sequence edits.
4. Manifest chain hash mismatch.
5. Human confusion from silent integrity failures, reduced through explicit PASS and FAIL outputs.

## Threats partially addressed

1. Missing records can be inferred when chain continuity or expected flow checks fail in reviewer workflows.
2. Malformed bundles are often caught during parsing or verification invocation.
3. Untrusted transport is partially addressed because post-transfer verification can detect integrity drift, but not trusted origin.

## Threats not addressed

1. Runtime action prevention and policy enforcement.
2. Complete capture of all agent context, hidden state, or every perception event.
3. Strong identity provenance without external signing controls.
4. Storage overwrite, deletion, and retention failures.
5. Selective capture decisions that omit events before recording.

## Trust assumptions

1. Integration code supplies meaningful checkpoint data.
2. Reviewers verify original bundles before relying on integrity outcomes.
3. Consumers understand redaction changes payload content and therefore verification behavior.
4. External systems provide transport security, storage controls, and identity controls.

## Operational caveats

1. Record creation includes runtime UUID and timestamp values.
2. Verification behavior is deterministic for the same bundle bytes, but regenerated outputs are not byte-identical by default.
3. Redaction improves shareability but reduces direct verifiability of redacted copies.
4. Operator misuse can still produce incomplete or low-value evidence.

## Residual risk

1. PASS only attests to internal integrity of provided records, not full runtime truth.
2. Incomplete checkpoint capture can still produce a valid PASS for what was recorded.
3. Without external enforcement layers, risky runtime actions may still execute.
4. Without external provenance controls, integrity verification does not prove creator identity.
