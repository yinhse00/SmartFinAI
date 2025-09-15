import { grokService } from '../grokService';
import { BusinessContext } from './materialityAnalyzer';

export interface AIMaterialityAssessment {
  isMaterial: boolean;
  percentage: number;
  baseAmount: number;
  threshold: number;
  businessSignificance: 'high' | 'medium' | 'low';
  disclosureRecommendation: 'required' | 'recommended' | 'optional';
  reasoning: {
    quantitativeAnalysis: string;
    qualitativeFactors: string[];
    businessContext: string;
    regulatoryConsiderations: string;
    comparativeAnalysis?: string;
  };
  trendAnalysis?: {
    direction: 'increasing' | 'decreasing' | 'stable' | 'volatile';
    materialityTrend: string;
    underlyingFactors: string[];
  };
}

export interface AIEnhancedMaterialityResult {
  itemName: string;
  statementType: 'profit_loss' | 'balance_sheet';
  aiAssessment: AIMaterialityAssessment;
  complianceChecklist: {
    hkexRequirement: boolean;
    ifrsCompliance: boolean;
    prospectusDisclosure: boolean;
  };
  contentGenerationHints: {
    keyPoints: string[];
    suggestedNarrative: string;
    riskFactors?: string[];
  };
}

class AIMaterialityReasonerService {

  /**
   * Perform comprehensive AI-driven materiality assessment
   */
  async assessMateriality(
    itemName: string,
    amount: number,
    baseAmount: number,
    statementType: 'profit_loss' | 'balance_sheet',
    businessContext?: BusinessContext,
    comparativeData?: any,
    threshold: number = 5.0
  ): Promise<AIEnhancedMaterialityResult> {
    console.log('🧠 AI materiality assessment for:', itemName);

    const percentage = Math.abs(amount / baseAmount) * 100;
    const quantitativeMateriality = percentage >= threshold;

    try {
      const aiAssessment = await this.generateAIAssessment(
        itemName,
        amount,
        baseAmount,
        percentage,
        statementType,
        businessContext,
        comparativeData,
        threshold
      );

      const complianceChecklist = this.generateComplianceChecklist(aiAssessment, statementType);
      const contentHints = await this.generateContentHints(itemName, aiAssessment, businessContext);

      return {
        itemName,
        statementType,
        aiAssessment,
        complianceChecklist,
        contentGenerationHints: contentHints
      };
    } catch (error) {
      console.error('AI materiality assessment failed:', error);
      return this.createFallbackAssessment(itemName, amount, baseAmount, percentage, statementType, threshold);
    }
  }

  /**
   * Generate comprehensive AI-powered materiality assessment
   */
  private async generateAIAssessment(
    itemName: string,
    amount: number,
    baseAmount: number,
    percentage: number,
    statementType: string,
    businessContext?: BusinessContext,
    comparativeData?: any,
    threshold: number = 5.0
  ): Promise<AIMaterialityAssessment> {
    const prompt = `
Perform comprehensive materiality analysis for IPO prospectus disclosure.

FINANCIAL ITEM DETAILS:
- Item: ${itemName}
- Amount: ${amount.toLocaleString()}
- Base Amount (${statementType === 'profit_loss' ? 'Total Revenue' : 'Total Assets'}): ${baseAmount.toLocaleString()}
- Percentage: ${percentage.toFixed(2)}%
- Statement Type: ${statementType}
- Materiality Threshold: ${threshold}%

BUSINESS CONTEXT:
${businessContext?.businessContent || 'No business context provided'}

COMPARATIVE DATA:
${comparativeData ? JSON.stringify(comparativeData) : 'No comparative data available'}

ANALYSIS REQUIREMENTS:
1. Quantitative Analysis:
   - Apply ${threshold}% materiality threshold
   - Consider absolute amounts and relative percentages
   - Assess impact on overall financial position

2. Qualitative Assessment:
   - Business significance beyond numbers
   - Industry-specific considerations
   - Regulatory environment factors

3. HKEX and IFRS Compliance:
   - Hong Kong listing rule requirements
   - International financial reporting standards
   - IPO prospectus disclosure obligations

4. Trend Analysis (if comparative data available):
   - Multi-period materiality assessment
   - Trend direction and implications
   - Underlying business drivers

5. Business Context Integration:
   - Alignment with business model
   - Operational significance
   - Strategic importance

Return structured assessment with clear reasoning and recommendations.
    `;

    const response = await grokService.generateResponse({
      prompt,
      format: 'structured_analysis',
      metadata: {
        context: 'materiality_assessment',
        requirements: {
          focus: 'regulatory_compliance',
          depth: 'comprehensive'
        }
      }
    });

    return this.parseAIAssessmentResponse(response.text, percentage, baseAmount, threshold);
  }

