# AI Review Helper - Solutions Design

**Date:** January 31, 2026  
**Based on:** research/complaints-analysis.md (1000+ complaints analyzed)  
**Mission:** Reduce AI code review time by 50%+

---

## Design Principles

Before diving into solutions, these principles guide all decisions:

1. **Don't modify the code** - We're helping humans READ, not rewriting AI output
2. **Hunk-level, not file-level** - PR reviews happen at the diff level
3. **Speed over perfection** - Fast approximate explanations > slow detailed ones
4. **Integrate with existing workflow** - GitHub Actions/CLI, not new tools to learn
5. **React/TypeScript focus** - Optimize for front-end patterns (Han's use case)

---

## Solution 1: "What Changed & Why" Summaries

### Problem Addressed

**Pain Point #4: Comprehension Takes Too Long** (76% frequency)
> "It takes me 2-3x longer to unwind such crap than it would for me to write it from scratch." - HN

### How It Works

For each hunk in a PR diff, generate a 2-3 sentence summary answering:
1. **WHAT:** What behavior changed?
2. **WHY:** What's the likely intent?
3. **WATCH:** What should the reviewer verify?

**Technical Approach:**
```
Input: Git diff hunk + surrounding context (50 lines before/after)
Process: Claude API with specialized prompt
Output: Structured summary posted as inline PR comment
```

### Example: Before/After

**Before (raw diff - reviewer must parse):**
```diff
+ const [isLoading, setIsLoading] = useState(false);
+ const [error, setError] = useState<string | null>(null);
+ 
+ useEffect(() => {
+   const fetchData = async () => {
+     setIsLoading(true);
+     try {
+       const response = await api.get('/users');
+       setData(response.data);
+     } catch (e) {
+       setError(e.message);
+     } finally {
+       setIsLoading(false);
+     }
+   };
+   fetchData();
+ }, []);
```

**After (with ReviewHelper comment):**

> 🔍 **WHAT:** Adds loading state and error handling to user data fetching
> 
> 💡 **WHY:** Provides UI feedback during async operations
> 
> ⚠️ **WATCH:** 
> - Empty dependency array means this runs once on mount only
> - Error state is set but check if it's displayed somewhere
> - Consider: Should failed fetches retry automatically?

### Success Metric

**Target:** 40% reduction in "time to first understanding" of a hunk
**Measurement:** Time from opening PR to first substantive comment by reviewer
**Test:** A/B test on 20 MetalBear PRs with AI-generated React code

### Implementation Complexity

- **Effort:** Low (single Claude API call per hunk)
- **Risk:** Low (worst case is unhelpful comment)
- **Priority:** HIGH - Build first

---

## Solution 2: "Pattern Decoder" - Explain Non-Standard AI Idioms

### Problem Addressed

**Pain Point #8: Looks Right But Isn't** (64% frequency)
> "LLMs are extremely good at hiding the errors in the parts of the code that we are cognitively most inclined to overlook." - HN

**Pain Point #3: Inconsistent Formatting** (78% frequency)
> "Over-consistent formatting lacks the natural drift that comes from context switching, fatigue, or simply not caring about aesthetic perfection." - dev.to

### How It Works

Detect common "AI-isms" and decode them for reviewers:

**Detected Patterns:**
1. **Unnecessary abstraction layers** → "This class wrapper adds no value over a plain function"
2. **Defensive catch-alls** → "This try-catch catches everything but doesn't help debugging"
3. **Commented-but-obvious code** → "These comments explain syntax, not intent - could be removed"
4. **Magic numbers with comments** → "The comment explains what 86400 is, but not why it's 86400"
5. **Overcomplicated conditionals** → "This could be simplified to: `if (x) return y`"

**Technical Approach:**
```
Input: Individual code block flagged as potential AI pattern
Process: Pattern matching + Claude API for explanation
Output: Inline annotation explaining the idiom and suggesting simplification
```

### Example: Before/After

**Before (AI pattern that reviewers skim over):**
```typescript
/**
 * Validates if the user data is valid
 * @param userData - The user data object to validate
 * @returns boolean indicating if the user data is valid
 */
function validateUserData(userData: UserData): boolean {
  try {
    if (userData === null || userData === undefined) {
      return false;
    }
    if (typeof userData.email !== 'string') {
      return false;
    }
    return true;
  } catch (error) {
    console.error('An error occurred during validation:', error);
    return false;
  }
}
```

**After (with Pattern Decoder comment):**

> 🔮 **AI Pattern Detected: Over-Defensive Validation**
> 
> **Issues:**
> - JSDoc duplicates what TypeScript already tells you
> - Try-catch can't catch anything here (no throwable operations)
> - Null/undefined check is redundant if `userData` has a required type
> 
> **Simpler alternative:**
> ```typescript
> const isValidUser = (u: UserData) => typeof u?.email === 'string';
> ```
> 
> **Question for reviewer:** Is this level of validation actually needed, or is it AI being overly cautious?

### Success Metric

**Target:** Identify 70%+ of "AI-isms" that experienced developers would flag
**Measurement:** Compare to manual expert review of same code
**Test:** 10 files of known AI-generated code, measure precision/recall

### Implementation Complexity

- **Effort:** Medium (requires pattern detection + explanation generation)
- **Risk:** Medium (false positives could annoy developers)
- **Priority:** HIGH - Build second

---

## Solution 3: "Architecture Fit" Analysis

### Problem Addressed

**Pain Point #9: Missing Context & Architectural Ignorance** (61% frequency)
> "Not used project utils." - r/webdev
> "AI can't see that your architecture reflects power dynamics between product and engineering." - dev.to

### How It Works

Compare the AI-generated code against existing project patterns:

1. **Scan the codebase** for common patterns (naming, file structure, imports)
2. **Build a "style fingerprint"** of the project
3. **Compare new code** to fingerprint and flag deviations
4. **Generate explanation** of how to align with existing patterns

**Technical Approach:**
```
Input: New file/hunk + project context (sampled existing files)
Process: 
  1. Extract patterns from existing codebase (cached per repo)
  2. Compare new code patterns to baseline
  3. Generate deviation report with fix suggestions
Output: Comment suggesting architectural alignment
```

### Example: Before/After

**Context:** Project uses `src/services/` for API calls with `useQuery` hooks

**AI-generated code (doesn't fit pattern):**
```typescript
// src/components/UserList.tsx
function UserList() {
  const [users, setUsers] = useState([]);
  
  useEffect(() => {
    fetch('/api/users').then(r => r.json()).then(setUsers);
  }, []);
  
  return <ul>{users.map(u => <li key={u.id}>{u.name}</li>)}</ul>;
}
```

**After (with Architecture Fit comment):**

> 🏗️ **Architecture Note:**
> 
> This project has an established pattern for data fetching:
> - API calls go in `src/services/*.ts` 
> - Components use `useQuery` from `src/hooks/useQuery.ts`
> 
> **Example from codebase:**
> ```typescript
> // src/services/users.ts
> export const getUsers = () => api.get<User[]>('/users');
> 
> // src/components/UserList.tsx
> const { data: users } = useQuery('users', getUsers);
> ```
> 
> **Consider:** Should this follow the existing pattern?

### Success Metric

**Target:** Catch 80% of pattern deviations that would be flagged in human code review
**Measurement:** Track comments that match senior dev feedback
**Test:** Compare tool output to actual code review comments on past PRs

### Implementation Complexity

- **Effort:** High (requires codebase analysis and pattern extraction)
- **Risk:** Medium (pattern detection may miss nuance)
- **Priority:** MEDIUM - Build third

---

## Solution 4: "Complexity Highlighter" - Visual Cognitive Load Map

### Problem Addressed

**Pain Point #2: Over-Engineering** (82% frequency)
> "It would be so complex and have so many modules that I couldn't mentally keep track of what's going on." - r/vibecoding

**Pain Point #15: Monolithic Blobs** (45% frequency)
> "All AIs know how to write code but when you ask it to break it into components from the insanely long code files it creates, then the real problem begins." - r/vibecoding

### How It Works

Generate a "cognitive load score" for each function/component:

**Metrics:**
1. **Nesting Depth:** Deep conditionals/loops = harder to follow
2. **Cyclomatic Complexity:** More paths = more to understand
3. **Parameter Count:** >3 params = harder to remember what's what
4. **Line Count:** >50 lines = candidates for splitting
5. **Dependency Count:** Many imports = more context needed

**Technical Approach:**
```
Input: TypeScript AST analysis of functions/components
Process: Static analysis (no LLM needed for metrics)
Output: Complexity badge + "break apart" suggestions if above threshold
```

### Example: Before/After

**Before (no complexity indication):**
```typescript
function handleSubmit(formData, user, options, config, callbacks) {
  if (options.validate) {
    if (formData.email) {
      if (isValidEmail(formData.email)) {
        if (user.permissions.includes('submit')) {
          // ... 80 more lines
        }
      }
    }
  }
}
```

**After (with Complexity Highlighter):**

> 🌡️ **Cognitive Load: HIGH** (Score: 8.2/10)
> 
> | Metric | Value | Threshold |
> |--------|-------|-----------|
> | Nesting Depth | 4 | ⚠️ >3 |
> | Parameters | 5 | ⚠️ >3 |
> | Line Count | 87 | ⚠️ >50 |
> | Cyclomatic | 12 | ⚠️ >10 |
> 
> **Suggestion:** Consider extracting:
> - `validateFormData(formData)` - validation logic
> - `checkPermissions(user)` - permission checks
> - `submitForm(data)` - actual submission

### Success Metric

**Target:** 90% correlation between "high complexity" flags and reviewer-requested refactors
**Measurement:** Track if highlighted functions get refactor requests
**Test:** Analyze 50 past PRs, compare flags to actual review comments

### Implementation Complexity

- **Effort:** Low (AST parsing, no LLM needed)
- **Risk:** Low (objective metrics, hard to disagree with)
- **Priority:** MEDIUM - Build fourth

---

## Solution 5: "Test Gap Detector" - What's Not Actually Tested

### Problem Addressed

**Pain Point #13: Tests That Don't Actually Test** (49% frequency)
> "Claude rewrote the tests but they were fake; they looked like they were testing the same thing as before but they were pure performance art." - r/ClaudeAI

### How It Works

Analyze test files to identify:
1. **Assertion-free tests:** Tests that run but don't assert anything
2. **Mocked-everything tests:** Tests where all dependencies are mocked (testing nothing)
3. **Happy-path-only tests:** No edge cases or error paths tested
4. **Coverage lies:** Tests that execute code but don't verify behavior

**Technical Approach:**
```
Input: Test file + file being tested
Process: 
  1. AST analysis of test structure
  2. Map assertions to code paths
  3. Identify untested branches/conditions
  4. Claude analysis for semantic test quality
Output: Test coverage quality report with specific gaps
```

### Example: Before/After

**Before (test looks complete):**
```typescript
describe('UserService', () => {
  it('should fetch users', async () => {
    const mockApi = { get: jest.fn().mockResolvedValue({ data: [] }) };
    const service = new UserService(mockApi);
    await service.getUsers();
    expect(mockApi.get).toHaveBeenCalled();
  });
});
```

**After (with Test Gap Detector):**

> 🧪 **Test Quality: LOW** (2/10)
> 
> **Issues Found:**
> 1. ❌ **Asserts call, not result** - You verify `get` was called, but not what was returned
> 2. ❌ **Mocks the world** - `mockApi` makes this a test of mocking, not of `UserService`
> 3. ❌ **No error path** - What happens when `get` rejects?
> 4. ❌ **No data verification** - Empty array mock means no data handling tested
> 
> **Suggested additions:**
> ```typescript
> it('should return user data', async () => {
>   const users = [{ id: 1, name: 'Test' }];
>   mockApi.get.mockResolvedValue({ data: users });
>   const result = await service.getUsers();
>   expect(result).toEqual(users);  // Actually test the result!
> });
> 
> it('should handle API errors', async () => {
>   mockApi.get.mockRejectedValue(new Error('Network'));
>   await expect(service.getUsers()).rejects.toThrow('Network');
> });
> ```

### Success Metric

**Target:** Identify 80% of "fake tests" that a senior dev would flag
**Measurement:** Compare to expert review of test quality
**Test:** 20 AI-generated test files, measure precision/recall vs expert

### Implementation Complexity

- **Effort:** Medium-High (requires deep understanding of test semantics)
- **Risk:** High (test quality is subjective; may create noise)
- **Priority:** LOW - Build last (or skip for MVP)

---

## Technical Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      GitHub Action                          │
├─────────────────────────────────────────────────────────────┤
│  Trigger: PR opened/updated                                 │
│  Input: Diff hunks from PR                                  │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    AI Review Helper CLI                      │
├─────────────────────────────────────────────────────────────┤
│  1. Parse diff into hunks                                   │
│  2. Gather context (surrounding code, related files)        │
│  3. For each hunk:                                          │
│     - Run Solution 1: What Changed & Why                    │
│     - Run Solution 2: Pattern Decoder                       │
│     - Run Solution 3: Architecture Fit (if enabled)         │
│     - Run Solution 4: Complexity Highlighter                │
│  4. Format output                                           │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    Analysis Engines                          │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Claude API Integration                               │  │
│  │  - Specialized prompts per solution                   │  │
│  │  - Hunk-level context window                          │  │
│  │  - JSON structured output                             │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Static Analysis (TypeScript)                         │  │
│  │  - AST parsing for complexity                         │  │
│  │  - Pattern matching for AI-isms                       │  │
│  │  - No external API needed                             │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    Output Formatters                         │
├─────────────────────────────────────────────────────────────┤
│  - Markdown (for PR comments)                               │
│  - JSON (for CI/CD integration)                             │
│  - Plain text (for terminal)                                │
│  - GitHub suggestion syntax (for quick fixes)               │
└─────────────────────────────────────────────────────────────┘
```

### File Structure

```
ai-review-helper/
├── src/
│   ├── index.ts              # CLI entry point
│   ├── analyzer/
│   │   ├── summary.ts        # Solution 1: What Changed & Why
│   │   ├── patterns.ts       # Solution 2: Pattern Decoder
│   │   ├── architecture.ts   # Solution 3: Architecture Fit
│   │   └── complexity.ts     # Solution 4: Complexity Highlighter
│   ├── parsers/
│   │   ├── diff.ts           # Git diff parsing
│   │   ├── typescript.ts     # TS AST analysis
│   │   └── context.ts        # Code context extraction
│   ├── api/
│   │   └── claude.ts         # Claude API wrapper
│   ├── formatters/
│   │   ├── markdown.ts
│   │   ├── json.ts
│   │   └── text.ts
│   └── config/
│       └── prompts.ts        # Specialized prompts
├── action/
│   ├── action.yml            # GitHub Action definition
│   └── entrypoint.sh         # Action runner
├── tests/
│   └── fixtures/             # Sample AI-generated code for testing
├── package.json
├── tsconfig.json
├── README.md
└── TESTING.md
```

### Claude API Prompts (Drafts)

**Solution 1: What Changed & Why**
```
You are a senior code reviewer helping another developer understand AI-generated code.

Given this diff hunk and its surrounding context, provide a brief explanation:

DIFF:
{hunk}

CONTEXT (50 lines before/after):
{context}

Respond in JSON format:
{
  "what": "1-2 sentences describing what behavior changed",
  "why": "1-2 sentences on the likely intent/purpose",
  "watch": ["array of 1-3 things the reviewer should verify"]
}

Keep it concise. The reviewer is experienced but unfamiliar with this specific code.
```

**Solution 2: Pattern Decoder**
```
You are an expert at identifying AI-generated code patterns.

Analyze this code for common "AI-isms" that make code harder to review:

CODE:
{code}

Look for:
1. Unnecessary abstraction/wrapping
2. Defensive coding that adds no value
3. Comments that explain syntax instead of intent
4. Overcomplicated solutions to simple problems
5. Generic variable names mixed with overly verbose ones

If you find AI patterns, respond in JSON:
{
  "patterns_found": [
    {
      "type": "over-defensive",
      "lines": [5, 8],
      "issue": "Try-catch wraps code that can't throw",
      "simpler_alternative": "Remove try-catch, errors would be more visible"
    }
  ],
  "overall_ai_likelihood": "high|medium|low",
  "key_question": "A question the reviewer should ask themselves"
}

If the code looks normal, respond with { "patterns_found": [], "overall_ai_likelihood": "low" }
```

---

## Implementation Roadmap

### Week 1: Core Infrastructure (12 hours)

**Days 1-2:**
- [ ] Set up TypeScript project with proper config
- [ ] Implement diff parser (git diff → hunks)
- [ ] Implement context extractor (get surrounding lines)
- [ ] Basic Claude API wrapper with retry/error handling

**Days 3-4:**
- [ ] Implement Solution 1: What Changed & Why
- [ ] Write unit tests for diff parsing
- [ ] Test on 5 sample AI-generated diffs

### Week 2: Pattern Analysis (12 hours)

**Days 1-2:**
- [ ] Implement Solution 2: Pattern Decoder
- [ ] Build pattern detection rules (static + LLM)
- [ ] Test on known AI-generated files

**Days 3-4:**
- [ ] Implement Solution 4: Complexity Highlighter
- [ ] Integrate TypeScript AST parser
- [ ] Build complexity scoring algorithm

### Week 3: Integration & Polish (12 hours)

**Days 1-2:**
- [ ] Build CLI interface with options
- [ ] Implement output formatters (markdown, JSON, text)
- [ ] Add configuration file support

**Days 3-4:**
- [ ] Create GitHub Action wrapper
- [ ] Write comprehensive README
- [ ] Write TESTING.md with proof of effectiveness

---

## Testing Strategy

### Unit Tests
- Diff parsing (various diff formats)
- Context extraction (edge cases)
- Complexity calculation (known values)
- Pattern detection (known AI patterns)

### Integration Tests
- End-to-end on sample PRs
- Claude API mocking for CI
- GitHub Action simulation

### Validation Tests
- **20 MetalBear PRs:** Run tool, measure time savings
- **Expert comparison:** Compare tool output to senior dev reviews
- **Precision/Recall:** Track false positives/negatives

### Sample Test Files

Include in `tests/fixtures/`:
1. `over-engineered-class.ts` - Simple logic wrapped in class
2. `verbose-comments.ts` - Every line commented
3. `defensive-error-handling.tsx` - Try-catch everywhere
4. `inconsistent-naming.ts` - Mixed naming conventions
5. `monolithic-component.tsx` - 200+ line React component
6. `fake-tests.test.ts` - Tests that don't actually test

---

## Success Criteria

### MVP Success (Week 3)

- [ ] CLI works on any TypeScript/React PR
- [ ] Solutions 1, 2, and 4 implemented
- [ ] Output is useful on 60%+ of AI-generated hunks
- [ ] Runs in <30 seconds for typical PR
- [ ] GitHub Action works on public repo

### Full Success (Post-MVP)

- [ ] 50% reduction in time-to-understand for AI code
- [ ] <10% false positive rate on pattern detection
- [ ] Adopted by 2+ MetalBear team members
- [ ] Solution 3 (Architecture Fit) implemented

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Claude API rate limits | Medium | High | Implement batching, caching, retry logic |
| False positives annoy users | High | Medium | Conservative thresholds, ability to tune |
| Pattern detection too generic | Medium | Medium | Focus on specific AI-isms, not general style |
| Performance too slow | Low | High | Parallel processing, limit context size |
| Explanations are unhelpful | Medium | High | Iterate on prompts, collect feedback |

---

## Appendix: Prompt Engineering Notes

### What Makes AI Code Explanations Useful

Based on research, good explanations:
1. Are **specific** (not "this could be simplified" but "extract lines 5-10 into validateEmail()")
2. Include **concrete alternatives** (show code, not abstract suggestions)
3. Ask **reviewer questions** (engage critical thinking, don't just dictate)
4. Are **brief** (15-30 second read max)
5. Avoid **false confidence** (use "consider" and "might" not "should" and "must")

### Anti-Patterns in Explanations

Avoid generating explanations that:
- Repeat what the code already says (defeats the purpose)
- Are longer than the code being explained (overwhelming)
- Use jargon the reviewer may not know (creates more questions)
- Sound preachy or condescending (reviewers are professionals)

---

*Design document complete. Ready for Phase 3: EXECUTE*
