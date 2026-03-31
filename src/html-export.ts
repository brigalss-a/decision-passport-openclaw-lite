import type { LiteBundle, PassportRecord } from "./types.js";

export interface LiteVerificationCheck {
  name: string;
  passed: boolean;
  message?: string;
}

export interface LiteHtmlReportData {
  bundle: LiteBundle;
  verification: { status: string; checks: LiteVerificationCheck[] };
  generatedAt: string;
}

/**
 * Render a self-contained HTML verification report for a LiteBundle.
 */
export function renderLiteHtmlReport(data: LiteHtmlReportData): string {
  const { bundle, verification, generatedAt } = data;
  const status = verification.status;
  const statusColor = status === "PASS" ? "#22c55e" : "#ef4444";
  const statusLabel = status === "PASS" ? "PASS" : "FAIL";

  const checksHtml = verification.checks
    .map(
      (c) =>
        `<tr>
          <td>${escapeHtml(c.name)}</td>
          <td style="color: ${c.passed ? "#22c55e" : "#ef4444"}">${c.passed ? "PASS" : "FAIL"}</td>
          <td>${c.message ? escapeHtml(c.message) : "&mdash;"}</td>
        </tr>`,
    )
    .join("\n");

  const recordsHtml = bundle.passport_records
    .map(
      (r: PassportRecord, i: number) =>
        `<tr>
          <td>${i}</td>
          <td>${escapeHtml(r.action_type)}</td>
          <td>${escapeHtml(r.actor_id)}</td>
          <td>${escapeHtml(r.actor_type)}</td>
          <td>${escapeHtml(formatPayloadSummary(r))}</td>
          <td><code title="${escapeHtml(r.record_hash)}">${escapeHtml(r.record_hash.slice(0, 12))}...</code></td>
        </tr>`,
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>OpenClaw Passport Lite &mdash; Verification Report</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 900px; margin: 0 auto; padding: 2rem; background: #0f172a; color: #e2e8f0; }
  h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
  h2 { font-size: 1.125rem; margin: 1.5rem 0 0.75rem; border-bottom: 1px solid #334155; padding-bottom: 0.25rem; }
  .status-card { display: inline-block; padding: 0.5rem 1.5rem; border-radius: 0.5rem; font-size: 1.75rem; font-weight: bold; color: #fff; background: ${statusColor}; margin: 1rem 0; }
  table { width: 100%; border-collapse: collapse; margin: 0.5rem 0; }
  th, td { text-align: left; padding: 0.375rem 0.75rem; border-bottom: 1px solid #1e293b; font-size: 0.875rem; }
  th { color: #94a3b8; font-weight: 600; }
  code { background: #1e293b; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.8125rem; }
  .meta { color: #64748b; font-size: 0.8125rem; margin-top: 2rem; }
  .summary-box { background: #1e293b; padding: 0.75rem 1rem; border-radius: 0.5rem; margin: 0.5rem 0; border-left: 4px solid ${statusColor}; }
</style>
</head>
<body>
  <h1>OpenClaw Passport Lite &mdash; Verification Report</h1>
  <div class="status-card">${statusLabel}</div>

  <h2>Bundle</h2>
  <table>
    <tr><th>Version</th><td>${escapeHtml(bundle.bundle_version)}</td></tr>
    <tr><th>Chain ID</th><td><code>${escapeHtml(bundle.manifest.chain_id)}</code></td></tr>
    <tr><th>Records</th><td>${bundle.passport_records.length}</td></tr>
    <tr><th>Chain Hash</th><td><code>${escapeHtml(bundle.manifest.chain_hash)}</code></td></tr>
    <tr><th>Exported</th><td>${escapeHtml(bundle.exported_at_utc)}</td></tr>${bundle.summary ? `\n    <tr><th>Summary</th><td>${escapeHtml(bundle.summary)}</td></tr>` : ""}
  </table>

  <h2>Checks</h2>
  <table>
    <thead><tr><th>Check</th><th>Result</th><th>Detail</th></tr></thead>
    <tbody>${checksHtml}</tbody>
  </table>

  <h2>Records</h2>
  <table>
    <thead><tr><th>#</th><th>Action</th><th>Actor</th><th>Type</th><th>Payload</th><th>Hash</th></tr></thead>
    <tbody>${recordsHtml}</tbody>
  </table>

  <p class="meta">Generated ${escapeHtml(generatedAt)} by decision-passport-openclaw-lite</p>
</body>
</html>`;
}

function formatPayloadSummary(record: PassportRecord): string {
  const p = record.payload;
  if (p.type === "reasoning_summary" && typeof p.summary === "string") {
    return p.summary.length > 60 ? p.summary.slice(0, 57) + "..." : p.summary;
  }
  if (typeof p.tool === "string") {
    return `tool: ${p.tool}`;
  }
  const keys = Object.keys(p);
  if (keys.length <= 3) return keys.join(", ");
  return `${keys.length} fields`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
