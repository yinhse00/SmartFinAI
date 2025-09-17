import { pipeline, env } from '@huggingface/transformers';

// Disable local model loading for production
env.allowLocalModels = false;

export interface QualitativeFactor {
  factor: string;
  description: string;
  material: boolean;
  confidence: number;
  section: string;
}

export interface NLPExtractionResult {
  qualitativeFactors: QualitativeFactor[];
  periods: string[];
  currency: string;
  auditStatus: string;
  riskSections: string[];
}

class FinancialNLPService {
  private classifier: any = null;
  private initialized = false;

  async initialize() {
    if (this.initialized) return;
    
    try {
      console.log('🤖 Initializing NLP classifier...');
      // Use DistilBERT for text classification - faster and efficient
      this.classifier = await pipeline(
        'text-classification', 
        'distilbert-base-uncased-finetuned-sst-2-english',
        { device: 'webgpu' }
      );
      this.initialized = true;
      console.log('✅ NLP classifier initialized');
    } catch (error) {
      console.warn('⚠️ WebGPU not available, falling back to CPU:', error);
      try {
        this.classifier = await pipeline(
          'text-classification', 
          'distilbert-base-uncased-finetuned-sst-2-english'
        );
        this.initialized = true;
        console.log('✅ NLP classifier initialized on CPU');
      } catch (fallbackError) {
        console.error('❌ Failed to initialize NLP classifier:', fallbackError);
        throw new Error('Failed to initialize NLP classifier');
      }
    }
  }

  async extractQualitativeFactors(documentText: string): Promise<NLPExtractionResult> {
    await this.initialize();

    const sections = this.splitIntoSections(documentText);
    const qualitativeFactors: QualitativeFactor[] = [];
    const riskSections: string[] = [];

    // Extract periods dynamically
    const periods = this.extractPeriods(documentText);
    
    // Extract currency information
    const currency = this.extractCurrency(documentText);
    
    // Extract audit status
    const auditStatus = this.extractAuditStatus(documentText, periods);

    // Process each section for qualitative content
    for (const section of sections) {
      const sectionType = await this.classifySection(section);
      
      if (sectionType.isRiskSection || sectionType.isManagementDiscussion) {
        const factors = await this.extractRiskFactors(section, sectionType.category);
        qualitativeFactors.push(...factors);
        
        if (sectionType.isRiskSection) {
          riskSections.push(section.substring(0, 200) + '...');
        }
      }
    }

    console.log(`📊 NLP extracted ${qualitativeFactors.length} qualitative factors from ${sections.length} sections`);

    return {
      qualitativeFactors,
      periods,
      currency,
      auditStatus,
      riskSections
    };
  }

  private splitIntoSections(text: string): string[] {
    // Split by common section headers and double line breaks
    const sectionBreaks = [
      /\n\s*(?:RISK FACTORS?|BUSINESS OVERVIEW|MANAGEMENT.?S DISCUSSION|MD&A|FINANCIAL INFORMATION|OPERATIONS|STRATEGY)\s*\n/gi,
      /\n\s*\d+\.\s+[A-Z][^.]*\n/g, // Numbered sections
      /\n\s*[A-Z][A-Z\s]{10,}\n/g,  // All caps headers
      /\n\n\n+/g // Triple line breaks
    ];

    let sections = [text];
    
    for (const breakPattern of sectionBreaks) {
      const newSections: string[] = [];
      for (const section of sections) {
        newSections.push(...section.split(breakPattern));
      }
      sections = newSections.filter(s => s.trim().length > 100); // Minimum section length
    }

    return sections.slice(0, 20); // Limit to first 20 sections for performance
  }

