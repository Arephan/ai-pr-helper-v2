"use strict";
/**
 * React-Specific Pattern Analyzer
 *
 * Detects common React issues and AI-generated patterns
 * without needing an API call.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeReactPatterns = analyzeReactPatterns;
exports.generateComponentDiagram = generateComponentDiagram;
/**
 * Analyze React code for patterns and issues
 */
function analyzeReactPatterns(code, filename) {
    const patterns = [];
    const lines = code.split('\n');
    // Detect component type
    const componentType = detectComponentType(code);
    // Extract hooks used
    const hooks = extractHooks(code);
    // Count state and effects
    const stateCount = (code.match(/useState\s*[<(]/g) || []).length;
    const effectCount = (code.match(/useEffect\s*\(/g) || []).length;
    // Check for error boundary
    const hasErrorBoundary = /ErrorBoundary|componentDidCatch/.test(code);
    // Pattern detection
    patterns.push(...detectNestedTryCatch(code, lines));
    patterns.push(...detectUseEffectIssues(code, lines));
    patterns.push(...detectStateIssues(code, lines, stateCount));
    patterns.push(...detectMemoIssues(code, lines));
    patterns.push(...detectCallbackIssues(code, lines));
    patterns.push(...detectOverDefensiveCode(code, lines));
    patterns.push(...detectVerboseComments(code, lines));
    patterns.push(...detectAIPatterns(code, lines));
    return {
        patterns,
        componentType,
        hooks,
        stateCount,
        effectCount,
        hasErrorBoundary
    };
}
function detectComponentType(code) {
    if (/extends\s+(React\.)?Component/.test(code))
        return 'class';
    if (/function\s+\w+.*?{|const\s+\w+\s*=\s*\(/.test(code))
        return 'functional';
    return 'unknown';
}
function extractHooks(code) {
    const hookPattern = /\b(use[A-Z]\w*)\s*[(<]/g;
    const hooks = [];
    let match;
    while ((match = hookPattern.exec(code)) !== null) {
        if (!hooks.includes(match[1])) {
            hooks.push(match[1]);
        }
    }
    return hooks;
}
function detectNestedTryCatch(code, lines) {
    const patterns = [];
    // Count try-catch blocks
    const tryCount = (code.match(/\btry\s*{/g) || []).length;
    const catchCount = (code.match(/\bcatch\s*\(/g) || []).length;
    if (tryCount > 3) {
        patterns.push({
            type: 'excessive-try-catch',
            severity: 'warning',
            message: `${tryCount} try-catch blocks detected. AI tends to over-wrap code in error handlers.`,
            suggestion: 'Use a single try-catch at the operation boundary. Let React error boundaries handle render errors.',
            codeExample: `// Instead of wrapping every line:
try {
  const response = await fetch(url);
  const data = await response.json();
  setState(data);
} catch (error) {
  handleError(error);
}`
        });
    }
    // Check for try-catch around setState (React never throws)
    if (/try\s*{\s*set[A-Z]\w*\([^)]+\)/.test(code)) {
        patterns.push({
            type: 'unnecessary-try-catch',
            severity: 'info',
            message: 'try-catch around setState is unnecessary - React setState never throws.',
            suggestion: 'Remove the try-catch wrapper around setState calls.'
        });
    }
    // Check for try-catch around JSX return
    if (/try\s*{\s*return\s*[<(]/.test(code)) {
        patterns.push({
            type: 'unnecessary-try-catch',
            severity: 'warning',
            message: 'try-catch around JSX return is unnecessary. Use Error Boundaries instead.',
            suggestion: 'Wrap components with an ErrorBoundary rather than try-catch.'
        });
    }
    return patterns;
}
function detectUseEffectIssues(code, lines) {
    const patterns = [];
    // Empty dependency array with state references inside
    const emptyDepsMatch = code.match(/useEffect\s*\(\s*\(\)\s*=>\s*{[\s\S]*?},\s*\[\s*\]\s*\)/g);
    if (emptyDepsMatch) {
        for (const match of emptyDepsMatch) {
            // Check if the effect body references state or props
            const hasStateRef = /set[A-Z]\w*\(|props\.|state\./.test(match);
            const hasDataFetch = /fetch\(|axios\.|\.get\(/.test(match);
            if (hasStateRef && !hasDataFetch) {
                patterns.push({
                    type: 'useEffect-deps',
                    severity: 'info',
                    message: 'Empty dependency array [] but effect references state/props. This runs once on mount only.',
                    suggestion: 'If you need to react to state changes, add dependencies to the array.'
                });
            }
        }
    }
    // Missing cleanup for subscriptions/timers
    const effectsWithInterval = code.match(/useEffect\s*\([^)]*setInterval|useEffect\s*\([^)]*addEventListener/g);
    const hasCleanup = code.includes('clearInterval') || code.includes('removeEventListener');
    if (effectsWithInterval && !hasCleanup) {
        patterns.push({
            type: 'useEffect-cleanup',
            severity: 'warning',
            message: 'Found setInterval/addEventListener without cleanup. This can cause memory leaks.',
            suggestion: 'Return a cleanup function from useEffect.',
            codeExample: `useEffect(() => {
  const id = setInterval(callback, 1000);
  return () => clearInterval(id); // Cleanup!
}, []);`
        });
    }
    // Too many useEffect hooks
    const effectCount = (code.match(/useEffect\s*\(/g) || []).length;
    if (effectCount > 4) {
        patterns.push({
            type: 'too-many-effects',
            severity: 'info',
            message: `${effectCount} useEffect hooks in one component. Consider if some could be combined or moved to custom hooks.`,
            suggestion: 'Group related effects or extract to custom hooks for reusability.'
        });
    }
    return patterns;
}
function detectStateIssues(code, lines, stateCount) {
    const patterns = [];
    // Too many useState hooks
    if (stateCount > 5) {
        patterns.push({
            type: 'too-many-states',
            severity: 'info',
            message: `${stateCount} useState hooks. Consider using useReducer or grouping related state.`,
            suggestion: 'Related states can be combined: `useState({ user, loading, error })`'
        });
    }
    // Boolean state patterns
    const booleanStates = code.match(/useState\s*<boolean>\s*\(|useState\s*\(\s*(true|false)\s*\)/g);
    if (booleanStates && booleanStates.length > 3) {
        patterns.push({
            type: 'boolean-state-overload',
            severity: 'info',
            message: `${booleanStates.length} boolean states. Consider a single status state instead.`,
            suggestion: `Instead of \`loading, saving, error\`, use \`status: 'idle' | 'loading' | 'saving' | 'error'\``
        });
    }
    // Derived state that should be computed
    const derivedStatePattern = /const\s*\[\s*(\w+),\s*set\w+\s*\]\s*=\s*useState.*?;\s*\n.*?useEffect/;
    if (derivedStatePattern.test(code)) {
        patterns.push({
            type: 'derived-state',
            severity: 'warning',
            message: 'State that\'s immediately updated in useEffect is likely derived state.',
            suggestion: 'Use useMemo instead of useState + useEffect for derived values.'
        });
    }
    return patterns;
}
function detectMemoIssues(code, lines) {
    const patterns = [];
    // useMemo with simple calculation
    const simpleMemo = /useMemo\s*\(\s*\(\)\s*=>\s*[^,]{1,30},/g;
    const memoMatches = code.match(simpleMemo);
    if (memoMatches && memoMatches.length > 2) {
        patterns.push({
            type: 'unnecessary-memo',
            severity: 'info',
            message: 'Multiple simple useMemo calls. Memoization has overhead - only use for expensive computations.',
            suggestion: 'Simple operations like string concatenation don\'t need useMemo.'
        });
    }
    // React.memo with inline objects
    if (/memo\s*\(/.test(code) && /style\s*=\s*{{\s*/.test(code)) {
        patterns.push({
            type: 'memo-inline-object',
            severity: 'warning',
            message: 'Component uses memo but has inline style objects. These create new objects every render.',
            suggestion: 'Move inline styles to a constant outside the component, or use useMemo.'
        });
    }
    return patterns;
}
function detectCallbackIssues(code, lines) {
    const patterns = [];
    // useCallback without dependencies
    if (/useCallback\s*\([^)]+,\s*\[\s*\]\s*\)/.test(code)) {
        patterns.push({
            type: 'useCallback-empty-deps',
            severity: 'info',
            message: 'useCallback with empty deps [] captures initial values only.',
            suggestion: 'Ensure the callback doesn\'t need access to changing state or props.'
        });
    }
    // Inline arrow functions in JSX for components that use memo
    if (/memo\s*\(/.test(code) && /onClick\s*=\s*{\s*\(\)\s*=>/.test(code)) {
        patterns.push({
            type: 'inline-handler-memo',
            severity: 'info',
            message: 'Inline arrow functions break memoization. Each render creates a new function.',
            suggestion: 'Use useCallback for event handlers when the parent is memoized.'
        });
    }
    return patterns;
}
function detectOverDefensiveCode(code, lines) {
    const patterns = [];
    // TypeScript null checks on typed values
    const tsNullChecks = code.match(/===?\s*(null|undefined)\s*\|\||(\?\?|&&)\s*null|typeof\s+\w+\s*[!=]==?\s*['"]string['"]/g);
    if (tsNullChecks && tsNullChecks.length > 5) {
        patterns.push({
            type: 'excessive-null-checks',
            severity: 'info',
            message: `${tsNullChecks.length}+ null/undefined checks. TypeScript already provides type safety.`,
            suggestion: 'Trust your types. If a value is typed non-null, you don\'t need to check.'
        });
    }
    // Optional chaining overuse
    const optionalChains = (code.match(/\?\./g) || []).length;
    if (optionalChains > 15) {
        patterns.push({
            type: 'optional-chaining-overuse',
            severity: 'info',
            message: `${optionalChains} optional chaining operators. Consider if all are necessary.`,
            suggestion: 'If your types guarantee a value exists, you don\'t need ?. everywhere.'
        });
    }
    return patterns;
}
function detectVerboseComments(code, lines) {
    const patterns = [];
    // Comments that just describe syntax
    const syntaxComments = [
        /\/\/\s*Import\s+.*/i,
        /\/\/\s*Define\s+(the\s+)?component/i,
        /\/\/\s*Set\s+state/i,
        /\/\/\s*Return\s+(JSX|component)/i,
        /\/\/\s*Export\s+(the\s+)?component/i,
        /\/\/\s*Create\s+(a\s+)?function/i,
        /\/\/\s*Loop\s+through/i,
        /\/\/\s*Check\s+if/i
    ];
    let verboseCount = 0;
    for (const pattern of syntaxComments) {
        if (pattern.test(code))
            verboseCount++;
    }
    if (verboseCount > 2) {
        patterns.push({
            type: 'verbose-comments',
            severity: 'info',
            message: 'Comments describe obvious code rather than explaining intent.',
            suggestion: 'Good comments explain WHY, not WHAT. The code itself shows what it does.'
        });
    }
    return patterns;
}
function detectAIPatterns(code, lines) {
    const patterns = [];
    // Very long variable names (AI tends to be overly descriptive)
    const longNames = code.match(/\b\w{25,}\b/g);
    if (longNames && longNames.length > 2) {
        patterns.push({
            type: 'long-names',
            severity: 'info',
            message: 'Very long variable names like "userProfileDataLoadingState" can hurt readability.',
            suggestion: 'Shorter context-appropriate names are fine: "isLoading" vs "userDataIsCurrentlyLoading"'
        });
    }
    // Inconsistent naming (mixing camelCase, snake_case, etc.)
    const hasCamel = /\b[a-z]+[A-Z][a-z]+\b/.test(code);
    const hasSnake = /\b[a-z]+_[a-z]+\b/.test(code);
    const hasPascal = /\b[A-Z][a-z]+[A-Z][a-z]+\b/.test(code);
    const styles = [hasCamel, hasSnake, hasPascal].filter(Boolean).length;
    if (styles > 1) {
        patterns.push({
            type: 'inconsistent-naming',
            severity: 'info',
            message: 'Mixed naming conventions detected (camelCase and snake_case).',
            suggestion: 'Stick to camelCase for JavaScript/TypeScript variables.'
        });
    }
    // Excessive console.log/error (often left by AI)
    const consoleCount = (code.match(/console\.(log|error|warn)/g) || []).length;
    if (consoleCount > 5) {
        patterns.push({
            type: 'excessive-console',
            severity: 'warning',
            message: `${consoleCount} console statements. AI often leaves debug logging.`,
            suggestion: 'Remove or replace with proper error handling/logging service.'
        });
    }
    return patterns;
}
/**
 * Generate ASCII diagram for component structure
 */
function generateComponentDiagram(code) {
    const components = [];
    // Find component declarations
    const funcMatch = code.match(/(?:export\s+)?(?:default\s+)?function\s+(\w+)/g);
    const constMatch = code.match(/(?:export\s+)?const\s+(\w+)\s*[=:]\s*(?:React\.)?(?:FC|memo|forwardRef)/g);
    if (funcMatch) {
        for (const match of funcMatch) {
            const name = match.match(/function\s+(\w+)/)?.[1];
            if (name && /^[A-Z]/.test(name)) {
                components.push(name);
            }
        }
    }
    if (constMatch) {
        for (const match of constMatch) {
            const name = match.match(/const\s+(\w+)/)?.[1];
            if (name)
                components.push(name);
        }
    }
    if (components.length < 2)
        return '';
    const lines = [
        '```',
        'Component Structure:',
        '',
        ...components.map((c, i) => `${i === 0 ? '┌─' : '├─'} ${c}`),
        '```'
    ];
    return lines.join('\n');
}
//# sourceMappingURL=react-patterns.js.map