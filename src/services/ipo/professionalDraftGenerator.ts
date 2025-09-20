import { precedentService, type PrecedentCase } from './precedentService';
import { ipoRequirementsService } from './ipoRequirementsService';
import { universalAiClient } from '@/services/ai/universalAiClient';
import { getFeatureAIPreference } from '@/services/ai/aiPreferences';
import { AIProvider } from '@/types/aiProvider';
import { analyzeFinancialResponse, detectTruncationComprehensive, getTruncationDiagnostics } from '@/utils/truncation';

export interface DraftGenerationRequest {
  currentContent: string;
  sectionType: string;
  userRequest: string;
  projectId: string;
  industry?: string;
}

export interface ProfessionalDraftResult {
  fullDraft: string;
  analysisSteps: AnalysisStep[];
  precedentCases: PrecedentCase[];
  complianceNotes: string[];
  confidence: number;
}

export interface AnalysisStep {
  title: string;
  description: string;
  findings: string[];
}

export class ProfessionalDraftGenerator {
  /**
   * Generate a complete professional IPO draft based on user request and precedents
   */
  async generateProfessionalDraft(request: DraftGenerationRequest): Promise<ProfessionalDraftResult> {
    try {
      // Step 1: Analyze current content and requirements
      const analysisSteps = await this.analyzeCurrentContent(request);

      // Step 2: Find relevant precedent cases
      const precedentCases = await precedentService.findRelevantPrecedents(
        request.sectionType,
        request.industry,
        3
      );

      // Step 3: Generate professional draft with precedent support
      const fullDraft = await this.generateCompleteSection(request, precedentCases.cases, analysisSteps);

      // Step 4: Extract compliance notes
      const complianceNotes = this.extractComplianceNotes(analysisSteps);

      return {
        fullDraft,
        analysisSteps,
        precedentCases: precedentCases.cases,
        complianceNotes,
        confidence: this.calculateConfidence(analysisSteps, precedentCases.cases)
      };

    } catch (error) {
      console.error('Professional draft generation failed:', error);
      
      return {
        fullDraft: request.currentContent,
        analysisSteps: [{
          title: 'Generation Error',
          description: 'Unable to generate professional draft',
          findings: ['Please try again or contact support']
        }],
        precedentCases: [],
        complianceNotes: ['Error in processing - manual review recommended'],
        confidence: 0.3
      };
    }
  }

  /**
   * Analyze current content and identify requirements
   */
  private async analyzeCurrentContent(request: DraftGenerationRequest): Promise<AnalysisStep[]> {
    const steps: AnalysisStep[] = [];

    // Content Assessment
    steps.push({
      title: 'Content Assessment',
      description: 'Analyzing current content quality and structure',
      findings: this.assessContentQuality(request.currentContent)
    });

    // Requirements Analysis
    steps.push({
      title: 'HKEX Requirements Analysis',
      description: 'Identifying mandatory disclosure requirements',
      findings: this.identifyRequirements(request.sectionType)
    });

    // Gap Analysis
    steps.push({
      title: 'Gap Analysis',
      description: 'Finding missing elements and improvement opportunities',
      findings: this.findContentGaps(request.currentContent, request.sectionType)
    });

    return steps;
  }

  /**
   * Generate complete professional section with precedent support and quality validation
   */
  private async generateCompleteSection(
    request: DraftGenerationRequest,
    precedents: PrecedentCase[],
    analysis: AnalysisStep[]
  ): Promise<string> {
    const precedentContext = precedents.length > 0 
      ? precedentService.formatPrecedentsForAI(precedents)
      : 'General IPO best practices will be applied.';

    const analysisContext = analysis.map(step => 
      `${step.title}: ${step.findings.join(', ')}`
    ).join('\n');

    // Get detailed requirements for this section
    const detailedRequirements = ipoRequirementsService.getDetailedRequirements(request.sectionType);

    // Enhanced prompt with completion requirements
    const prompt = `
You are an expert IPO prospectus drafter. Generate a complete, professionally formatted ${request.sectionType} section.

CURRENT CONTENT:
${request.currentContent}

USER REQUEST:
${request.userRequest}

ANALYSIS FINDINGS:
${analysisContext}

PRECEDENT CASES FOR REFERENCE:
${precedentContext}

${detailedRequirements}

CRITICAL REQUIREMENTS:
1. Generate a COMPLETE, professionally formatted section (not just additions)
2. Follow ALL Hong Kong Stock Exchange disclosure requirements listed above
3. Use formal, professional IPO language throughout
4. Include proper numbering and structure per HKEX standards
5. Incorporate insights from precedent cases where applicable
6. Address all gaps identified in the analysis
7. Include ALL mandatory tables and disclosures specified above
8. Ensure full regulatory compliance with App1A requirements
9. Use professional IPO terminology and formatting
10. Provide comprehensive coverage of all required subsections

COMPLETION REQUIREMENTS:
- ENSURE COMPLETE RESPONSE - DO NOT TRUNCATE
- Generate MINIMUM 2000 words for complex sections (Overview, Business Model)
- Generate MINIMUM 1500 words for standard sections
- Include ALL required subsections and elements
- Provide thorough analysis and comprehensive disclosure

Please provide the FULL REVISED SECTION with proper IPO formatting and ALL required elements:
`;

    // Try multiple attempts with different providers if needed
    for (let attempt = 0; attempt < 3; attempt++) {
      console.log(`Professional draft generation attempt ${attempt + 1}/3`);
      
      try {
        const result = await this.attemptGeneration(prompt, request, attempt);
        
        // Validate completeness
        const validation = await this.validateDraftCompleteness(result, request.sectionType);
        
        if (validation.isComplete) {
          console.log('✅ Professional draft generation successful');
          return this.formatIPOSection(result, request.sectionType);
        } else {
          console.log(`⚠ Draft incomplete on attempt ${attempt + 1}:`, validation.issues);
          
          // If this is the last attempt, return what we have
          if (attempt === 2) {
            console.log('Using final attempt result despite incompleteness');
            return this.formatIPOSection(result, request.sectionType);
          }
          
          // Continue to next attempt with different provider/parameters
        }
      } catch (error) {
        console.error(`Attempt ${attempt + 1} failed:`, error);
        
        // If this is the last attempt, throw the error
        if (attempt === 2) {
          throw error;
        }
      }
    }
    
    // Fallback (should not reach here)
    throw new Error('All generation attempts failed');
  }

