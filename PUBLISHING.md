# Publishing Guide - mcp-agent-kit

## Pre-Publication Checklist

### 1. Code Quality

- [x] All TypeScript files compile without errors
- [x] No linting errors
- [x] All providers implemented (OpenAI, Anthropic, Gemini, Ollama)
- [x] All modules working (Agent, Router, Chatbot, MCP Server, API)
- [x] Documentation complete

### 2. Package Configuration

- [x] package.json updated with correct version
- [x] package.json has all required fields
- [x] .npmignore configured correctly
- [x] README.md complete and professional
- [x] CHANGELOG.md created
- [x] LICENSE file present

### 3. Testing

- [x] Code compiles successfully
- [ ] Manual testing with real API keys (recommended)
- [ ] All examples tested
- [ ] MCP Server tested with client

### 4. Documentation

- [x] README.md (no emojis, professional)
- [x] CHANGELOG.md
- [x] TROUBLESHOOTING.md
- [x] EXTENDING.md
- [x] Examples in /examples directory

## Publishing Steps

### Step 1: Final Build

```bash
# Clean and build
npm run build:clean

# Verify build output
ls dist/
```

### Step 2: Version Check

Update version in `package.json` if needed:

```json
{
  "version": "1.0.0" // or "1.0.1", "1.1.0", etc.
}
```

### Step 3: Test Package Locally

```bash
# Test the package locally
npm pack

# This creates mcp-agent-kit-1.0.0.tgz
# You can test it in another project:
# npm install /path/to/mcp-agent-kit-1.0.0.tgz
```

### Step 4: Login to npm

```bash
npm login
```

Enter your npm credentials:

- Username
- Password
- Email
- 2FA code (if enabled)

### Step 5: Publish

```bash
# Dry run first (see what will be published)
npm publish --dry-run

# If everything looks good, publish
npm publish
```

### Step 6: Verify Publication

```bash
# Check on npm
npm view mcp-agent-kit

# Install in a test project
mkdir test-install
cd test-install
npm init -y
npm install mcp-agent-kit
```

### Step 7: Create GitHub Release

1. Go to: https://github.com/dominiquekossi/mcp-agent-kit/releases
2. Click "Create a new release"
3. Tag: `v1.0.0`
4. Title: `v1.0.0 - Initial Release`
5. Description: Copy from CHANGELOG.md
6. Publish release

## Post-Publication

### 1. Update Documentation

- [ ] Add npm badge to README
- [ ] Update installation instructions
- [ ] Add link to npm package

### 2. Announce

- [ ] Twitter/X
- [ ] Reddit (r/typescript, r/node, r/programming)
- [ ] Dev.to article
- [ ] Hacker News (Show HN)
- [ ] LinkedIn

### 3. Monitor

- [ ] Watch for issues on GitHub
- [ ] Respond to questions
- [ ] Monitor npm downloads

## Version Management

### Semantic Versioning

- **MAJOR** (1.0.0 → 2.0.0): Breaking changes
- **MINOR** (1.0.0 → 1.1.0): New features, backwards compatible
- **PATCH** (1.0.0 → 1.0.1): Bug fixes

### Updating Version

```bash
# Patch (1.0.0 → 1.0.1)
npm version patch

# Minor (1.0.0 → 1.1.0)
npm version minor

# Major (1.0.0 → 2.0.0)
npm version major
```

## Troubleshooting

### Error: "You do not have permission to publish"

Solution: Make sure you're logged in and the package name is available.

```bash
npm login
npm search mcp-agent-kit  # Check if name is taken
```

### Error: "Package name too similar to existing package"

Solution: Choose a different name or contact npm support.

### Error: "Version already exists"

Solution: Increment the version number.

```bash
npm version patch
npm publish
```

## Unpublishing (Emergency Only)

```bash
# Unpublish specific version (within 72 hours)
npm unpublish mcp-agent-kit@1.0.0

# Unpublish entire package (within 72 hours)
npm unpublish mcp-agent-kit --force
```

**Warning**: Unpublishing is permanent and should only be done in emergencies.

## Maintenance

### Regular Updates

1. Update dependencies monthly
2. Fix reported bugs promptly
3. Add requested features
4. Keep documentation current

### Security

1. Monitor security advisories
2. Update vulnerable dependencies
3. Respond to security reports quickly

## Support

For publishing issues:

- npm support: https://www.npmjs.com/support
- GitHub issues: https://github.com/dominiquekossi/mcp-agent-kit/issues

---

Last updated: 2024-01-XX
