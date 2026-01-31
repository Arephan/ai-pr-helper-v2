/**
 * Solution 4: Complexity Highlighter
 *
 * Analyzes code complexity to help reviewers prioritize their attention.
 * Uses static analysis - no LLM needed.
 */
import { ComplexityAnalysis, ComplexityThresholds } from '../types.js';
/**
 * Analyze code complexity and return metrics + suggestions
 */
export declare function analyzeComplexity(code: string, thresholds?: ComplexityThresholds): ComplexityAnalysis;
/**
 * Get a human-readable severity label
 */
export declare function getSeverityLabel(score: number): 'low' | 'medium' | 'high' | 'critical';
/**
 * Get emoji for complexity level
 */
export declare function getComplexityEmoji(score: number): string;
//# sourceMappingURL=complexity.d.ts.map