  /**
   * Parse AI assessment response into structured format
   */
  private parseAIAssessmentResponse(
    response: string,
    percentage: number,
    baseAmount: number,
    threshold: number
  ): AIMaterialityAssessment {
    try {
      // Extract structured assessment from AI response
      const assessment = this.extractAssessmentFromResponse(response);
      
      return {
        isMaterial: assessment.isMaterial !== undefined ? assessment.isMaterial : percentage >= threshold,
        percentage,
        baseAmount,
        threshold,
        businessSignificance: assessment.businessSignificance || this.assessBusinessSignificance(percentage),
        disclosureRecommendation: assessment.disclosureRecommendation || this.getDisclosureRecommendation(percentage, threshold),
        reasoning: {
          quantitativeAnalysis: assessment.quantitativeAnalysis || this.getDefaultQuantitativeAnalysis(percentage, threshold),
          qualitativeFactors: assessment.qualitativeFactors || [],
          businessContext: assessment.businessContext || 'Limited business context available',
          regulatoryConsiderations: assessment.regulatoryConsiderations || 'Standard HKEX and IFRS requirements apply',
          comparativeAnalysis: assessment.comparativeAnalysis
        },
        trendAnalysis: assessment.trendAnalysis
      };
    } catch (error) {
      console.error('Failed to parse AI assessment:', error);
      return this.createDefaultAssessment(percentage, baseAmount, threshold);
    }
  }

  /**
   * Extract assessment details from AI response
   */
  private extractAssessmentFromResponse(response: string): any {
    try {
      // Try to extract JSON structure from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Fallback to text parsing
      return this.parseTextResponse(response);
    } catch (error) {
      return {};
    }
  }

  /**
   * Parse text response for key assessment elements
   */
  private parseTextResponse(response: string): any {
    const assessment: any = {};

    // Extract materiality conclusion
    if (response.toLowerCase().includes('material') && !response.toLowerCase().includes('not material')) {
      assessment.isMaterial = true;
    } else if (response.toLowerCase().includes('not material') || response.toLowerCase().includes('immaterial')) {
      assessment.isMaterial = false;
    }

    // Extract business significance
    if (response.toLowerCase().includes('highly significant') || response.toLowerCase().includes('critical')) {
      assessment.businessSignificance = 'high';
    } else if (response.toLowerCase().includes('moderately significant')) {
      assessment.businessSignificance = 'medium';
    } else {
      assessment.businessSignificance = 'low';
    }

    // Extract qualitative factors
    const qualitativeFactors = [];
    if (response.toLowerCase().includes('regulatory')) qualitativeFactors.push('Regulatory considerations');
    if (response.toLowerCase().includes('strategic')) qualitativeFactors.push('Strategic importance');
    if (response.toLowerCase().includes('operational')) qualitativeFactors.push('Operational significance');
    assessment.qualitativeFactors = qualitativeFactors;

    return assessment;
  }

