import { SessionRecorderLite } from "./SessionRecorderLite.js";
import { summarizeResult } from "./utils/summarize-result.js";
import { mapToolIntent } from "./utils/map-tool-intent.js";

export class OpenClawPassportWrapperLite {
  private readonly recorder: SessionRecorderLite;

  constructor(config: {
    chainId: string;
    actorId: string;
    purpose: string;
    model?: string;
  }) {
    this.recorder = new SessionRecorderLite(config);
  }

  async recordReasoningSummary(summary: string, confidence: number) {
    return this.recorder.record("reasoning_summary", {
      summary,
      confidence
    });
  }

  async recordToolIntent(tool: string, payload: Record<string, unknown>) {
    return this.recorder.record("tool_intent", mapToolIntent(tool, payload));
  }

  async recordToolResultSummary(tool: string, result: unknown) {
    return this.recorder.record("tool_result", {
      tool,
      result_summary: summarizeResult(result)
    });
  }

  async finalize(summary?: string) {
    return this.recorder.finalize(summary);
  }
}
