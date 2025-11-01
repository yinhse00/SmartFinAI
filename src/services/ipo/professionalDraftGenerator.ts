import { precedentService, type PrecedentCase } from './precedentService';
import { ipoRequirementsService } from './ipoRequirementsService';
import { universalAiClient } from '@/services/ai/universalAiClient';
import { getFeatureAIPreference } from '@/services/ai/aiPreferences';
import { AIProvider } from '@/types/aiProvider';
import { analyzeFinancialResponse, detectTruncationComprehensive, getTruncationDiagnostics } from '@/utils/truncation';
import { complianceValidationService } from './complianceValidationService';

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

    // Generate compliance checklist for enhanced requirements integration
    const complianceChecklist = await this.generateComplianceChecklist(request.sectionType);
    
    // Optimized prompt - reduced context size while maintaining quality
    const prompt = `You are a senior IPO prospectus advisor for HKEX Main Board. Generate content with 85%+ compliance.

SECTION: ${request.sectionType}
REQUEST: ${request.userRequest}

CURRENT CONTENT (excerpt):
${request.currentContent.substring(0, 3000)}${request.currentContent.length > 3000 ? '...' : ''}

MANDATORY REQUIREMENTS:
${detailedRequirements}

COMPLIANCE CHECKLIST:
${complianceChecklist.slice(0, 10).map(item => `☐ ${item}`).join('\n')}

KEY PRECEDENTS:
${precedents.length > 0 ? precedents.slice(0, 2).map(p => `${p.companyName}: ${p.keyInsights?.slice(0, 1).join('; ')}`).join('\n') : 'Apply IPO best practices'}

INSTRUCTIONS:
1. Address all checklist items (85%+ compliance required)
2. Include required subsections per HKEX format
3. Use professional language and specific examples
4. Add regulatory citations where needed
5. Ensure complete response - no truncation
6. Target: 1500-2500 words for standard sections, 2000-3500 for complex sections

Generate the COMPLETE revised section with proper IPO formatting:`;

    // Try multiple attempts with different providers if needed
    for (let attempt = 0; attempt < 3; attempt++) {
      console.log(`Professional draft generation attempt ${attempt + 1}/3`);
      
      try {
        const { result, provider, modelId } = await this.attemptGeneration(prompt, request, attempt);
        
        // Enhanced validation with compliance scoring
        const validation = await this.validateDraftCompleteness(result, request.sectionType);
        
        // Check for truncation and attempt recovery
        if (validation.issues.some(issue => issue.includes('truncation'))) {
          console.log('⚠️ Truncation detected, attempting recovery...');
          try {
            const recoveredResult = await this.recoverTruncatedContent(result, prompt, provider, modelId);
            // Re-validate recovered content
            const recoveredValidation = await this.validateDraftCompleteness(recoveredResult, request.sectionType);
            if (recoveredValidation.isComplete || recoveredValidation.complianceScore > validation.complianceScore) {
              console.log('✅ Truncation recovery successful');
              return this.formatIPOSection(recoveredResult, request.sectionType);
            }
          } catch (recoveryError) {
            console.warn('Truncation recovery failed:', recoveryError);
          }
        }
        
        // If compliance is sufficient, return result
        if (validation.isComplete && validation.complianceScore >= 0.85) {
          console.log('✅ Professional draft generation successful');
          return this.formatIPOSection(result, request.sectionType);
        } else {
          console.log(`⚠ Draft incomplete on attempt ${attempt + 1}:`, validation.issues);
          console.log(`Compliance score: ${Math.round(validation.complianceScore * 100)}%`);
          
          // If this is the last attempt, return what we have
          if (attempt === 2) {
            console.log('Using final attempt result despite incompleteness');
            return this.formatIPOSection(result, request.sectionType);
          }
          
          // Continue to next attempt with enhanced compliance instructions
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
   * Recover truncated content by requesting continuation
   */
  private async recoverTruncatedContent(
    truncatedContent: string, 
    originalPrompt: string,
    provider: AIProvider,
    modelId: string
  ): Promise<string> {
    // Find last complete sentence
    const sentences = truncatedContent.match(/[^.!?]+[.!?]+/g) || [];
    const lastCompleteSentence = sentences[sentences.length - 1] || '';
    const lastWords = lastCompleteSentence.split(' ').slice(-10).join(' ');
    
    const continuationPrompt = `Continue the IPO prospectus section from where it was cut off.

LAST COMPLETE CONTENT:
...${lastWords}

INSTRUCTIONS:
- Continue naturally from the last sentence
- Complete any unfinished subsections
- Maintain consistent tone and format
- Do NOT repeat previous content
- Provide ONLY the continuation (no introduction)

Continue here:`;

    console.log('Requesting continuation from:', lastWords.substring(0, 100));
    
    const aiResponse = await universalAiClient.generateContent({
      prompt: continuationPrompt,
      provider,
      modelId,
      metadata: { 
        requestType: 'truncation_recovery',
        maxTokens: 8000,
        temperature: 0.3
      }
    });
    
    if (!aiResponse.success) {
      throw new Error('Continuation failed: ' + aiResponse.error);
    }
    
    // Merge original and continuation
    return truncatedContent + '\n\n' + aiResponse.text;
  }

  /**
   * Attempt generation with smart provider selection
   */
  private async attemptGeneration(prompt: string, request: DraftGenerationRequest, attempt: number): Promise<{
    result: string;
    provider: AIProvider;
    modelId: string;
  }> {
    // Smart provider selection based on attempt
    let provider: AIProvider;
    let modelId: string;
    let maxTokens: number;
    
    if (attempt === 0) {
      // First attempt: Use Google Gemini with optimized token limit
      provider = AIProvider.GOOGLE;
      modelId = 'gemini-2.0-flash';
      maxTokens = 16000; // Optimized for reliable complete responses
    } else if (attempt === 1) {
      // Second attempt: Use user preference with reduced tokens
      const userPreference = getFeatureAIPreference('ipo');
      provider = userPreference.provider;
      modelId = userPreference.model;
      maxTokens = 12000;
    } else {
      // Final attempt: Fallback to Grok with conservative tokens
      provider = AIProvider.GROK;
      modelId = 'grok-4-0709';
      maxTokens = 8000;
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
    
    return {
      result: aiResponse.text,
      provider,
      modelId
    };
  }

  /**
   * Validate draft completeness using main chat quality system with enhanced compliance
   */
  private async validateDraftCompleteness(content: string, sectionType: string): Promise<{
    isComplete: boolean;
    issues: string[];
    complianceScore: number;
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
    
    // 5. Enhanced compliance validation using semantic analysis
    let complianceScore = 0.7; // Default fallback score
    const requirements = ipoRequirementsService.getRequirements(sectionType);
    if (requirements) {
      // Use semantic compliance validation for more accurate scoring
      try {
        const semanticValidation = await complianceValidationService.validateCompliance(content, sectionType);
        complianceScore = semanticValidation.overallScore;
        
        if (!semanticValidation.passesThreshold) {
          issues.push(`Compliance score too low: ${Math.round(complianceScore * 100)}% (minimum 85% required)`);
        }
        
        if (semanticValidation.missingRequirements.length > 0) {
          issues.push(`Missing mandatory requirements: ${semanticValidation.missingRequirements.join(', ')}`);
        }
      } catch (error) {
        console.warn('Semantic validation failed, using basic compliance check:', error);
        // Fallback to basic compliance checking
        const basicCompliance = ipoRequirementsService.checkCompliance(content, sectionType);
        complianceScore = basicCompliance.complianceScore;
        
        if (complianceScore < 0.7) {
          issues.push(`Low compliance score: ${Math.round(complianceScore * 100)}%`);
        }
        
        if (basicCompliance.missingRequirements.length > 0) {
          issues.push(`Missing requirements: ${basicCompliance.missingRequirements.length} items`);
        }
      }
    }
    
    return {
      isComplete: issues.length === 0 && complianceScore >= 0.85,
      issues,
      complianceScore
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

  /**
   * Generate compliance checklist for specific section
   */
  private async generateComplianceChecklist(sectionType: string): Promise<string[]> {
    const requirements = ipoRequirementsService.getRequirements(sectionType);
    if (!requirements) return [];

    const checklist: string[] = [];

    // Add mandatory requirements to checklist
    requirements.requirements
      .filter(req => req.mandatory)
      .forEach(req => {
        checklist.push(`🔴 MANDATORY: ${req.title} - ${req.description}`);
        req.subsections.forEach(sub => {
          checklist.push(`   • Include: ${sub}`);
        });
        req.disclosures.forEach(disc => {
          checklist.push(`   • Disclose: ${disc}`);
        });
      });

    // Add mandatory tables
    if (requirements.mandatoryTables.length > 0) {
      checklist.push('🔴 MANDATORY TABLES:');
      requirements.mandatoryTables.forEach(table => {
        checklist.push(`   • ${table}`);
      });
    }

    // Add compliance notes
    if (requirements.complianceNotes.length > 0) {
      checklist.push('🔴 COMPLIANCE REQUIREMENTS:');
      requirements.complianceNotes.forEach(note => {
        checklist.push(`   • ${note}`);
      });
    }

    return checklist;
  }
}

export const professionalDraftGenerator = new ProfessionalDraftGenerator();