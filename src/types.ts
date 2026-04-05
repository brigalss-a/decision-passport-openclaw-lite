export type LiteEventType =
  | "reasoning_summary"
  | "tool_intent"
  | "tool_result"
  | "checkpoint";

export type CaptureMode = "event" | "checkpoint";

export type CheckpointType =
  | "send_email"
  | "delete_file"
  | "submit_form"
  | "external_post"
  | "purchase"
  | "irreversible_mutation"
  | "permission_change"
  | "credential_use"
  | "human_approval_boundary"
  | "custom";

export type ScreenshotPolicy = "none" | "selective" | "always";

export interface CheckpointContext {
  readonly summary?: string;
  readonly structuredState?: Readonly<Record<string, unknown>>;
  readonly inputSummary?: string | Readonly<Record<string, unknown>>;
  readonly outputSummary?: string | Readonly<Record<string, unknown>>;
  readonly target?: string;
  readonly actorIntent?: string;
  readonly riskHint?: "low" | "medium" | "high" | "critical";
  readonly triggerMetadata?: Readonly<Record<string, unknown>>;
}

export interface CheckpointRecordInput {
  readonly checkpointType: CheckpointType;
  readonly context?: CheckpointContext;
  readonly screenshotPolicy?: ScreenshotPolicy;
  readonly screenshotCaptured?: boolean;
  readonly screenshotReason?: string;
}

export interface CheckpointPayload {
  readonly type: "checkpoint";
  readonly checkpointType: CheckpointType;
  readonly context?: CheckpointContext;
  readonly screenshotPolicy: ScreenshotPolicy;
  readonly screenshotCaptured?: boolean;
  readonly screenshotReason?: string;
}

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
  readonly captureMode: CaptureMode;
  readonly summary?: string;
  readonly passport_records: readonly PassportRecord[];
  readonly manifest: ChainManifest;
}
