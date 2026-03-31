# Append-Only Guarantees and Limits

OpenClaw Passport Lite is built on the same **append-only protocol** as
`decision-passport-core`. This document explains what is guaranteed, what is detected
by verification, and what is explicitly out of scope.

---

## What "append-only" means here

| Level | Guarantee |
| --- | --- |
| **Recorder** | `SessionRecorderLite.record()` only appends. No prior event is modified. |
| **Chain** | Each appended record's `prev_hash` points to the prior `record_hash`. |
| **Bundle** | `finalize()` exports a snapshot. Verification fails if any record changes after export. |

---

## What the protocol guarantees

**No mutation API exists.** `SessionRecorderLite`, `OpenClawPassportWrapperLite`, and
`OpenClawPassportMiddlewareLite` only append records. There is no method to update,
delete, reorder, or patch a prior event.

**Records are typed as readonly.** `PassportRecord`, `ChainManifest`, and `LiteBundle`
use `readonly` fields throughout. Consumer code receives immutable-by-type records.

**`getRecords()` returns a copy.** The internal record list is not exposed directly.
Mutations to the returned array do not affect the recorder state.

**`finalize()` is a snapshot.** Calling `finalize()` returns the chain state at that
moment. Subsequent `record()` calls do not retroactively change prior finalized bundles.

**Verification is hash-based and deterministic.** `verifyLiteBundle()` calls
`verifyChain()`, which recomputes every `payload_hash` and `record_hash` from scratch.

---

## What verification detects

`verifyLiteBundle()` will return `FAIL` for any of the following:

| Mutation | Detected by |
| --- | --- |
| Payload content changed | `record_hash` mismatch |
| `prev_hash` rewritten | explicit `prev_hash` check |
| Sequence number altered | explicit `sequence` check |
| Record removed from chain | `prev_hash` mismatch on next record |
| Records reordered | `sequence` and `prev_hash` mismatch |
| Manifest `chain_hash` changed | manifest check |

---

## Redaction and verification

Redacted bundles produced by `redactLiteBundle()` **do not re-hash**. Because payload
content is replaced, `payload_hash` and `record_hash` will no longer match the redacted
data. **Verification of a redacted bundle returns `FAIL`** — this is expected and
documented behaviour.

See [redaction-modes.md](./redaction-modes.md) for full details.

---

## What "append-only" does NOT mean here

This library implements a **protocol-level** append-only design. It does not implement
and does not claim:

- **File-system write protection** — exported bundle files can be overwritten on disk.
- **WORM storage** — no storage layer is managed by this library.
- **Database trigger immutability** — no database is involved.

If you need storage-level immutability, layer that on top using append-only object
storage, signed exports, or an audited log system.

---

## Summary

| Claim | Status |
| --- | --- |
| No mutation API in public exports | **True** |
| Records typed as readonly | **True** |
| `getRecords()` returns a copy | **True** |
| Tamper detectable by verification | **True** |
| Redacted bundles fail verification | **True — expected behaviour** |
| Storage-level immutability | **Out of scope** |
