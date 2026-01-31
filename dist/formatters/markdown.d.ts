/**
 * Markdown formatter for PR comments and CLI output
 */
import { HunkAnalysis, FileAnalysis, ReviewResult, SummaryAnalysis, PatternAnalysis, ComplexityAnalysis } from '../types.js';
/**
 * Format a complete review result as markdown
 */
export declare function formatReviewResult(result: ReviewResult): string;
/**
 * Format analysis for a single file
 */
export declare function formatFileAnalysis(file: FileAnalysis): string;
/**
 * Format analysis for a single hunk
 */
export declare function formatHunkAnalysis(hunk: HunkAnalysis, index?: number): string;
/**
 * Format a summary analysis (Solution 1)
 */
export declare function formatSummary(summary: SummaryAnalysis): string;
/**
 * Format pattern analysis (Solution 2)
 */
export declare function formatPatterns(patterns: PatternAnalysis): string;
/**
 * Format complexity analysis (Solution 4)
 */
export declare function formatComplexity(complexity: ComplexityAnalysis): string;
/**
 * Format a single inline comment for GitHub PR
 */
export declare function formatInlineComment(analysis: HunkAnalysis, includeComplexity?: boolean): string;
//# sourceMappingURL=markdown.d.ts.map