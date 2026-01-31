/**
 * Solution 4: Complexity Highlighter
 * 
 * Analyzes code complexity to help reviewers prioritize their attention.
 * Uses static analysis - no LLM needed.
 */

import {
  ComplexityMetrics,
  ComplexityAnalysis,
  ComplexityFlag,
  ComplexityThresholds,
  DEFAULT_CONFIG
} from '../types.js';

/**
 * Analyze code complexity and return metrics + suggestions
 */
export function analyzeComplexity(
  code: string,
  thresholds: ComplexityThresholds = DEFAULT_CONFIG.complexityThresholds
): ComplexityAnalysis {
  const metrics = calculateMetrics(code);
  const flags = checkThresholds(metrics, thresholds);
  const score = calculateScore(metrics, thresholds);
  const suggestions = generateSuggestions(metrics, flags, code);
  
  return {
    score,
    metrics,
    flags,
    suggestions
  };
}

/**
 * Calculate all complexity metrics for a code block
 */
function calculateMetrics(code: string): ComplexityMetrics {
  return {
    nestingDepth: calculateNestingDepth(code),
    cyclomaticComplexity: calculateCyclomaticComplexity(code),
    parameterCount: calculateMaxParameters(code),
    lineCount: calculateLineCount(code),
    dependencyCount: calculateDependencyCount(code)
  };
}

/**
 * Calculate maximum nesting depth (if/for/while/try blocks)
 */
function calculateNestingDepth(code: string): number {
  let maxDepth = 0;
  let currentDepth = 0;
  
  // Simple brace counting (works for most TS/JS)
  for (const char of code) {
    if (char === '{') {
      currentDepth++;
      maxDepth = Math.max(maxDepth, currentDepth);
    } else if (char === '}') {
      currentDepth = Math.max(0, currentDepth - 1);
    }
  }
  
  return maxDepth;
}

/**
 * Calculate cyclomatic complexity (decision points)
 */
