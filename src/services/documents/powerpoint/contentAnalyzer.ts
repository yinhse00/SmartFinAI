/**
 * Service for intelligent content analysis and IPO section detection
 */

export interface ContentSection {
  type: IPOSectionType;
  title: string;
  content: string;
  priority: number;
  keyMetrics?: string[];
  financialData?: FinancialData[];
}

export interface FinancialData {
  metric: string;
  value: string;
  period?: string;
  change?: string;
}

export type IPOSectionType = 
  | 'executive_summary'
  | 'business_overview' 
  | 'financial_highlights'
  | 'market_opportunity'
  | 'risk_factors'
  | 'use_of_proceeds'
  | 'management_team'
  | 'competitive_advantages'
  | 'general';

/**
 * Content analyzer for IPO documents
 */
export const contentAnalyzer = {
  /**
   * Analyze content and detect IPO sections
   */
  analyzeContent(content: string): ContentSection[] {
    const sections: ContentSection[] = [];
    
    // Split content into logical sections based on headings and structure
    const contentParts = this.splitIntoSections(content);
    
    for (const part of contentParts) {
      const sectionType = this.detectSectionType(part.title, part.content);
      const keyMetrics = this.extractKeyMetrics(part.content);
      const financialData = this.extractFinancialData(part.content);
      const priority = this.calculateSectionPriority(sectionType, part.content);
      
      sections.push({
        type: sectionType,
        title: part.title,
        content: part.content,
        priority,
        keyMetrics,
        financialData
      });
    }
    
    // Sort by priority (higher priority first)
    return sections.sort((a, b) => b.priority - a.priority);
  },

  /**
   * Split content into logical sections
   */
  splitIntoSections(content: string): Array<{ title: string; content: string }> {
    // Look for headings (marked with # or common heading patterns)
    const headingPattern = /(?:^|\n)(#{1,3}\s*.*?$|(?:executive summary|business overview|financial highlights|market opportunity|risk factors|use of proceeds|management|competitive|strategy).*?$)/gmi;
    
    const sections: Array<{ title: string; content: string }> = [];
    let lastIndex = 0;
    let lastTitle = 'Introduction';
    
    const matches = Array.from(content.matchAll(headingPattern));
    
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const currentIndex = match.index || 0;
      
      // Add the previous section
      if (i > 0 || lastIndex > 0) {
        const sectionContent = content.slice(lastIndex, currentIndex).trim();
        if (sectionContent) {
          sections.push({
            title: lastTitle,
            content: sectionContent
          });
        }
      }
      
      lastTitle = match[1].replace(/^#+\s*/, '').trim();
      lastIndex = currentIndex + match[0].length;
    }
    
    // Add the final section
    const finalContent = content.slice(lastIndex).trim();
    if (finalContent) {
      sections.push({
        title: lastTitle,
        content: finalContent
      });
    }
    
    // If no sections found, treat entire content as one section
    if (sections.length === 0) {
      sections.push({
        title: 'Document Content',
        content: content
      });
    }
    
    return sections;
  },

  /**
   * Detect the type of IPO section based on title and content
   */
  detectSectionType(title: string, content: string): IPOSectionType {
    const titleLower = title.toLowerCase();
    const contentLower = content.toLowerCase();
    
    // Executive Summary
    if (titleLower.includes('executive') || titleLower.includes('summary') || 
        titleLower.includes('overview') && contentLower.includes('investment')) {
      return 'executive_summary';
    }
    
    // Business Overview
    if (titleLower.includes('business') || titleLower.includes('company') ||
        titleLower.includes('operations') || contentLower.includes('revenue model')) {
      return 'business_overview';
    }
    
    // Financial Highlights
    if (titleLower.includes('financial') || titleLower.includes('performance') ||
        contentLower.includes('revenue') || contentLower.includes('profit') ||
        contentLower.match(/\$[\d,]+/)) {
      return 'financial_highlights';
    }
    
    // Market Opportunity
    if (titleLower.includes('market') || titleLower.includes('opportunity') ||
        titleLower.includes('addressable') || contentLower.includes('tam')) {
      return 'market_opportunity';
    }
    
    // Risk Factors
    if (titleLower.includes('risk') || titleLower.includes('factors') ||
        contentLower.includes('may adversely') || contentLower.includes('uncertainty')) {
      return 'risk_factors';
    }
    
    // Use of Proceeds
    if (titleLower.includes('proceeds') || titleLower.includes('use of') ||
        contentLower.includes('funds will be used')) {
      return 'use_of_proceeds';
    }
    
    // Management Team
    if (titleLower.includes('management') || titleLower.includes('team') ||
        titleLower.includes('leadership') || contentLower.includes('ceo')) {
      return 'management_team';
    }
    
    // Competitive Advantages
    if (titleLower.includes('competitive') || titleLower.includes('advantage') ||
        titleLower.includes('differentiation') || contentLower.includes('moat')) {
      return 'competitive_advantages';
    }
    
    return 'general';
  },

  /**
   * Extract key metrics from content
   */
  extractKeyMetrics(content: string): string[] {
    const metrics: string[] = [];
    
    // Financial metrics
    const financialRegex = /(?:revenue|profit|margin|growth|market share|customers?|users?|subscriptions?)[:\s]*[\$\d,\.%]+/gi;
    const financialMatches = content.match(financialRegex);
    if (financialMatches) {
      metrics.push(...financialMatches.slice(0, 5)); // Limit to top 5
    }
    
    // Percentage metrics
    const percentageRegex = /\d+(?:\.\d+)?%/g;
    const percentageMatches = content.match(percentageRegex);
    if (percentageMatches) {
      metrics.push(...percentageMatches.slice(0, 3));
    }
    
    // Dollar amounts
    const dollarRegex = /\$[\d,]+(?:\.\d+)?(?:\s*(?:million|billion|thousand|M|B|K))?/gi;
    const dollarMatches = content.match(dollarRegex);
    if (dollarMatches) {
      metrics.push(...dollarMatches.slice(0, 3));
    }
    
    return [...new Set(metrics)]; // Remove duplicates
  },

  /**
   * Extract financial data from content
   */
  extractFinancialData(content: string): FinancialData[] {
    const financialData: FinancialData[] = [];
    
    // Pattern for revenue/financial statements
    const financialPattern = /(?:revenue|profit|ebitda|gross margin)[:\s]*\$?([\d,]+(?:\.\d+)?)\s*(?:million|billion|thousand|M|B|K)?\s*(?:for|in)?\s*(\d{4})?/gi;
    
    let match;
    while ((match = financialPattern.exec(content)) !== null && financialData.length < 10) {
      financialData.push({
        metric: match[0].split(':')[0].trim(),
        value: match[1],
        period: match[2] || undefined
      });
    }
    
    return financialData;
  },

  /**
   * Calculate section priority for presentation ordering
   */
  calculateSectionPriority(sectionType: IPOSectionType, content: string): number {
    const basePriorities: Record<IPOSectionType, number> = {
      executive_summary: 100,
      financial_highlights: 90,
      business_overview: 80,
      market_opportunity: 70,
      competitive_advantages: 60,
      use_of_proceeds: 50,
      management_team: 40,
      risk_factors: 30,
      general: 20
    };
    
    let priority = basePriorities[sectionType];
    
    // Boost priority for sections with financial data
    if (content.match(/\$[\d,]+/) || content.match(/\d+%/)) {
      priority += 10;
    }
    
    // Boost priority for longer, more detailed sections
    if (content.length > 1000) {
      priority += 5;
    }
    
    return priority;
  }
};