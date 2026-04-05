import { createManifest, createRecord } from "./chain.js";
import type {
  PassportRecord,
  LiteBundle,
  ActionType,
  CaptureMode,
  CheckpointRecordInput,
  LiteEventType,
  ScreenshotPolicy,
} from "./types.js";

type EventRecordType = Exclude<LiteEventType, "checkpoint">;

export class SessionRecorderLite {
  private records: PassportRecord[] = [];
  private lastRecord: PassportRecord | null = null;
  private captureMode: CaptureMode;

  constructor(
    private readonly config: {
      chainId: string;
      actorId: string;
      purpose: string;
      model?: string;
      captureMode?: CaptureMode;
      defaultScreenshotPolicy?: "none" | "selective" | "always";
    }
  ) {
    this.captureMode = config.captureMode ?? "event";
  }

  private mapType(type: LiteEventType): ActionType {
    if (type === "reasoning_summary") return "AI_RECOMMENDATION";
    if (type === "tool_intent" || type === "checkpoint") return "EXECUTION_PENDING";
    return "EXECUTION_SUCCEEDED";
  }

  private async recordInternal(type: LiteEventType, payload: Record<string, unknown>) {
    const record = createRecord({
      chainId: this.config.chainId,
      lastRecord: this.lastRecord,
      actorId: this.config.actorId,
      actorType: "ai_agent",
      actionType: this.mapType(type),
      payload: {
        ...payload,
        type,
        purpose: this.config.purpose,
        model: this.config.model
      }
    });

    this.records.push(record);
    this.lastRecord = record;
    return record;
  }

  async record(type: EventRecordType, payload: Record<string, unknown>) {
    return this.recordInternal(type, payload);
  }

  private normalizeScreenshotMetadata(input: CheckpointRecordInput): {
    screenshotPolicy: ScreenshotPolicy;
    screenshotCaptured: boolean;
    screenshotReason?: string;
  } {
    const screenshotPolicy =
      input.screenshotPolicy ?? this.config.defaultScreenshotPolicy ?? "none";
    const screenshotCaptured = input.screenshotCaptured ?? false;
    const screenshotReason = input.screenshotReason?.trim();

    return {
      screenshotPolicy,
      screenshotCaptured,
      ...(screenshotReason ? { screenshotReason } : {}),
    };
  }

  async recordCheckpoint(input: CheckpointRecordInput) {
    this.captureMode = "checkpoint";

    const screenshot = this.normalizeScreenshotMetadata(input);
    const payload: Record<string, unknown> = {
      checkpointType: input.checkpointType,
      screenshotPolicy: screenshot.screenshotPolicy,
      screenshotCaptured: screenshot.screenshotCaptured,
    };

    if (input.context !== undefined) {
      payload.context = input.context;
    }
    if (screenshot.screenshotReason !== undefined) {
      payload.screenshotReason = screenshot.screenshotReason;
    }

    return this.recordInternal("checkpoint", payload);
  }

  async finalize(summary?: string): Promise<LiteBundle> {
    return {
      bundle_version: "1.4-openclaw-lite",
      exported_at_utc: new Date().toISOString(),
      captureMode: this.captureMode,
      summary,
      passport_records: [...this.records],
      manifest: createManifest(this.records)
    };
  }

  getRecords(): readonly PassportRecord[] {
    return [...this.records];
  }
}
