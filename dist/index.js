#!/usr/bin/env node
"use strict";
/**
 * AI Review Helper - Help humans review AI-generated code faster
 *
 * Usage:
 *   ai-review-helper <diff-input>
 *   git diff HEAD~1 | ai-review-helper -
 *   ai-review-helper --git HEAD~3..HEAD
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const fs_1 = require("fs");
const child_process_1 = require("child_process");
const ora_1 = __importDefault(require("ora"));
const chalk_1 = __importDefault(require("chalk"));
const diff_js_1 = require("./parsers/diff.js");
const complexity_js_1 = require("./analyzers/complexity.js");
const claude_js_1 = require("./api/claude.js");
const markdown_js_1 = require("./formatters/markdown.js");
const text_js_1 = require("./formatters/text.js");
const types_js_1 = require("./types.js");
const VERSION = '1.0.0';
async function main() {
    const program = new commander_1.Command();
    program
        .name('ai-review-helper')
        .description('Help humans review AI-generated code faster')
        .version(VERSION)
        .argument('[input]', 'Diff file, git range, or - for stdin')
        .option('-g, --git <range>', 'Use git diff for the specified range')
        .option('-f, --format <type>', 'Output format: text, markdown, json, github', 'text')
        .option('--no-summary', 'Skip "What Changed & Why" analysis')
        .option('--no-patterns', 'Skip AI pattern detection')
        .option('--no-complexity', 'Skip complexity analysis')
        .option('-m, --max-hunks <n>', 'Maximum hunks to analyze', '20')
        .option('-c, --context <n>', 'Lines of context around hunks', '30')
        .option('--model <name>', 'Claude model to use', types_js_1.DEFAULT_CONFIG.model)
        .option('-q, --quiet', 'Minimal output')
        .option('-v, --verbose', 'Verbose output')
        .action(runReview);
    await program.parseAsync(process.argv);
}
async function runReview(input, options) {
    const spinner = (0, ora_1.default)({ isSilent: options.quiet });
    try {
        // Get diff content
        spinner.start('Reading diff...');
        const diffContent = await getDiffContent(input, options.git);
        if (!diffContent.trim()) {
            spinner.fail('No diff content found');
            process.exit(1);
        }
        spinner.succeed(`Read diff (${diffContent.split('\n').length} lines)`);
        // Parse diff
        spinner.start('Parsing diff...');
        const parsed = (0, diff_js_1.parseDiff)(diffContent);
        // Filter to TypeScript/JavaScript files
        const tsFiles = parsed.files.filter(f => (0, diff_js_1.isTypeScriptFile)(f.filename));
        if (tsFiles.length === 0) {
            spinner.warn('No TypeScript/JavaScript files in diff');
            console.log(chalk_1.default.dim('Tip: This tool is optimized for TS/JS/React code'));
            process.exit(0);
        }
        spinner.succeed(`Parsed ${tsFiles.length} files, ${tsFiles.reduce((a, f) => a + f.hunks.length, 0)} hunks`);
        // Initialize Claude if needed
        if (options.summary || options.patterns) {
            spinner.start('Initializing Claude API...');
            try {
                (0, claude_js_1.initClaudeClient)();
                spinner.succeed('Claude API ready');
            }
            catch (e) {
                spinner.warn('Claude API not configured - skipping AI analysis');
                if (options.verbose) {
                    console.log(chalk_1.default.dim('Set ANTHROPIC_API_KEY to enable AI-powered analysis'));
                }
                options.summary = false;
                options.patterns = false;
            }
        }
        // Analyze hunks
        const maxHunks = parseInt(options.maxHunks, 10);
        const startTime = Date.now();
        const fileAnalyses = [];
        let totalHunks = 0;
        let processedHunks = 0;
        for (const file of tsFiles) {
            const hunkAnalyses = [];
            for (const hunk of file.hunks.slice(0, maxHunks - processedHunks)) {
                if (processedHunks >= maxHunks)
                    break;
                spinner.start(`Analyzing ${file.filename}:${hunk.startLine}...`);
                const analysis = await analyzeHunk(hunk, file.filename, options);
                hunkAnalyses.push(analysis);
                processedHunks++;
                totalHunks++;
            }
            // Calculate overall file complexity
            const complexities = hunkAnalyses
                .filter(h => h.complexity)
                .map(h => h.complexity.score);
            const overallComplexity = complexities.length > 0
                ? complexities.reduce((a, b) => a + b, 0) / complexities.length
                : 0;
            fileAnalyses.push({
                filename: file.filename,
                hunks: hunkAnalyses,
                overallComplexity
            });
        }
        const totalTime = Date.now() - startTime;
        spinner.succeed(`Analysis complete (${(totalTime / 1000).toFixed(1)}s)`);
        // Determine overall AI likelihood
        const allPatterns = fileAnalyses.flatMap(f => f.hunks.flatMap(h => h.patterns?.patternsFound || []));
        const aiLikelihood = allPatterns.length > 5 ? 'high' :
            allPatterns.length > 2 ? 'medium' : 'low';
        // Build result
        const result = {
            files: fileAnalyses,
            totalHunks,
            totalProcessingTime: totalTime,
            aiCodeLikelihood: aiLikelihood
        };
        // Format and output
        const output = formatOutput(result, options.format);
        console.log(output);
        // Exit code based on findings
        if (aiLikelihood === 'high' && allPatterns.length > 10) {
            process.exit(1); // Signal for CI
        }
    }
    catch (error) {
        spinner.fail('Analysis failed');
        console.error(chalk_1.default.red(error instanceof Error ? error.message : String(error)));
        process.exit(1);
    }
}
/**
 * Get diff content from various sources
 */
