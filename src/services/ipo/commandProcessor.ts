/**
 * Natural Language Command Processor for IPO Drafting
 * Recognizes and processes common drafting commands to provide targeted assistance
 */

export interface CommandAnalysis {
  intent: CommandIntent;
  targets: string[];
  modifiers: string[];
  confidence: number;
  originalCommand: string;
}

export type CommandIntent = 
  | 'improve_professional'
  | 'add_citations'
  | 'expand_content'
  | 'fix_compliance'
  | 'restructure'
  | 'add_examples'
  | 'make_compliant'
  | 'analyze_content'
  | 'enhance_language'
  | 'add_details'
  | 'simplify'
  | 'strengthen'
  | 'general_query';

const COMMAND_PATTERNS = {
  improve_professional: [
    /make.*more professional/i,
    /improve.*professional/i,
    /enhance.*professional/i,
    /make.*formal/i,
    /professional tone/i,
    /refine.*language/i
  ],
  add_citations: [
    /add.*citations?/i,
    /include.*references?/i,
    /add.*regulatory.*references?/i,
    /cite.*regulations?/i,
    /reference.*listing.*rules?/i,
    /add.*sources?/i
  ],
  expand_content: [
    /expand.*content/i,
    /make.*longer/i,
    /add.*more.*details?/i,
    /elaborate.*on/i,
    /provide.*more.*information/i,
    /flesh.*out/i,
    /develop.*further/i
  ],
  fix_compliance: [
    /fix.*compliance/i,
    /compliance.*issues?/i,
    /regulatory.*compliance/i,
    /hkex.*compliance/i,
    /listing.*rules.*compliance/i,
    /ensure.*compliant/i
  ],
  restructure: [
    /restructure/i,
    /reorganize/i,
    /reorder/i,
    /better.*flow/i,
    /improve.*structure/i,
    /reorganise/i,
    /rearrange/i
  ],
  add_examples: [
    /add.*examples?/i,
    /provide.*examples?/i,
    /include.*examples?/i,
    /specific.*examples?/i,
    /give.*examples?/i,
    /illustrate.*with/i
  ],
  make_compliant: [
    /make.*hkex.*compliant/i,
    /ensure.*hkex/i,
    /comply.*with.*hkex/i,
    /listing.*rules.*compliant/i,
    /meet.*requirements/i
  ],
  analyze_content: [
    /analyze/i,
    /review/i,
    /check/i,
    /assess/i,
    /evaluate/i,
    /audit/i
  ],
  enhance_language: [
    /enhance.*language/i,
    /improve.*wording/i,
    /better.*language/i,
    /refine.*text/i,
    /polish/i,
    /improve.*writing/i
  ],
  add_details: [
    /add.*details?/i,
    /more.*specific/i,
    /be.*specific/i,
    /include.*specifics?/i,
    /detailed/i
  ],
  simplify: [
    /simplify/i,
    /make.*simpler/i,
    /easier.*to.*understand/i,
    /clearer/i,
    /less.*complex/i
  ],
  strengthen: [
    /strengthen/i,
    /make.*stronger/i,
    /more.*compelling/i,
    /more.*convincing/i,
    /bolster/i,
    /reinforce/i
  ]
};

const SECTION_TARGETS = [
  'business model', 'overview', 'strategy', 'risks', 'financials',
  'history', 'products', 'services', 'strengths', 'competitive',
  'management', 'operations', 'market', 'industry', 'revenue',
  'growth', 'disclosure', 'summary', 'background', 'development'
];

const MODIFIER_PATTERNS = {
  urgency: [/urgent/i, /immediate/i, /asap/i, /quickly/i, /now/i],
  quality: [/high.*quality/i, /professional/i, /excellent/i, /top.*tier/i],
  length: [/brief/i, /detailed/i, /comprehensive/i, /concise/i, /extensive/i],
  compliance: [/hkex/i, /listing.*rules/i, /regulatory/i, /app1a/i, /part.*a/i],
  tone: [/formal/i, /professional/i, /technical/i, /accessible/i]
};

export class CommandProcessor {
  /**
   * Analyze user input to determine intent and extract key information
   */
  analyzeCommand(userInput: string): CommandAnalysis {
    const normalizedInput = userInput.toLowerCase().trim();
    
    // Detect primary intent
    const intent = this.detectIntent(normalizedInput);
    
    // Extract targets (what the user wants to work on)
    const targets = this.extractTargets(normalizedInput);
    
    // Extract modifiers (how they want it done)
    const modifiers = this.extractModifiers(normalizedInput);
    
    // Calculate confidence based on pattern matches
    const confidence = this.calculateConfidence(intent, targets, normalizedInput);
    
    return {
      intent,
      targets,
      modifiers,
      confidence,
      originalCommand: userInput
    };
  }

