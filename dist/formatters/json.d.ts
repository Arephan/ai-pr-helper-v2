/**
 * JSON formatter for programmatic output
 */
import { ReviewResult } from '../types.js';
/**
 * Format review result as JSON string
 */
export declare function formatReviewResultJson(result: ReviewResult): string;
/**
 * Format for GitHub Actions output (sets output variables)
 */
export declare function formatGithubActionsOutput(result: ReviewResult): string;
/**
 * Create a minimal JSON summary for quick checks
 */
export declare function formatMinimalSummary(result: ReviewResult): object;
/**
 * Format for CI/CD checks (returns pass/fail data)
 */
export declare function formatCiResult(result: ReviewResult, thresholds?: {
    maxPatterns?: number;
    maxComplexity?: number;
    maxAiLikelihood?: 'low' | 'medium' | 'high';
}): {
    pass: boolean;
    reasons: string[];
};
//# sourceMappingURL=json.d.ts.map