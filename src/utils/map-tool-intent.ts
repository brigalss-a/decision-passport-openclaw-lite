export function mapToolIntent(tool: string, payload: Record<string, unknown>) {
  return {
    tool,
    payload_summary: payload
  };
}
