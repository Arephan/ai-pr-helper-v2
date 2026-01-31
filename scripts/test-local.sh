#!/bin/bash
# Local testing script for AI Review Helper
# Run this to verify the tool works correctly

set -e

echo "🔍 AI Review Helper - Local Test"
echo "================================="
echo ""

cd "$(dirname "$0")/.."

# Build first
echo "📦 Building..."
npm run build

# Test 1: Complexity-only on test fixtures
echo ""
echo "📋 Test 1: Complexity Analysis (defensive-error-handling.tsx)"
echo "---"
cat tests/fixtures/defensive-error-handling.tsx | \
  git diff --no-index /dev/null - 2>/dev/null | \
  node dist/index.js - --no-summary --no-patterns --format text || true

# Test 2: React patterns detection
echo ""
echo "📋 Test 2: React Patterns Detection"
echo "---"
cat tests/fixtures/monolithic-component.tsx | \
  git diff --no-index /dev/null - 2>/dev/null | \
  node dist/index.js - --no-summary --format text || true

# Test 3: Friendly format output
echo ""
echo "📋 Test 3: Friendly Format (PR-ready)"
echo "---"
cat tests/fixtures/defensive-error-handling.tsx | \
  git diff --no-index /dev/null - 2>/dev/null | \
  node dist/index.js - --no-summary --format friendly || true

# Test 4: JSON output for CI
echo ""
echo "📋 Test 4: JSON Output (CI-ready)"
echo "---"
cat tests/fixtures/defensive-error-handling.tsx | \
  git diff --no-index /dev/null - 2>/dev/null | \
  node dist/index.js - --no-summary --no-patterns --format json | jq '.aiCodeLikelihood, .totalHunks, .files[0].overallComplexity' || true

echo ""
echo "✅ All tests completed!"
echo ""
echo "To test with Claude API:"
echo "  export ANTHROPIC_API_KEY=your-key"
echo "  npm run test:api"
