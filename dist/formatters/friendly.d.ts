/**
 * Friendly Reviewer Formatter
 *
 * Transforms analysis results into human-friendly PR comments
 * that feel like they're from a helpful teammate, not a linter.
 */
import { HunkAnalysis, ReviewResult } from '../types.js';
/**
 * Format a complete hunk analysis in friendly style
 */
export declare function formatFriendlyHunkAnalysis(hunk: HunkAnalysis, includeContext?: boolean): string;
/**
 * Format complete review result in friendly style
 */
export declare function formatFriendlyReviewResult(result: ReviewResult): string;
/**
 * Format as inline PR comment (for specific lines)
 */
export declare function formatFriendlyInlineComment(hunk: HunkAnalysis, lineNumber: number): string;
/**
 * Format as GitHub suggestion (with ` ```suggestion ` blocks)
 */
export declare function formatGitHubSuggestion(originalCode: string, suggestedCode: string, explanation: string): string;
//# sourceMappingURL=friendly.d.ts.map