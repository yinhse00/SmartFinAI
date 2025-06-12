import { grokService } from '../grokService';
import { fileProcessingService } from '../documents/fileProcessingService';
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';

export interface TransactionAnalysisRequest {
  transactionType: string;
  description: string;
  amount?: number;
  currency?: string;
  documents?: File[];
  additionalContext?: string;
}

export interface AnalysisContext {
  originalRequest: TransactionAnalysisRequest;
  analysisTimestamp: Date;
}

/**
 * Service for AI-powered transaction analysis
 */
export const aiAnalysisService = {
  /**
   * Analyze transaction requirements and generate comprehensive advisory
   */
  analyzeTransaction: async (request: TransactionAnalysisRequest): Promise<AnalysisResults> => {
    try {
      console.log('Starting AI transaction analysis...');
      
      // Extract content from uploaded documents
      let documentContent = '';
      if (request.documents?.length > 0) {
        console.log(`Processing ${request.documents.length} uploaded documents...`);
        const extractionPromises = request.documents.map(file => 
          fileProcessingService.processFile(file)
        );
        
        const extractions = await Promise.all(extractionPromises);
        documentContent = extractions
          .map(result => `${result.source}:\n${result.content}`)
          .join('\n\n');
      }
      
      // Construct comprehensive analysis prompt
      const analysisPrompt = buildAnalysisPrompt(request.description, documentContent);
      
      // Get AI analysis from Grok
      const response = await grokService.generateResponse({
        prompt: analysisPrompt,
        metadata: {
          type: 'deal_structuring',
          hasDocuments: request.documents?.length > 0
        }
      });
      
      // Parse and structure the response
      const analysisResults = parseAnalysisResponse(response.text);
      
      console.log('AI transaction analysis completed');
      return analysisResults;
    } catch (error) {
      console.error('Error in AI transaction analysis:', error);
      throw new Error('Failed to analyze transaction. Please try again.');
    }
  },

  /**
   * Store analysis context for follow-up processing
   */
  storeAnalysisContext: (request: TransactionAnalysisRequest, results: AnalysisResults): AnalysisContext => {
    return {
      originalRequest: request,
      analysisTimestamp: new Date()
    };
  },

  /**
   * Enhanced analysis method that returns both results and context
   */
  analyzeTransactionWithContext: async (request: TransactionAnalysisRequest): Promise<{
    results: AnalysisResults;
    context: AnalysisContext;
  }> => {
    const results = await aiAnalysisService.analyzeTransaction(request);
    const context = aiAnalysisService.storeAnalysisContext(request, results);
    
    return { results, context };
  }
};

/**
 * Build comprehensive analysis prompt for Grok
 */
function buildAnalysisPrompt(description: string, documentContent: string): string {
  return `
As a Hong Kong financial regulatory expert and investment banking advisor, analyze the following transaction and provide comprehensive structuring advice.

TRANSACTION DESCRIPTION:
${description}

${documentContent ? `UPLOADED DOCUMENTS CONTENT:\n${documentContent}\n` : ''}

Please provide a detailed analysis covering:

1. TRANSACTION STRUCTURE:
   - Recommended optimal structure
   - Alternative structures with pros/cons
   - Rationale for recommendation

2. COST ANALYSIS:
   - Regulatory fees (HKEX, SFC, etc.)
   - Professional fees (legal, accounting, financial advisory)
   - Timing-related costs
   - Total estimated costs with breakdown

3. EXECUTION TIMETABLE:
   - Key milestones with dates
   - Critical path items
   - Regulatory approval timelines
   - Total duration estimate

4. SHAREHOLDING IMPACT:
   - Before and after shareholding structure
   - Dilution analysis
   - Control implications

5. REGULATORY COMPLIANCE:
   - Applicable Listing Rules requirements
   - Takeovers Code implications (if any)
   - Key regulatory risks
   - Compliance recommendations

6. DIAGRAM DATA (REQUIRED for visualization):
   - Enhanced shareholding changes with entity types and control implications
   - Corporate structure with entity relationships and ownership percentages
   - Detailed before/after comparison with change indicators

FORMAT your response as a structured JSON object with the following schema:
{
  "transactionType": "string",
  "structure": {
    "recommended": "string",
    "alternatives": ["string"],
    "rationale": "string"
  },
  "costs": {
    "regulatory": number,
    "professional": number,
    "timing": number,
    "total": number,
    "breakdown": [{"category": "string", "amount": number, "description": "string"}]
  },
  "timetable": {
    "totalDuration": "string",
    "keyMilestones": [{"date": "string", "event": "string", "description": "string"}]
  },
  "shareholding": {
    "before": [{"name": "string", "percentage": number}],
    "after": [{"name": "string", "percentage": number}],
    "impact": "string"
  },
  "compliance": {
    "listingRules": ["string"],
    "takeoversCode": ["string"],
    "risks": ["string"],
    "recommendations": ["string"]
  },
  "confidence": number,
  "shareholdingChanges": {
    "before": [{"name": "string", "percentage": number, "type": "individual|institutional|connected|public|fund", "isConnected": false}],
    "after": [{"name": "string", "percentage": number, "type": "individual|institutional|connected|public|fund", "isConnected": false}],
    "keyChanges": [{"shareholder": "string", "change": number, "type": "increase|decrease|new|exit"}],
    "controlImplications": ["string"]
  },
  "corporateStructure": {
    "entities": [{"id": "string", "name": "string", "type": "parent|subsidiary|target|issuer", "ownership": number}],
    "relationships": [{"parent": "string", "child": "string", "ownershipPercentage": number}],
    "mainIssuer": "string",
    "targetEntities": ["string"]
  }
}

IMPORTANT: You MUST include both "shareholdingChanges" and "corporateStructure" objects in your response for the diagrams to display properly. Generate realistic sample data if specific details are not provided.

Ensure all monetary amounts are in HKD and all dates follow Hong Kong business day calendar. Include comprehensive diagram data for visualization purposes.
`;
}

