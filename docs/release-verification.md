# Release Verification

## What a release includes

Each tagged release (`v*`) produces:

| Artifact | Description |
| --- | --- |
| `passport-lite-report.html` | HTML verification report from the email demo |
| `passport-lite-summary.json` | JSON verification summary from the email demo |
| `checksums.txt` | SHA-256 checksums for demo artifact files |

---

## How to verify a release locally

### 1. Clone and build

```bash
git clone https://github.com/brigalss-a/decision-passport-openclaw-lite.git
cd decision-passport-openclaw-lite
git checkout v0.1.0   # or any release tag
pnpm install --frozen-lockfile
pnpm build
```

### 2. Run the test suite

```bash
pnpm test
```

All tests must pass.

### 3. Run the demo

```bash
pnpm demo
```

This runs the email demo, which creates a chain, verifies it, and writes artifacts to `artifacts/`.

### 4. Check demo artifacts exist

After running `pnpm demo`, the following files should be present:

- `artifacts/passport-lite-report.html`
- `artifacts/passport-lite-summary.json`

### 5. Verify checksums

```bash
pnpm checksums
```

Compare the output with the `checksums.txt` file from the GitHub Release. Note that demo artifacts contain timestamps, so checksums will differ between runs. The checksums in the release correspond to the artifacts generated during the CI release build.

---

## What successful verification proves

- The source code builds without errors
- All tests pass on your machine
- The chain engine creates and verifies bundles correctly
- The demo produces expected artifacts (HTML report and JSON summary)

## What verification does NOT prove

- It does not prove the release was created by a specific person (no code signing in public preview)
- It does not prove the release artifacts were not modified after creation (no provenance attestation yet)
- It does not prove the source code has no vulnerabilities
- It does not replace a security audit

---

## Artifact scope

Currently, only the email demo (`examples/email-with-passport-lite/`) generates artifacts. The browser and file-op demos produce console output but do not write files to `artifacts/`.
