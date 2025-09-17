/**
 * Content Extractor Service - Filters AI commentary and extracts implementable content
 */
export interface ExtractedContent {
  implementableContent: string;
  contentType: 'addition' | 'replacement' | 'enhancement' | 'correction';
  segments: ContentSegment[];
  hasCommentary: boolean;
}

export interface ContentSegment {
  id: string;
  content: string;
  type: 'paragraph' | 'bullet_point' | 'section' | 'correction';
  confidence: number;
  isImplementable: boolean;
}

export class ContentExtractor {
  private commentaryPatterns = [
    /^(Here's|Here is|I suggest|Consider|You might want to|I recommend|Let me|I'll|I would suggest)/i,
    /^(This|That|These|Those) (would|should|could|will|might) (be|help|improve|enhance|make)/i,
    /^(To|In order to|For better|For improved) (improve|enhance|make|achieve)/i,
    /^(Based on|According to|Given|Considering)/i,
    /\b(analysis|assessment|evaluation|review)\b/i,
    /^(Note:|Important:|Tip:|Remember:)/i,
    /\b(I think|I believe|In my opinion|My suggestion)\b/i
  ];

  private structureMarkers = [
    '1.', '2.', '3.', '4.', '5.',
    '•', '-', '*',
    'Section', 'Chapter', 'Part',
    'Background:', 'Overview:', 'Summary:'
  ];

  /**
   * Extract implementable content from AI suggestions
   */
  extractImplementableContent(aiSuggestion: string): ExtractedContent {
    const segments = this.segmentContent(aiSuggestion);
    const implementableSegments = segments.filter(seg => seg.isImplementable);
    
    const implementableContent = implementableSegments
      .map(seg => seg.content)
      .join('\n\n');

    const contentType = this.determineContentType(aiSuggestion, implementableContent);

    return {
      implementableContent,
      contentType,
      segments,
      hasCommentary: segments.some(seg => !seg.isImplementable)
    };
  }

  /**
   * Segment content into implementable and commentary parts
   */
  private segmentContent(content: string): ContentSegment[] {
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim());
    const segments: ContentSegment[] = [];

    paragraphs.forEach((paragraph, index) => {
      const trimmed = paragraph.trim();
      
      if (!trimmed) return;

      const isCommentary = this.isCommentary(trimmed);
      const segmentType = this.detectSegmentType(trimmed);
      
      segments.push({
        id: `segment-${index}`,
        content: trimmed,
        type: segmentType,
        confidence: isCommentary ? 0.2 : 0.8,
        isImplementable: !isCommentary && this.isContentImplementable(trimmed)
      });
    });

    return segments;
  }

  /**
   * Check if text is AI commentary rather than implementable content
   */
  private isCommentary(text: string): boolean {
    return this.commentaryPatterns.some(pattern => pattern.test(text));
  }

  /**
   * Check if content is actually implementable (not just metadata)
   */
  private isContentImplementable(text: string): boolean {
    // Too short to be meaningful content
    if (text.length < 20) return false;
    
    // Only instructions or questions
    if (text.endsWith('?') && !text.includes('.')) return false;
    
    // Just structural markers without content
    if (this.structureMarkers.some(marker => text.trim() === marker)) return false;
    
    return true;
  }

  /**
   * Detect the type of content segment
   */
  private detectSegmentType(text: string): ContentSegment['type'] {
    if (text.match(/^(\d+\.|\•|-|\*)/)) return 'bullet_point';
    if (text.match(/^(Section|Chapter|Part|##|###)/i)) return 'section';
    if (text.length < 100 && text.includes('should be') || text.includes('change to')) return 'correction';
    return 'paragraph';
  }

  /**
   * Determine the overall content type
   */
  private determineContentType(original: string, extracted: string): ExtractedContent['contentType'] {
    const hasAdditionKeywords = /\b(add|include|also|additionally|furthermore|moreover)\b/i.test(original);
    const hasReplacementKeywords = /\b(replace|instead|rather than|substitute|change to)\b/i.test(original);
    const hasEnhancementKeywords = /\b(improve|enhance|strengthen|clarify|expand)\b/i.test(original);
    
    if (hasReplacementKeywords) return 'replacement';
    if (hasEnhancementKeywords) return 'enhancement';
    if (hasAdditionKeywords) return 'addition';
    
    // Default based on content characteristics
    if (extracted.length > original.length * 0.8) return 'replacement';
    return 'addition';
  }

  /**
   * Filter out commentary and return clean content
   */
  cleanContent(content: string): string {
    const extracted = this.extractImplementableContent(content);
    return extracted.implementableContent;
  }
}

export const contentExtractor = new ContentExtractor();