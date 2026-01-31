/**
 * Git diff parser - extracts hunks from unified diff format
 */

import { DiffHunk, DiffFile, ParsedDiff } from '../types.js';

interface RawHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: string[];
}

/**
 * Parse a unified diff string into structured data
 */
export function parseDiff(diffText: string): ParsedDiff {
  const files: DiffFile[] = [];
  const lines = diffText.split('\n');
  
  let currentFile: DiffFile | null = null;
  let currentHunk: RawHunk | null = null;
  let i = 0;
  
  while (i < lines.length) {
    const line = lines[i];
    
    // New file header: diff --git a/path b/path
    if (line.startsWith('diff --git')) {
      if (currentFile && currentHunk) {
        currentFile.hunks.push(convertHunk(currentHunk, currentFile.filename));
      }
      if (currentFile) {
        files.push(currentFile);
      }
      
      // Extract filename from diff header
      const match = line.match(/diff --git a\/(.+) b\/(.+)/);
      const filename = match ? match[2] : 'unknown';
      
      currentFile = {
        filename,
        hunks: [],
        additions: 0,
        deletions: 0
      };
      currentHunk = null;
      i++;
      continue;
    }
    
    // Skip index, ---, +++ lines
    if (line.startsWith('index ') || line.startsWith('---') || line.startsWith('+++')) {
      i++;
      continue;
    }
    
    // New hunk header: @@ -old,count +new,count @@
    if (line.startsWith('@@')) {
      if (currentFile && currentHunk) {
        currentFile.hunks.push(convertHunk(currentHunk, currentFile.filename));
      }
      
      const match = line.match(/@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
      if (match) {
        currentHunk = {
          oldStart: parseInt(match[1], 10),
          oldLines: match[2] ? parseInt(match[2], 10) : 1,
          newStart: parseInt(match[3], 10),
          newLines: match[4] ? parseInt(match[4], 10) : 1,
          lines: []
        };
      }
      i++;
      continue;
    }
    
    // Content lines
    if (currentHunk && (line.startsWith('+') || line.startsWith('-') || line.startsWith(' ') || line === '')) {
      currentHunk.lines.push(line);
      
      if (currentFile) {
        if (line.startsWith('+') && !line.startsWith('+++')) {
          currentFile.additions++;
        } else if (line.startsWith('-') && !line.startsWith('---')) {
          currentFile.deletions++;
        }
      }
    }
    
    i++;
  }
  
  // Don't forget the last file and hunk
  if (currentFile && currentHunk) {
    currentFile.hunks.push(convertHunk(currentHunk, currentFile.filename));
  }
  if (currentFile) {
    files.push(currentFile);
  }
  
  return { files };
}

/**
 * Convert raw hunk data to our DiffHunk format
 */
function convertHunk(raw: RawHunk, filename: string): DiffHunk {
  const additions: string[] = [];
  const deletions: string[] = [];
  const contentLines: string[] = [];
  
  for (const line of raw.lines) {
    if (line.startsWith('+') && !line.startsWith('+++')) {
      additions.push(line.substring(1));
      contentLines.push(line);
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      deletions.push(line.substring(1));
      contentLines.push(line);
    } else if (line.startsWith(' ') || line === '') {
      contentLines.push(line);
    }
  }
  
  return {
    filename,
    startLine: raw.newStart,
    endLine: raw.newStart + raw.newLines - 1,
    content: contentLines.join('\n'),
    additions,
    deletions,
    context: '' // Will be filled later if we have file access
  };
}

/**
 * Get context around a hunk (surrounding code)
 */
export function extractContext(
  fileContent: string,
  startLine: number,
  endLine: number,
  contextLines: number = 50
): string {
  const lines = fileContent.split('\n');
  const contextStart = Math.max(0, startLine - contextLines - 1);
  const contextEnd = Math.min(lines.length, endLine + contextLines);
  
  return lines.slice(contextStart, contextEnd).join('\n');
}

/**
 * Check if a file is likely TypeScript/JavaScript/React
 */
export function isTypeScriptFile(filename: string): boolean {
  return /\.(tsx?|jsx?)$/.test(filename);
}

/**
 * Check if a file is a test file
 */
export function isTestFile(filename: string): boolean {
  return /\.(test|spec)\.(tsx?|jsx?)$/.test(filename) ||
         filename.includes('__tests__') ||
         filename.includes('__mocks__');
}

/**
 * Estimate if code is likely AI-generated based on patterns
 * This is a quick heuristic, not a definitive check
 */
export function quickAiCheck(content: string): 'high' | 'medium' | 'low' {
  let score = 0;
  
  // Check for AI-typical patterns
  const patterns = [
    /\/\*\*[\s\S]*?\*\//g,                    // JSDoc blocks
    /\/\/\s+[A-Z][a-z]+.*$/gm,                // Sentence-case comments
    /try\s*\{[\s\S]*?\}\s*catch\s*\([^)]*\)\s*\{[\s\S]*?console\.(log|error)/g, // Generic catch
    /function\s+\w{20,}/g,                     // Very long function names
    /const\s+\w{20,}/g,                        // Very long variable names
    /import\s+[\s\S]*?from\s+['"][^'"]+['"];?\s*\n/g // Many import lines
  ];
  
  for (const pattern of patterns) {
    const matches = content.match(pattern);
    if (matches && matches.length > 2) {
      score++;
    }
  }
  
  // Check comment density (AI tends to over-comment)
  const lines = content.split('\n');
  const commentLines = lines.filter(l => 
    l.trim().startsWith('//') || 
    l.trim().startsWith('/*') || 
    l.trim().startsWith('*')
  ).length;
  
  const commentRatio = commentLines / lines.length;
  if (commentRatio > 0.3) score += 2;
  else if (commentRatio > 0.2) score += 1;
  
  if (score >= 4) return 'high';
  if (score >= 2) return 'medium';
  return 'low';
}
