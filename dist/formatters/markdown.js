"use strict";
/**
 * Markdown formatter for PR comments and CLI output
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatReviewResult = formatReviewResult;
exports.formatFileAnalysis = formatFileAnalysis;
exports.formatHunkAnalysis = formatHunkAnalysis;
exports.formatSummary = formatSummary;
exports.formatPatterns = formatPatterns;
exports.formatComplexity = formatComplexity;
exports.formatInlineComment = formatInlineComment;
const complexity_js_1 = require("../analyzers/complexity.js");
/**
 * Format a complete review result as markdown
 */
function formatReviewResult(result) {
    const lines = [];
    // Header
    lines.push('# 🔍 AI Code Review Helper\n');
    // Summary stats
    lines.push('## Overview\n');
    lines.push(`- **Files analyzed:** ${result.files.length}`);
    lines.push(`- **Hunks reviewed:** ${result.totalHunks}`);
    lines.push(`- **AI likelihood:** ${formatLikelihood(result.aiCodeLikelihood)}`);
    lines.push(`- **Processing time:** ${(result.totalProcessingTime / 1000).toFixed(1)}s\n`);
    // Per-file analysis
    for (const file of result.files) {
        lines.push(formatFileAnalysis(file));
    }
    return lines.join('\n');
}
/**
 * Format analysis for a single file
 */
function formatFileAnalysis(file) {
    const lines = [];
    lines.push(`## 📄 \`${file.filename}\`\n`);
    if (file.overallComplexity > 0) {
        const emoji = (0, complexity_js_1.getComplexityEmoji)(file.overallComplexity);
        const label = (0, complexity_js_1.getSeverityLabel)(file.overallComplexity);
        lines.push(`**Overall Complexity:** ${emoji} ${file.overallComplexity.toFixed(1)}/10 (${label})\n`);
    }
    for (let i = 0; i < file.hunks.length; i++) {
        lines.push(formatHunkAnalysis(file.hunks[i], i + 1));
    }
    return lines.join('\n');
}
/**
 * Format analysis for a single hunk
 */
function formatHunkAnalysis(hunk, index) {
    const lines = [];
    const hunkHeader = index
        ? `### Hunk ${index} (lines ${hunk.hunk.startLine}-${hunk.hunk.endLine})\n`
        : `### Lines ${hunk.hunk.startLine}-${hunk.hunk.endLine}\n`;
    lines.push(hunkHeader);
    // Summary (Solution 1)
    if (hunk.summary) {
        lines.push(formatSummary(hunk.summary));
    }
    // Patterns (Solution 2)
    if (hunk.patterns && hunk.patterns.patternsFound.length > 0) {
        lines.push(formatPatterns(hunk.patterns));
    }
    // Complexity (Solution 4)
    if (hunk.complexity && hunk.complexity.score > 3) {
        lines.push(formatComplexity(hunk.complexity));
    }
    lines.push('---\n');
    return lines.join('\n');
}
/**
 * Format a summary analysis (Solution 1)
 */
function formatSummary(summary) {
    const lines = [];
    lines.push(`> 🔍 **WHAT:** ${summary.what}`);
    lines.push(`>`);
    lines.push(`> 💡 **WHY:** ${summary.why}`);
    if (summary.watch.length > 0) {
        lines.push(`>`);
        lines.push(`> ⚠️ **WATCH:**`);
        for (const item of summary.watch) {
            lines.push(`> - ${item}`);
        }
    }
    lines.push('');
    return lines.join('\n');
}
/**
 * Format pattern analysis (Solution 2)
 */
function formatPatterns(patterns) {
    const lines = [];
    lines.push(`**🔮 AI Patterns Detected:**\n`);
    for (const pattern of patterns.patternsFound) {
        const typeLabel = formatPatternType(pattern.type);
        const linesStr = pattern.lines.length > 0
            ? ` (lines ${pattern.lines.join(', ')})`
            : '';
        lines.push(`- **${typeLabel}**${linesStr}`);
        lines.push(`  - Issue: ${pattern.issue}`);
        if (pattern.simplerAlternative) {
            lines.push(`  - Suggestion: ${pattern.simplerAlternative}`);
        }
    }
    if (patterns.keyQuestion) {
        lines.push(`\n> 🤔 **Question:** ${patterns.keyQuestion}`);
    }
    lines.push('');
    return lines.join('\n');
}
/**
 * Format complexity analysis (Solution 4)
 */
function formatComplexity(complexity) {
    const lines = [];
    const emoji = (0, complexity_js_1.getComplexityEmoji)(complexity.score);
    const label = (0, complexity_js_1.getSeverityLabel)(complexity.score);
    lines.push(`**🌡️ Cognitive Load:** ${emoji} ${complexity.score.toFixed(1)}/10 (${label})\n`);
    // Metrics table
    lines.push('| Metric | Value | Threshold |');
    lines.push('|--------|-------|-----------|');
    for (const flag of complexity.flags) {
        const icon = flag.severity === 'critical' ? '🔴' : '⚠️';
        lines.push(`| ${formatMetricName(flag.metric)} | ${flag.value} | ${icon} >${flag.threshold} |`);
    }
    if (complexity.suggestions.length > 0) {
        lines.push('\n**Suggestions:**');
        for (const suggestion of complexity.suggestions) {
            lines.push(`- ${suggestion}`);
        }
    }
    lines.push('');
    return lines.join('\n');
}
/**
 * Format pattern type for display
 */
function formatPatternType(type) {
    const labels = {
        'over-defensive': 'Over-Defensive Code',
        'verbose-comments': 'Verbose Comments',
        'over-abstraction': 'Over-Abstraction',
        'naming-chaos': 'Naming Inconsistency',
        'import-bloat': 'Import Bloat',
        'monolithic-function': 'Monolithic Function',
        'catch-all-error': 'Catch-All Error Handling'
    };
    return labels[type] || type;
}
/**
 * Format metric name for display
 */
function formatMetricName(metric) {
    const labels = {
        nestingDepth: 'Nesting Depth',
        cyclomaticComplexity: 'Cyclomatic',
        parameterCount: 'Parameters',
        lineCount: 'Line Count',
        dependencyCount: 'Dependencies'
    };
    return labels[metric] || metric;
}
/**
 * Format AI likelihood for display
 */
function formatLikelihood(likelihood) {
    switch (likelihood) {
        case 'high': return '🔴 High';
        case 'medium': return '🟡 Medium';
        case 'low': return '🟢 Low';
        default: return likelihood;
    }
}
/**
 * Format a single inline comment for GitHub PR
 */
function formatInlineComment(analysis, includeComplexity = true) {
    const parts = [];
    // Summary
    if (analysis.summary) {
        parts.push(formatSummary(analysis.summary));
    }
    // Patterns (only if found)
    if (analysis.patterns && analysis.patterns.patternsFound.length > 0) {
        parts.push(formatPatterns(analysis.patterns));
    }
    // Complexity (only if concerning)
    if (includeComplexity && analysis.complexity && analysis.complexity.score > 5) {
        parts.push(formatComplexity(analysis.complexity));
    }
    return parts.join('\n');
}
//# sourceMappingURL=markdown.js.map