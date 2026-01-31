/**
 * Git diff parser - extracts hunks from unified diff format
 */
import { ParsedDiff } from '../types.js';
/**
 * Parse a unified diff string into structured data
 */
export declare function parseDiff(diffText: string): ParsedDiff;
/**
 * Get context around a hunk (surrounding code)
 */
export declare function extractContext(fileContent: string, startLine: number, endLine: number, contextLines?: number): string;
/**
 * Check if a file is likely TypeScript/JavaScript/React
 */
export declare function isTypeScriptFile(filename: string): boolean;
/**
 * Check if a file is a test file
 */
export declare function isTestFile(filename: string): boolean;
/**
 * Estimate if code is likely AI-generated based on patterns
 * This is a quick heuristic, not a definitive check
 */
export declare function quickAiCheck(content: string): 'high' | 'medium' | 'low';
//# sourceMappingURL=diff.d.ts.map