  /**
   * Attempt generation with smart provider selection
   */
  private async attemptGeneration(prompt: string, request: DraftGenerationRequest, attempt: number): Promise<string> {
    // Smart provider selection based on attempt
    let provider: AIProvider;
    let modelId: string;
    let maxTokens: number;
    
    if (attempt === 0) {
      // First attempt: Use Google Gemini for high token limit
      provider = AIProvider.GOOGLE;
      modelId = 'gemini-2.0-flash';
      maxTokens = 100000; // Very high for complex sections
    } else if (attempt === 1) {
      // Second attempt: Use user preference with enhanced params
      const userPreference = getFeatureAIPreference('ipo');
      provider = userPreference.provider;
      modelId = userPreference.model;
      maxTokens = 50000;
    } else {
      // Final attempt: Fallback to Grok with maximum tokens
      provider = AIProvider.GROK;
      modelId = 'grok-4-0709';
      maxTokens = 25000;
    }
    
    console.log(`Attempting generation with ${provider}/${modelId}, maxTokens: ${maxTokens}`);
    
    const aiResponse = await universalAiClient.generateContent({
      prompt,
      provider,
      modelId,
      metadata: { 
        requestType: 'professional_draft_generation',
        sectionType: request.sectionType,
        maxTokens,
        temperature: 0.3 // Lower temperature for consistency
      }
    });
    
    if (!aiResponse.success) {
      throw new Error(aiResponse.error || 'AI generation failed');
    }
    
    return aiResponse.text;
  }

  /**
   * Validate draft completeness using main chat quality system
   */
  private async validateDraftCompleteness(content: string, sectionType: string): Promise<{
    isComplete: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];
    
    // 1. Basic truncation detection
    const basicTruncation = detectTruncationComprehensive(content);
    if (basicTruncation) {
      issues.push('Basic truncation patterns detected');
    }
    
    // 2. Advanced diagnostics
    const diagnostics = getTruncationDiagnostics(content);
    if (diagnostics.isTruncated) {
      issues.push(`Truncation detected: ${diagnostics.reasons.join(', ')}`);
    }
    
    // 3. Financial content analysis
    const financialAnalysis = analyzeFinancialResponse(content, sectionType);
    if (!financialAnalysis.isComplete) {
      issues.push(`Financial content incomplete: ${financialAnalysis.missingElements?.join(', ') || 'Missing elements detected'}`);
    }
    
    // 4. Content length validation based on section complexity
    const minLength = this.getMinimumContentLength(sectionType);
    if (content.length < minLength) {
      issues.push(`Content too short: ${content.length} chars (minimum: ${minLength})`);
    }
    
    // 5. Required elements validation
    const requirements = ipoRequirementsService.getRequirements(sectionType);
    if (requirements) {
      const compliance = ipoRequirementsService.checkCompliance(content, sectionType);
      if (compliance.complianceScore < 0.7) {
        issues.push(`Low compliance score: ${Math.round(compliance.complianceScore * 100)}%`);
      }
      
      if (compliance.missingRequirements.length > 0) {
        issues.push(`Missing requirements: ${compliance.missingRequirements.length} items`);
      }
    }
    
