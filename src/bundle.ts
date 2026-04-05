import type { LiteBundle } from "./types.js";
import { verifyChain } from "./chain.js";

export type LiteVerificationReasonCode =
  | "MALFORMED_LITE_BUNDLE"
  | "EMPTY_OR_MISSING_RECORDS"
  | "CHAIN_INTEGRITY_FAILED"
  | "MANIFEST_HASH_MISMATCH"
  | "EXPECTED_REDACTION_NON_VERIFIABLE"
  | "UNKNOWN_VERIFICATION_ERROR";

export interface LiteVerificationCheck {
  name: string;
  passed: boolean;
  message?: string;
}

export interface LiteRedactionAssessment {
  expectedNonVerifiable: boolean;
  evidence: string[];
  message: string;
}

export interface LiteVerifierResult {
  status: "PASS" | "FAIL";
  summary: string;
  checks: LiteVerificationCheck[];
  reasonCodes: LiteVerificationReasonCode[];
  redactionAssessment?: LiteRedactionAssessment;
  nextSteps: string[];
}

export function verifyLiteBundle(bundle: unknown): LiteVerifierResult {
  const malformed = validateLiteBundleShape(bundle);
  if (malformed) {
    return failWith(
      [
        {
          name: "bundle_structure",
          passed: false,
          message: malformed,
        },
      ],
      ["MALFORMED_LITE_BUNDLE"],
      "Verification failed because Lite bundle structure is malformed.",
      [
        "Validate JSON parsing and required top-level LiteBundle fields.",
        "Ensure passport_records and manifest are present with expected primitive field types.",
      ],
    );
  }

  const typedBundle = bundle as LiteBundle;
  if (typedBundle.passport_records.length === 0) {
    return failWith(
      [
        {
          name: "records_present",
          passed: false,
          message: "Lite bundle has no records.",
        },
      ],
      ["EMPTY_OR_MISSING_RECORDS"],
      "Verification failed because Lite bundle has no records.",
      [
        "Confirm recording captured at least one checkpoint before finalize/export.",
        "Re-run the integration flow and verify the original unmodified artifact.",
      ],
    );
  }

  const checks: LiteVerificationCheck[] = [];
  const reasonCodes = new Set<LiteVerificationReasonCode>();
  const chain = verifyChain(typedBundle.passport_records);

  checks.push({
    name: "chain_integrity",
    passed: chain.valid,
    message: chain.error
  });

  if (!chain.valid) {
    reasonCodes.add("CHAIN_INTEGRITY_FAILED");
  }

  if (typedBundle.passport_records.length > 0) {
    const manifestMatch =
      typedBundle.manifest.chain_hash ===
      typedBundle.passport_records[typedBundle.passport_records.length - 1].record_hash;

    checks.push({
      name: "manifest_chain_hash",
      passed: manifestMatch,
      message: manifestMatch ? undefined : "Manifest chain_hash mismatch"
    });

    if (!manifestMatch) {
      reasonCodes.add("MANIFEST_HASH_MISMATCH");
    }
  }

  if (checks.every((c) => c.passed)) {
    return {
      status: "PASS",
      summary: "Verification passed. Lite artifact integrity checks succeeded.",
      checks,
      reasonCodes: [],
      nextSteps: [
        "Preserve original bundle bytes and checksums for repeat verification.",
      ],
    };
  }

  const redactionAssessment = assessExpectedRedactionFailure(typedBundle);
  if (redactionAssessment.expectedNonVerifiable) {
    reasonCodes.add("EXPECTED_REDACTION_NON_VERIFIABLE");
  }

  if (reasonCodes.size === 0) {
    reasonCodes.add("UNKNOWN_VERIFICATION_ERROR");
  }

  return failWith(
    checks,
    [...reasonCodes],
    buildFailSummary([...reasonCodes], redactionAssessment),
    buildNextSteps([...reasonCodes], redactionAssessment),
    redactionAssessment.expectedNonVerifiable ? redactionAssessment : undefined,
  );
}

function failWith(
  checks: LiteVerificationCheck[],
  reasonCodes: LiteVerificationReasonCode[],
  summary: string,
  nextSteps: string[],
  redactionAssessment?: LiteRedactionAssessment,
): LiteVerifierResult {
  return {
    status: "FAIL",
    summary,
    checks,
    reasonCodes,
    redactionAssessment,
    nextSteps,
  };
}

