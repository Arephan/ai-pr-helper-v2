/**
 * Claude API wrapper for AI code review
 */
export interface AIReview {
    summary: string;
    critical: Array<{
        type: 'security' | 'crash' | 'data-loss' | 'performance';
        line: number;
        issue: string;
        friendlySuggestion: string;
    }>;
    language: string;
}
/**
 * Initialize Claude client
 */
export declare function initClaudeClient(apiKey?: string): void;
/**
 * Review code with AI (language agnostic)
 */
export declare function reviewCode(code: string, filename: string, model?: string): Promise<AIReview>;
//# sourceMappingURL=claude.d.ts.map