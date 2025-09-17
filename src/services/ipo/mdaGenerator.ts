import { supabase } from '@/integrations/supabase/client';
import { getFeatureAIPreference } from '../ai/aiPreferences';
import { CentralBrainService } from '../brain/centralBrainService';
import { EnhancedMaterialityItem } from '../financial/enhancedMaterialityAnalyzer';

export interface MDAGenerationRequest {
  projectId: string;
  selectedItems: EnhancedMaterialityItem[];
  qualitativeItems: Array<{
    factor: string;
    description: string;
    material: boolean;
  }>;
  financialData: {
    totalRevenue?: number;
    totalAssets?: number;
    totalLiabilities?: number;
    periods: string[];
    currency: string;
    auditStatus: string;
  };
  businessContext?: any;
}

export interface MDAGenerationResponse {
  content: string;
  wordCount: number;
  sections: string[];
  complianceNotes: string[];
  generatedAt: string;
}

class MDAGeneratorService {
  async generateMDA(request: MDAGenerationRequest): Promise<MDAGenerationResponse> {
    console.log('🎯 Starting HKEX-compliant MD&A generation...');
    
    const preferences = getFeatureAIPreference('ipo');
    
    // Build comprehensive prompt for MD&A generation
    const prompt = this.buildMDAPrompt(request);
    
    try {
      const response = await CentralBrainService.processContentGeneration(
        prompt,
        {
          preferences,
          feature: 'mda_generation',
          outputFormat: 'markdown',
          wordCount: { min: 1200, max: 1800, target: 1500 }
        }
      );

      if (!response.success) {
        throw new Error('MD&A generation failed');
      }

      const content = response.content;
      const wordCount = this.countWords(content);
      const sections = this.extractSections(content);
      const complianceNotes = this.generateComplianceNotes(request);

      const mdaResponse: MDAGenerationResponse = {
        content,
        wordCount,
        sections,
        complianceNotes,
        generatedAt: new Date().toISOString()
      };

      // Save MD&A to database
      await this.saveMDA(request.projectId, mdaResponse);

      console.log(`✅ MD&A generated: ${wordCount} words, ${sections.length} sections`);
      
      return mdaResponse;
    } catch (error) {
      console.error('❌ MD&A generation failed:', error);
      throw new Error(`Failed to generate MD&A: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildMDAPrompt(request: MDAGenerationRequest): string {
    const { selectedItems, qualitativeItems, financialData, businessContext } = request;
    
    // Filter items by materiality and type
    const materialFinancialItems = selectedItems.filter(item => item.isMaterial && item.itemType !== 'qualitative_item');
    const materialQualitativeItems = qualitativeItems.filter(item => item.material);
    
    const prompt = `
You are an expert IPO prospectus drafter specializing in HKEX-compliant Management Discussion and Analysis (MD&A) sections. Generate a comprehensive MD&A focusing ONLY on the selected material items.

**CRITICAL REQUIREMENTS:**
- 1200-1800 words total
- Focus exclusively on selected material items
- Use exact periods from data: ${financialData.periods.join(', ')}
- Currency: ${financialData.currency}'000
- HKEX regulatory compliance
- Professional tone with forward-looking disclaimers

**FINANCIAL DATA:**
- Periods: ${financialData.periods.join(', ')}
- Currency: ${financialData.currency}
- Audit Status: ${financialData.auditStatus}
- Total Revenue: ${financialData.totalRevenue?.toLocaleString() || 'N/A'}
- Total Assets: ${financialData.totalAssets?.toLocaleString() || 'N/A'}

**SELECTED MATERIAL FINANCIAL ITEMS:**
${materialFinancialItems.map(item => `
- ${item.itemName} (${item.section}):
  * Amount: ${item.amount.toLocaleString()}
  * Percentage of base: ${item.percentage.toFixed(1)}%
  * YoY Change: ${item.yoyPercentage ? `${item.yoyPercentage > 0 ? '+' : ''}${item.yoyPercentage.toFixed(1)}%` : 'N/A'}
  * AI Reasoning: ${item.aiReasoning}
`).join('\n')}

**MATERIAL QUALITATIVE FACTORS:**
${materialQualitativeItems.map(item => `
- ${item.factor}: ${item.description}
`).join('\n')}

**BUSINESS CONTEXT:**
${businessContext?.businessContent || 'Technology-driven marketing and advertising services company'}

**REQUIRED MD&A STRUCTURE:**
Generate exactly these sections, focusing on selected material items:

## Management Discussion and Analysis

### Overview
- Brief business summary (100-150 words)
- Table of selected material items with key metrics
- Overall performance summary for ${financialData.periods.slice(-2).join(' to ')}

### Basis of Presentation
- Accounting standards and policies (80-100 words)
- Currency and reporting basis
- Audit status: ${financialData.auditStatus}

${materialFinancialItems.filter(item => item.section === 'P/L').length > 0 ? `
### Revenue Analysis
${materialFinancialItems.filter(item => item.itemName.toLowerCase().includes('revenue')).map(item => `
**${item.itemName}**
- Analysis of ${item.percentage.toFixed(1)}% materiality
- YoY change: ${item.yoyPercentage ? `${item.yoyPercentage.toFixed(1)}%` : 'N/A'}
- Business drivers and market factors
- Forward-looking implications
`).join('\n')}
` : ''}

${materialFinancialItems.filter(item => item.itemName.toLowerCase().includes('cost') || item.itemName.toLowerCase().includes('expense')).length > 0 ? `
### Cost Structure Analysis
${materialFinancialItems.filter(item => item.itemName.toLowerCase().includes('cost') || item.itemName.toLowerCase().includes('expense')).map(item => `
**${item.itemName}**
- Analysis of ${item.percentage.toFixed(1)}% of base
- Period-over-period changes
- Cost management initiatives
- Efficiency improvements
`).join('\n')}
` : ''}

${materialFinancialItems.filter(item => item.section === 'BS').length > 0 ? `
### Balance Sheet Analysis
${materialFinancialItems.filter(item => item.section === 'BS').map(item => `
**${item.itemName}**
- Represents ${item.percentage.toFixed(1)}% of relevant base
- Asset/liability management approach
- Liquidity and capital adequacy
- Risk management considerations
`).join('\n')}
` : ''}

${materialQualitativeItems.length > 0 ? `
### Key Risk Factors and Business Considerations
${materialQualitativeItems.map(item => `
**${item.factor}**
${item.description}

Management assessment and mitigation strategies.
`).join('\n')}
` : ''}

### Financial Ratios and Metrics
- Key performance indicators for selected material items
- Comparative analysis across ${financialData.periods.join(', ')}
- Industry benchmarking where relevant

### Liquidity and Capital Resources
- Cash flow implications of material items
- Working capital management
- Capital expenditure plans related to material items

### Recent Developments and Outlook
- Recent events affecting material items
- Management's forward-looking assessment
- Expected trends for ${new Date().getFullYear() + 1}

### No Material Adverse Change
Standard statement regarding no material adverse changes since ${financialData.periods.slice(-1)[0]}.

**CRITICAL FORMATTING:**
- Use Markdown headers (##, ###)
- Include tables where appropriate
- Add disclaimers: "This MD&A should be read in conjunction with our audited financial statements and notes thereto included in Appendix I of this prospectus."
- Forward-looking statements disclaimer
- Currency notation: ${financialData.currency}'000

**OUTPUT FORMAT:**
Provide only the MD&A content in Markdown format. Do not include explanations or meta-commentary.
`;

    return prompt;
  }

  private countWords(content: string): number {
    // Remove markdown formatting and count words
    const cleanContent = content
      .replace(/#{1,6}\s/g, '') // Remove headers
      .replace(/\*\*|\*/g, '') // Remove bold/italic
      .replace(/\|.*\|/g, '') // Remove table rows
      .replace(/\n+/g, ' ') // Replace newlines with spaces
      .trim();
    
    return cleanContent.split(/\s+/).filter(word => word.length > 0).length;
  }

  private extractSections(content: string): string[] {
    const headerRegex = /^#{2,3}\s+(.+)$/gm;
    const sections: string[] = [];
    let match;
    
    while ((match = headerRegex.exec(content)) !== null) {
      sections.push(match[1]);
    }
    
    return sections;
  }

  private generateComplianceNotes(request: MDAGenerationRequest): string[] {
    const notes: string[] = [];
    
    notes.push('MD&A generated based on selected material items only');
    notes.push('Complies with HKEX Listing Rules requirements');
    notes.push('Includes forward-looking disclaimers and risk factors');
    notes.push(`Generated for periods: ${request.financialData.periods.join(', ')}`);
    
    if (request.financialData.auditStatus === 'unaudited') {
      notes.push('Contains unaudited financial information - appropriate disclaimers included');
    }
    
    if (request.selectedItems.some(item => (item as any).yoyPercentage && Math.abs((item as any).yoyPercentage) >= 20)) {
      notes.push('Significant year-over-year changes addressed in analysis');
    }
    
    return notes;
  }

  private async saveMDA(projectId: string, mdaResponse: MDAGenerationResponse): Promise<void> {
    try {
      // Check if MD&A draft already exists
      const { data: existingDraft } = await supabase
        .from('ipo_prospectus_sections')
        .select('id')
        .eq('project_id', projectId)
        .eq('section_type', 'management_discussion_analysis')
        .single();

      const sectionData = {
        project_id: projectId,
        section_type: 'management_discussion_analysis',
        title: 'Management Discussion and Analysis',
        content: mdaResponse.content,
        status: 'draft' as const,
        metadata: {
          wordCount: mdaResponse.wordCount,
          sections: mdaResponse.sections,
          complianceNotes: mdaResponse.complianceNotes,
          generatedAt: mdaResponse.generatedAt
        }
      };

      if (existingDraft) {
        // Update existing draft
        const { error } = await supabase
          .from('ipo_prospectus_sections')
          .update(sectionData)
          .eq('id', existingDraft.id);

        if (error) throw error;
      } else {
        // Create new draft
        const { error } = await supabase
          .from('ipo_prospectus_sections')
          .insert(sectionData);

        if (error) throw error;
      }

      console.log('✅ MD&A saved to database');
    } catch (error) {
      console.error('❌ Failed to save MD&A:', error);
      throw new Error('Failed to save MD&A to database');
    }
  }

  async getMDA(projectId: string): Promise<MDAGenerationResponse | null> {
    try {
      const { data, error } = await supabase
        .from('ipo_prospectus_sections')
        .select('*')
        .eq('project_id', projectId)
        .eq('section_type', 'management_discussion_analysis')
        .single();

      if (error || !data) {
        return null;
      }

      return {
        content: data.content || '',
        wordCount: data.metadata?.wordCount || 0,
        sections: data.metadata?.sections || [],
        complianceNotes: data.metadata?.complianceNotes || [],
        generatedAt: data.metadata?.generatedAt || data.created_at
      };
    } catch (error) {
      console.error('Failed to fetch MD&A:', error);
      return null;
    }
  }
}

export const mdaGenerator = new MDAGeneratorService();