    return {
      isComplete: issues.length === 0,
      issues
    };
  }

  /**
   * Get minimum content length based on section type
   */
  private getMinimumContentLength(sectionType: string): number {
    const complexSections = ['overview', 'business model', 'risk factors', 'financial information'];
    const isComplex = complexSections.some(section => 
      sectionType.toLowerCase().includes(section)
    );
    
    return isComplex ? 8000 : 4000; // Character minimums, not word counts
  }

  /**
   * Format content according to IPO prospectus standards (less aggressive cleaning)
   */
  private formatIPOSection(content: string, sectionType: string): string {
    // Less aggressive cleaning - only remove obvious AI artifacts
    const cleanContent = content
      .replace(/^(Here's the|This is the|I've generated).*?section:\s*/i, '')
      .replace(/^Note: This is.*$/gm, '')
      .replace(/^Based on.*?here's.*?:/gm, '')
      .trim();

    // Preserve legitimate content structure
    const lines = cleanContent.split('\n');
    const formattedLines: string[] = [];
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Keep all content, just clean up excessive whitespace
      if (trimmedLine.length > 0) {
        formattedLines.push(trimmedLine);
      } else if (formattedLines.length > 0 && formattedLines[formattedLines.length - 1] !== '') {
        formattedLines.push(''); // Preserve paragraph breaks
      }
    }

    return formattedLines.join('\n').trim();
  }

  /**
   * Assess content quality
   */
  private assessContentQuality(content: string): string[] {
    const findings: string[] = [];
    
    if (content.length < 200) {
      findings.push('Content length is insufficient for IPO standards');
    } else if (content.length < 500) {
      findings.push('Content length is below recommended IPO disclosure levels');
    } else {
      findings.push('Content length meets basic IPO requirements');
    }

    // Check for professional language
    const informalWords = ['very', 'quite', 'really', 'pretty', 'kind of'];
    const hasInformalLanguage = informalWords.some(word => 
      content.toLowerCase().includes(word)
    );
    
    if (hasInformalLanguage) {
      findings.push('Language style needs enhancement for professional IPO standards');
    } else {
      findings.push('Language style is appropriate for IPO documentation');
    }

    return findings;
  }

  /**
   * Identify mandatory requirements for section type using comprehensive requirements service
   */
  private identifyRequirements(sectionType: string): string[] {
    const requirements = ipoRequirementsService.getRequirements(sectionType);
    if (!requirements) {
      return [
        'Mandatory disclosure requirements per HKEX Listing Rules',
        'Professional presentation standards',
        'Regulatory compliance elements'
      ];
    }

    // Extract requirement titles and descriptions
    const findings: string[] = [];
    requirements.requirements.forEach(req => {
      if (req.mandatory) {
        findings.push(`${req.title}: ${req.description}`);
        // Add key subsections
        req.subsections.slice(0, 2).forEach(sub => {
          findings.push(`Must include: ${sub}`);
        });
      }
    });

    // Add mandatory tables requirement
    if (requirements.mandatoryTables.length > 0) {
      findings.push(`Required tables: ${requirements.mandatoryTables.join(', ')}`);
    }

    return findings.slice(0, 8); // Limit for readability
  }

  /**
   * Find content gaps using comprehensive requirements checking
   */
  private findContentGaps(content: string, sectionType: string): string[] {
    // Use the requirements service for comprehensive gap analysis
    const compliance = ipoRequirementsService.checkCompliance(content, sectionType);
    
    const gaps: string[] = [];

    // Add missing requirements
    compliance.missingRequirements.forEach(req => {
      gaps.push(`Missing: ${req.title} - ${req.description}`);
    });

    // Add missing tables
    compliance.missingTables.forEach(table => {
      gaps.push(`Missing mandatory table: ${table}`);
    });

    // Add specific recommendations
    compliance.recommendations.slice(0, 3).forEach(rec => {
      gaps.push(rec);
    });

    // If no specific gaps, provide general assessment
    if (gaps.length === 0) {
      if (compliance.complianceScore >= 0.8) {
        gaps.push('Content structure aligns well with IPO requirements');
      } else {
        gaps.push(`Compliance score: ${Math.round(compliance.complianceScore * 100)}% - Enhancement recommended`);
      }
    }

    return gaps.slice(0, 6); // Limit for readability
  }

  /**
   * Extract compliance notes from analysis
   */
  private extractComplianceNotes(steps: AnalysisStep[]): string[] {
    const notes: string[] = [];

    steps.forEach(step => {
      step.findings.forEach(finding => {
        if (finding.toLowerCase().includes('requirement') || 
            finding.toLowerCase().includes('compliance') ||
            finding.toLowerCase().includes('missing')) {
          notes.push(finding);
        }
      });
    });

    // Add standard compliance notes
    notes.push('Ensure compliance with HKEX Listing Rules App1A');
    notes.push('Review for consistency with other prospectus sections');

    return notes.slice(0, 5); // Limit to most important notes
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(steps: AnalysisStep[], precedents: PrecedentCase[]): number {
    let confidence = 0.7; // Base confidence

    // Boost confidence if we have precedent cases
    if (precedents.length > 0) {
      confidence += 0.1;
    }

    // Boost confidence based on analysis quality
    const totalFindings = steps.reduce((sum, step) => sum + step.findings.length, 0);
    if (totalFindings >= 6) {
      confidence += 0.1;
    }

    return Math.min(confidence, 0.95); // Cap at 95%
  }
}

export const professionalDraftGenerator = new ProfessionalDraftGenerator();