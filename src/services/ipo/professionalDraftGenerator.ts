import { precedentService, type PrecedentCase } from './precedentService';
import { ipoRequirementsService } from './ipoRequirementsService';
import { universalAiClient } from '@/services/ai/universalAiClient';
import { getFeatureAIPreference } from '@/services/ai/aiPreferences';
import { AIProvider } from '@/types/aiProvider';
import { analyzeFinancialResponse, detectTruncationComprehensive, getTruncationDiagnostics } from '@/utils/truncation';
import { complianceValidationService } from './complianceValidationService';
import { smartContentMerger } from './smartContentMerger';
import { contentRelevanceAnalyzer, ContentFlag } from './contentRelevanceAnalyzer';

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
  contentFlags?: ContentFlag[];
}

export interface AnalysisStep {
  title: string;
  description: string;
  findings: string[];
}

export class ProfessionalDraftGenerator {
  // Cache for precedent cases to avoid repeated DB queries
  private precedentCache: Map<string, { data: PrecedentCase[]; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Generate a complete professional IPO draft based on user request and precedents
   */
  async generateProfessionalDraft(request: DraftGenerationRequest): Promise<ProfessionalDraftResult> {
    try {
      // FORMAT-ONLY PATH: Preserve all content, only change structure
      if (this.isFormatOnlyRequest(request.userRequest) && request.currentContent?.length > 200) {
        console.log('📐 Format-only request detected, using content-preserving handler');
        
        // Run format and content analysis in parallel
        const [formattedContent, relevanceAnalysis] = await Promise.all([
          this.generateFormatAmendment(request),
          contentRelevanceAnalyzer.analyzeRelevance(request.currentContent, request.sectionType)
        ]);
        
        console.log(`🔍 Content analysis found ${relevanceAnalysis.flaggedContent.length} items for review`);
        
        return {
          fullDraft: formattedContent,
          analysisSteps: [{ 
            title: 'Format Enhancement', 
            description: 'Applied formatting improvements while preserving all content',
            findings: ['Structure improved', 'All original content preserved']
          }],
          precedentCases: [],
          complianceNotes: ['Format enhanced - all content preserved'],
          confidence: 0.95,
          contentFlags: relevanceAnalysis.flaggedContent
        };
      }

      // FAST PATH: For amendments, skip heavy analysis
      if (this.isAmendmentRequest(request)) {
        console.log('⚡ Fast-track amendment mode - skipping full analysis');
        
        const startTime = Date.now();
        const fullDraft = await this.generateTargetedAmendment(request);
        
        // Validate content preservation
        const validation = this.validateAmendmentPreservation(
          request.currentContent, 
          fullDraft, 
          request.userRequest
        );
        
        const finalDraft = validation.isValid ? fullDraft : validation.recoveredContent!;
        
        console.log(`✅ Amendment completed in ${Date.now() - startTime}ms`);
        
        return {
          fullDraft: finalDraft,
          analysisSteps: [{
            title: 'Targeted Amendment',
            description: 'Made precise changes as requested',
            findings: ['Existing content preserved', 'Only requested changes applied']
          }],
          precedentCases: [], // Skip precedent lookup for speed
          complianceNotes: ['Amendment applied - verify compliance if needed'],
          confidence: 0.9
        };
      }

      // FULL PATH: For new generation, run complete analysis
      console.log('📝 Full generation mode with complete analysis');
      
      // Run analysis and precedent lookup IN PARALLEL for speed
      const [analysisSteps, precedentCases] = await Promise.all([
        this.analyzeCurrentContent(request),
        this.getCachedPrecedents(request.sectionType, request.industry)
      ]);

      // Generate professional draft with precedent support
      const fullDraft = await this.generateCompleteSection(request, precedentCases, analysisSteps);

      // Extract compliance notes
      const complianceNotes = this.extractComplianceNotes(analysisSteps);

      return {
        fullDraft,
        analysisSteps,
        precedentCases,
        complianceNotes,
        confidence: this.calculateConfidence(analysisSteps, precedentCases)
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
   * Detect if this is an amendment request or new generation
   */
  private isAmendmentRequest(request: DraftGenerationRequest): boolean {
    const content = request.currentContent?.trim() || '';
    const userRequest = request.userRequest.toLowerCase();
    
    // If no existing content or very short, it's always a new generation
    if (content.length < 200) return false;
    
    // Check for amendment keywords (including format/structure)
    const amendmentKeywords = [
      'amend', 'change', 'update', 'modify', 'revise', 'edit', 'fix',
      'add to', 'add more', 'remove', 'replace', 'improve', 'enhance', 
      'correct', 'adjust', 'refine', 'strengthen', 'clarify', 'expand on',
      'delete', 'shorten', 'lengthen', 'rewrite paragraph', 'fix the',
      'tweak', 'polish', 'rephrase',
      // Format/structure keywords
      'format', 'structure', 'reorganize', 'restructure', 'reformat', 
      'reorder', 'layout', 'organize', 'paragraph', 'heading', 'bullet',
      'better organized', 'cleaner', 'readable'
    ];
    
    // Check for new generation keywords (override amendment detection)
    const newGenerationKeywords = [
      'generate new', 'create new', 'write new', 'draft new', 'start fresh',
      'regenerate', 'rewrite completely', 'write from scratch'
    ];
    
    if (newGenerationKeywords.some(keyword => userRequest.includes(keyword))) {
      return false;
    }
    
    return amendmentKeywords.some(keyword => userRequest.includes(keyword));
  }

  /**
   * Detect if this is a format/structure-only request (no content changes)
   */
  private isFormatOnlyRequest(userRequest: string): boolean {
    const request = userRequest.toLowerCase();
    const formatKeywords = [
      'format', 'structure', 'reorganize', 'restructure', 'reformat',
      'reorder', 'layout', 'paragraph', 'heading', 'bullet point',
      'better organized', 'cleaner format', 'improve layout', 'readable',
      'better structure', 'improve structure', 'fix format', 'fix structure'
    ];
    
    // Check if it's asking for content changes (not just formatting)
    const contentChangeKeywords = ['add', 'remove', 'delete', 'expand', 'shorten', 'write', 'include', 'mention'];
    const hasContentChange = contentChangeKeywords.some(k => request.includes(k));
    const hasFormatRequest = formatKeywords.some(k => request.includes(k));
    
    return hasFormatRequest && !hasContentChange;
  }

  /**
   * Generate format-only amendment with strict content preservation
   */
  private async generateFormatAmendment(request: DraftGenerationRequest): Promise<string> {
    const originalLength = request.currentContent.length;
    
    const prompt = `You are an IPO prospectus FORMAT editor. Your task is to REORGANIZE and REFORMAT text while PRESERVING EVERY WORD.

USER REQUEST: ${request.userRequest}

CURRENT CONTENT (YOU MUST PRESERVE ALL OF THIS TEXT):
${request.currentContent}

CRITICAL PRESERVATION RULES:
1. DO NOT delete, summarize, or shorten ANY text content
2. DO NOT add new substantive content or examples
3. DO NOT change any numbers, dates, names, percentages, financial figures
4. DO NOT remove any sentences or paragraphs
5. The output MUST contain approximately the same number of characters (within 5%)

WHAT YOU CAN CHANGE:
- Add paragraph breaks to improve readability
- Add section headings (use plain text like "SECTION NAME" not markdown)
- Reorder paragraphs if it improves logical flow
- Convert run-on text into proper paragraphs
- Add bullet formatting using plain text (• or numbers)
- Improve sentence structure within paragraphs

OUTPUT FORMAT:
- Plain text only - NO markdown (no **, *, ##, etc.)
- Use blank lines between paragraphs
- Section headers on their own line
- Start directly with the content, no preamble

Return the reformatted content with ALL original text preserved:`;

    const { result } = await this.attemptGeneration(prompt, request, 0);
    
    // Strict validation: format changes should NOT significantly change length
    const newLength = result.length;
    const lengthRatio = newLength / originalLength;
    
    if (lengthRatio < 0.9) {
      console.warn(`⚠️ Format amendment lost ${Math.round((1 - lengthRatio) * 100)}% content, using safe fallback`);
      return this.applyMinimalFormatting(request.currentContent, request.userRequest);
    }
    
    if (lengthRatio > 1.15) {
      console.warn(`⚠️ Format amendment added ${Math.round((lengthRatio - 1) * 100)}% content, using safe fallback`);
      return this.applyMinimalFormatting(request.currentContent, request.userRequest);
    }
    
    console.log(`✅ Format amendment preserved ${Math.round(lengthRatio * 100)}% of content length`);
    return this.formatIPOSection(result, request.sectionType);
  }

  /**
   * Apply minimal, non-destructive formatting as a safe fallback
   */
  private applyMinimalFormatting(content: string, userRequest: string): string {
    let result = content;
    const request = userRequest.toLowerCase();
    
    // Add paragraph breaks after periods followed by capital letters (if requested)
    if (request.includes('paragraph') || request.includes('readable') || request.includes('structure')) {
      // Split long blocks into paragraphs at natural sentence boundaries
      result = result.replace(/([.!?])(\s+)([A-Z])/g, '$1\n\n$3');
    }
    
    // Ensure section headers have proper spacing
    if (request.includes('heading') || request.includes('section') || request.includes('structure')) {
      // Add spacing around lines that look like headers (short, possibly caps, ending with colon)
      result = result.replace(/\n([A-Z][A-Z\s]{2,40}:?)\n/g, '\n\n$1\n\n');
    }
    
    console.log('📝 Applied minimal safe formatting');
    return result;
  }

  /**
   * Generate targeted amendment preserving existing content
   */
  private async generateTargetedAmendment(request: DraftGenerationRequest): Promise<string> {
    const prompt = `You are an IPO prospectus editor. Make PRECISE, TARGETED amendments ONLY.

USER REQUEST: ${request.userRequest}

CURRENT CONTENT (PRESERVE THIS STRUCTURE):
${request.currentContent}

CRITICAL RULES - READ CAREFULLY:
1. ONLY modify the specific parts mentioned in the user's request
2. DO NOT rewrite or reorganize content that wasn't mentioned
3. DO NOT delete any paragraphs unless explicitly requested
4. PRESERVE all:
   - Section headers and structure
   - Numbers, dates, percentages, financial figures
   - Company names, regulatory citations
   - Paragraphs NOT related to the request
5. Return the COMPLETE content with your targeted changes applied

OUTPUT FORMAT:
- Output the FULL content with changes applied inline
- Plain text only - NO markdown
- Start directly with the content, no preamble
- Do NOT add comments like "[CHANGED]" - just output the final text
- Do NOT include HKEX draft disclaimers like "THIS DOCUMENT IS IN DRAFT FORM"

Return the amended content:`;

    const { result } = await this.attemptGeneration(prompt, request, 0);
    
    // Safety check: ensure we haven't lost significant content
    const originalLength = request.currentContent.length;
    const newLength = result.length;
    const lengthRatio = newLength / originalLength;
    
    if (lengthRatio < 0.7) {
      console.warn('⚠️ Amendment resulted in >30% content loss, using smart merge instead');
      return smartContentMerger.smartMerge(request.currentContent, result, { 
        type: 'enhance-existing', 
        preserveStructure: true 
      });
    }
    
    return this.formatIPOSection(result, request.sectionType);
  }

  /**
   * Validate that amendment preserved necessary content
   */
  private validateAmendmentPreservation(
    original: string, 
    amended: string, 
    userRequest: string
  ): { isValid: boolean; recoveredContent?: string } {
    // Extract key paragraphs from original (at least 50 chars)
    const originalParagraphs = original.split(/\n\n+/).filter(p => p.trim().length > 50);
    const amendedContent = amended.toLowerCase();
    const requestWords = userRequest.toLowerCase().split(/\s+/).filter(w => w.length > 4);
    
    // Find missing paragraphs that are NOT related to the user's request
    const missingParagraphs = originalParagraphs.filter(origPara => {
      const paraLower = origPara.toLowerCase();
      
      // Check if this paragraph was intentionally targeted by the request
      const isRequestRelated = requestWords.some(word => paraLower.includes(word));
      if (isRequestRelated) return false; // Expected to be modified
      
      // Check if key phrases from this paragraph still exist
      const keyPhrases = origPara.split(/[.!?]/).filter(s => s.trim().length > 20).slice(0, 2);
      const stillExists = keyPhrases.some(phrase => {
        const cleanPhrase = phrase.trim().toLowerCase().substring(0, 50);
        return amendedContent.includes(cleanPhrase);
      });
      
      return !stillExists;
    });
    
    if (missingParagraphs.length > 0) {
      console.warn(`⚠️ ${missingParagraphs.length} paragraphs may be missing, attempting recovery`);
      const recoveredContent = this.recoverMissingContent(original, amended, missingParagraphs);
      return { isValid: false, recoveredContent };
    }
    
    return { isValid: true };
  }

  /**
   * Recover content that was accidentally removed during amendment
   */
  private recoverMissingContent(original: string, amended: string, missing: string[]): string {
    // Use smart merger to reintegrate missing content
    let result = amended;
    
    for (const paragraph of missing) {
      // Find approximate position in original
      const originalIndex = original.indexOf(paragraph);
      const textBefore = original.substring(0, originalIndex);
      const paragraphsBefore = textBefore.split(/\n\n+/).length;
      
      // Insert at similar position in amended content
      const amendedParts = result.split(/\n\n+/);
      const insertPosition = Math.min(paragraphsBefore, amendedParts.length);
      
      console.log(`Recovering paragraph at position ${insertPosition}`);
      amendedParts.splice(insertPosition, 0, paragraph);
      result = amendedParts.join('\n\n');
    }
    
    return result;
  }

  /**
   * Get cached precedents or fetch from database
   */
  private async getCachedPrecedents(sectionType: string, industry?: string): Promise<PrecedentCase[]> {
    const cacheKey = `${sectionType}-${industry || 'general'}`;
    const cached = this.precedentCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      console.log('⚡ Using cached precedents');
      return cached.data;
    }
    
    const result = await precedentService.findRelevantPrecedents(sectionType, industry, 3);
    this.precedentCache.set(cacheKey, { data: result.cases, timestamp: Date.now() });
    
    return result.cases;
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

CRITICAL OUTPUT FORMAT RULES:
- Output PLAIN TEXT ONLY - absolutely NO markdown formatting
- Do NOT use: ** (bold), * (italic), ## (headers), - (bullets at start of lines), \` (code blocks)
- Do NOT start with "Okay", "Here's", "Sure", "I've", "Certainly", "Of course", or any preamble
- Do NOT add any explanation or commentary about what you're generating
- Do NOT say things like "Here's a revised version" or "I've expanded the section"
- Do NOT include HKEX draft disclaimers like "THIS DOCUMENT IS IN DRAFT FORM, INCOMPLETE AND SUBJECT TO CHANGE"
- Start DIRECTLY with the section title or content
- Write content ready for Word document insertion

PARAGRAPH STRUCTURE RULES:
- Use double line breaks (blank line) between paragraphs
- Each major point or topic should be its own paragraph
- Group related sentences together in the same paragraph
- Section headers should be on their own line followed by a blank line
- Keep paragraphs focused and readable (3-6 sentences each)

Generate the COMPLETE revised section:`;

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
   * Clean AI output for Word/document insertion
   * Removes markdown formatting and AI preambles
   */
  private cleanOutputForWord(text: string): string {
    if (!text || typeof text !== 'string') return text;
    
    let cleaned = text;
    
    // Remove markdown bold/italic
    cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1');
    cleaned = cleaned.replace(/\*([^*]+)\*/g, '$1');
    cleaned = cleaned.replace(/__([^_]+)__/g, '$1');
    cleaned = cleaned.replace(/_([^_]+)_/g, '$1');
    
    // Remove markdown headers
    cleaned = cleaned.replace(/^#{1,6}\s+/gm, '');
    
    // Remove markdown bullet points (convert to simple format)
    cleaned = cleaned.replace(/^[\s]*[-*+]\s+/gm, '• ');
    
    // Remove code blocks
    cleaned = cleaned.replace(/```[\s\S]*?```/g, '');
    cleaned = cleaned.replace(/`([^`]+)`/g, '$1');
    
    // Remove common AI preambles (expanded patterns)
    const preamblePatterns = [
      /^(Okay|Sure|Certainly|Of course)[,.]?\s*(here('s| is)|I('ve| have))[^.]*[.!:]\s*/i,
      /^Here('s| is) (a |the )?(revised|improved|rewritten|expanded|complete|updated|professional)[^.]*[.!:]\s*/i,
      /^I('ve| have) (revised|improved|rewritten|expanded|generated|created)[^.]*[.!:]\s*/i,
      /^(The following|Below) (is|are)[^.]*[.!:]\s*/i,
      /^This (is a |)(revised|improved|expanded|complete)[^.]*[.!:]\s*/i,
      /^(Okay|Sure|Certainly)[,.]?\s*here('s| is)[^]*?standards[.!:]\s*/i,
    ];
    
    for (const pattern of preamblePatterns) {
      cleaned = cleaned.replace(pattern, '');
    }
    
    // Remove HKEX draft disclaimers
    const disclaimerPatterns = [
      /THIS DOCUMENT IS IN DRAFT FORM[^.]*\.\s*/gi,
      /INCOMPLETE AND SUBJECT TO CHANGE[^.]*\.\s*/gi,
      /THE INFORMATION MUST BE READ IN CONJUNCTION WITH[^.]*\.\s*/gi,
    ];
    disclaimerPatterns.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '');
    });
    
    // Clean up extra whitespace
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    
    return cleaned.trim();
  }

  /**
   * Convert plain text to proper HTML for JoditEditor
   * Handles paragraphs, headers, and lists
   */
  private convertToProspectusHTML(text: string): string {
    if (!text || typeof text !== 'string') return text;
    
    // Already HTML? Return as-is
    if (text.includes('<p>') || text.includes('<h2>') || text.includes('<div>')) {
      return text;
    }
    
    let html = text;
    
    // Normalize line breaks
    html = html.replace(/\r\n/g, '\n');
    
    // Split into paragraphs (double newlines)
    const paragraphs = html.split(/\n\n+/);
    
    // Convert each paragraph to HTML
    const htmlParagraphs = paragraphs.map(para => {
      const trimmed = para.trim();
      if (!trimmed) return '';
      
      // Check if it's a section header (short line, often ends with colon or is ALL CAPS)
      const isHeader = (
        trimmed.length < 100 && 
        !trimmed.includes('. ') &&
        (trimmed.endsWith(':') || 
         trimmed === trimmed.toUpperCase() ||
         /^[A-Z][A-Z\s]+$/.test(trimmed) ||
         /^\d+\.\s*[A-Z]/.test(trimmed)) // Numbered sections like "1. BUSINESS OVERVIEW"
      );
      
      if (isHeader) {
        // Use h3 for subsection headers
        return `<h3>${trimmed.replace(/:$/, '')}</h3>`;
      }
      
      // Handle bullet points
      const lines = trimmed.split('\n');
      if (lines.some(line => line.trim().startsWith('•') || line.trim().match(/^[-–]\s/))) {
        const listItems = lines
          .filter(line => line.trim())
          .map(line => `<li>${line.replace(/^[\s•\-–]+/, '').trim()}</li>`)
          .join('');
        return `<ul>${listItems}</ul>`;
      }
      
      // Regular paragraph - preserve single line breaks as <br> if needed
      const formattedPara = trimmed.replace(/\n/g, '<br>');
      return `<p>${formattedPara}</p>`;
    });
    
    return htmlParagraphs.filter(p => p).join('\n');
  }

  /**
   * Format content according to IPO prospectus standards
   */
  private formatIPOSection(content: string, sectionType: string): string {
    // First apply comprehensive markdown/preamble cleaning
    let cleanContent = this.cleanOutputForWord(content);
    
    // Additional IPO-specific cleanup
    cleanContent = cleanContent
      .replace(/^Note: This is.*$/gm, '')
      .replace(/^This draft.*$/gm, '')
      .trim();

    // Convert to proper HTML for the editor
    return this.convertToProspectusHTML(cleanContent);
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

  /**
   * Generate amendment for selected text only
   */
  async generateSelectionAmendment(request: {
    fullContent: string;
    selectedText: string;
    userRequest: string;
    sectionType: string;
  }): Promise<string> {
    const { fullContent, selectedText, userRequest, sectionType } = request;
    
    // Get context around the selection for better understanding
    const selectionIndex = fullContent.indexOf(selectedText);
    const contextBefore = selectionIndex > 0 
      ? fullContent.substring(Math.max(0, selectionIndex - 500), selectionIndex)
      : '';
    const contextAfter = selectionIndex >= 0 
      ? fullContent.substring(selectionIndex + selectedText.length, selectionIndex + selectedText.length + 500)
      : '';

    const prompt = `You are an IPO prospectus editor. The user has SELECTED a specific portion of text to amend.

DOCUMENT SECTION TYPE: ${sectionType}

CONTEXT BEFORE SELECTION:
...${contextBefore}

USER'S SELECTED TEXT (THIS IS WHAT YOU MUST AMEND):
"${selectedText}"

CONTEXT AFTER SELECTION:
${contextAfter}...

USER REQUEST: ${userRequest}

CRITICAL RULES:
1. Return ONLY the amended version of the selected text
2. Do NOT return the full document or surrounding context
3. Do NOT add any text before or after the amendment
4. Keep the same approximate length (±20%) unless expanding/shortening is requested
5. PRESERVE any:
   - Numbers, dates, percentages, financial figures
   - Company names, regulatory citations
   - Technical terms and proper nouns
6. Match the tone and style of the surrounding document
7. Plain text only - NO markdown formatting (**bold**, *italic*, ## headers)
8. Do NOT start with "Here's", "Sure", "Okay" or any preamble
9. Do NOT include HKEX draft disclaimers

OUTPUT: Return ONLY the improved version of the selected text, nothing else.`;

    const preference = getFeatureAIPreference('ipo');
    
    const response = await universalAiClient.generateContent({
      prompt,
      provider: preference.provider,
      modelId: preference.model,
      metadata: {
        maxTokens: Math.max(500, selectedText.length * 3),
        temperature: 0.2,
        featureContext: 'selection-amendment'
      }
    });
    
    return this.cleanOutputForWord(response.text);
  }
}

export const professionalDraftGenerator = new ProfessionalDraftGenerator();