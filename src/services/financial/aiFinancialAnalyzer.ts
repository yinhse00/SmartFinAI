import { grokService } from '../grokService';
import { AIEnhancedMaterialityResult } from './aiMaterialityReasoner';
import { BusinessContext } from './materialityAnalyzer';

export interface ComprehensiveFinancialAnalysis {
  projectId: string;
  analysisDate: string;
  materialItems: AIEnhancedMaterialityResult[];
  overallAssessment: {
    totalMaterialItems: number;
    keyFinancialRisks: string[];
    businessAlignment: 'strong' | 'moderate' | 'weak';
    disclosureRecommendations: string[];
  };
  sectionContent: {
    financialInformation: string;
    riskFactors: string[];
    businessDescription: string;
    managementDiscussion: string;
  };
  regulatoryCompliance: {
    hkexCompliance: boolean;
    ifrsCompliance: boolean;
    requiredDisclosures: string[];
    additionalRecommendations: string[];
  };
}

export interface FinancialAnalysisRequest {
  projectId: string;
  materialityResults: AIEnhancedMaterialityResult[];
  businessContext?: BusinessContext;
  regulatoryRequirements: string[];
  targetSections: string[];
}

class AIFinancialAnalyzerService {

  /**
   * Perform comprehensive financial analysis for IPO prospectus
   */
  async analyzeForIPOProspectus(request: FinancialAnalysisRequest): Promise<ComprehensiveFinancialAnalysis> {
    console.log('📊 Starting comprehensive financial analysis for IPO prospectus...');

    try {
      const overallAssessment = await this.generateOverallAssessment(request);
      const sectionContent = await this.generateSectionContent(request);
      const regulatoryCompliance = await this.assessRegulatoryCompliance(request);

      const analysis: ComprehensiveFinancialAnalysis = {
        projectId: request.projectId,
        analysisDate: new Date().toISOString(),
        materialItems: request.materialityResults,
        overallAssessment,
        sectionContent,
        regulatoryCompliance
      };

      console.log('✅ Comprehensive financial analysis completed');
      return analysis;
    } catch (error) {
      console.error('Financial analysis failed:', error);
      throw new Error(`Comprehensive financial analysis failed: ${error.message}`);
    }
  }

  /**
   * Generate overall assessment of material items
   */
  private async generateOverallAssessment(request: FinancialAnalysisRequest): Promise<ComprehensiveFinancialAnalysis['overallAssessment']> {
    const materialItems = request.materialityResults.filter(item => item.aiAssessment.isMaterial);
    
    const prompt = `
Analyze material financial items for IPO prospectus overall assessment.

MATERIAL ITEMS (${materialItems.length} total):
${materialItems.map(item => `
- ${item.itemName}: ${item.aiAssessment.percentage.toFixed(1)}% (${item.statementType})
  Business Significance: ${item.aiAssessment.businessSignificance}
  Disclosure: ${item.aiAssessment.disclosureRecommendation}
  Reasoning: ${item.aiAssessment.reasoning.quantitativeAnalysis}
`).join('\n')}

BUSINESS CONTEXT:
${request.businessContext?.businessContent || 'Limited business context available'}

REGULATORY REQUIREMENTS:
${request.regulatoryRequirements.join('\n')}

Generate overall assessment including:
1. Key financial risks based on material items
2. Business alignment assessment
3. High-level disclosure recommendations
4. Strategic considerations for IPO

Focus on investor-relevant insights and regulatory compliance.
    `;

    const response = await grokService.generateResponse({
      prompt,
      format: 'executive_summary',
      metadata: {
        context: 'financial_analysis_overview',
        requirements: {
          focus: 'investor_perspective',
          compliance: 'ipo_standards'
        }
      }
    });

    return this.parseOverallAssessment(response.text, materialItems.length);
  }

  /**
   * Parse overall assessment from AI response
   */
  private parseOverallAssessment(response: string, materialItemsCount: number): ComprehensiveFinancialAnalysis['overallAssessment'] {
    try {
      return {
        totalMaterialItems: materialItemsCount,
        keyFinancialRisks: this.extractFinancialRisks(response),
        businessAlignment: this.assessBusinessAlignment(response),
        disclosureRecommendations: this.extractDisclosureRecommendations(response)
      };
    } catch (error) {
      console.error('Failed to parse overall assessment:', error);
      return this.createDefaultOverallAssessment(materialItemsCount);
    }
  }

  /**
   * Extract financial risks from response
   */
  private extractFinancialRisks(response: string): string[] {
    const risks: string[] = [];
    const lines = response.split('\n');
    
    let inRiskSection = false;
    for (const line of lines) {
      if (line.toLowerCase().includes('risk') && (line.includes(':') || line.toLowerCase().includes('factor'))) {
        inRiskSection = true;
        continue;
      }
      
      if (inRiskSection && (line.includes('•') || line.includes('-') || line.includes('*'))) {
        const risk = line.replace(/[•\-*]/g, '').trim();
        if (risk.length > 15) {
          risks.push(risk);
        }
      } else if (inRiskSection && line.trim() === '') {
        inRiskSection = false;
      }
    }

    return risks.length > 0 ? risks : ['Material financial items may impact overall financial performance'];
  }

