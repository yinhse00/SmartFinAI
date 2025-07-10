/**
 * Real-time Content Analyzer for IPO Drafting
 * Provides instant feedback and suggestions as users type
 */

export interface ContentSuggestion {
  id: string;
  type: 'grammar' | 'style' | 'compliance' | 'disclosure' | 'enhancement';
  severity: 'error' | 'warning' | 'suggestion';
  message: string;
  startIndex: number;
  endIndex: number;
  replacement?: string;
  details?: string;
  ruleReference?: string;
}

export interface ComplianceScore {
  overall: number; // 0-100
  categories: {
    disclosure: number;
    language: number;
    structure: number;
    citations: number;
  };
  missingDisclosures: string[];
  criticalIssues: number;
}

export interface AnalysisResult {
  suggestions: ContentSuggestion[];
  complianceScore: ComplianceScore;
  wordCount: number;
  readabilityScore: number;
  lastAnalyzed: Date;
}

// HKEX Required Disclosures by Section
const HKEX_DISCLOSURE_REQUIREMENTS = {
  overview: [
    'principal activities',
    'business model',
    'competitive position',
    'key performance indicators',
    'regulatory environment'
  ],
  history: [
    'incorporation date',
    'significant milestones',
    'corporate restructuring',
    'ownership changes',
    'material acquisitions'
  ],
  products: [
    'revenue breakdown by product',
    'major customers',
    'supplier dependencies',
    'intellectual property',
    'regulatory approvals'
  ],
  strengths: [
    'competitive advantages',
    'market position',
    'operational efficiency',
    'management expertise',
    'financial strengths'
  ],
  strategy: [
    'business objectives',
    'growth strategy',
    'expansion plans',
    'investment priorities',
    'key initiatives'
  ],
  risk_factors: [
    'business risks',
    'financial risks',
    'operational risks',
    'regulatory risks',
    'market risks'
  ]
};

const COMPLIANCE_PATTERNS = {
  // Professional language patterns
  unprofessional: [
    /\b(awesome|amazing|incredible|fantastic)\b/gi,
    /\b(tons of|lots of|a bunch of)\b/gi,
    /\b(really|very|super|extremely)\s+good\b/gi,
    /\b(cheap|expensive)\b/gi // Should use "cost-effective" or "premium"
  ],
  
  // Required citations
  missingCitations: [
    /listing rule/gi,
    /hkex requirement/gi,
    /regulatory requirement/gi,
    /compliance with/gi
  ],
  
  // Vague language that needs specificity
  vagueLanguage: [
    /\b(significant|substantial|considerable)\b(?!\s+(amount|portion|percentage))/gi,
    /\b(many|several|various|numerous)\b(?!\s+\d)/gi,
    /\b(recently|soon|in the near future)\b/gi
  ],
  
  // Missing quantification
  needsQuantification: [
    /increased by\s+(?!approximately|\d)/gi,
    /decreased by\s+(?!approximately|\d)/gi,
    /growth of\s+(?!approximately|\d)/gi
  ]
};

export class RealTimeAnalyzer {
  private debounceTimer: NodeJS.Timeout | null = null;
  private analysisCache = new Map<string, AnalysisResult>();

  /**
   * Analyze content with debouncing for real-time feedback
   */
  analyzeContent(
    content: string, 
    sectionType: string, 
    callback: (result: AnalysisResult) => void,
    debounceMs: number = 1000
  ): void {
    // Clear previous timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Set new timer for debounced analysis
    this.debounceTimer = setTimeout(() => {
      const result = this.performAnalysis(content, sectionType);
      callback(result);
    }, debounceMs);
  }

  /**
   * Perform immediate analysis without debouncing
   */
  performAnalysis(content: string, sectionType: string): AnalysisResult {
    const cacheKey = `${sectionType}-${this.hashContent(content)}`;
    
    // Check cache first
    if (this.analysisCache.has(cacheKey)) {
      return this.analysisCache.get(cacheKey)!;
    }

    const suggestions: ContentSuggestion[] = [];
    
    // Analyze for different types of issues
    suggestions.push(...this.analyzeLanguageStyle(content));
    suggestions.push(...this.analyzeCompliance(content, sectionType));
    suggestions.push(...this.analyzeDisclosures(content, sectionType));
    suggestions.push(...this.analyzeStructure(content));

    // Calculate compliance score
    const complianceScore = this.calculateComplianceScore(content, sectionType, suggestions);

    // Calculate metrics
    const wordCount = content.trim().split(/\s+/).length;
    const readabilityScore = this.calculateReadabilityScore(content);

    const result: AnalysisResult = {
      suggestions,
      complianceScore,
      wordCount,
      readabilityScore,
      lastAnalyzed: new Date()
    };

    // Cache result
    this.analysisCache.set(cacheKey, result);
    
    return result;
  }

