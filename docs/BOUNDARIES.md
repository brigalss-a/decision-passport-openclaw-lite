# Boundaries

## What this repository is

Decision Passport OpenClaw Lite is a lightweight proof wrapper for OpenClaw-style agent actions.
It records structured checkpoints, exports a Lite proof bundle, and supports offline integrity verification.
It also supports redacted sharing artifacts for demos and public communication.

## What this repository is not

1. It is not a runtime policy engine.
2. It is not an execution guard that blocks actions before they run.
3. It is not a full enterprise control-plane service.
4. It is not a full forensic recorder of all model internals or every environment signal.

## What is proven

1. Recorded Lite bundle records maintain hash-chain integrity when verification returns PASS.
2. Manifest chain hash matches the terminal record hash when verification returns PASS.
3. Post-record tampering of payloads or chain links is detected by verification.

## What is not proven

1. Runtime authorization of each action.
2. Policy compliance or policy correctness.
3. Full environment truth for everything the agent perceived.
4. Strong provenance of author identity without external signing infrastructure.

## Trust boundaries

1. Capture boundary: this library records what integration code chooses to send as reasoning summary, tool intent, and tool result summary.
2. Verification boundary: verification checks internal integrity of the provided bundle object.
3. Storage boundary: persistence and write protection are external responsibilities.
4. Runtime boundary: enforcement and prevention controls are outside this repository.

## Assumptions

1. Integrators choose meaningful high-value checkpoints.
2. Integrators keep original bundles when strict re-verification is needed.
3. Operators do not interpret PASS as policy approval.
4. Consumers understand redacted artifacts are share artifacts, not full verifiable originals.

## Failure modes and non-goals

1. Integrity failures should return FAIL in verification checks.
2. Malformed inputs may fail during parsing or verification calls.
3. Redacted bundles are expected to fail verification because payload content changes.
4. This repository does not prevent operator misuse or unsafe runtime behavior by itself.

## What stronger infrastructure would add

1. Runtime authorization claims and fail-closed execution gating.
2. Policy evaluation and enforcement at action time.
3. Replay prevention, tenant controls, and stronger governance controls.
4. Provenance signing, key management, and hardened storage controls.

## Logs, traces, audit trails, proof bundles, and enforcement

1. Logs and traces are operational telemetry and often optimized for debugging.
2. Generic audit trails may describe events but may not include cryptographic integrity checks.
3. Lite proof bundles provide integrity-oriented, hash-linked evidence for selected checkpoints.
4. Runtime enforcement decides whether actions may run, this repository does not provide that control layer.
