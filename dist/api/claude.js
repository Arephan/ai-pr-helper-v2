"use strict";
/**
 * Claude API wrapper for AI analysis
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initClaudeClient = initClaudeClient;
exports.generateSummary = generateSummary;
exports.detectPatterns = detectPatterns;
exports.batchAnalyze = batchAnalyze;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
let client = null;
/**
 * Initialize Claude client
 */
function initClaudeClient(apiKey) {
    const key = apiKey || process.env.ANTHROPIC_API_KEY;
    if (!key) {
        throw new Error('ANTHROPIC_API_KEY is required');
    }
    client = new sdk_1.default({ apiKey: key });
}
/**
 * Get Claude client (throws if not initialized)
 */
function getClient() {
    if (!client) {
        throw new Error('Claude client not initialized. Call initClaudeClient first.');
    }
    return client;
}
/**
 * Solution 1: Generate "What Changed & Why" summary for a hunk
 */
async function generateSummary(hunkContent, context, filename, model = 'claude-sonnet-4-20250514') {
    const prompt = `You are a senior code reviewer helping another developer understand AI-generated code changes.

Given this diff hunk from ${filename} and its surrounding context, provide a brief explanation.

DIFF:
\`\`\`
${hunkContent}
\`\`\`

CONTEXT (surrounding code):
\`\`\`
${context.slice(0, 2000)}
\`\`\`

Respond in JSON format only:
{
  "what": "1-2 sentences describing what behavior changed",
  "why": "1-2 sentences on the likely intent/purpose",
  "watch": ["1-3 things the reviewer should verify"]
}

Keep it concise. The reviewer is experienced but unfamiliar with this specific code.
Be specific about what actually changed, not generic statements.`;
    const response = await getClient().messages.create({
        model,
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }]
    });
    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    try {
        // Extract JSON from response (handle markdown code blocks)
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            return defaultSummary();
        }
        const parsed = JSON.parse(jsonMatch[0]);
        return {
            what: parsed.what || 'Unable to determine what changed',
            why: parsed.why || 'Intent unclear',
            watch: Array.isArray(parsed.watch) ? parsed.watch : []
        };
    }
    catch (e) {
        console.error('Failed to parse summary response:', e);
        return defaultSummary();
    }
}
function defaultSummary() {
    return {
        what: 'Code changes detected',
        why: 'Review manually for context',
        watch: ['Check the changes carefully']
    };
}
/**
 * Solution 2: Detect AI patterns in code
 */
async function detectPatterns(code, filename, model = 'claude-sonnet-4-20250514') {
    const prompt = `You are an expert at identifying AI-generated code patterns that make code harder to review.

Analyze this code from ${filename} for common "AI-isms":

CODE:
\`\`\`
${code.slice(0, 3000)}
\`\`\`

Look for these specific patterns:
1. "over-defensive" - Unnecessary try-catch blocks, null checks that TypeScript already handles
2. "verbose-comments" - Comments explaining obvious syntax instead of intent (e.g., "// Loop through array")
3. "over-abstraction" - Simple operations wrapped in unnecessary classes/factories
4. "naming-chaos" - Mix of very long names and very short generic names in same scope
5. "import-bloat" - More imports than actually needed
6. "monolithic-function" - Function doing too many things that should be split
7. "catch-all-error" - Generic error handling that hides actual issues

Respond in JSON format only:
{
  "patternsFound": [
    {
      "type": "pattern-type-from-above",
      "lines": [line numbers array],
      "issue": "What's wrong",
      "simplerAlternative": "How to fix it (optional)"
    }
  ],
  "overallAiLikelihood": "high|medium|low",
  "keyQuestion": "A question the reviewer should ask themselves"
}

Only report patterns you're confident about. If the code looks normal, return empty patternsFound array.
Be specific about line numbers and issues.`;
    const response = await getClient().messages.create({
        model,
        max_tokens: 800,
        messages: [{ role: 'user', content: prompt }]
    });
    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            return defaultPatternAnalysis();
        }
        const parsed = JSON.parse(jsonMatch[0]);
        return {
            patternsFound: (parsed.patternsFound || []).map((p) => ({
                type: p.type || 'unknown',
                lines: Array.isArray(p.lines) ? p.lines : [],
                issue: p.issue || '',
                simplerAlternative: p.simplerAlternative
            })),
            overallAiLikelihood: parsed.overallAiLikelihood || 'low',
            keyQuestion: parsed.keyQuestion
        };
    }
    catch (e) {
        console.error('Failed to parse patterns response:', e);
        return defaultPatternAnalysis();
    }
}
function defaultPatternAnalysis() {
    return {
        patternsFound: [],
        overallAiLikelihood: 'low'
    };
}
/**
 * Batch analyze multiple hunks (more efficient API usage)
 */
async function batchAnalyze(hunks, options = {}) {
    const { includeSummary = true, includePatterns = true, model = 'claude-sonnet-4-20250514' } = options;
    // Process in parallel with rate limiting
    const results = await Promise.all(hunks.map(async (hunk, index) => {
        // Simple rate limiting: stagger requests
        await new Promise(resolve => setTimeout(resolve, index * 100));
        const result = {};
        if (includeSummary) {
            result.summary = await generateSummary(hunk.content, hunk.context, hunk.filename, model);
        }
        if (includePatterns) {
            result.patterns = await detectPatterns(hunk.content, hunk.filename, model);
        }
        return result;
    }));
    return results;
}
//# sourceMappingURL=claude.js.map