  /**
   * Assess business significance based on percentage
   */
  private assessBusinessSignificance(percentage: number): 'high' | 'medium' | 'low' {
    if (percentage >= 20) return 'high';
    if (percentage >= 10) return 'medium';
    return 'low';
  }

  /**
   * Get disclosure recommendation based on materiality
   */
  private getDisclosureRecommendation(percentage: number, threshold: number): 'required' | 'recommended' | 'optional' {
    if (percentage >= threshold * 2) return 'required';
    if (percentage >= threshold) return 'recommended';
    return 'optional';
  }

  /**
   * Generate default quantitative analysis
   */
  private getDefaultQuantitativeAnalysis(percentage: number, threshold: number): string {
    if (percentage >= threshold) {
      return `Item represents ${percentage.toFixed(1)}% of the base amount, exceeding the ${threshold}% materiality threshold and requiring disclosure consideration.`;
    } else {
      return `Item represents ${percentage.toFixed(1)}% of the base amount, below the ${threshold}% materiality threshold but may require disclosure based on qualitative factors.`;
    }
  }

  /**
   * Create default assessment when AI processing fails
   */
  private createDefaultAssessment(percentage: number, baseAmount: number, threshold: number): AIMaterialityAssessment {
    return {
      isMaterial: percentage >= threshold,
      percentage,
      baseAmount,
      threshold,
      businessSignificance: this.assessBusinessSignificance(percentage),
      disclosureRecommendation: this.getDisclosureRecommendation(percentage, threshold),
      reasoning: {
        quantitativeAnalysis: this.getDefaultQuantitativeAnalysis(percentage, threshold),
        qualitativeFactors: ['Standard materiality assessment'],
        businessContext: 'Limited context available for enhanced analysis',
        regulatoryConsiderations: 'Standard HKEX listing requirements apply'
      }
    };
  }

  /**
   * Generate compliance checklist
   */
  private generateComplianceChecklist(assessment: AIMaterialityAssessment, statementType: string): AIEnhancedMaterialityResult['complianceChecklist'] {
    return {
      hkexRequirement: assessment.isMaterial || assessment.disclosureRecommendation === 'required',
      ifrsCompliance: true, // Always assume IFRS compliance for proper financial reporting
      prospectusDisclosure: assessment.isMaterial || assessment.businessSignificance === 'high'
    };
  }

  /**
   * Generate content generation hints for IPO prospectus
   */
  private async generateContentHints(
    itemName: string,
    assessment: AIMaterialityAssessment,
    businessContext?: BusinessContext
  ): Promise<AIEnhancedMaterialityResult['contentGenerationHints']> {
    console.log('📝 Generating content hints for:', itemName);

    try {
      const prompt = `
Generate IPO prospectus content guidance for material financial item.

ITEM: ${itemName}
MATERIALITY: ${assessment.isMaterial ? 'Material' : 'Not Material'} (${assessment.percentage.toFixed(1)}%)
BUSINESS SIGNIFICANCE: ${assessment.businessSignificance}

ASSESSMENT REASONING:
${assessment.reasoning.quantitativeAnalysis}
${assessment.reasoning.businessContext}

BUSINESS CONTEXT:
${businessContext?.businessContent || 'Limited business context'}

Generate:
1. Key points for prospectus narrative
2. Suggested narrative structure
3. Potential risk factors (if applicable)
4. Investor disclosure considerations

Focus on professional IPO-quality content that meets HKEX standards.
      `;

      const response = await grokService.generateResponse({
        prompt,
        format: 'structured_guidance',
        metadata: {
          context: 'ipo_content_generation',
          requirements: {
            quality: 'professional',
            compliance: 'hkex_standards'
          }
        }
      });

      return this.parseContentHints(response.text);
    } catch (error) {
      console.error('Failed to generate content hints:', error);
      return this.createDefaultContentHints(itemName, assessment);
    }
  }