  /**
   * Generate enhanced prompts based on command analysis
   */
  generateEnhancedPrompt(analysis: CommandAnalysis, currentContent: string, sectionType: string): string {
    const basePrompt = this.getIntentBasedPrompt(analysis.intent);
    const targetContext = analysis.targets.length > 0 
      ? `Focus specifically on: ${analysis.targets.join(', ')}` 
      : '';
    const modifierContext = analysis.modifiers.length > 0 
      ? `Apply these qualities: ${analysis.modifiers.join(', ')}` 
      : '';

    return `
${basePrompt}

**SPECIFIC FOCUS:**
${targetContext}
${modifierContext}

**CURRENT SECTION:** ${sectionType}
**CURRENT CONTENT LENGTH:** ${currentContent?.length || 0} characters

**USER'S ORIGINAL REQUEST:** ${analysis.originalCommand}

**CONFIDENCE LEVEL:** ${Math.round(analysis.confidence * 100)}%

Please provide specific, actionable improvements that directly address the user's intent.
    `.trim();
  }

  private detectIntent(input: string): CommandIntent {
    for (const [intent, patterns] of Object.entries(COMMAND_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(input)) {
          return intent as CommandIntent;
        }
      }
    }
    return 'general_query';
  }

  private extractTargets(input: string): string[] {
    const targets: string[] = [];
    
    for (const target of SECTION_TARGETS) {
      if (input.includes(target)) {
        targets.push(target);
      }
    }
    
    return targets;
  }

  private extractModifiers(input: string): string[] {
    const modifiers: string[] = [];
    
    for (const [category, patterns] of Object.entries(MODIFIER_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(input)) {
          modifiers.push(category);
          break; // Only add category once
        }
      }
    }
    
    return modifiers;
  }

  private calculateConfidence(intent: CommandIntent, targets: string[], input: string): number {
    let confidence = 0.5; // Base confidence
    
    // Increase confidence for specific intent matches
    if (intent !== 'general_query') {
      confidence += 0.3;
    }
    
    // Increase confidence for specific targets
    if (targets.length > 0) {
      confidence += 0.2;
    }
    
    // Increase confidence for longer, more detailed requests
    if (input.length > 50) {
      confidence += 0.1;
    }
    
    // Cap at 1.0
    return Math.min(confidence, 1.0);
  }

  private getIntentBasedPrompt(intent: CommandIntent): string {
    const prompts = {
      improve_professional: `
**TASK: PROFESSIONAL ENHANCEMENT**
Transform the content to use professional investment banking language, formal tone, and sophisticated vocabulary appropriate for institutional investors and regulatory authorities.`,

      add_citations: `
**TASK: REGULATORY CITATION ENHANCEMENT**
Add specific regulatory references, cite relevant HKEX Listing Rules, App1A Part A requirements, and include proper legal citations to strengthen credibility.`,

      expand_content: `
**TASK: CONTENT EXPANSION**
Develop the content with additional details, supporting information, context, and comprehensive explanations while maintaining professional quality.`,

      fix_compliance: `
**TASK: COMPLIANCE REMEDIATION**
Identify and fix specific HKEX compliance issues, ensure adherence to listing rules, and address regulatory requirements with specific corrective actions.`,

      restructure: `
**TASK: STRUCTURAL REORGANIZATION**
Reorganize content for optimal flow, logical progression, and improved readability while maintaining all essential information and regulatory compliance.`,

      add_examples: `
**TASK: EXAMPLE INTEGRATION**
Incorporate specific, relevant examples that illustrate key points, strengthen arguments, and provide concrete evidence of statements made.`,

      make_compliant: `
**TASK: HKEX COMPLIANCE ASSURANCE**
Ensure full compliance with HKEX Main Board listing requirements, App1A Part A standards, and relevant regulatory frameworks.`,

      analyze_content: `
**TASK: CONTENT ANALYSIS**
Provide comprehensive analysis of the content's quality, compliance, structure, and areas for improvement with specific recommendations.`,

      enhance_language: `
**TASK: LANGUAGE ENHANCEMENT**
Improve word choice, sentence structure, clarity, and overall linguistic quality while maintaining professional tone and technical accuracy.`,

      add_details: `
**TASK: DETAIL ENHANCEMENT**
Add specific, relevant details that strengthen the content, provide better context, and offer more comprehensive information to readers.`,

      simplify: `
**TASK: CLARITY IMPROVEMENT**
Simplify complex language while maintaining professional standards, improve readability, and ensure accessibility without losing technical accuracy.`,

      strengthen: `
**TASK: CONTENT STRENGTHENING**
Reinforce key arguments, add supporting evidence, improve persuasiveness, and enhance the overall impact of the content.`,

      general_query: `
**TASK: GENERAL ASSISTANCE**
Provide helpful guidance and improvements based on the user's request, focusing on enhancing the overall quality and effectiveness of the IPO prospectus content.`
    };

    return prompts[intent];
  }
}

export const commandProcessor = new CommandProcessor();