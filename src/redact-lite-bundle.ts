/**
 * Redaction utility for LiteBundle.
 *
 * Produces a new bundle with sensitive data removed or replaced.
 * The original bundle is never mutated.
 *
 * Redaction modes:
 *   - "none":         Returns a deep copy, no changes.
 *   - "safe-demo":    Replaces obvious payload values with "[REDACTED]".
 *                     Preserves structure, action types, sequences, timestamps.
 *                     Payload hashes will NOT match redacted content.
 *   - "public-share": Aggressively removes payload content and optional metadata.
 *                     Preserves chain structure and manifest only.
 *                     Payload hashes will NOT match redacted content.
 *
 * IMPORTANT: Redacted bundles are for sharing and illustration only.
 * Because payload content changes, payload_hash and record_hash will no longer
 * match the redacted data. Verification of a redacted bundle will return FAIL.
 * This is expected and documented behaviour.
 */

import type { LiteBundle, PassportRecord } from "./types.js";

/** Supported redaction modes. */
export type RedactionMode = "none" | "safe-demo" | "public-share";

/** Options for redactLiteBundle. */
export interface RedactOptions {
  mode: RedactionMode;
}

/** Result of a redaction operation. */
export interface RedactedBundleResult {
  /** The redacted bundle. */
  bundle: LiteBundle;
  /** The redaction mode that was applied. */
  mode: RedactionMode;
  /** Whether the bundle can still pass verification. */
  verifiable: boolean;
  /** Explanation of verification status. */
  verificationNote: string;
}

const REDACTED = "[REDACTED]";

/**
 * Produce a redacted copy of a LiteBundle.
 *
 * The original bundle is never mutated.
 * Returns a result object that includes the redacted bundle and metadata
 * about whether verification is still possible.
 */
export function redactLiteBundle(
  bundle: LiteBundle,
  options: RedactOptions
): RedactedBundleResult {
  // JSON round-trip provides a deep copy of the original
  const raw: LiteBundle = JSON.parse(JSON.stringify(bundle));

  if (options.mode === "none") {
    return {
      bundle: raw,
      mode: "none",
      verifiable: true,
      verificationNote:
        "No redaction applied. Bundle is identical to the original and remains fully verifiable.",
    };
  }

  if (options.mode === "safe-demo") {
    const redacted: LiteBundle = {
      ...raw,
      passport_records: raw.passport_records.map(redactRecordSafeDemo),
      ...(raw.summary !== undefined ? { summary: REDACTED } : {}),
    };
    return {
      bundle: redacted,
      mode: "safe-demo",
      verifiable: false,
      verificationNote:
        "Payload values have been replaced with placeholders. " +
        "payload_hash and record_hash no longer match the redacted content. " +
        "Verification will return FAIL. " +
        "Chain structure, action types, sequences, and timestamps are preserved.",
    };
  }

  // public-share
  const redacted: LiteBundle = {
    ...raw,
    passport_records: raw.passport_records.map(redactRecordPublicShare),
    ...(raw.summary !== undefined ? { summary: REDACTED } : {}),
  };
  return {
    bundle: redacted,
    mode: "public-share",
    verifiable: false,
    verificationNote:
      "Payload content and metadata have been removed. " +
      "payload_hash and record_hash no longer match the redacted content. " +
      "Verification will return FAIL. " +
      "Only chain structure, action types, and sequence order are preserved.",
  };
}

/**
 * safe-demo: replace payload leaf values with "[REDACTED]" but preserve keys.
 * Preserves actor_id, actor_type, action_type, timestamps, sequence, hashes.
 */
function redactRecordSafeDemo(record: PassportRecord): PassportRecord {
  return {
    ...record,
    payload: redactPayloadValues(record.payload),
    metadata: record.metadata ? redactPayloadValues(record.metadata) : undefined,
  };
}

/**
 * public-share: replace entire payload with a minimal stub.
 * Remove metadata entirely.
 * Replace actor_id with a generic label.
 */
function redactRecordPublicShare(record: PassportRecord): PassportRecord {
  return {
    ...record,
    actor_id: REDACTED,
    payload: { redacted: true },
    metadata: undefined,
  };
}

/**
 * Recursively replace leaf values in an object with "[REDACTED]".
 * Preserves object structure and keys.
 */
function redactPayloadValues(
  obj: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value)
    ) {
      result[key] = redactPayloadValues(value as Record<string, unknown>);
    } else {
      result[key] = REDACTED;
    }
  }
  return result;
}
