/**
 * Service for intelligent content summarization and bullet point generation
 */

import { ContentSection, IPOSectionType } from './contentAnalyzer';

export interface SummarizedSlide {
  title: string;
  bulletPoints: string[];
  keyMetrics?: string[];
  visualData?: VisualElement[];
  slideType: IPOSectionType;
}

export interface VisualElement {
  type: 'chart' | 'table' | 'highlight';
  title: string;
  data: any;
}

/**
 * Content summarizer for creating presentation-ready content
 */
export const contentSummarizer = {
  /**
   * Convert content sections into summarized slides
   */
  summarizeForPresentation(sections: ContentSection[]): SummarizedSlide[] {
    const slides: SummarizedSlide[] = [];
    
    for (const section of sections) {
      const summarizedSlide = this.createSlideFromSection(section);
      if (summarizedSlide) {
        slides.push(summarizedSlide);
      }
    }
    
    return slides;
  },

  /**
   * Create a slide from a content section
   */
  createSlideFromSection(section: ContentSection): SummarizedSlide | null {
    const bulletPoints = this.extractBulletPoints(section.content, section.type);
    
    if (bulletPoints.length === 0) {
      return null;
    }
    
    const visualData = this.createVisualElements(section);
    
    return {
      title: section.title,
      bulletPoints,
      keyMetrics: section.keyMetrics,
      visualData,
      slideType: section.type
    };
  },

  /**
   * Extract and create bullet points from content
   */
  extractBulletPoints(content: string, sectionType: IPOSectionType): string[] {
    const sentences = this.splitIntoSentences(content);
    const keyPoints = this.selectKeyPoints(sentences, sectionType);
    const bulletPoints = this.formatAsBulletPoints(keyPoints, sectionType);
    
    return bulletPoints.slice(0, 6); // Limit to 6 bullet points per slide
  },

  /**
   * Split content into sentences
   */
  splitIntoSentences(content: string): string[] {
    // Clean the content first
    const cleaned = content
      .replace(/\s+/g, ' ')
      .replace(/([.!?])\s*([A-Z])/g, '$1|$2')
      .trim();
    
    return cleaned
      .split('|')
      .map(s => s.trim())
      .filter(s => s.length > 20 && s.length < 200); // Filter reasonable sentence lengths
  },

  /**
   * Select key points based on importance scoring
   */
  selectKeyPoints(sentences: string[], sectionType: IPOSectionType): string[] {
    const scoredSentences = sentences.map(sentence => ({
      text: sentence,
      score: this.calculateSentenceScore(sentence, sectionType)
    }));
    
    // Sort by score and take top sentences
    return scoredSentences
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map(s => s.text);
  },

  /**
   * Calculate importance score for a sentence
   */
  calculateSentenceScore(sentence: string, sectionType: IPOSectionType): number {
    let score = 0;
    const lowerSentence = sentence.toLowerCase();
    
    // Base score for sentence length (sweet spot around 60-120 chars)
    const length = sentence.length;
    if (length >= 60 && length <= 120) {
      score += 10;
    } else if (length >= 30 && length <= 60) {
      score += 5;
    }
    
    // Boost for financial data
    if (sentence.match(/\$[\d,]+/) || sentence.match(/\d+(?:\.\d+)?%/)) {
      score += 15;
    }
    
    // Boost for numbers and metrics
    if (sentence.match(/\d+/)) {
      score += 5;
    }
    
    // Section-specific scoring
    switch (sectionType) {
      case 'executive_summary':
        if (lowerSentence.includes('investment') || lowerSentence.includes('opportunity') || 
            lowerSentence.includes('growth') || lowerSentence.includes('market leader')) {
          score += 20;
        }
        break;
        
      case 'financial_highlights':
        if (lowerSentence.includes('revenue') || lowerSentence.includes('profit') || 
            lowerSentence.includes('margin') || lowerSentence.includes('growth')) {
          score += 20;
        }
        break;
        
      case 'business_overview':
        if (lowerSentence.includes('business model') || lowerSentence.includes('competitive') || 
            lowerSentence.includes('strategy') || lowerSentence.includes('operations')) {
          score += 15;
        }
        break;
        
      case 'market_opportunity':
        if (lowerSentence.includes('market') || lowerSentence.includes('addressable') || 
            lowerSentence.includes('tam') || lowerSentence.includes('opportunity')) {
          score += 20;
        }
        break;
        
      case 'risk_factors':
        if (lowerSentence.includes('risk') || lowerSentence.includes('may') || 
            lowerSentence.includes('could') || lowerSentence.includes('uncertainty')) {
          score += 15;
        }
        break;
    }
    
    // Boost for action words and strong statements
    const actionWords = ['will', 'plans to', 'expects to', 'aims to', 'positioned to', 'committed to'];
    if (actionWords.some(word => lowerSentence.includes(word))) {
      score += 10;
    }
    
    // Penalty for very common words
    if (lowerSentence.includes('however') || lowerSentence.includes('furthermore') || 
        lowerSentence.includes('moreover')) {
      score -= 5;
    }
    
    return score;
  },

  /**
   * Format sentences as presentation-friendly bullet points
   */
  formatAsBulletPoints(sentences: string[], sectionType: IPOSectionType): string[] {
    return sentences.map(sentence => {
      let formatted = sentence;
      
      // Remove introductory phrases
      formatted = formatted.replace(/^(Additionally|Furthermore|Moreover|However|Therefore),?\s*/i, '');
      
      // Capitalize first letter
      formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);
      
      // Ensure it ends with appropriate punctuation
      if (!formatted.match(/[.!?]$/)) {
        formatted += '.';
      }
      
      // Make it more concise for bullet points
      formatted = this.makeConcise(formatted, sectionType);
      
      return formatted;
    });
  },

  /**
   * Make bullet points more concise and punchy
   */
  makeConcise(text: string, sectionType: IPOSectionType): string {
    let concise = text;
    
    // Remove redundant phrases
    const redundantPhrases = [
      'It is important to note that',
      'It should be noted that',
      'We believe that',
      'The Company expects that',
      'The management team believes'
    ];
    
    for (const phrase of redundantPhrases) {
      concise = concise.replace(new RegExp(phrase, 'gi'), '');
    }
    
    // Convert to more direct language
    concise = concise
      .replace(/in order to/gi, 'to')
      .replace(/due to the fact that/gi, 'because')
      .replace(/a significant number of/gi, 'many')
      .replace(/has the ability to/gi, 'can')
      .replace(/is in a position to/gi, 'can');
    
    // Clean up spacing
    concise = concise.replace(/\s+/g, ' ').trim();
    
    return concise;
  },

  /**
   * Create visual elements from section data
   */
  createVisualElements(section: ContentSection): VisualElement[] {
    const visualElements: VisualElement[] = [];
    
    // Create financial charts if financial data exists
    if (section.financialData && section.financialData.length > 0) {
      visualElements.push({
        type: 'chart',
        title: 'Financial Performance',
        data: section.financialData
      });
    }
    
    // Create metric highlights
    if (section.keyMetrics && section.keyMetrics.length > 0) {
      visualElements.push({
        type: 'highlight',
        title: 'Key Metrics',
        data: section.keyMetrics.slice(0, 4) // Top 4 metrics
      });
    }
    
    return visualElements;
  },

  /**
   * Create an executive summary slide with key investment highlights
   */
  createExecutiveSummary(sections: ContentSection[]): SummarizedSlide {
    const executiveSection = sections.find(s => s.type === 'executive_summary');
    const financialSection = sections.find(s => s.type === 'financial_highlights');
    const businessSection = sections.find(s => s.type === 'business_overview');
    
    const bulletPoints: string[] = [];
    
    // Add key investment thesis points
    if (executiveSection) {
      const keyPoints = this.extractBulletPoints(executiveSection.content, 'executive_summary');
      bulletPoints.push(...keyPoints.slice(0, 2));
    }
    
    // Add top financial highlight
    if (financialSection && financialSection.keyMetrics) {
      bulletPoints.push(`Strong financial performance: ${financialSection.keyMetrics[0]}`);
    }
    
    // Add business highlight
    if (businessSection) {
      const businessPoints = this.extractBulletPoints(businessSection.content, 'business_overview');
      if (businessPoints.length > 0) {
        bulletPoints.push(businessPoints[0]);
      }
    }
    
    // Gather all key metrics
    const allMetrics = sections
      .flatMap(s => s.keyMetrics || [])
      .slice(0, 4);
    
    return {
      title: 'Investment Highlights',
      bulletPoints: bulletPoints.slice(0, 4),
      keyMetrics: allMetrics,
      visualData: [],
      slideType: 'executive_summary'
    };
  }
};