function calculateCyclomaticComplexity(code: string): number {
  // Start with 1 (base path)
  let complexity = 1;
  
  // Count decision points
  const patterns = [
    /\bif\s*\(/g,           // if statements
    /\belse\s+if\s*\(/g,    // else if (don't double count)
    /\bfor\s*\(/g,          // for loops
    /\bwhile\s*\(/g,        // while loops
    /\bcase\s+/g,           // switch cases
    /\bcatch\s*\(/g,        // catch blocks
    /\?\s*[^:]/g,           // ternary operators
    /&&/g,                  // logical AND
    /\|\|/g,                // logical OR
    /\?\?/g                 // nullish coalescing
  ];
  
  for (const pattern of patterns) {
    const matches = code.match(pattern);
    if (matches) {
      complexity += matches.length;
    }
  }
  
  return complexity;
}

/**
 * Calculate max parameter count for any function
 */
function calculateMaxParameters(code: string): number {
  let maxParams = 0;
  
  // Match function declarations and arrow functions
  const funcPatterns = [
    /function\s*\w*\s*\(([^)]*)\)/g,           // function name(params)
    /\(([^)]*)\)\s*=>/g,                        // (params) =>
    /\w+\s*\(([^)]*)\)\s*{/g                    // method(params) {
  ];
  
  for (const pattern of funcPatterns) {
    let match;
    while ((match = pattern.exec(code)) !== null) {
      const params = match[1];
      if (params.trim()) {
        // Count parameters (split by comma, accounting for type annotations)
        const paramCount = countParameters(params);
        maxParams = Math.max(maxParams, paramCount);
      }
    }
  }
  
  return maxParams;
}

/**
 * Count parameters in a parameter string
 */
function countParameters(params: string): number {
  // Handle cases like: a: string, b: { foo: bar }, c: Array<T>
  let depth = 0;
  let count = 0;
  let hasContent = false;
  
  for (const char of params) {
    if (char === '<' || char === '{' || char === '[' || char === '(') {
      depth++;
    } else if (char === '>' || char === '}' || char === ']' || char === ')') {
      depth--;
    } else if (char === ',' && depth === 0) {
      if (hasContent) count++;
      hasContent = false;
    } else if (char.trim()) {
      hasContent = true;
    }
  }
  
  // Don't forget the last parameter
  if (hasContent) count++;
  
  return count;
}

/**
 * Calculate line count (excluding empty lines and comments)
 */
function calculateLineCount(code: string): number {
  const lines = code.split('\n');
  
  let count = 0;
  let inBlockComment = false;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip empty lines
    if (!trimmed) continue;
    
    // Handle block comments
    if (trimmed.startsWith('/*')) {
      inBlockComment = true;
    }
    if (inBlockComment) {
      if (trimmed.includes('*/')) {
        inBlockComment = false;
      }
      continue;
    }
    
    // Skip single-line comments
    if (trimmed.startsWith('//')) continue;
    
    count++;
  }
  
  return count;
}

/**
 * Count import/require statements
 */
function calculateDependencyCount(code: string): number {
  const importPattern = /^import\s+/gm;
  const requirePattern = /require\s*\(/g;
  
  const imports = (code.match(importPattern) || []).length;
  const requires = (code.match(requirePattern) || []).length;
  
  return imports + requires;
}

/**
 * Check metrics against thresholds and return flags
 */
function checkThresholds(
  metrics: ComplexityMetrics,
  thresholds: ComplexityThresholds
): ComplexityFlag[] {
  const flags: ComplexityFlag[] = [];
  
  const checks: Array<{
    metric: keyof ComplexityMetrics;
    threshold: number;
  }> = [
    { metric: 'nestingDepth', threshold: thresholds.nestingDepth },
    { metric: 'cyclomaticComplexity', threshold: thresholds.cyclomaticComplexity },
    { metric: 'parameterCount', threshold: thresholds.parameterCount },
    { metric: 'lineCount', threshold: thresholds.lineCount },
    { metric: 'dependencyCount', threshold: thresholds.dependencyCount }
  ];
  
  for (const { metric, threshold } of checks) {
    const value = metrics[metric];
    if (value > threshold) {
      flags.push({
        metric,
        value,
        threshold,
        severity: value > threshold * 1.5 ? 'critical' : 'warning'
      });
    }
  }
  
  return flags;
}

/**
 * Calculate overall complexity score (0-10)
 */
function calculateScore(
  metrics: ComplexityMetrics,
  thresholds: ComplexityThresholds
): number {
  // Normalize each metric to 0-2 range based on threshold
  const normalize = (value: number, threshold: number): number => {
    const ratio = value / threshold;
    return Math.min(2, ratio);
  };
  
  const scores = [
    normalize(metrics.nestingDepth, thresholds.nestingDepth),
    normalize(metrics.cyclomaticComplexity, thresholds.cyclomaticComplexity),
    normalize(metrics.parameterCount, thresholds.parameterCount),
    normalize(metrics.lineCount, thresholds.lineCount),
    normalize(metrics.dependencyCount, thresholds.dependencyCount)
  ];
  
  // Average and scale to 0-10
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return Math.round(avg * 5 * 10) / 10;
}

/**
 * Generate human-readable suggestions based on flags
 */
function generateSuggestions(
  metrics: ComplexityMetrics,
  flags: ComplexityFlag[],
  code: string
): string[] {
  const suggestions: string[] = [];
  
  for (const flag of flags) {
    switch (flag.metric) {
      case 'nestingDepth':
        suggestions.push(`Consider extracting nested logic into separate functions to reduce depth from ${flag.value} to ≤${flag.threshold}`);
        break;
        
      case 'cyclomaticComplexity':
        suggestions.push(`High decision complexity (${flag.value} paths). Consider splitting into smaller functions or using early returns`);
        break;
        
      case 'parameterCount':
        suggestions.push(`Function has ${flag.value} parameters. Consider using an options object or splitting the function`);
        break;
        
      case 'lineCount':
        suggestions.push(`${flag.value} lines is hard to review at once. Consider extracting into ${Math.ceil(flag.value / 30)} smaller functions`);
        break;
        
      case 'dependencyCount':
        suggestions.push(`${flag.value} imports may indicate too many responsibilities. Consider if all are needed`);
        break;
    }
  }
  
  // Add specific suggestions based on code patterns
  if (code.includes('try') && code.includes('catch')) {
    const catchCount = (code.match(/catch/g) || []).length;
    if (catchCount > 2) {
      suggestions.push(`Multiple try-catch blocks (${catchCount}). Consider a single error boundary or utility function`);
    }
  }
  
  return suggestions;
}

/**
 * Get a human-readable severity label
 */
export function getSeverityLabel(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score <= 3) return 'low';
  if (score <= 5) return 'medium';
  if (score <= 7) return 'high';
  return 'critical';
}

/**
 * Get emoji for complexity level
 */
export function getComplexityEmoji(score: number): string {
  if (score <= 3) return '🟢';
  if (score <= 5) return '🟡';
  if (score <= 7) return '🟠';
  return '🔴';
}
