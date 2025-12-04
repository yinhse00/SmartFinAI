import { universalAiClient } from '@/services/ai/universalAiClient';
import { AIProvider } from '@/types/aiProvider';

export interface ContentFlag {
  id: string;
  sentence: string;
  flagType: 'redundant' | 'off-topic' | 'filler' | 'misplaced';
  reason: string;
  confidence: number;
  suggestedAction: 'remove' | 'move' | 'review';
  targetSection?: string;
}

export interface ContentRelevanceResult {
  flaggedContent: ContentFlag[];
  summary: string;
  analysisTime: number;
}

class ContentRelevanceAnalyzer {
  /**
   * Analyze content for unnecessary, redundant, or misplaced sentences
   */
  async analyzeRelevance(
    content: string,
    sectionType: string
  ): Promise<ContentRelevanceResult> {
    const startTime = Date.now();
    
    // Skip analysis for very short content
    if (content.length < 500) {
      return {
        flaggedContent: [],
        summary: 'Content too short for detailed analysis',
        analysisTime: Date.now() - startTime
      };
    }

    try {
      const prompt = this.buildRelevancePrompt(content, sectionType);
      
      const response = await universalAiClient.generateContent({
        prompt,
        provider: AIProvider.GOOGLE,
        modelId: 'gemini-2.0-flash',
        metadata: {
          requestType: 'content_relevance_analysis',
          maxTokens: 4000,
          temperature: 0.2
        }
      });

      const flaggedContent = this.parseAnalysisResponse(response.text || '');
      
      return {
        flaggedContent,
        summary: flaggedContent.length > 0 
          ? `Found ${flaggedContent.length} items that may need review`
          : 'No issues detected',
        analysisTime: Date.now() - startTime
      };
    } catch (error) {
      console.error('Content relevance analysis failed:', error);
      return {
        flaggedContent: [],
        summary: 'Analysis failed - please review manually',
        analysisTime: Date.now() - startTime
      };
    }
  }

  private buildRelevancePrompt(content: string, sectionType: string): string {
    return `You are an IPO prospectus content quality reviewer. Analyze this ${sectionType} section and identify problematic content.

CONTENT TO ANALYZE:
${content}

SECTION TYPE: ${sectionType}

IDENTIFY AND FLAG (only high-confidence issues):

1. REDUNDANT - Sentences that repeat information already stated elsewhere in this content:
   - Same facts stated multiple ways
   - Repetitive phrasing
   - Duplicate disclosures

2. FILLER - Generic statements that add no substantive value to a prospectus:
   - Vague statements without specifics like "We are committed to excellence"
   - Marketing language inappropriate for regulatory documents
   - Unnecessary qualifiers

3. OFF-TOPIC - Content that doesn't belong in a ${sectionType} section:
   - Information unrelated to section purpose
   - Tangential details that dilute key messages

4. MISPLACED - Content that belongs in a different prospectus section:
   - Financial data in non-financial sections
   - Risk factors outside risk section
   - Identify which section it should be in

OUTPUT FORMAT (JSON array):
[
  {
    "sentence": "[exact sentence text - max 150 chars, use ... for longer]",
    "flagType": "redundant|filler|off-topic|misplaced",
    "reason": "[brief explanation - max 50 words]",
    "suggestedAction": "remove|move|review",
    "targetSection": "[only if misplaced, e.g. 'Risk Factors']",
    "confidence": 0.7-1.0
  }
]

RULES:
- Only flag items with confidence >= 0.75
- Be conservative - when in doubt, don't flag
- Maximum 5 flags per analysis
- Focus on clear issues, not stylistic preferences
- Return empty array [] if no issues found

Return ONLY the JSON array, no other text:`;
  }

  private parseAnalysisResponse(response: string): ContentFlag[] {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        return [];
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed
        .filter((item: any) => 
          item.sentence && 
          item.flagType && 
          item.reason && 
          item.suggestedAction &&
          item.confidence >= 0.75
        )
        .map((item: any, index: number) => ({
          id: `flag_${Date.now()}_${index}`,
          sentence: String(item.sentence).substring(0, 200),
          flagType: item.flagType as ContentFlag['flagType'],
          reason: String(item.reason).substring(0, 200),
          confidence: Math.min(1, Math.max(0, Number(item.confidence) || 0.75)),
          suggestedAction: item.suggestedAction as ContentFlag['suggestedAction'],
          targetSection: item.targetSection || undefined
        }))
        .slice(0, 5); // Max 5 flags
    } catch (error) {
      console.error('Failed to parse relevance analysis:', error);
      return [];
    }
  }
}

export const contentRelevanceAnalyzer = new ContentRelevanceAnalyzer();
