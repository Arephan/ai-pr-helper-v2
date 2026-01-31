#!/usr/bin/env node

/**
 * AI Review Helper - Help humans review AI-generated code faster
 * 
 * Usage:
 *   ai-review-helper <diff-input>
 *   git diff HEAD~1 | ai-review-helper -
 *   ai-review-helper --git HEAD~3..HEAD
 */

import { Command } from 'commander';
import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import ora from 'ora';
import chalk from 'chalk';

import { parseDiff, isTypeScriptFile, quickAiCheck } from './parsers/diff.js';
import { analyzeComplexity } from './analyzers/complexity.js';
import { initClaudeClient, generateSummary, detectPatterns } from './api/claude.js';
import { formatReviewResult } from './formatters/markdown.js';
import { formatReviewResultJson, formatMinimalSummary } from './formatters/json.js';
import { formatReviewResultText } from './formatters/text.js';
import {
  DiffHunk,
  HunkAnalysis,
  FileAnalysis,
  ReviewResult,
  OutputFormat,
  DEFAULT_CONFIG
} from './types.js';

const VERSION = '1.0.0';

async function main() {
  const program = new Command();
  
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
    .option('--model <name>', 'Claude model to use', DEFAULT_CONFIG.model)
    .option('-q, --quiet', 'Minimal output')
    .option('-v, --verbose', 'Verbose output')
    .action(runReview);
  
  await program.parseAsync(process.argv);
}

async function runReview(
  input: string | undefined,
  options: {
    git?: string;
    format: string;
    summary: boolean;
    patterns: boolean;
    complexity: boolean;
    maxHunks: string;
    context: string;
    model: string;
    quiet: boolean;
    verbose: boolean;
  }
) {
  const spinner = ora({ isSilent: options.quiet });
  
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
    const parsed = parseDiff(diffContent);
    
    // Filter to TypeScript/JavaScript files
    const tsFiles = parsed.files.filter(f => isTypeScriptFile(f.filename));
    
    if (tsFiles.length === 0) {
      spinner.warn('No TypeScript/JavaScript files in diff');
      console.log(chalk.dim('Tip: This tool is optimized for TS/JS/React code'));
      process.exit(0);
    }
    
    spinner.succeed(`Parsed ${tsFiles.length} files, ${tsFiles.reduce((a, f) => a + f.hunks.length, 0)} hunks`);
    
    // Initialize Claude if needed
    if (options.summary || options.patterns) {
      spinner.start('Initializing Claude API...');
      try {
        initClaudeClient();
        spinner.succeed('Claude API ready');
      } catch (e) {
        spinner.warn('Claude API not configured - skipping AI analysis');
        if (options.verbose) {
          console.log(chalk.dim('Set ANTHROPIC_API_KEY to enable AI-powered analysis'));
        }
        options.summary = false;
        options.patterns = false;
      }
    }
    
    // Analyze hunks
    const maxHunks = parseInt(options.maxHunks, 10);
    const startTime = Date.now();
    const fileAnalyses: FileAnalysis[] = [];
    let totalHunks = 0;
    let processedHunks = 0;
    
    for (const file of tsFiles) {
      const hunkAnalyses: HunkAnalysis[] = [];
      
      for (const hunk of file.hunks.slice(0, maxHunks - processedHunks)) {
        if (processedHunks >= maxHunks) break;
        
        spinner.start(`Analyzing ${file.filename}:${hunk.startLine}...`);
        const analysis = await analyzeHunk(hunk, file.filename, options);
        hunkAnalyses.push(analysis);
        
        processedHunks++;
        totalHunks++;
      }
      
      // Calculate overall file complexity
      const complexities = hunkAnalyses
        .filter(h => h.complexity)
        .map(h => h.complexity!.score);
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
    const allPatterns = fileAnalyses.flatMap(f => 
      f.hunks.flatMap(h => h.patterns?.patternsFound || [])
    );
    const aiLikelihood = allPatterns.length > 5 ? 'high' :
                         allPatterns.length > 2 ? 'medium' : 'low';
    
    // Build result
    const result: ReviewResult = {
      files: fileAnalyses,
      totalHunks,
      totalProcessingTime: totalTime,
      aiCodeLikelihood: aiLikelihood
    };
    
    // Format and output
    const output = formatOutput(result, options.format as OutputFormat);
    console.log(output);
    
    // Exit code based on findings
    if (aiLikelihood === 'high' && allPatterns.length > 10) {
      process.exit(1); // Signal for CI
    }
    
  } catch (error) {
    spinner.fail('Analysis failed');
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}

/**
 * Get diff content from various sources
 */
async function getDiffContent(input?: string, gitRange?: string): Promise<string> {
  // Git range specified
  if (gitRange) {
    return execSync(`git diff ${gitRange}`, { encoding: 'utf-8' });
  }
  
  // Stdin
  if (input === '-' || !input) {
    if (process.stdin.isTTY) {
      // No stdin, try git diff of staged changes
      try {
        return execSync('git diff --cached', { encoding: 'utf-8' });
      } catch {
        return execSync('git diff HEAD~1', { encoding: 'utf-8' });
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
  if (existsSync(input)) {
    return readFileSync(input, 'utf-8');
  }
  
  // Assume it's a git range
  return execSync(`git diff ${input}`, { encoding: 'utf-8' });
}

/**
 * Analyze a single hunk
 */
async function analyzeHunk(
  hunk: DiffHunk,
  filename: string,
  options: {
    summary: boolean;
    patterns: boolean;
    complexity: boolean;
    model: string;
  }
): Promise<HunkAnalysis> {
  const startTime = Date.now();
  const result: HunkAnalysis = {
    hunk,
    processingTime: 0
  };
  
  // Solution 4: Complexity (always fast, no API)
  if (options.complexity) {
    const allContent = [...hunk.additions, ...hunk.deletions].join('\n');
    if (allContent.trim()) {
      result.complexity = analyzeComplexity(allContent);
    }
  }
  
  // Solution 1: Summary (uses Claude)
  if (options.summary) {
    try {
      result.summary = await generateSummary(
        hunk.content,
        hunk.context || '',
        filename,
        options.model
      );
    } catch (e) {
      // Continue without summary on API error
    }
  }
  
  // Solution 2: Pattern Detection (uses Claude)
  if (options.patterns) {
    try {
      const addedCode = hunk.additions.join('\n');
      if (addedCode.trim()) {
        result.patterns = await detectPatterns(addedCode, filename, options.model);
      }
    } catch (e) {
      // Continue without patterns on API error
    }
  }
  
  result.processingTime = Date.now() - startTime;
  return result;
}

/**
 * Format output based on requested format
 */
function formatOutput(result: ReviewResult, format: OutputFormat): string {
  switch (format) {
    case 'json':
      return JSON.stringify(result, null, 2);
    case 'markdown':
      return formatReviewResult(result);
    case 'github':
      return formatReviewResult(result); // Same as markdown for now
    case 'text':
    default:
      return formatReviewResultText(result);
  }
}

// Run
main().catch(console.error);
