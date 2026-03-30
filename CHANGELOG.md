# Changelog

All notable changes to this project will be documented in this file.

This project adheres to [Semantic Versioning](https://semver.org/).

## [0.1.0] — 2025-06-28

### Added

- **OpenClaw Passport Wrapper Lite**: middleware and wrapper for attaching decision passports to AI tool calls.
- **Session Recorder Lite**: lightweight in-memory session recorder for capturing decision chains.
- **Bundle export & verification**: SHA-256 hash-chain bundles with standalone verification.
- **Three example integrations**: browser automation, email dispatch, and file operations — each with full passport lifecycle.
- **Test suite**: 17 tests across 4 test files (session-recorder, bundle-verify, wrapper, middleware).
- **CI workflow** (`.github/workflows/ci.yml`): install → build → test → demo on every push and PR.
- **Demo script** (`scripts/run-demo.ts`): runs the email example end-to-end with formatted summary output.
- Copilot skill definition (`skills/passport-skill.md`).
- Apache-2.0 licence, CONTRIBUTING.md, SECURITY.md.
