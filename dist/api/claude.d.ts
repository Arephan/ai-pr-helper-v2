/**
 * Claude API wrapper for AI analysis
 */
import { SummaryAnalysis, PatternAnalysis } from '../types.js';
/**
 * Initialize Claude client
 */
export declare function initClaudeClient(apiKey?: string): void;
/**
 * Solution 1: Generate "What Changed & Why" summary for a hunk
 */
export declare function generateSummary(hunkContent: string, context: string, filename: string, model?: string): Promise<SummaryAnalysis>;
/**
 * Solution 2: Detect AI patterns in code
 */
export declare function detectPatterns(code: string, filename: string, model?: string): Promise<PatternAnalysis>;
/**
 * Batch analyze multiple hunks (more efficient API usage)
 */
export declare function batchAnalyze(hunks: Array<{
    content: string;
    context: string;
    filename: string;
}>, options?: {
    includeSummary?: boolean;
    includePatterns?: boolean;
    model?: string;
}): Promise<Array<{
    summary?: SummaryAnalysis;
    patterns?: PatternAnalysis;
}>>;
//# sourceMappingURL=claude.d.ts.map