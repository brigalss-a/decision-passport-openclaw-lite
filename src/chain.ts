import { randomUUID } from "crypto";
import type { ActionType, ActorType, PassportRecord, ChainManifest } from "./types.js";
import { hashCanonical } from "./hashing.js";

export const GENESIS_HASH =
  "GENESIS_0000000000000000000000000000000000000000000000000000000000000000";

export function createRecord(params: {
  chainId: string;
  lastRecord: PassportRecord | null;
  actorId: string;
  actorType: ActorType;
  actionType: ActionType;
  payload: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}): PassportRecord {
  const sequence = params.lastRecord ? params.lastRecord.sequence + 1 : 0;
  const prevHash = params.lastRecord ? params.lastRecord.record_hash : GENESIS_HASH;
  const payloadHash = hashCanonical(params.payload);

  const withoutHash = {
    id: randomUUID(),
    chain_id: params.chainId,
    sequence,
    timestamp_utc: new Date().toISOString(),
    actor_id: params.actorId,
    actor_type: params.actorType,
    action_type: params.actionType,
    payload: params.payload,
    payload_hash: payloadHash,
    prev_hash: prevHash,
    ...(params.metadata ? { metadata: params.metadata } : {})
  };

  return {
    ...withoutHash,
    record_hash: hashCanonical(withoutHash)
  };
}

export function createManifest(records: readonly PassportRecord[]): ChainManifest {
  if (records.length === 0) {
    return {
      chain_id: "empty-chain",
      record_count: 0,
      first_record_id: "",
      last_record_id: "",
      chain_hash: ""
    };
  }

  return {
    chain_id: records[0].chain_id,
    record_count: records.length,
    first_record_id: records[0].id,
    last_record_id: records[records.length - 1].id,
    chain_hash: records[records.length - 1].record_hash
  };
}

export function verifyChain(records: readonly PassportRecord[]): { valid: boolean; error?: string } {
  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const expectedSequence = i;
    const expectedPrevHash = i === 0 ? GENESIS_HASH : records[i - 1].record_hash;

    if (record.sequence !== expectedSequence) {
      return { valid: false, error: `Sequence mismatch at index ${i}` };
    }
    if (record.prev_hash !== expectedPrevHash) {
      return { valid: false, error: `prev_hash mismatch at index ${i}` };
    }

    const { record_hash, ...rest } = record;
    const recomputed = hashCanonical(rest);
    if (recomputed !== record_hash) {
      return { valid: false, error: `record_hash mismatch at index ${i}` };
    }
  }

  return { valid: true };
}
