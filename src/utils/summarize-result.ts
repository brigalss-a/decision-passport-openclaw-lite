import { hashCanonical } from "../hashing.js";

export function summarizeResult(result: unknown) {
  const serialized = typeof result === "string" ? result : JSON.stringify(result ?? null);
  return {
    kind: Array.isArray(result) ? "array" : typeof result,
    size_bytes: Buffer.byteLength(serialized, "utf8"),
    result_hash: hashCanonical(
      (typeof result === "object" && result !== null ? result : { value: result }) as Record<string, unknown>
    )
  };
}