  /**
   * Parse content hints from AI response
   */
  private parseContentHints(response: string): AIEnhancedMaterialityResult['contentGenerationHints'] {
    try {
      const hints = {
        keyPoints: this.extractKeyPoints(response),
        suggestedNarrative: this.extractNarrative(response),
        riskFactors: this.extractRiskFactors(response)
      };

      return hints;
    } catch (error) {
      return {
        keyPoints: ['Standard financial item disclosure'],
        suggestedNarrative: 'Describe the nature and significance of this financial item in the context of business operations.'
      };
    }
  }

  /**
   * Extract key points from response
   */
  private extractKeyPoints(response: string): string[] {
    const points: string[] = [];
    const lines = response.split('\n');
    
    for (const line of lines) {
      if (line.includes('•') || line.includes('-') || line.includes('*')) {
        const cleanPoint = line.replace(/[•\-*]/g, '').trim();
        if (cleanPoint.length > 10) {
          points.push(cleanPoint);
        }
      }
    }

    return points.length > 0 ? points : ['Describe the financial item and its business significance'];
  }

  /**
   * Extract narrative from response
   */
  private extractNarrative(response: string): string {
    // Look for narrative section in response
    const narrativeMatch = response.match(/narrative[:\s]*(.*?)(?:\n\n|\n[A-Z]|$)/is);
    if (narrativeMatch) {
      return narrativeMatch[1].trim();
    }

    return 'Provide context for this financial item within the overall business operations and financial performance.';
  }

  /**
   * Extract risk factors from response
   */
  private extractRiskFactors(response: string): string[] | undefined {
    if (!response.toLowerCase().includes('risk')) {
      return undefined;
    }

    const risks: string[] = [];
    const lines = response.split('\n');
    let inRiskSection = false;

    for (const line of lines) {
      if (line.toLowerCase().includes('risk')) {
        inRiskSection = true;
      }
      
      if (inRiskSection && (line.includes('•') || line.includes('-') || line.includes('*'))) {
        const cleanRisk = line.replace(/[•\-*]/g, '').trim();
        if (cleanRisk.length > 10) {
          risks.push(cleanRisk);
        }
      }
    }

    return risks.length > 0 ? risks : undefined;
  }

  /**
   * Create default content hints
   */
  private createDefaultContentHints(itemName: string, assessment: AIMaterialityAssessment): AIEnhancedMaterialityResult['contentGenerationHints'] {
    const keyPoints = [
      `${itemName} represents ${assessment.percentage.toFixed(1)}% of the financial base`,
      'Significance in context of overall business operations',
      'Regulatory disclosure requirements'
    ];

    const suggestedNarrative = `${itemName} is ${assessment.isMaterial ? 'a material component' : 'included'} in the Company's financial statements, representing ${assessment.percentage.toFixed(1)}% of ${assessment.percentage >= 5 ? 'significant' : 'total'} financial activity.`;

    return {
      keyPoints,
      suggestedNarrative,
      riskFactors: assessment.businessSignificance === 'high' ? [`Fluctuations in ${itemName} may impact financial performance`] : undefined
    };
  }

  /**
   * Create fallback assessment
   */
  private createFallbackAssessment(
    itemName: string,
    amount: number,
    baseAmount: number,
    percentage: number,
    statementType: string,
    threshold: number
  ): AIEnhancedMaterialityResult {
    const fallbackAssessment = this.createDefaultAssessment(percentage, baseAmount, threshold);
    
    return {
      itemName,
      statementType: statementType as 'profit_loss' | 'balance_sheet',
      aiAssessment: fallbackAssessment,
      complianceChecklist: {
        hkexRequirement: percentage >= threshold,
        ifrsCompliance: true,
        prospectusDisclosure: percentage >= threshold
      },
      contentGenerationHints: this.createDefaultContentHints(itemName, fallbackAssessment)
    };
  }
}

export const aiMaterialityReasoner = new AIMaterialityReasonerService();