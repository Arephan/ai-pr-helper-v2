/**
 * Claude API wrapper for AI code review
 */

import Anthropic from '@anthropic-ai/sdk';

let client: Anthropic | null = null;

export interface AIReview {
  summary: string;      // 1 sentence: what is this PR
  critical: Array<{
    type: 'security' | 'crash' | 'data-loss' | 'performance';
    line: number;
    issue: string;      // Brief description
  }>;
  language: string;
}

/**
 * Initialize Claude client
 */
export function initClaudeClient(apiKey?: string): void {
  const key = apiKey || process.env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new Error('ANTHROPIC_API_KEY is required');
  }
  client = new Anthropic({ apiKey: key });
}

/**
 * Get Claude client (throws if not initialized)
 */
function getClient(): Anthropic {
  if (!client) {
    throw new Error('Claude client not initialized. Call initClaudeClient first.');
  }
  return client;
}

/**
 * Review code with AI (language agnostic)
 */
export async function reviewCode(
  code: string,
  filename: string,
  model: string = 'claude-sonnet-4-20250514'
): Promise<AIReview> {
  const prompt = `You're reviewing a PR. Be BRIEF and only flag CRITICAL issues.

CODE (${filename}):
\`\`\`
${code.slice(0, 4000)}
\`\`\`

ONLY report issues that:
- 🔒 Security vulnerabilities (exposed secrets, SQL injection, XSS, etc.)
- 💥 Will crash in production (unhandled errors, null refs, race conditions)
- 🗑️ Data loss risks (missing validation, destructive ops without confirmation)
- 🐌 Major performance problems (N+1 queries, infinite loops, memory leaks)

Ignore:
- Style issues
- Minor optimizations
- Naming conventions
- Comments
- Anything that won't break prod

Respond in JSON:
{
  "language": "language name",
  "summary": "1 sentence: what does this PR do?",
  "critical": [
    {
      "type": "security|crash|data-loss|performance",
      "line": line_number_where_issue_is,
      "issue": "Brief what's wrong (1 sentence)"
    }
  ]
}

If no CRITICAL issues, return empty critical array.`;

  const response = await getClient().messages.create({
    model,
    max_tokens: 800,
    messages: [{ role: 'user', content: prompt }]
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return defaultReview();
    }
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      language: parsed.language || 'Unknown',
      summary: parsed.summary || 'Code changes',
      critical: Array.isArray(parsed.critical) ? parsed.critical : []
    };
  } catch (e) {
    console.error('Failed to parse AI response:', e);
    return defaultReview();
  }
}

function defaultReview(): AIReview {
  return {
    language: 'Unknown',
    summary: 'Unable to analyze',
    critical: []
  };
}
