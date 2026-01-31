/**
 * React-Specific Pattern Analyzer
 *
 * Detects common React issues and AI-generated patterns
 * without needing an API call.
 */
export interface ReactPattern {
    type: string;
    severity: 'info' | 'warning' | 'error';
    line?: number;
    message: string;
    suggestion?: string;
    codeExample?: string;
}
export interface ReactAnalysis {
    patterns: ReactPattern[];
    componentType: 'functional' | 'class' | 'unknown';
    hooks: string[];
    stateCount: number;
    effectCount: number;
    hasErrorBoundary: boolean;
}
/**
 * Analyze React code for patterns and issues
 */
export declare function analyzeReactPatterns(code: string, filename: string): ReactAnalysis;
/**
 * Generate ASCII diagram for component structure
 */
export declare function generateComponentDiagram(code: string): string;
//# sourceMappingURL=react-patterns.d.ts.map