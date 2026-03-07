# Publishing Guide

This document explains how to publish the `@obseqia/openpay-node` package to npm.

## Quick Setup

**To enable automated publishing with Trusted Publishing:**

1. Navigate to: https://www.npmjs.com/package/@obseqia/openpay-node/settings/publishing
2. Click "Add a new trusted publisher"
3. Select "GitHub Actions"
4. Fill in:
   - Organization: `obseqia`
   - Repository: `openpay-node`
   - Workflow filename: `publish.yml`
5. Click "Create"

That's it! No tokens needed.

## Automated Publishing (Recommended)

The package is automatically published to npm when a semantic version tag is pushed to the repository using **Trusted Publishing** with OIDC (OpenID Connect).

This approach is more secure than using long-lived API tokens because:
- ✅ No token storage needed in GitHub Secrets
- ✅ Each publish uses short-lived, cryptographically-signed tokens
- ✅ Tokens cannot be extracted or reused
- ✅ Automatic revocation after the workflow completes
- ✅ No 7-day token expiration concerns

### Prerequisites

1. **Trusted Publishing Configured on npm** - Must be set up in the @obseqia organization
   - Go to: https://www.npmjs.com/org/obseqia/settings/publishing
   - Add GitHub as a trusted publisher
   - Specify the repository: `obseqia/openpay-node`
   - See detailed steps in "Configuring Trusted Publishing" section below

2. **Version in `package.json`** - Must match the git tag being created
   - Example: If pushing tag `v3.1.0`, ensure `package.json` version is `3.1.0`

### Publishing a New Version

```bash
# 1. Update version in package.json (if not already done)
# Edit package.json and change the version field
# Example: "version": "3.2.0"

# 2. Create and push the git tag
git tag v3.2.0
git push origin v3.2.0
```

### What Happens Automatically

When a tag matching the pattern `v*.*.*` is pushed:

1. ✅ GitHub Actions triggers the `publish` workflow
2. ✅ Checks out the code at that tag
3. ✅ Installs dependencies with `pnpm install`
4. ✅ Runs linter: `pnpm lint`
5. ✅ Builds the package: `pnpm build` (generates `dist/`)
6. ✅ Generates OIDC token via GitHub's OIDC provider
7. ✅ Publishes to npm: `pnpm publish --access public`
8. ✅ OIDC token automatically expires (no manual revocation needed)

### Monitoring the Release

1. Go to: Repository → Actions tab
2. Look for the "Publish to npm" workflow
3. Click the workflow run to see detailed logs
4. Check npm registry: https://www.npmjs.com/package/@obseqia/openpay-node

## Manual Publishing (Not Recommended)

If for some reason you need to publish manually, you have two options:

### Option A: Using Trusted Publishing Locally (Requires OIDC Setup)

```bash
# 1. Ensure you're on the correct branch and commit
git checkout main
git pull origin main

# 2. Verify the build works
pnpm install
pnpm lint
pnpm build

# 3. Configure npm trust (one-time)
npm trust github @obseqia/openpay-node --repo obseqia/openpay-node -y

# 4. Publish
pnpm publish --access public

# 5. Create a git tag to match
git tag v3.2.0
git push origin v3.2.0
```

### Option B: Using a Temporary Token (Not Recommended)

If you absolutely need a temporary token:

1. Go to https://www.npmjs.com/org/obseqia/settings/tokens
2. Create a token with **"Publish"** permissions
3. Keep token lifespan as short as possible (7 days minimum)
4. Delete the token immediately after publishing

```bash
# 1. Set token as environment variable
export NPM_TOKEN="npm_your_temporary_token_here"

# 2. Publish (token will be used automatically)
pnpm publish --access public

# 3. Go back to npm.js and revoke the token
```

## Configuring Trusted Publishing

Trusted Publishing uses OpenID Connect (OIDC) to securely authenticate GitHub Actions with npm without storing long-lived tokens.

### Step 1: Enable Trusted Publishing on npm

1. Go to: https://www.npmjs.com/package/@obseqia/openpay-node/settings/publishing
   (Or navigate: npmjs.com → Packages → @obseqia/openpay-node → Settings → Publishing)
2. Under "Trusted Publisher" section, click "Add a new trusted publisher"
3. Select **GitHub Actions** as the provider
4. Configure the following fields:
   - **Organization or user:** `obseqia`
   - **Repository:** `openpay-node`
   - **Workflow filename:** `publish.yml` (just the filename, not the full path)
   - **Environment name:** (leave empty unless using GitHub Environments)
5. Click "Create"

### Step 2: Verify Workflow Permissions

The workflow already includes the required permissions:

```yaml
permissions:
  contents: read
  id-token: write  # Required for OIDC tokens
```

These permissions are automatically granted by GitHub Actions during the workflow run.

### Why Trusted Publishing is Better

| Aspect | Traditional Token | Trusted Publishing |
|--------|-----------------|-------------------|
| Token Lifespan | Long-lived (7 days minimum) | Short-lived (< 1 hour) |
| Storage | GitHub Secrets | Not stored (OIDC) |
| Rotation | Manual or automated | Automatic each run |
| Exposure Risk | Can leak in logs | Cryptographically signed |
| Two-Factor Auth | Required bypass | Not needed |
| Security Risk | High (if compromised) | Low (tokens self-destruct) |

## Troubleshooting

### Publishing fails with "404 Not Found"

- **Cause**: The package name `@obseqia/openpay-node` might not exist on npm
- **Solution**: Contact npm support or create the package first with `npm publish`

### Publishing fails with "401 Unauthorized"

- **Cause**: Trusted Publishing not configured or misconfigured
- **Solution**:
  1. Verify Trusted Publisher is configured: https://www.npmjs.com/org/obseqia/settings/publishing
  2. Check that:
     - Repository is set to: `obseqia/openpay-node`
     - Provider is: GitHub Actions
  3. Ensure workflow has `id-token: write` permission (already configured)
  4. Try publishing again from the correct repository and tag pattern

### Publishing fails with "Lint" or "Build" errors

- **Cause**: Code quality issues or compilation errors
- **Solution**:
  1. Run `pnpm lint` and `pnpm build` locally
  2. Fix any errors
  3. Commit and push the fixes to `main`
  4. Then create the new tag

### Tag was already published, need to re-release

- **Option 1** (Recommended): Fix the issue, increment version, and create a new tag
  ```bash
  git tag v3.2.1
  git push origin v3.2.1
  ```

- **Option 2**: Delete tag locally and on GitHub, then re-push
  ```bash
  git tag -d v3.2.0
  git push origin :refs/tags/v3.2.0
  git tag v3.2.0
  git push origin v3.2.0
  ```

## Workflow File

The automation workflow is defined in: `.github/workflows/publish.yml`

Key configuration:
- **Trigger**: Push events with tags matching `v*.*.*`
- **Node version**: 24
- **Package manager**: pnpm 10
- **Registry**: https://registry.npmjs.org
- **Access level**: public

## Related Commands

```bash
# Check current version
npm view @obseqia/openpay-node version

# List all published versions
npm view @obseqia/openpay-node versions

# View package details
npm info @obseqia/openpay-node
```
