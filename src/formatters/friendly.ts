/**
 * Human-friendly output format (brief, critical-only)
 */

import { ReviewResult } from '../types.js';

const EMOJI_MAP = {
  security: '🔒',
  crash: '💥',
  'data-loss': '🗑️',
  performance: '🐌'
};

export function formatFriendlyReviewResult(result: ReviewResult): string {
  const parts: string[] = [];
  
  // Get PR context from environment (set by GitHub Action)
  const repo = process.env.GITHUB_REPOSITORY || '';
  const prNumber = process.env.PR_NUMBER || '';
  const headSha = process.env.HEAD_SHA || '';
  
  let hasCriticalIssues = false;
  
  for (const file of result.files) {
    if (file.hunks.length === 0) continue;
    
    for (const hunk of file.hunks) {
      if (!hunk.aiReview) continue;
      
      const { summary, critical, language } = hunk.aiReview;
      
      // Summary (brief!)
      if (!hasCriticalIssues) {
        parts.push(`**What's this?** ${summary}\n`);
        if (language && language !== 'Unknown') {
          parts.push(`*${language}*\n`);
        }
      }
      
      // Critical issues
      if (critical.length > 0) {
        if (!hasCriticalIssues) {
          parts.push(`\n**🚨 Critical Issues:**\n`);
          hasCriticalIssues = true;
        }
        
        critical.forEach((item) => {
          const emoji = EMOJI_MAP[item.type] || '⚠️';
          
          // Generate GitHub diff link to Files Changed tab
          let lineLink = `line ${item.line}`;
          if (repo && prNumber) {
            // Link to Files Changed tab - GitHub will show the file
            const filesUrl = `https://github.com/${repo}/pull/${prNumber}/files`;
            lineLink = `[${file.filename}:${item.line}](${filesUrl})`;
          }
          
          parts.push(`- ${emoji} **${item.type.toUpperCase()}**: ${item.issue} → ${lineLink}\n`);
        });
      }
    }
  }
  
  if (parts.length === 0) {
    return '✅ Looks good - no critical issues found!';
  }
  
  if (!hasCriticalIssues) {
    return parts.join('\n') + '\n\n✅ No critical issues found!';
  }
  
  return parts.join('\n');
}
