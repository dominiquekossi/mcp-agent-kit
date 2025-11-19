#!/bin/bash

# Script to initialize v1.1.0 development branch
# This script should be run from the repository root

echo "🚀 Initializing v1.1.0 Development Branch"
echo "=========================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run from repository root."
    exit 1
fi

# Ensure we're on main and up to date
echo "📥 Fetching latest changes from main..."
git checkout main
git pull origin main

# Create new development branch
echo "🌿 Creating feat/v1.1.0 branch..."
git checkout -b feat/v1.1.0

# Update version in package.json
echo "📦 Updating version to 1.1.0-dev..."
npm version 1.1.0-dev --no-git-tag-version

# Create directory structure for new features
echo "📁 Creating directory structure..."
mkdir -p src/agent/smart-tool-calling
mkdir -p src/tracking
mkdir -p src/testing
mkdir -p tests/smart-tool-calling
mkdir -p tests/tracking
mkdir -p tests/testing

# Copy documentation files
echo "📝 Organizing documentation..."
mkdir -p docs
mv IMPROVEMENT_STRATEGY.md docs/ 2>/dev/null || true
mv FEATURE_PROPOSAL_*.md docs/ 2>/dev/null || true
mv NEXT_STEPS.md docs/ 2>/dev/null || true
mv COMPETITIVE_ANALYSIS.md docs/ 2>/dev/null || true
mv PACKAGE_VERIFICATION_REPORT.md docs/ 2>/dev/null || true

# Create CHANGELOG entry
echo "📋 Creating CHANGELOG entry..."
cat > CHANGELOG.md << 'EOF'
# Changelog

All notable changes to this project will be documented in this file.

## [1.1.0-dev] - In Development

### Added
- Smart Tool Calling with retry and fallback
- Cost Tracking and Budget Management
- Enhanced Logging and Debugging
- Testing Utilities (mocks and helpers)

### Changed
- Improved error messages
- Better TypeScript types

### Fixed
- TBD

## [1.0.0] - Initial Release

### Added
- Basic agent creation
- MCP server support
- Chatbot with memory
- LLM router
- API helpers
EOF

# Commit initial setup
echo "💾 Committing initial setup..."
git add .
git commit -m "chore: initialize v1.1.0 development branch

- Update version to 1.1.0-dev
- Create directory structure for new features
- Organize documentation
- Add CHANGELOG.md"

# Push to remote
echo "📤 Pushing to remote..."
git push -u origin feat/v1.1.0

echo ""
echo "✅ v1.1.0 development branch initialized successfully!"
echo ""
echo "Next steps:"
echo "1. Review docs/ROADMAP_v1.1.0.md"
echo "2. Create feature branches from feat/v1.1.0"
echo "3. Start implementing features"
echo ""
echo "Happy coding! 🎉"
