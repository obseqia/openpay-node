# Publishing Guide

This document explains how to publish the `@obseqia/openpay-node` package to npm.

## Automated Publishing (Recommended)

The package is automatically published to npm when a semantic version tag is pushed to the repository.

### Prerequisites

1. **NPM Token Secret** - Must be configured in GitHub repository settings
   - Go to: Repository Settings → Secrets and variables → Actions
   - Create a new secret named `NPM_TOKEN`
   - Value: Your npm authentication token (see "Creating an NPM Token" below)

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
6. ✅ Publishes to npm: `pnpm publish --access public`

### Monitoring the Release

1. Go to: Repository → Actions tab
2. Look for the "Publish to npm" workflow
3. Click the workflow run to see detailed logs
4. Check npm registry: https://www.npmjs.com/package/@obseqia/openpay-node

## Manual Publishing (Not Recommended)

If for some reason you need to publish manually:

```bash
# 1. Ensure you're on the correct branch and commit
git checkout main
git pull origin main

# 2. Verify the build works
pnpm install
pnpm lint
pnpm build

# 3. Login to npm (one-time setup)
npm login

# 4. Publish
pnpm publish --access public

# 5. Create a git tag to match
git tag v3.2.0
git push origin v3.2.0
```

## Creating an NPM Token

### Steps:

1. Go to https://www.npmjs.com/settings/~/tokens
2. Click "Create New Token"
3. Select token type: **"Automation"** (recommended for CI/CD)
4. Copy the token (save it somewhere safe)

### Why "Automation" type?

- Works with GitHub Actions without two-factor authentication
- Higher security: no password needed
- Can be revoked independently
- Limited to publish operations (if you set the scope)

## Troubleshooting

### Publishing fails with "404 Not Found"

- **Cause**: The package name `@obseqia/openpay-node` might not exist on npm
- **Solution**: Contact npm support or create the package first with `npm publish`

### Publishing fails with "401 Unauthorized"

- **Cause**: `NPM_TOKEN` secret is missing, wrong, or expired
- **Solution**:
  1. Create a new token on npmjs.com
  2. Update the `NPM_TOKEN` secret in GitHub Settings
  3. Try publishing again

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