  private analyzeLanguageStyle(content: string): ContentSuggestion[] {
    const suggestions: ContentSuggestion[] = [];

    // Check for unprofessional language
    COMPLIANCE_PATTERNS.unprofessional.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        suggestions.push({
          id: `style-${match.index}`,
          type: 'style',
          severity: 'warning',
          message: 'Consider using more professional language for institutional investors',
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          details: 'IPO prospectuses require formal, professional language appropriate for regulatory authorities and institutional investors.'
        });
      }
    });

    // Check for vague language
    COMPLIANCE_PATTERNS.vagueLanguage.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        suggestions.push({
          id: `vague-${match.index}`,
          type: 'enhancement',
          severity: 'suggestion',
          message: 'Be more specific with quantitative details',
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          details: 'Provide specific numbers, percentages, or timeframes instead of vague terms.'
        });
      }
    });

    return suggestions;
  }

  private analyzeCompliance(content: string, sectionType: string): ContentSuggestion[] {
    const suggestions: ContentSuggestion[] = [];

    // Check for missing citations
    const citationKeywords = ['listing rule', 'regulatory requirement', 'hkex'];
    citationKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      let match;
      while ((match = regex.exec(content)) !== null) {
        // Check if there's a proper citation nearby
        const surrounding = content.slice(Math.max(0, match.index - 50), match.index + 50);
        if (!/\b(App1A|Part A|Chapter \d+|Rule \d+|Section \d+)\b/i.test(surrounding)) {
          suggestions.push({
            id: `citation-${match.index}`,
            type: 'compliance',
            severity: 'warning',
            message: 'Add specific regulatory citation',
            startIndex: match.index,
            endIndex: match.index + match[0].length,
            details: 'Include specific HKEX Listing Rules references (e.g., App1A Part A, Chapter 9)',
            ruleReference: 'HKEX Listing Rules'
          });
        }
      }
    });

    return suggestions;
  }

  private analyzeDisclosures(content: string, sectionType: string): ContentSuggestion[] {
    const suggestions: ContentSuggestion[] = [];
    const requiredDisclosures = HKEX_DISCLOSURE_REQUIREMENTS[sectionType as keyof typeof HKEX_DISCLOSURE_REQUIREMENTS] || [];

    requiredDisclosures.forEach(disclosure => {
      const keywords = disclosure.split(' ');
      const hasDisclosure = keywords.some(keyword => 
        content.toLowerCase().includes(keyword.toLowerCase())
      );

      if (!hasDisclosure) {
        suggestions.push({
          id: `disclosure-${disclosure}`,
          type: 'disclosure',
          severity: 'error',
          message: `Missing required disclosure: ${disclosure}`,
          startIndex: 0,
          endIndex: 0,
          details: `HKEX requires disclosure of ${disclosure} in this section`,
          ruleReference: 'App1A Part A'
        });
      }
    });

    return suggestions;
  }

  private analyzeStructure(content: string): ContentSuggestion[] {
    const suggestions: ContentSuggestion[] = [];

    // Check paragraph length
    const paragraphs = content.split('\n\n');
    paragraphs.forEach((paragraph, index) => {
      const words = paragraph.trim().split(/\s+/).length;
      if (words > 150) {
        const startIndex = paragraphs.slice(0, index).join('\n\n').length;
        suggestions.push({
          id: `structure-para-${index}`,
          type: 'style',
          severity: 'suggestion',
          message: 'Consider breaking this paragraph into smaller sections',
          startIndex,
          endIndex: startIndex + paragraph.length,
          details: 'Long paragraphs can reduce readability. Consider breaking into 2-3 shorter paragraphs.'
        });
      }
    });

    return suggestions;
  }

  private calculateComplianceScore(content: string, sectionType: string, suggestions: ContentSuggestion[]): ComplianceScore {
    const errors = suggestions.filter(s => s.severity === 'error').length;
    const warnings = suggestions.filter(s => s.severity === 'warning').length;
    
    // Calculate category scores
    const disclosure = this.calculateDisclosureScore(content, sectionType);
    const language = this.calculateLanguageScore(suggestions);
    const structure = this.calculateStructureScore(suggestions);
    const citations = this.calculateCitationScore(suggestions);

    // Overall score weighted by importance
    const overall = Math.round(
      (disclosure * 0.4) + 
      (language * 0.3) + 
      (citations * 0.2) + 
      (structure * 0.1)
    );

    const missingDisclosures = suggestions
      .filter(s => s.type === 'disclosure')
      .map(s => s.message.replace('Missing required disclosure: ', ''));

    return {
      overall,
      categories: {
        disclosure,
        language,
        structure,
        citations
      },
      missingDisclosures,
      criticalIssues: errors
    };
  }

  private calculateDisclosureScore(content: string, sectionType: string): number {
    const required = HKEX_DISCLOSURE_REQUIREMENTS[sectionType as keyof typeof HKEX_DISCLOSURE_REQUIREMENTS] || [];
    if (required.length === 0) return 100;

    const covered = required.filter(disclosure => {
      const keywords = disclosure.split(' ');
      return keywords.some(keyword => 
        content.toLowerCase().includes(keyword.toLowerCase())
      );
    }).length;

    return Math.round((covered / required.length) * 100);
  }

  private calculateLanguageScore(suggestions: ContentSuggestion[]): number {
    const languageIssues = suggestions.filter(s => s.type === 'style').length;
    return Math.max(0, 100 - (languageIssues * 10));
  }

  private calculateStructureScore(suggestions: ContentSuggestion[]): number {
    const structureIssues = suggestions.filter(s => s.type === 'style' && s.message.includes('paragraph')).length;
    return Math.max(0, 100 - (structureIssues * 15));
  }

  private calculateCitationScore(suggestions: ContentSuggestion[]): number {
    const citationIssues = suggestions.filter(s => s.type === 'compliance').length;
    return Math.max(0, 100 - (citationIssues * 20));
  }

  private calculateReadabilityScore(content: string): number {
    // Simplified readability calculation
    const sentences = content.split(/[.!?]+/).length;
    const words = content.trim().split(/\s+/).length;
    const avgWordsPerSentence = words / sentences;
    
    // Score based on average sentence length (ideal: 15-20 words)
    if (avgWordsPerSentence >= 15 && avgWordsPerSentence <= 20) return 100;
    if (avgWordsPerSentence >= 10 && avgWordsPerSentence <= 25) return 80;
    return 60;
  }

  private hashContent(content: string): string {
    // Simple hash for caching
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  /**
   * Clear analysis cache
   */
  clearCache(): void {
    this.analysisCache.clear();
  }
}

export const realTimeAnalyzer = new RealTimeAnalyzer();