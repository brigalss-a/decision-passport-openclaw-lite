import { createManifest, createRecord } from "./chain.js";
import type { PassportRecord, LiteBundle, ActionType } from "./types.js";

export class SessionRecorderLite {
  private records: PassportRecord[] = [];
  private lastRecord: PassportRecord | null = null;

  constructor(
    private readonly config: {
      chainId: string;
      actorId: string;
      purpose: string;
      model?: string;
    }
  ) {}

  private mapType(type: "reasoning_summary" | "tool_intent" | "tool_result"): ActionType {
    if (type === "reasoning_summary") return "AI_RECOMMENDATION";
    if (type === "tool_intent") return "EXECUTION_PENDING";
    return "EXECUTION_SUCCEEDED";
  }

  async record(type: "reasoning_summary" | "tool_intent" | "tool_result", payload: Record<string, unknown>) {
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

  async finalize(summary?: string): Promise<LiteBundle> {
    return {
      bundle_version: "1.4-openclaw-lite",
      exported_at_utc: new Date().toISOString(),
      summary,
      passport_records: this.records,
      manifest: createManifest(this.records)
    };
  }

  getRecords() {
    return this.records;
  }
}
