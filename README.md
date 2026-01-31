# 🔍 AI Review Helper

**Help humans review AI-generated code faster.**

> Every AI code review tool focuses on finding bugs. This one focuses on **comprehension** — making AI-generated code easier to understand.

## The Problem

Developers consistently report that reviewing AI-generated code takes **2-3x longer** than reviewing human code. Not because it's buggier, but because:

- Too verbose with unnecessary comments
- Over-engineered abstractions
- Non-standard patterns that feel "off"
- Hard to follow logic flow
- No context about intent

AI Review Helper addresses **verification debt**: when you don't write the code yourself, you have to rebuild understanding during review.

## Features

### 1. 🔍 "What Changed & Why" Summaries
For each code change, get a quick explanation:
- **WHAT:** What behavior actually changed
- **WHY:** The likely intent behind the change
- **WATCH:** Things the reviewer should verify

### 2. 🔮 AI Pattern Decoder
Detect and explain common "AI-isms" that make code harder to review:
- Over-defensive try-catch blocks
- Verbose comments that explain obvious syntax
- Unnecessary abstraction layers
- Naming inconsistencies
- Import bloat

### 3. 🌡️ Complexity Highlighter
Objective metrics to prioritize review attention:
- Nesting depth
- Cyclomatic complexity
- Parameter count
- Line count
- Dependency count

## Installation

```bash
npm install -g ai-review-helper
```

Or use with npx:
```bash
npx ai-review-helper
```

## Usage

### CLI

```bash
# Review staged changes
ai-review-helper

# Review a git range
ai-review-helper --git HEAD~3..HEAD

# Read from a diff file
ai-review-helper path/to/changes.diff

# Pipe from git
git diff main..feature | ai-review-helper -

# JSON output for CI
ai-review-helper --format json

# Skip AI analysis (complexity only)
ai-review-helper --no-summary --no-patterns
```

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `-g, --git <range>` | Git diff range to analyze | - |
| `-f, --format <type>` | Output: text, markdown, json | text |
| `--no-summary` | Skip "What Changed & Why" | false |
| `--no-patterns` | Skip AI pattern detection | false |
| `--no-complexity` | Skip complexity analysis | false |
| `-m, --max-hunks <n>` | Max hunks to analyze | 20 |
| `--model <name>` | Claude model | claude-sonnet-4-20250514 |
| `-q, --quiet` | Minimal output | false |
| `-v, --verbose` | Verbose output | false |

### Environment Variables

```bash
# Required for AI-powered analysis
export ANTHROPIC_API_KEY=your-key-here
```

## GitHub Action

Add to your workflow:

```yaml
name: AI Code Review
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: AI Review Helper
        uses: your-org/ai-review-helper@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          comment_on_pr: true
```

### Action Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `anthropic_api_key` | Anthropic API key | Yes | - |
| `model` | Claude model | No | claude-sonnet-4-20250514 |
| `max_hunks` | Max hunks to analyze | No | 20 |
| `skip_summary` | Skip summaries | No | false |
| `skip_patterns` | Skip patterns | No | false |
| `skip_complexity` | Skip complexity | No | false |
| `comment_on_pr` | Post PR comment | No | true |
| `fail_on_high_ai` | Fail if high AI likelihood | No | false |

### Action Outputs

| Output | Description |
|--------|-------------|
| `total_files` | Number of files analyzed |
| `total_hunks` | Number of hunks reviewed |
| `ai_likelihood` | AI code likelihood (low/medium/high) |
| `patterns_found` | Number of AI patterns detected |
| `analysis_markdown` | Full analysis as markdown |

## Example Output

```
═══════════════════════════════════════════════
  AI CODE REVIEW HELPER
═══════════════════════════════════════════════

OVERVIEW
  Files analyzed:    3
  Hunks reviewed:    7
  AI likelihood:     MEDIUM
  Processing time:   4.2s

▶ src/components/UserList.tsx
  Complexity: 6.2/10 (high)

  ┌─ Hunk 1 (lines 15-42)
  │ WHAT: Adds loading state and error handling to user data fetching
  │ WHY:  Provides UI feedback during async operations
  │ WATCH:
  │   • Empty dependency array means this runs once on mount only
  │   • Error state is set but check if it's displayed somewhere
  │
  │ AI PATTERNS:
  │   ▸ Over-Defensive Code
  │     Try-catch wraps code that TypeScript already protects
  │     → Consider: let the error bubble to error boundary
  │
  │ COMPLEXITY: 6.8/10
  │   ! Nesting: 4 (>3)
  │   ! Lines: 58 (>50)
  │ Suggestions:
  │   • Consider extracting fetch logic into custom hook
  │   • Break validation into separate function
  └────────────────────────────────────

═══════════════════════════════════════════════
```

## How It Works

1. **Parse** the git diff into individual hunks
2. **Analyze** each hunk using:
   - Static analysis for complexity metrics (fast, no API)
   - Claude API for summaries and pattern detection
3. **Format** results for your chosen output

The tool is optimized for **TypeScript/React** code but works with any JavaScript.

## Why This Exists

Based on research of 1000+ developer complaints about AI-generated code, the #1 issue isn't bugs — it's **comprehension time**.

Existing tools focus on:
- ❌ Finding bugs (that's what tests/linters are for)
- ❌ Suggesting fixes (we can't modify the code)
- ❌ Generic "code quality" scores

This tool focuses on:
- ✅ Explaining what changed and why
- ✅ Highlighting AI-specific patterns that slow reviewers
- ✅ Providing objective complexity metrics
- ✅ Asking the right questions for reviewers

## Limitations

- Best with TypeScript/JavaScript/React code
- Requires Anthropic API key for full analysis
- Complexity-only mode works without API
- Large PRs may hit API rate limits

## Development

```bash
# Clone
git clone https://github.com/your-org/ai-review-helper
cd ai-review-helper

# Install
npm install

# Build
npm run build

# Test
npm test

# Run locally
node dist/index.js --help
```

## License

MIT

## Related Research

This tool is based on the insight that **every AI code review tool focuses on correctness, but none focus on comprehension**. 

For the full research, see: [research/complaints-analysis.md](research/complaints-analysis.md)

---

**Made to help humans review faster, not to replace human judgment.**