/**
 * Parse AI response into structured analysis results
 */
function parseAnalysisResponse(responseText: string): AnalysisResults {
  try {
    // Try to extract JSON from the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Ensure diagram data exists with fallback
      if (!parsed.shareholdingChanges) {
        parsed.shareholdingChanges = createFallbackShareholdingChanges();
      }
      if (!parsed.corporateStructure) {
        parsed.corporateStructure = createFallbackCorporateStructure();
      }
      
      return parsed;
    }
  } catch (error) {
    console.error('Error parsing JSON response:', error);
  }
  
  // Fallback: create structured response from text
  return createFallbackAnalysis(responseText);
}

/**
 * Create fallback shareholding changes when data is missing
 */
function createFallbackShareholdingChanges() {
  return {
    before: [
      { name: "Existing Shareholders", percentage: 100, type: "institutional", isConnected: false }
    ],
    after: [
      { name: "Existing Shareholders", percentage: 80, type: "institutional", isConnected: false },
      { name: "New Investors", percentage: 20, type: "institutional", isConnected: false }
    ],
    keyChanges: [
      { shareholder: "Existing Shareholders", change: -20, type: "decrease" },
      { shareholder: "New Investors", change: 20, type: "new" }
    ],
    controlImplications: ["Dilution of existing shareholders", "Introduction of new institutional investors"]
  };
}

/**
 * Create fallback corporate structure when data is missing
 */
function createFallbackCorporateStructure() {
  return {
    entities: [
      { id: "issuer", name: "Main Company", type: "issuer", ownership: 100 },
      { id: "target", name: "Target Entity", type: "target", ownership: 0 }
    ],
    relationships: [
      { parent: "issuer", child: "target", ownershipPercentage: 100 }
    ],
    mainIssuer: "issuer",
    targetEntities: ["target"]
  };
}

/**
 * Create fallback analysis when JSON parsing fails
 */
function createFallbackAnalysis(responseText: string): AnalysisResults {
  return {
    transactionType: "Transaction Analysis",
    structure: {
      recommended: "Please review the detailed analysis below",
      alternatives: [],
      rationale: responseText.substring(0, 500) + "..."
    },
    costs: {
      regulatory: 0,
      professional: 0,
      timing: 0,
      total: 0,
      breakdown: [{
        category: "Analysis",
        amount: 0,
        description: "Detailed cost analysis available in full response"
      }]
    },
    timetable: {
      totalDuration: "To be determined",
      keyMilestones: [{
        date: "TBD",
        event: "Analysis Review",
        description: "Review comprehensive analysis provided"
      }]
    },
    shareholding: {
      before: [],
      after: [],
      impact: "Shareholding impact analysis included in detailed response"
    },
    compliance: {
      listingRules: ["Review required"],
      takeoversCode: ["Assessment needed"],
      risks: ["Detailed risk analysis in response"],
      recommendations: ["See comprehensive recommendations"]
    },
    confidence: 0.7,
    shareholdingChanges: createFallbackShareholdingChanges(),
    corporateStructure: createFallbackCorporateStructure()
  };
}
