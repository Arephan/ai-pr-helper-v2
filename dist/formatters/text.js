"use strict";
/**
 * Plain text formatter for terminal output
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatReviewResultText = formatReviewResultText;
const complexity_js_1 = require("../analyzers/complexity.js");
// ANSI color codes (works in most terminals)
const colors = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    bgRed: '\x1b[41m',
    bgGreen: '\x1b[42m',
    bgYellow: '\x1b[43m'
};
/**
 * Check if colors should be used
 */
function useColors() {
    return process.stdout.isTTY !== false &&
        process.env.NO_COLOR === undefined &&
        process.env.TERM !== 'dumb';
}
/**
 * Apply color if terminal supports it
 */
function c(text, ...colorCodes) {
    if (!useColors())
        return text;
    return colorCodes.join('') + text + colors.reset;
}
/**
 * Format review result as plain text
 */
function formatReviewResultText(result) {
    const lines = [];
    // Header
    lines.push(c('═══════════════════════════════════════════════', colors.cyan));
    lines.push(c('  AI CODE REVIEW HELPER', colors.bold, colors.cyan));
    lines.push(c('═══════════════════════════════════════════════', colors.cyan));
    lines.push('');
    // Summary stats
    lines.push(c('OVERVIEW', colors.bold));
    lines.push(`  Files analyzed:    ${result.files.length}`);
    lines.push(`  Hunks reviewed:    ${result.totalHunks}`);
    lines.push(`  AI likelihood:     ${formatLikelihoodText(result.aiCodeLikelihood)}`);
    lines.push(`  Processing time:   ${(result.totalProcessingTime / 1000).toFixed(1)}s`);
    lines.push('');
    // Per-file analysis
    for (const file of result.files) {
        lines.push(formatFileAnalysisText(file));
    }
    lines.push(c('═══════════════════════════════════════════════', colors.cyan));
    return lines.join('\n');
}
/**
 * Format file analysis as text
 */
function formatFileAnalysisText(file) {
    const lines = [];
    lines.push(c(`▶ ${file.filename}`, colors.bold, colors.blue));
    if (file.overallComplexity > 0) {
        const label = (0, complexity_js_1.getSeverityLabel)(file.overallComplexity);
        const color = label === 'critical' ? colors.red :
            label === 'high' ? colors.yellow :
                label === 'medium' ? colors.cyan : colors.green;
        lines.push(`  Complexity: ${c(`${file.overallComplexity.toFixed(1)}/10 (${label})`, color)}`);
    }
    lines.push('');
    for (let i = 0; i < file.hunks.length; i++) {
        lines.push(formatHunkAnalysisText(file.hunks[i], i + 1));
    }
    return lines.join('\n');
}
/**
 * Format hunk analysis as text
 */
function formatHunkAnalysisText(hunk, index) {
    const lines = [];
    lines.push(c(`  ┌─ Hunk ${index} (lines ${hunk.hunk.startLine}-${hunk.hunk.endLine})`, colors.dim));
    // Summary
    if (hunk.summary) {
        lines.push(formatSummaryText(hunk.summary));
    }
    // Patterns
    if (hunk.patterns && hunk.patterns.patternsFound.length > 0) {
        lines.push(formatPatternsText(hunk.patterns));
    }
    // Complexity
    if (hunk.complexity && hunk.complexity.score > 3) {
        lines.push(formatComplexityText(hunk.complexity));
    }
    lines.push(c('  └────────────────────────────────────', colors.dim));
    lines.push('');
    return lines.join('\n');
}
/**
 * Format summary as text
 */
function formatSummaryText(summary) {
    const lines = [];
    lines.push(`  │ ${c('WHAT:', colors.bold)} ${summary.what}`);
    lines.push(`  │ ${c('WHY:', colors.bold)}  ${summary.why}`);
    if (summary.watch.length > 0) {
        lines.push(`  │ ${c('WATCH:', colors.yellow)}`);
        for (const item of summary.watch) {
            lines.push(`  │   • ${item}`);
        }
    }
    return lines.join('\n');
}
/**
 * Format patterns as text
 */
function formatPatternsText(patterns) {
    const lines = [];
    lines.push(`  │`);
    lines.push(`  │ ${c('AI PATTERNS:', colors.magenta)}`);
    for (const pattern of patterns.patternsFound) {
        const typeLabel = formatPatternTypeText(pattern.type);
        lines.push(`  │   ${c('▸', colors.magenta)} ${typeLabel}`);
        lines.push(`  │     ${pattern.issue}`);
        if (pattern.simplerAlternative) {
            lines.push(`  │     ${c('→', colors.green)} ${pattern.simplerAlternative}`);
        }
    }
    if (patterns.keyQuestion) {
        lines.push(`  │`);
        lines.push(`  │ ${c('?', colors.cyan)} ${patterns.keyQuestion}`);
    }
    return lines.join('\n');
}
/**
 * Format complexity as text
 */
function formatComplexityText(complexity) {
    const lines = [];
    const label = (0, complexity_js_1.getSeverityLabel)(complexity.score);
    const color = label === 'critical' ? colors.red :
        label === 'high' ? colors.yellow : colors.cyan;
    lines.push(`  │`);
    lines.push(`  │ ${c('COMPLEXITY:', colors.bold)} ${c(`${complexity.score.toFixed(1)}/10`, color)}`);
    for (const flag of complexity.flags) {
        const icon = flag.severity === 'critical' ? c('✗', colors.red) : c('!', colors.yellow);
        lines.push(`  │   ${icon} ${formatMetricNameText(flag.metric)}: ${flag.value} (>${flag.threshold})`);
    }
    if (complexity.suggestions.length > 0) {
        lines.push(`  │ ${c('Suggestions:', colors.dim)}`);
        for (const suggestion of complexity.suggestions.slice(0, 2)) {
            lines.push(`  │   • ${suggestion}`);
        }
    }
    return lines.join('\n');
}
function formatPatternTypeText(type) {
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
function formatMetricNameText(metric) {
    const labels = {
        nestingDepth: 'Nesting',
        cyclomaticComplexity: 'Paths',
        parameterCount: 'Params',
        lineCount: 'Lines',
        dependencyCount: 'Imports'
    };
    return labels[metric] || metric;
}
function formatLikelihoodText(likelihood) {
    switch (likelihood) {
        case 'high': return c('HIGH', colors.red, colors.bold);
        case 'medium': return c('MEDIUM', colors.yellow);
        case 'low': return c('LOW', colors.green);
        default: return likelihood;
    }
}
//# sourceMappingURL=text.js.map