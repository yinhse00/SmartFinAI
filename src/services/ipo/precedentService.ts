import { supabase } from '@/integrations/supabase/client';

export interface PrecedentCase {
  id: string;
  companyName: string;
  prospectusDate: string;
  industry: string;
  sectionType: string;
  content: string;
  keyInsights: string[];
  regulatoryReferences: string[];
}

export interface PrecedentSearchResult {
  cases: PrecedentCase[];
  totalFound: number;
  searchCriteria: string;
}

export class PrecedentService {
  /**
   * Find relevant precedent cases based on section type and industry
   */
  async findRelevantPrecedents(
    sectionType: string,
    industry?: string,
    limit: number = 3
  ): Promise<PrecedentSearchResult> {
    try {
      let query = supabase
        .from('ipo_section_business_templates')
        .select('*')
        .limit(limit);

      // Add industry filter if provided
      if (industry) {
        query = query.eq('business Nature', industry);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching precedent cases:', error);
        return {
          cases: [],
          totalFound: 0,
          searchCriteria: `${sectionType}${industry ? ` in ${industry}` : ''}`
        };
      }

      const cases: PrecedentCase[] = (data || []).map(template => ({
        id: template.id,
        companyName: this.extractCompanyName(template['Company Name'] || 'Unknown Company'),
        prospectusDate: this.extractDate(template['date of prospectus'] || template.created_at),
        industry: template['business Nature'] || 'General',
        sectionType: sectionType,
        content: template['Overview'] || '',
        keyInsights: this.extractKeyInsights(template),
        regulatoryReferences: []
      }));

      return {
        cases,
        totalFound: cases.length,
        searchCriteria: `${sectionType}${industry ? ` in ${industry}` : ''}`
      };

    } catch (error) {
      console.error('Precedent search failed:', error);
      return {
        cases: [],
        totalFound: 0,
        searchCriteria: `${sectionType}${industry ? ` in ${industry}` : ''}`
      };
    }
  }

  /**
   * Extract company name from template name
   */
  private extractCompanyName(templateName: string): string {
    // Extract company name from template naming patterns
    const patterns = [
      /^([^-]+)/,  // Everything before first dash
      /([A-Za-z\s]+)(?:\s+(?:Limited|Ltd|Corporation|Corp|Inc|Group|Holdings))/i,
      /^(.+?)(?:\s+Template|\s+Section|\s+IPO)/i
    ];

    for (const pattern of patterns) {
      const match = templateName.match(pattern);
      if (match && match[1].trim().length > 2) {
        return match[1].trim();
      }
    }

    return templateName.substring(0, 30) + '...';
  }

  /**
   * Extract and format date from timestamp
   */
  private extractDate(timestamp: string): string {
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long'
      });
    } catch {
      return 'Date Unknown';
    }
  }

  /**
   * Extract key insights from template content
   */
  private extractKeyInsights(template: any): string[] {
    const insights: string[] = [];

    // Extract insights from various template fields
    if (template['Competitive Strengths']) {
      insights.push('Competitive positioning strategies');
    }
    if (template['Business Strategies']) {
      insights.push('Strategic business approaches');
    }
    if (template['Business Model']) {
      insights.push('Business model framework');
    }

    // Add default insights if none found
    if (insights.length === 0) {
      insights.push('Professional IPO disclosure format');
      insights.push('Regulatory compliance structure');
    }

    return insights.slice(0, 3);
  }


  /**
   * Format precedent cases for display in AI responses
   */
  formatPrecedentsForAI(precedents: PrecedentCase[]): string {
    if (precedents.length === 0) {
      return 'No specific precedent cases found, but I will apply general IPO best practices.';
    }

    return precedents.map(precedent => 
      `**${precedent.companyName}** (${precedent.prospectusDate})\n` +
      `Industry: ${precedent.industry}\n` +
      `Key insights: ${precedent.keyInsights.join(', ')}`
    ).join('\n\n');
  }
}

export const precedentService = new PrecedentService();