  /**
   * Assess business alignment from response
   */
  private assessBusinessAlignment(response: string): 'strong' | 'moderate' | 'weak' {
    const text = response.toLowerCase();
    
    if (text.includes('strong alignment') || text.includes('highly aligned') || text.includes('well-aligned')) {
      return 'strong';
    } else if (text.includes('moderate') || text.includes('partial')) {
      return 'moderate';
    } else {
      return 'weak';
    }
  }

  /**
   * Extract disclosure recommendations from response
   */
  private extractDisclosureRecommendations(response: string): string[] {
    const recommendations: string[] = [];
    const lines = response.split('\n');
    
    let inRecommendationSection = false;
    for (const line of lines) {
      if (line.toLowerCase().includes('recommend') || line.toLowerCase().includes('disclosure')) {
        inRecommendationSection = true;
      }
      
      if (inRecommendationSection && (line.includes('•') || line.includes('-') || line.includes('*'))) {
        const rec = line.replace(/[•\-*]/g, '').trim();
        if (rec.length > 15) {
          recommendations.push(rec);
        }
      }
    }

    return recommendations.length > 0 ? recommendations : ['Ensure material items are properly disclosed per HKEX requirements'];
  }

  /**
   * Generate content for specific prospectus sections
   */
  private async generateSectionContent(request: FinancialAnalysisRequest): Promise<ComprehensiveFinancialAnalysis['sectionContent']> {
    console.log('📝 Generating section content...');

    const contentPromises = await Promise.all([
      this.generateFinancialInformationContent(request),
      this.generateRiskFactorsContent(request),
      this.generateBusinessDescriptionContent(request),
      this.generateManagementDiscussionContent(request)
    ]);

    return {
      financialInformation: contentPromises[0],
      riskFactors: contentPromises[1],
      businessDescription: contentPromises[2],
      managementDiscussion: contentPromises[3]
    };
  }

  /**
   * Generate financial information section content
   */
  private async generateFinancialInformationContent(request: FinancialAnalysisRequest): Promise<string> {
    const materialItems = request.materialityResults.filter(item => item.aiAssessment.isMaterial);
    
    const prompt = `
Generate "Financial Information" section content for IPO prospectus.

MATERIAL ITEMS:
${materialItems.map(item => `
${item.itemName}:
- Amount: ${item.aiAssessment.percentage.toFixed(1)}% of ${item.statementType === 'profit_loss' ? 'revenue' : 'assets'}
- Significance: ${item.aiAssessment.businessSignificance}
- Business Context: ${item.aiAssessment.reasoning.businessContext}
- Key Points: ${item.contentGenerationHints.keyPoints.join('; ')}
`).join('\n')}

BUSINESS CONTEXT:
${request.businessContext?.businessContent || ''}

Generate professional IPO-quality content covering:
1. Overview of material financial items
2. Business significance and context
3. Period-to-period analysis where applicable
4. Impact on financial position and performance

Style: Professional, clear, investor-focused
Length: 2-3 paragraphs per material item
Compliance: HKEX prospectus standards
    `;

    const response = await grokService.generateResponse({
      prompt,
      format: 'prospectus_section',
      metadata: {
        context: 'ipo_financial_information',
        requirements: {
          quality: 'professional',
          length: 'comprehensive'
        }
      }
    });

    return response.text;
  }

  /**
   * Generate risk factors content
   */
  private async generateRiskFactorsContent(request: FinancialAnalysisRequest): Promise<string[]> {
    const materialItems = request.materialityResults.filter(item => 
      item.aiAssessment.isMaterial && item.contentGenerationHints.riskFactors
    );

    if (materialItems.length === 0) {
      return ['Standard financial risks associated with business operations'];
    }

    const riskFactors: string[] = [];
    
    for (const item of materialItems) {
      if (item.contentGenerationHints.riskFactors) {
        riskFactors.push(...item.contentGenerationHints.riskFactors);
      }
    }

    return [...new Set(riskFactors)]; // Remove duplicates
  }

