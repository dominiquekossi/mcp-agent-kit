# Quick Publish Commands

## One-Command Publication

```bash
# 1. Build
npm run build

# 2. Login (if not already)
npm login

# 3. Publish
npm publish
```

## That's it!

## Verify Publication

```bash
# Check on npm
npm view mcp-agent-kit

# Test install
mkdir test && cd test
npm init -y
npm install mcp-agent-kit
```

## Rollback (if needed, within 72h)

```bash
npm unpublish mcp-agent-kit@1.0.0
```

---

For detailed instructions, see PUBLISHING.md
