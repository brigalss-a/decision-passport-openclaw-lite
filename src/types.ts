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
  id: string;
  chain_id: string;
  sequence: number;
  timestamp_utc: string;
  actor_id: string;
  actor_type: ActorType;
  action_type: ActionType;
  payload: Record<string, unknown>;
  payload_hash: string;
  prev_hash: string;
  record_hash: string;
  metadata?: Record<string, unknown>;
}

export interface ChainManifest {
  chain_id: string;
  record_count: number;
  first_record_id: string;
  last_record_id: string;
  chain_hash: string;
}

export interface LiteBundle {
  bundle_version: "1.4-openclaw-lite";
  exported_at_utc: string;
  summary?: string;
  passport_records: PassportRecord[];
  manifest: ChainManifest;
}