async function getDiffContent(input, gitRange) {
    // Git range specified
    if (gitRange) {
        return (0, child_process_1.execSync)(`git diff ${gitRange}`, { encoding: 'utf-8' });
    }
    // Stdin
    if (input === '-' || !input) {
        if (process.stdin.isTTY) {
            // No stdin, try git diff of staged changes
            try {
                return (0, child_process_1.execSync)('git diff --cached', { encoding: 'utf-8' });
            }
            catch {
                return (0, child_process_1.execSync)('git diff HEAD~1', { encoding: 'utf-8' });
            }
        }
        // Read from stdin
        return new Promise((resolve) => {
            let data = '';
            process.stdin.setEncoding('utf-8');
            process.stdin.on('readable', () => {
                let chunk;
                while ((chunk = process.stdin.read()) !== null) {
                    data += chunk;
                }
            });
            process.stdin.on('end', () => resolve(data));
        });
    }
    // File path
    if ((0, fs_1.existsSync)(input)) {
        return (0, fs_1.readFileSync)(input, 'utf-8');
    }
    // Assume it's a git range
    return (0, child_process_1.execSync)(`git diff ${input}`, { encoding: 'utf-8' });
}
/**
 * Analyze a single hunk
 */
async function analyzeHunk(hunk, filename, options) {
    const startTime = Date.now();
    const result = {
        hunk,
        processingTime: 0
    };
    // Solution 4: Complexity (always fast, no API)
    if (options.complexity) {
        const allContent = [...hunk.additions, ...hunk.deletions].join('\n');
        if (allContent.trim()) {
            result.complexity = (0, complexity_js_1.analyzeComplexity)(allContent);
        }
    }
    // Solution 1: Summary (uses Claude)
    if (options.summary) {
        try {
            result.summary = await (0, claude_js_1.generateSummary)(hunk.content, hunk.context || '', filename, options.model);
        }
        catch (e) {
            // Continue without summary on API error
        }
    }
    // Solution 2: Pattern Detection (uses Claude)
    if (options.patterns) {
        try {
            const addedCode = hunk.additions.join('\n');
            if (addedCode.trim()) {
                result.patterns = await (0, claude_js_1.detectPatterns)(addedCode, filename, options.model);
            }
        }
        catch (e) {
            // Continue without patterns on API error
        }
    }
    result.processingTime = Date.now() - startTime;
    return result;
}
/**
 * Format output based on requested format
 */
function formatOutput(result, format) {
    switch (format) {
        case 'json':
            return JSON.stringify(result, null, 2);
        case 'markdown':
            return (0, markdown_js_1.formatReviewResult)(result);
        case 'github':
            return (0, markdown_js_1.formatReviewResult)(result); // Same as markdown for now
        case 'text':
        default:
            return (0, text_js_1.formatReviewResultText)(result);
    }
}
// Run
main().catch(console.error);
//# sourceMappingURL=index.js.map