  private async classifySection(sectionText: string): Promise<{
    isRiskSection: boolean;
    isManagementDiscussion: boolean;
    category: string;
    confidence: number;
  }> {
    const lowerText = sectionText.toLowerCase();
    
    // Pattern-based classification for financial documents
    const riskKeywords = [
      'risk', 'uncertainty', 'adverse', 'impact', 'material adverse', 
      'concentration', 'dependency', 'litigation', 'regulatory', 'competition'
    ];
    
    const managementKeywords = [
      'management discussion', 'md&a', 'analysis', 'performance', 
      'results of operations', 'financial condition', 'liquidity'
    ];

    const riskScore = riskKeywords.reduce((score, keyword) => 
      score + (lowerText.includes(keyword) ? 1 : 0), 0) / riskKeywords.length;
    
    const mgmtScore = managementKeywords.reduce((score, keyword) => 
      score + (lowerText.includes(keyword) ? 1 : 0), 0) / managementKeywords.length;

    // Use AI classifier for additional validation
    let aiConfidence = 0.5;
    try {
      if (this.classifier) {
        const result = await this.classifier(sectionText.substring(0, 512)); // Limit input length
        aiConfidence = result[0]?.score || 0.5;
      }
    } catch (error) {
      console.warn('AI classification failed, using pattern-based approach:', error);
    }

    const isRiskSection = riskScore > 0.3 || lowerText.includes('risk factor');
    const isManagementDiscussion = mgmtScore > 0.3 || lowerText.includes('md&a');

    return {
      isRiskSection,
      isManagementDiscussion,
      category: isRiskSection ? 'risk' : isManagementDiscussion ? 'management' : 'other',
      confidence: Math.max(riskScore, mgmtScore, aiConfidence * 0.5)
    };
  }

  private async extractRiskFactors(sectionText: string, category: string): Promise<QualitativeFactor[]> {
    const factors: QualitativeFactor[] = [];
    
    // Extract risk factors using pattern matching
    const riskPatterns = [
      // Customer concentration
      /(?:customer|client)\s+concentration[\s\S]{0,200}/gi,
      // Regulatory risks
      /regulatory[\s\S]{0,200}(?:risk|impact|adverse)/gi,
      // Competition risks
      /competit(?:ion|ive)[\s\S]{0,200}(?:risk|pressure|threat)/gi,
      // Technology risks
      /technology[\s\S]{0,200}(?:risk|obsolescence|disruption)/gi,
      // Market risks
      /market[\s\S]{0,200}(?:risk|volatility|downturn)/gi,
      // Operational risks
      /operational[\s\S]{0,200}(?:risk|failure|disruption)/gi
    ];

    for (const pattern of riskPatterns) {
      const matches = sectionText.match(pattern);
      if (matches) {
        for (const match of matches) {
          const cleanedMatch = match.replace(/\s+/g, ' ').trim();
          if (cleanedMatch.length > 20) {
            const factor = this.extractFactorName(cleanedMatch);
            factors.push({
              factor,
              description: cleanedMatch.substring(0, 500),
              material: this.assessMateriality(cleanedMatch),
              confidence: 0.8,
              section: category
            });
          }
        }
      }
    }

    // Extract general risk statements
    const sentences = sectionText.split(/[.!?]+/).filter(s => s.trim().length > 30);
    for (const sentence of sentences.slice(0, 10)) { // Limit processing
      if (this.isRiskSentence(sentence)) {
        const factor = this.extractFactorName(sentence);
        if (factor && !factors.some(f => f.factor === factor)) {
          factors.push({
            factor,
            description: sentence.trim(),
            material: this.assessMateriality(sentence),
            confidence: 0.6,
            section: category
          });
        }
      }
    }

    return factors.slice(0, 5); // Limit to top 5 factors per section
  }

  private extractFactorName(text: string): string {
    // Extract the main subject/factor from the text
    const words = text.split(/\s+/).slice(0, 5);
    
    // Common factor patterns
    const factorPatterns = [
      /customer\s+concentration/i,
      /regulatory\s+(?:risk|compliance)/i,
      /market\s+competition/i,
      /technology\s+(?:risk|obsolescence)/i,
      /operational\s+risk/i,
      /liquidity\s+risk/i,
      /credit\s+risk/i
    ];

    for (const pattern of factorPatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[0];
      }
    }

