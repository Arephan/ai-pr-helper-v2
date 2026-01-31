# Enhancement Requirements Update

**Date:** Jan 31, 2026 8:39 AM
**From:** Han Kim

---

## CRITICAL UPDATE: Scope Change

**Original scope:** React/TypeScript focus (MetalBear use case)

**NEW SCOPE:** ALL CODE LANGUAGES

The tool should work for:
- ✅ React/TypeScript (still primary)
- ✅ Python
- ✅ Go
- ✅ Rust
- ✅ Any language AI generates

**Why:** MetalBear works across multiple languages. Tool needs to be useful for backend code reviews too, not just front-end.

---

## Updated Requirements

### Pattern Detection
**Before:** React hooks, useEffect deps, component patterns
**After:** 
- Language-agnostic patterns (nesting, complexity, verbosity)
- Language-specific patterns when detected (React hooks, Python list comprehensions, Go error handling, etc.)
- Auto-detect language from file extension

### ASCII Diagrams
**Before:** Component hierarchies, React state flow
**After:**
- Function call graphs (any language)
- Data flow diagrams (any language)
- Control flow visualization (any language)
- Language-specific when helpful (React component trees, Python class hierarchies, etc.)

### Examples in Comments
**Before:** Always show TypeScript/React examples
**After:**
- Show examples in the SAME LANGUAGE as the code being reviewed
- If reviewing Python, suggest Python refactors
- If reviewing Go, suggest Go idioms

---

## Implementation Strategy

### Language Detection
```typescript
function detectLanguage(filepath: string): Language {
  const ext = path.extname(filepath);
  // .ts/.tsx → TypeScript
  // .py → Python
  // .go → Go
  // .rs → Rust
  // etc.
}
```

### Universal Patterns (all languages)
1. Excessive nesting (>3 levels)
2. Long functions (>50 lines)
3. High cyclomatic complexity
4. Too many parameters (>3)
5. Obvious comments
6. Defensive over-engineering
7. Dead code / unused imports

### Language-Specific Enhancements
**Only when language is detected:**
- React: Hook dependencies, re-render issues
- Python: List comprehension overuse, exception handling
- Go: Error handling patterns, defer usage
- Rust: Ownership issues, lifetime complexity

---

## Priority

1. **FIRST:** Make universal patterns work for all languages
2. **SECOND:** Add React-specific enhancements (still primary use case)
3. **THIRD:** Add other language-specific patterns as time permits

---

## Testing

Must test on:
- ✅ TypeScript/React code
- ✅ Python code (from Agent Chain project)
- ✅ At least one other language (Go or Rust if available)

---

**Bottom line:** Tool should be useful for ANY AI-generated code, not just React.