  /**
   * Generate business description content incorporating financial context
   */
  private async generateBusinessDescriptionContent(request: FinancialAnalysisRequest): Promise<string> {
    const materialItems = request.materialityResults.filter(item => item.aiAssessment.isMaterial);
    
    const prompt = `
Enhance business description with financial materiality insights.

MATERIAL FINANCIAL ITEMS:
${materialItems.map(item => `
- ${item.itemName}: Represents ${item.aiAssessment.percentage.toFixed(1)}% of ${item.statementType}
  Business Significance: ${item.aiAssessment.businessSignificance}
`).join('\n')}

BUSINESS CONTEXT:
${request.businessContext?.businessContent || ''}

Generate enhanced business description that:
1. Integrates material financial items with business operations
2. Explains financial structure in business context
3. Demonstrates operational significance of material items
4. Provides investor clarity on business-finance alignment

Focus on how financial materiality reflects business reality.
    `;

    const response = await grokService.generateResponse({
      prompt,
      format: 'narrative_section',
      metadata: {
        context: 'business_description_financial',
        requirements: {
          integration: 'financial_business_alignment',
          clarity: 'investor_focused'
        }
      }
    });

    return response.text;
  }

  /**
   * Generate management discussion content
   */
  private async generateManagementDiscussionContent(request: FinancialAnalysisRequest): Promise<string> {
    const materialItems = request.materialityResults.filter(item => item.aiAssessment.isMaterial);
    
    const prompt = `
Generate "Management Discussion and Analysis" content for material financial items.

MATERIAL ITEMS FOR DISCUSSION:
${materialItems.map(item => `
${item.itemName}:
- Financial Impact: ${item.aiAssessment.percentage.toFixed(1)}% materiality
- Business Significance: ${item.aiAssessment.businessSignificance}
- Trend Analysis: ${item.aiAssessment.trendAnalysis?.direction || 'Not available'}
- Management Perspective Needed: ${item.contentGenerationHints.suggestedNarrative}
`).join('\n')}

Generate management commentary covering:
1. Management's view on material items
2. Strategic decisions affecting these items
3. Future outlook and expectations
4. Risk mitigation strategies
5. Operational factors driving financial results

Style: Management perspective, forward-looking, strategic
Compliance: Prospectus disclosure requirements
    `;

    const response = await grokService.generateResponse({
      prompt,
      format: 'management_discussion',
      metadata: {
        context: 'management_discussion',
        requirements: {
          perspective: 'management_view',
          content: 'strategic_financial_analysis',
          compliance: 'forward_looking_statements'
        }
      }
    });

    return response.text;
  }

  /**
   * Assess regulatory compliance for the analysis
   */
  private async assessRegulatoryCompliance(request: FinancialAnalysisRequest): Promise<ComprehensiveFinancialAnalysis['regulatoryCompliance']> {
    const materialItems = request.materialityResults.filter(item => item.aiAssessment.isMaterial);
    
    // Check HKEX compliance
    const hkexCompliant = materialItems.every(item => item.complianceChecklist.hkexRequirement);
    
    // Check IFRS compliance (assume compliant if properly structured)
    const ifrsCompliant = materialItems.every(item => item.complianceChecklist.ifrsCompliance);
    
    // Generate required disclosures
    const requiredDisclosures = materialItems
      .filter(item => item.aiAssessment.disclosureRecommendation === 'required')
      .map(item => `${item.itemName} disclosure required due to ${item.aiAssessment.percentage.toFixed(1)}% materiality`);
    
    // Generate additional recommendations
    const additionalRecommendations = this.generateAdditionalRecommendations(materialItems);
    
    return {
      hkexCompliance: hkexCompliant,
      ifrsCompliance: ifrsCompliant,
      requiredDisclosures,
      additionalRecommendations
    };
  }

  /**
   * Generate additional compliance recommendations
   */
  private generateAdditionalRecommendations(materialItems: AIEnhancedMaterialityResult[]): string[] {
    const recommendations: string[] = [];
    
    // Check for high-significance items
    const highSignificanceItems = materialItems.filter(item => item.aiAssessment.businessSignificance === 'high');
    if (highSignificanceItems.length > 0) {
      recommendations.push('Consider enhanced disclosure for high business significance items');
    }
    
    // Check for items with trend analysis
    const trendItems = materialItems.filter(item => item.aiAssessment.trendAnalysis);
    if (trendItems.length > 0) {
      recommendations.push('Include trend analysis and underlying factors in prospectus narrative');
    }
    
    // Check for risk factor items
    const riskItems = materialItems.filter(item => item.contentGenerationHints.riskFactors);
    if (riskItems.length > 0) {
      recommendations.push('Ensure identified risk factors are adequately disclosed in risk section');
    }
    
    return recommendations;
  }

  /**
   * Create default overall assessment
   */
  private createDefaultOverallAssessment(materialItemsCount: number): ComprehensiveFinancialAnalysis['overallAssessment'] {
    return {
      totalMaterialItems: materialItemsCount,
      keyFinancialRisks: ['Standard business and financial risks'],
      businessAlignment: 'moderate',
      disclosureRecommendations: ['Follow standard HKEX disclosure requirements for material items']
    };
  }
}

export const aiFinancialAnalyzer = new AIFinancialAnalyzerService();