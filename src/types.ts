export type LiteEventType =
  | "reasoning_summary"
  | "tool_intent"
  | "tool_result";

export type ActorType = "human" | "ai_agent" | "system" | "policy";

export type ActionType =
  | "AI_RECOMMENDATION"
  | "EXECUTION_PENDING"
  | "EXECUTION_SUCCEEDED";

export interface PassportRecord {
  readonly id: string;
  readonly chain_id: string;
  readonly sequence: number;
  readonly timestamp_utc: string;
  readonly actor_id: string;
  readonly actor_type: ActorType;
  readonly action_type: ActionType;
  readonly payload: Readonly<Record<string, unknown>>;
  readonly payload_hash: string;
  readonly prev_hash: string;
  readonly record_hash: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface ChainManifest {
  readonly chain_id: string;
  readonly record_count: number;
  readonly first_record_id: string;
  readonly last_record_id: string;
  readonly chain_hash: string;
}

export interface LiteBundle {
  readonly bundle_version: "1.4-openclaw-lite";
  readonly exported_at_utc: string;
  readonly summary?: string;
  readonly passport_records: readonly PassportRecord[];
  readonly manifest: ChainManifest;
}
