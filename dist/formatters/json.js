"use strict";
/**
 * JSON formatter for programmatic output
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatReviewResultJson = formatReviewResultJson;
exports.formatGithubActionsOutput = formatGithubActionsOutput;
exports.formatMinimalSummary = formatMinimalSummary;
exports.formatCiResult = formatCiResult;
/**
 * Format review result as JSON string
 */
function formatReviewResultJson(result) {
    return JSON.stringify(result, null, 2);
}
/**
 * Format for GitHub Actions output (sets output variables)
 */
function formatGithubActionsOutput(result) {
    const lines = [];
    // Summary data as outputs
    lines.push(`total_files=${result.files.length}`);
    lines.push(`total_hunks=${result.totalHunks}`);
    lines.push(`ai_likelihood=${result.aiCodeLikelihood}`);
    lines.push(`processing_time=${result.totalProcessingTime}`);
    // Count issues by type
    let patternCount = 0;
    let complexityIssues = 0;
    for (const file of result.files) {
        for (const hunk of file.hunks) {
            if (hunk.patterns) {
                patternCount += hunk.patterns.patternsFound.length;
            }
            if (hunk.complexity && hunk.complexity.score > 5) {
                complexityIssues++;
            }
        }
    }
    lines.push(`ai_patterns_found=${patternCount}`);
    lines.push(`high_complexity_hunks=${complexityIssues}`);
    // Files with issues
    const filesWithIssues = result.files.filter(f => f.hunks.some(h => (h.patterns?.patternsFound.length ?? 0) > 0 ||
        (h.complexity?.score ?? 0) > 5));
    lines.push(`files_with_issues=${filesWithIssues.length}`);
    return lines.join('\n');
}
/**
 * Create a minimal JSON summary for quick checks
 */
function formatMinimalSummary(result) {
    return {
        files: result.files.length,
        hunks: result.totalHunks,
        aiLikelihood: result.aiCodeLikelihood,
        issues: {
            patterns: result.files.reduce((acc, f) => acc + f.hunks.reduce((a, h) => a + (h.patterns?.patternsFound.length ?? 0), 0), 0),
            highComplexity: result.files.reduce((acc, f) => acc + f.hunks.filter(h => (h.complexity?.score ?? 0) > 5).length, 0)
        },
        processingTimeMs: result.totalProcessingTime
    };
}
/**
 * Format for CI/CD checks (returns pass/fail data)
 */
function formatCiResult(result, thresholds = {}) {
    const { maxPatterns = 10, maxComplexity = 8, maxAiLikelihood = 'high' } = thresholds;
    const reasons = [];
    // Count patterns
    const patternCount = result.files.reduce((acc, f) => acc + f.hunks.reduce((a, h) => a + (h.patterns?.patternsFound.length ?? 0), 0), 0);
    if (patternCount > maxPatterns) {
        reasons.push(`Too many AI patterns detected: ${patternCount} (max: ${maxPatterns})`);
    }
    // Check max complexity
    for (const file of result.files) {
        for (const hunk of file.hunks) {
            if (hunk.complexity && hunk.complexity.score > maxComplexity) {
                reasons.push(`High complexity in ${file.filename}:${hunk.hunk.startLine} ` +
                    `(${hunk.complexity.score.toFixed(1)} > ${maxComplexity})`);
            }
        }
    }
    // Check AI likelihood
    const likelihoodLevels = { low: 1, medium: 2, high: 3 };
    if (likelihoodLevels[result.aiCodeLikelihood] > likelihoodLevels[maxAiLikelihood]) {
        reasons.push(`AI likelihood too high: ${result.aiCodeLikelihood} (max: ${maxAiLikelihood})`);
    }
    return {
        pass: reasons.length === 0,
        reasons
    };
}
//# sourceMappingURL=json.js.map