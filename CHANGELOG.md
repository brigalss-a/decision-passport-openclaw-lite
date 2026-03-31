# Changelog

<!-- markdownlint-disable MD024 -->

All notable changes to this project will be documented in this file.

This project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- **HTML verification report** (`renderLiteHtmlReport()`): self-contained HTML export for any `LiteBundle`. Includes dark theme, status card, checks table, and records table.
- **Demo artifact output**: `pnpm demo` now writes `artifacts/passport-lite-report.html` and `artifacts/passport-lite-summary.json`.
- **6 new tests** for HTML export (PASS/FAIL rendering, XSS escaping, summary handling, record table).
- **Redaction utility** (`redactLiteBundle()`): three modes -- `none` (deep copy), `safe-demo` (recursive value replacement with `[REDACTED]`), `public-share` (payload and actor removal). Redacted bundles explicitly fail verification.
- **15 new redaction tests** across all three modes plus nested payload handling.
- **Redaction docs** (`docs/redaction-modes.md`): mode comparison tables, verification consequences, usage examples.
- **Release workflow** (`.github/workflows/release.yml`): automated GitHub Release on `v*` tags with artifact collection and SHA-256 checksums.
- **Checksum generation** (`scripts/generate-checksums.ts`): SHA-256 checksums for demo artifact files.
- **Release verification docs** (`docs/release-verification.md`): step-by-step local verification of published releases.
- Test count: 17 → 38.

### Fixed

- Markdown lint warnings across README, CONTRIBUTING, SECURITY, CHANGELOG, quickstart, enterprise-vs-lite, passport-skill, demo README, and RELEASE_NOTES files.

## [0.1.0] - 2025-06-28

### Added

- **OpenClaw Passport Wrapper Lite**: middleware and wrapper for attaching decision passports to AI tool calls.
- **Session Recorder Lite**: lightweight in-memory session recorder for capturing decision chains.
- **Bundle export & verification**: SHA-256 hash-chain bundles with standalone verification.
- **Three example integrations**: browser automation, email dispatch, and file operations, each with full passport lifecycle.
- **Test suite**: 17 tests across 4 test files (session-recorder, bundle-verify, wrapper, middleware).
- **CI workflow** (`.github/workflows/ci.yml`): install → build → test → demo on every push and PR.
- **Demo script** (`scripts/run-demo.ts`): runs the email example end-to-end with formatted summary output.
- Copilot skill definition (`skills/passport-skill.md`).
- Apache-2.0 licence, CONTRIBUTING.md, SECURITY.md.
