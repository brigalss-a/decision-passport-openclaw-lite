# Release Notes: v0.1.0

## Highlights

- Full OpenClaw agent action recording: reasoning, tool intent, tool result
- Append-only chain with offline verification
- Three integration patterns: Wrapper, Middleware, Minimal
- Three ready-to-run example demos (email, browser, file-op)
- 17 tests, all passing
- Green GitHub Actions CI
- Fresh-clone validated on Windows and GitHub Actions (Ubuntu)

## Included

- `OpenClawPassportWrapperLite`: explicit event recording
- `OpenClawPassportMiddlewareLite`: automatic tool call intercept
- `SessionRecorderLite`: low-level chain recorder
- `verifyLiteBundle()`: offline bundle verification
- Chain primitives (`createRecord`, `createManifest`, `verifyChain`)
- Three example integrations (email, browser action, file operation)
- Runnable demo (`pnpm demo`)
- CI workflow (install, build, test, demo)

## Quickstart

```bash
git clone https://github.com/brigalss-a/decision-passport-openclaw-lite.git
cd decision-passport-openclaw-lite
pnpm install --frozen-lockfile
pnpm demo
```

## Known limits

- Public preview. API surface may change before 1.0
- No HTML report export yet (coming in next release)
- No browser verifier in this repo (see `decision-passport-core`)
- No enterprise features (claims, guard, outcomes). Those live in the private repo.
- No npm publish yet
