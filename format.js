#!/usr/bin/env node

/**
 * Format analysis results into GitHub comment
 * Usage: node format.js <results-file>
 */

const fs = require('fs');

const resultsFile = process.argv[2];
if (!resultsFile) {
  console.error('Usage: node format.js <results-file>');
  process.exit(1);
}

const result = JSON.parse(fs.readFileSync(resultsFile, 'utf-8'));
const intent = result.intent || '';
const issues = result.issues || [];

const SEVERITY = {
  CRITICAL: { emoji: '💀', label: 'CRITICAL (review first)', priority: 1 },
  HIGH: { emoji: '🔒', label: 'HIGH', priority: 2 },
  MEDIUM: { emoji: '⚠️', label: 'IMPORTANT', priority: 3 },
  LOW: { emoji: '💡', label: 'CONSIDER', priority: 4 }
};

function groupBySeverity(issues) {
  const grouped = {};
  
  issues.forEach(issue => {
    const severity = issue.severity.toUpperCase();
    if (!grouped[severity]) {
      grouped[severity] = [];
    }
    grouped[severity].push(issue);
  });
  
  return grouped;
}

function formatReport(intent, issues) {
  let report = '# 🔍 Code Review\n\n';
  
  // Add issue count summary at top
  if (issues.length > 0) {
    const grouped = groupBySeverity(issues);
    const criticalCount = (grouped.CRITICAL || []).length;
    const highCount = (grouped.HIGH || []).length;
    const mediumCount = (grouped.MEDIUM || []).length;
    
    const parts = [];
    if (criticalCount > 0) parts.push(`💀 ${criticalCount} critical`);
    if (highCount > 0) parts.push(`🔒 ${highCount} high`);
    if (mediumCount > 0) parts.push(`⚠️ ${mediumCount} important`);
    
    report += `**Found:** ${parts.join(', ')}\n\n`;
    report += `---\n\n`;
  }
  
  // Add intent summary if available
  if (intent) {
    report += `## What's this PR doing?\n\n${intent}\n\n---\n\n`;
  }
  
  if (issues.length === 0) {
    report += `✅ **No critical issues found**\n\n`;
    report += `This PR looks good from a security and performance perspective.`;
    
    if (!intent) {
      report += '\n\n<sub>🤖 Automated review powered by Claude Opus</sub>';
    }
    
    return report;
  }

  const grouped = groupBySeverity(issues);
  const sortedSeverities = Object.keys(grouped).sort((a, b) => 
    SEVERITY[a].priority - SEVERITY[b].priority
  );

  sortedSeverities.forEach(severity => {
    const { emoji, label } = SEVERITY[severity];
    const severityIssues = grouped[severity];

    report += `## ${emoji} ${label}\n\n`;

    severityIssues.forEach(issue => {
      const location = `${issue.file}:${issue.line}`;
      const fix = issue.fix ? ` → Fix: \`${issue.fix}\`` : '';
      report += `${emoji} **${issue.type}** (${issue.context}) → \`${location}\`${fix}\n`;
    });

    report += '\n';
  });

  const totalIssues = issues.length;
  const criticalCount = (grouped.CRITICAL || []).length;
  const highCount = (grouped.HIGH || []).length;

  report += `---\n`;
  report += `**Total:** ${totalIssues} issue${totalIssues !== 1 ? 's' : ''}`;
  if (criticalCount > 0) {
    report += ` | ${criticalCount} critical`;
  }
  if (highCount > 0) {
    report += ` | ${highCount} high`;
  }
  report += '\n\n';
  report += `<sub>🤖 Automated review powered by Claude Opus</sub>`;

  return report;
}

const report = formatReport(intent, issues);
console.log(report);
