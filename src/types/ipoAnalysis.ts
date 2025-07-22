
export interface ContentAnalysis {
  structuralIssues: AnalysisIssue[];
  complianceGaps: AnalysisIssue[];
  qualityMetrics: QualityMetric[];
  missingElements: string[];
  improvementOpportunities: ImprovementOpportunity[];
  overallScore: number;
}

export interface AnalysisIssue {
  id: string;
  type: 'structural' | 'compliance' | 'content' | 'formatting';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  location: ContentLocation;
  suggestedFix?: string;
  autoFixable: boolean;
}

export interface QualityMetric {
  aspect: string;
  score: number;
  maxScore: number;
  feedback: string;
}

export interface ImprovementOpportunity {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'easy' | 'moderate' | 'complex';
  suggestedAction: string;
  beforeText?: string;
  afterText?: string;
}

export interface ContentLocation {
  section: string;
  paragraph?: number;
  sentenceStart?: number;
  sentenceEnd?: number;
}

export interface ProactiveAnalysisResult {
  hasIssues: boolean;
  urgentIssues: AnalysisIssue[];
  quickWins: ImprovementOpportunity[];
  summary: string;
  nextSteps: string[];
}

export interface ContentDiff {
  type: 'insert' | 'delete' | 'replace';
  originalText: string;
  newText: string;
  location: ContentLocation;
  reason: string;
}

export interface TargetedEdit {
  id: string;
  title: string;
  description: string;
  diffs: ContentDiff[];
  confidence: number;
  impact: string;
  previewText: string;
}
