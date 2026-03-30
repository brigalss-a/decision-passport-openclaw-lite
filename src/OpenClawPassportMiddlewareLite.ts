import { OpenClawPassportWrapperLite } from "./OpenClawPassportWrapperLite.js";

export class OpenClawPassportMiddlewareLite {
  constructor(private readonly wrapper: OpenClawPassportWrapperLite) {}

  async beforeToolCall(toolCall: { tool: string; payload: Record<string, unknown> }) {
    await this.wrapper.recordReasoningSummary(
      `OpenClaw intends to execute ${toolCall.tool}`,
      0.88
    );

    await this.wrapper.recordToolIntent(toolCall.tool, toolCall.payload);
    return toolCall;
  }

  async afterToolResult(toolCall: { tool: string; payload: Record<string, unknown> }, result: unknown) {
    await this.wrapper.recordToolResultSummary(toolCall.tool, result);
    return result;
  }

  async finalize(summary?: string) {
    return this.wrapper.finalize(summary);
  }
}
