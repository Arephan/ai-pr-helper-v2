/**
 * GitHub API Integration
 *
 * Post inline comments on PRs, create reviews, and manage discussions.
 */
import { ReviewResult } from '../types.js';
interface GitHubConfig {
    token: string;
    owner: string;
    repo: string;
    pullNumber: number;
}
/**
 * Create a GitHub review with inline comments
 */
export declare function createPRReview(config: GitHubConfig, result: ReviewResult, options?: {
    postInline?: boolean;
    summaryOnly?: boolean;
    maxComments?: number;
}): Promise<{
    reviewId: number;
    commentCount: number;
}>;
/**
 * Post a single inline comment (for testing or manual use)
 */
export declare function postInlineComment(config: GitHubConfig, path: string, line: number, body: string, commitId: string): Promise<{
    id: number;
}>;
/**
 * Update or create a PR comment (for summary updates)
 */
export declare function upsertPRComment(config: GitHubConfig, body: string, marker?: string): Promise<{
    id: number;
    created: boolean;
}>;
/**
 * Get changed files in a PR
 */
export declare function getPRFiles(config: GitHubConfig): Promise<Array<{
    filename: string;
    patch: string;
    additions: number;
    deletions: number;
}>>;
/**
 * Rate limiter for GitHub API
 */
export declare class GitHubRateLimiter {
    private remaining;
    private resetTime;
    checkLimit(): Promise<boolean>;
    updateFromHeaders(headers: Headers): void;
}
export {};
//# sourceMappingURL=github.d.ts.map