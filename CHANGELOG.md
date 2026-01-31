# Changelog

## [1.1.0] - 2026-01-31

### 🚀 Major Changes - AI-Only, Language Agnostic

**BREAKING CHANGES:**
- Removed all static analysis (React patterns, complexity scoring)
- `ANTHROPIC_API_KEY` now required (no longer optional)
- Removed options: `--no-summary`, `--no-patterns`, `--no-complexity`

**New Features:**
- ✅ **Language agnostic** - works with any programming language
- ✅ **Automatic language detection** - Claude detects the language automatically
- ✅ **Simpler codebase** - removed 3000+ lines of static analysis code
- ✅ **Better AI reviews** - Claude analyzes code quality, not just patterns

**Why the change:**
- Static analysis was React-specific, limiting usefulness
- AI review is more powerful and language-agnostic
- Simpler = easier to maintain and extend
- Let Claude do what it does best

**Migration:**
1. Add `ANTHROPIC_API_KEY` to your GitHub repo secrets
2. Update workflow to include the API key:
   ```yaml
   - uses: Arephan/reviewpal@v1
     with:
       anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
   ```

---

## [1.0.0] - 2026-01-31

- Initial release
- React-focused static analysis
- Optional AI summaries
- Complexity scoring