function validateLiteBundleShape(bundle: unknown): string | null {
  if (!isObject(bundle)) {
    return "Lite bundle must be an object.";
  }

  if (typeof bundle.bundle_version !== "string") {
    return "Field bundle_version must be a string.";
  }

  if (typeof bundle.exported_at_utc !== "string") {
    return "Field exported_at_utc must be a string.";
  }

  if (!Array.isArray(bundle.passport_records)) {
    return "Field passport_records must be an array.";
  }

  if (!isObject(bundle.manifest)) {
    return "Field manifest must be an object.";
  }

  if (typeof bundle.manifest.chain_hash !== "string") {
    return "Field manifest.chain_hash must be a string.";
  }

  for (let i = 0; i < bundle.passport_records.length; i++) {
    const record = bundle.passport_records[i];
    if (!isObject(record)) {
      return `Record at index ${i} must be an object.`;
    }
    if (typeof record.sequence !== "number") {
      return `Record at index ${i} has invalid sequence type.`;
    }
    if (typeof record.prev_hash !== "string") {
      return `Record at index ${i} has invalid prev_hash type.`;
    }
    if (typeof record.record_hash !== "string") {
      return `Record at index ${i} has invalid record_hash type.`;
    }
    if (typeof record.payload_hash !== "string") {
      return `Record at index ${i} has invalid payload_hash type.`;
    }
    if (!isObject(record.payload)) {
      return `Record at index ${i} has invalid payload shape.`;
    }
  }

  return null;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function assessExpectedRedactionFailure(bundle: LiteBundle): LiteRedactionAssessment {
  const evidence = new Set<string>();

  if (bundle.summary === "[REDACTED]") {
    evidence.add("bundle.summary is [REDACTED]");
  }

  for (const record of bundle.passport_records) {
    if (record.actor_id === "[REDACTED]") {
      evidence.add("record.actor_id is [REDACTED]");
    }

    if (isObject(record.payload) && record.payload.redacted === true) {
      evidence.add("record.payload uses { redacted: true } marker");
    }

    if (containsRedactedMarker(record.payload)) {
      evidence.add("record payload contains [REDACTED] marker values");
    }
  }

  const evidenceList = [...evidence];
  const expectedNonVerifiable = evidenceList.length > 0;

  return {
    expectedNonVerifiable,
    evidence: evidenceList,
    message: expectedNonVerifiable
      ? "Failure is likely expected for a redacted share artifact; verify the original unredacted bundle for integrity evidence."
      : "No obvious redaction markers detected.",
  };
}

function containsRedactedMarker(value: unknown): boolean {
  if (value === "[REDACTED]") {
    return true;
  }
  if (Array.isArray(value)) {
    return value.some((item) => containsRedactedMarker(item));
  }
  if (isObject(value)) {
    for (const fieldValue of Object.values(value)) {
      if (containsRedactedMarker(fieldValue)) {
        return true;
      }
    }
  }
  return false;
}

function buildFailSummary(
  reasonCodes: LiteVerificationReasonCode[],
  redactionAssessment: LiteRedactionAssessment,
): string {
  if (reasonCodes.includes("MALFORMED_LITE_BUNDLE")) {
    return "Verification failed because Lite bundle structure is malformed.";
  }

  const parts: string[] = [];
  if (reasonCodes.includes("EMPTY_OR_MISSING_RECORDS")) {
    parts.push("bundle has no records");
  }
  if (reasonCodes.includes("CHAIN_INTEGRITY_FAILED")) {
    parts.push("chain integrity check failed");
  }
  if (reasonCodes.includes("MANIFEST_HASH_MISMATCH")) {
    parts.push("manifest chain hash does not match terminal record hash");
  }

  if (parts.length === 0) {
    parts.push("an unknown integrity check failed");
  }

  if (reasonCodes.includes("EXPECTED_REDACTION_NON_VERIFIABLE")) {
    return `Verification failed because ${parts.join("; ")}. Redaction markers indicate this may be an expected non-verifiable share artifact.`;
  }

  if (redactionAssessment.expectedNonVerifiable) {
    return `Verification failed because ${parts.join("; ")}. Redaction indicators were detected; confirm whether this is a redacted bundle.`;
  }

  return `Verification failed because ${parts.join("; ")}.`;
}

function buildNextSteps(
  reasonCodes: LiteVerificationReasonCode[],
  redactionAssessment: LiteRedactionAssessment,
): string[] {
  const steps = new Set<string>();

  if (reasonCodes.includes("MALFORMED_LITE_BUNDLE")) {
    steps.add("Validate input JSON shape before verification and ensure required fields exist.");
  }

  if (reasonCodes.includes("EMPTY_OR_MISSING_RECORDS")) {
    steps.add("Re-export the bundle from source integration with recorded checkpoints present.");
  }

  if (
    reasonCodes.includes("CHAIN_INTEGRITY_FAILED") ||
    reasonCodes.includes("MANIFEST_HASH_MISMATCH")
  ) {
    steps.add("Re-verify original artifact bytes and compare against known-good capture path.");
  }

  if (reasonCodes.includes("EXPECTED_REDACTION_NON_VERIFIABLE")) {
    steps.add("Use the original unredacted bundle for integrity verification and keep redacted copy for sharing only.");
  } else if (redactionAssessment.expectedNonVerifiable) {
    steps.add("If this artifact was intentionally redacted, treat FAIL as expected non-verifiable output and verify the original bundle.");
  }

  steps.add("Interpret FAIL as artifact structure or integrity failure; it does not by itself prove runtime compromise or malicious behavior.");

  return [...steps];
}