    // Fallback: use first few meaningful words
    return words.filter(w => w.length > 3).slice(0, 3).join(' ');
  }

  private isRiskSentence(sentence: string): boolean {
    const riskIndicators = [
      'may result in', 'could impact', 'adverse effect', 'significant risk',
      'material adverse', 'uncertainty', 'depends on', 'subject to'
    ];
    
    const lowerSentence = sentence.toLowerCase();
    return riskIndicators.some(indicator => lowerSentence.includes(indicator));
  }

  private assessMateriality(text: string): boolean {
    const materialityIndicators = [
      'material', 'significant', 'substantial', 'major', 'critical',
      'adverse', 'severe', 'substantial impact'
    ];
    
    const lowerText = text.toLowerCase();
    return materialityIndicators.some(indicator => lowerText.includes(indicator));
  }

  private extractPeriods(text: string): string[] {
    const periodPatterns = [
      // Year only: 2023, 2024
      /\b(20\d{2})\b/g,
      // Year ended: Year ended 31 December 2023
      /Year ended \d{1,2} (?:January|February|March|April|May|June|July|August|September|October|November|December) (20\d{2})/gi,
      // Half year: 2023H1, 2024H2
      /\b(20\d{2}H[12])\b/g,
      // Quarter: 2023Q1, 2024Q4
      /\b(20\d{2}Q[1-4])\b/g,
      // Month year: Dec 2023, December 2024
      /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* (20\d{2})/gi
    ];

    const allPeriods = new Set<string>();
    
    for (const pattern of periodPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        let period = match[1] || match[0];
        
        // Normalize periods
        if (period.includes('Year ended')) {
          period = period.match(/20\d{2}/)?.[0] || period;
        }
        
        if (period.match(/^20\d{2}$/)) {
          allPeriods.add(period);
        } else if (period.match(/^20\d{2}[HQ]\d$/)) {
          allPeriods.add(period);
        }
      }
    }

    // Sort periods chronologically
    return Array.from(allPeriods).sort();
  }

  private extractCurrency(text: string): string {
    const currencyPatterns = [
      /(?:RMB|CNY).?000/i,
      /(?:USD|US\$).?000/i,
      /(?:HKD|HK\$).?000/i,
      /(?:GBP|£).?000/i,
      /(?:EUR|€).?000/i
    ];

    for (const pattern of currencyPatterns) {
      const match = text.match(pattern);
      if (match) {
        const currency = match[0].match(/RMB|CNY|USD|US\$|HKD|HK\$|GBP|£|EUR|€/i)?.[0];
        return currency?.toUpperCase().replace('$', '') || 'Unknown';
      }
    }

    return 'Unknown';
  }

  private extractAuditStatus(text: string, periods: string[]): string {
    const unauditedIndicators = [
      'unaudited', 'preliminary', 'management accounts', 'draft',
      'subject to audit', 'not yet audited'
    ];

    const auditedIndicators = [
      'audited', 'certified', 'verified', 'final accounts'
    ];

    const lowerText = text.toLowerCase();
    
    // Check if any periods are marked as unaudited
    const hasUnauditedPeriods = periods.some(period => 
      lowerText.includes(period.toLowerCase() + '_unaudited') ||
      lowerText.includes(period.toLowerCase() + ' unaudited')
    );

    if (hasUnauditedPeriods) return 'mixed';

    const unauditedScore = unauditedIndicators.reduce((score, indicator) => 
      score + (lowerText.includes(indicator) ? 1 : 0), 0);
    
    const auditedScore = auditedIndicators.reduce((score, indicator) => 
      score + (lowerText.includes(indicator) ? 1 : 0), 0);

    if (unauditedScore > auditedScore) return 'unaudited';
    if (auditedScore > unauditedScore) return 'audited';
    return 'unknown';
  }
}

export const financialNLPService = new FinancialNLPService();