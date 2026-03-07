# Publishing Guide

This document explains how to publish the `@obseqia/openpay` package to npm.

## ⚠️ Important: First Publication vs Future Publications

This workflow supports **both scenarios**:
1. **First publication**: Manual login + publish (creates the package on npm)
2. **Future publications**: Automated via Trusted Publishing with GitHub Actions + OIDC (after first publish)

---

## Scenario 1: First Publication (Manual, One-Time)

The `@obseqia/openpay` package must be created on npm first using traditional authentication. After that, Trusted Publishing can be configured.

### Prerequisites

- npm account with permission to publish to the `@obseqia` scope
- Local machine with `pnpm` and `npm` CLI installed
- `package.json` name is correctly set to `@obseqia/openpay` ✅

### Step 1: Verify Build Works Locally

```bash
pnpm install
pnpm lint
pnpm build
```

### Step 2: Login to npm (One-Time)

```bash
npm login
```

You'll be prompted for:
- Username: Your npm account username
- Password: Your npm account password  
- One-time password (OTP): From your 2FA authenticator (if 2FA is enabled)

### Step 3: Publish to npm

```bash
pnpm publish --access public --no-git-checks
```

This command:
- `--access public`: Makes the scoped package publicly available
- `--no-git-checks`: Skips git branch validation (useful in CI/automation)

**Success**: The package `@obseqia/openpay` is now on npm registry at:
https://www.npmjs.com/package/@obseqia/openpay

---

## Scenario 2: Automated Publishing with Trusted Publishing (After First Publication)

Once the package exists on npm, future publications can be automated using Trusted Publishing with OIDC.

### Step 1: Configure Trusted Publishing on npm

1. Go to: https://www.npmjs.com/package/@obseqia/openpay/settings/publishing
2. Under "Trusted Publisher" section, click "Add a new trusted publisher"
3. Select **GitHub Actions** as the provider
4. Configure:
   - **Organization or user**: `obseqia`
   - **Repository**: `openpay-node` (the GitHub repo name)
   - **Workflow filename**: `publish.yml` (just the filename, not the path)
   - **Environment name**: (leave empty)
5. Click "Create"

### Step 2: Workflow is Already Configured

The workflow at `.github/workflows/publish.yml` includes:
- `id-token: write` permission (required for OIDC)
- `pnpm publish --access public --no-git-checks` (with git checks disabled for CI)

No additional workflow changes needed.

### Step 3: Publishing Process

For each new version:

```bash
# 1. Update version in package.json
# Edit package.json: "version": "3.2.0"

# 2. Commit and push
git add package.json
git commit -m "chore: bump version to 3.2.0"
git push origin master

# 3. Create and push git tag
git tag v3.2.0
git push origin v3.2.0
```

**What happens automatically**:
1. GitHub Actions detects the tag push
2. Workflow triggers: `.github/workflows/publish.yml`
3. Checks out code, installs deps, lints, builds
4. GitHub generates short-lived OIDC token
5. pnpm detects OIDC and publishes to npm
6. OIDC token auto-expires (< 1 hour)

**Monitor the release**: Go to https://github.com/obseqia/openpay-node/actions

---

## Why Trusted Publishing is Better

| Aspect | Traditional Token | Trusted Publishing (OIDC) |
|--------|-----------------|--------------------------|
| **Storage** | GitHub Secrets | Not stored (generated on-demand) |
| **Lifespan** | Long-lived (7+ days) | Short-lived (< 1 hour) |
| **Rotation** | Manual | Automatic each run |
| **2FA Bypass** | Required | Not needed |
| **Security Risk** | High (if leaked) | Low (tokens self-destruct) |
| **Audit Trail** | Manual token tracking | Full GitHub Actions audit log |

---

## Troubleshooting

### Publishing fails with "package does not exist"

**Cause**: The package hasn't been created on npm yet.

**Solution**: Complete Scenario 1 (First Publication) first. After that, Trusted Publishing is available.

### Publishing fails with "401 Unauthorized"

**Cause**: Trusted Publishing not configured or misconfigured on npm.

**Solution**:
1. Verify setup at: https://www.npmjs.com/package/@obseqia/openpay/settings/publishing
2. Check that all fields match exactly (organization, repository name, workflow filename)
3. Ensure `id-token: write` is in the workflow

### Publishing fails with "Lint" or "Build" errors

**Cause**: Code quality issues or compilation errors.

**Solution**:
1. Run locally: `pnpm lint && pnpm build`
2. Fix any errors
3. Commit and push fixes to main branch
4. Create a new tag after fixes

### "detached HEAD" or git checks failures in workflow

**Cause**: When GitHub Actions checks out a tag, the repo is in detached HEAD state (not on a branch).

**Solution**: The workflow already includes `--no-git-checks` to handle this. If you see this error, verify the publish command has `--no-git-checks`.

### npm login not working

**Cause**: npm 2FA enabled or authentication issues.

**Solution**:
- For 2FA: Ensure you have a one-time password ready
- For tokens: You can use `npm token create` instead of `npm login`
- Check that you're logged in: `npm whoami`

---

## Related Commands

```bash
# Check if you're logged in
npm whoami

# View package details
npm view @obseqia/openpay

# List all published versions
npm view @obseqia/openpay versions

# Check current local version
grep '"version"' package.json
```

---

## References

- npm Publishing: https://docs.npmjs.com/cli/v11/commands/npm-publish
- Trusted Publishing: https://docs.npmjs.com/trusted-publishers
- pnpm publish: https://pnpm.io/cli/publish

