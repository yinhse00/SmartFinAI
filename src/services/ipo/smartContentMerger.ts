/**
 * Smart Content Merger for IPO Prospectus
 * Intelligently merges AI suggestions with existing content instead of replacing everything
 */
import { contentExtractor } from './contentExtractor';
import { ipoMessageFormatter } from '@/services/ipo/ipoMessageFormatter';

export interface MergeStrategy {
  type: 'append' | 'prepend' | 'replace-section' | 'merge-paragraphs' | 'insert-at-line' | 'enhance-existing' | 'replace-all';
  targetLine?: number;
  targetSection?: string;
  preserveStructure?: boolean;
  reason?: string;
}

export interface MergePreview {
  original: string;
  merged: string;
  changes: Array<{
    type: 'addition' | 'modification' | 'deletion';
    content: string;
    position: number;
  }>;
  strategy: MergeStrategy;
  extractedContent?: import('./contentExtractor').ExtractedContent;
}

export const smartContentMerger = {
  /**
   * Analyzes content and suggests the best merge strategy - Enhanced for minimal changes
   */
  analyzeBestMergeStrategy: (currentContent: string, aiSuggestion: string): MergeStrategy => {
    // Clean and extract only implementable content
    const cleanSuggestion = contentExtractor.cleanContent(aiSuggestion);
    const currentLength = currentContent.length;
    const suggestionLength = cleanSuggestion.length;
    
    // Enhanced analysis for minimal changes
    const hasAdditionKeywords = /\b(add|include|also|additionally|furthermore|moreover|new)\b/i.test(aiSuggestion);
    const hasReplacementKeywords = /\b(replace|instead|rather than|substitute|change to|should be)\b/i.test(aiSuggestion);
    const hasEnhancementKeywords = /\b(improve|enhance|strengthen|clarify|expand|refine)\b/i.test(aiSuggestion);
    const hasStructuralMarkers = /^(##|###|\d+\.|•|-|\*)/.test(cleanSuggestion);
    
    // Calculate content overlap
    const overlap = smartContentMerger.calculateSimilarity(currentContent.toLowerCase(), cleanSuggestion.toLowerCase());
    
    // Prefer minimal, surgical changes
    if (overlap < 0.1 && suggestionLength < currentLength * 0.4) {
      // New content that's relatively small - append it
      return { type: 'append' };
    }
    
    if (hasEnhancementKeywords && overlap > 0.2) {
      // Content enhancement - merge intelligently
      return { type: 'merge-paragraphs' };
    }
    
    if (hasStructuralMarkers || hasAdditionKeywords) {
      // Find best insertion point for structured content
      const insertionPoint = smartContentMerger.findBestInsertionPoint(currentContent, cleanSuggestion);
      if (insertionPoint > 0) {
        return { type: 'insert-at-line', targetLine: insertionPoint };
      }
      return { type: 'append' };
    }
    
    if (hasReplacementKeywords && overlap > 0.3) {
      // Only replace when explicitly requested and there's significant overlap
      return { type: 'replace-section', targetSection: smartContentMerger.findBestReplacementSection(currentContent, cleanSuggestion) };
    }
    
    // Default to append for minimal disruption
    return { type: 'append' };
  },

  /**
   * Fallback strategy analysis for when content extractor isn't used
   */
  _legacyAnalyzeBestMergeStrategy: (currentContent: string, aiSuggestion: string): MergeStrategy => {
    const currentLines = currentContent.split('\n').filter(line => line.trim());
    const suggestionLines = aiSuggestion.split('\n').filter(line => line.trim());
    
    // If current content is empty or very short, replace entirely
    if (currentContent.trim().length < 100) {
      return { type: 'replace-section', preserveStructure: false };
    }
    
    // If suggestion looks like an addition (starts with common additive phrases)
    const additivePatterns = [
      /^(Additionally|Furthermore|Moreover|Also,)/i,
      /^(In addition|Beyond that|It should be noted)/i,
      /^(Key considerations include|Important factors)/i
    ];
    
    const isAdditive = additivePatterns.some(pattern => 
      suggestionLines.some(line => pattern.test(line))
    );
    
    if (isAdditive) {
      return { type: 'append', preserveStructure: true };
    }
    
    // If suggestion contains section headers that match existing content
    const currentHeaders = currentLines.filter(line => 
      /^#+\s|^\d+\.|^[A-Z][^a-z]*:/.test(line.trim())
    );
    
    const suggestionHeaders = suggestionLines.filter(line => 
      /^#+\s|^\d+\.|^[A-Z][^a-z]*:/.test(line.trim())
    );
    
    const hasMatchingHeaders = suggestionHeaders.some(sugHeader =>
      currentHeaders.some(curHeader => 
        smartContentMerger.extractHeaderText(sugHeader) === smartContentMerger.extractHeaderText(curHeader)
      )
    );
    
    if (hasMatchingHeaders) {
      return { 
        type: 'replace-section', 
        targetSection: suggestionHeaders[0],
        preserveStructure: true 
      };
    }
    
    // Default to intelligent merging
    return { type: 'merge-paragraphs', preserveStructure: true };
  },

  /**
   * Performs smart content merging based on strategy
   */
  smartMerge: (currentContent: string, aiSuggestion: string, strategy?: MergeStrategy): string => {
    const mergeStrategy = strategy || smartContentMerger.analyzeBestMergeStrategy(currentContent, aiSuggestion);
    
    // Special handling for complete replacement strategies
    if (mergeStrategy.type === 'replace-all') {
      console.log('[SmartMerger] Using complete replacement strategy');
      return aiSuggestion.trim();
    }
    
    // Extract only the new/different content from AI suggestion
    const extractedContent = smartContentMerger.extractOnlyNewContent(currentContent, aiSuggestion);
    
    console.log(`[SmartMerger] Using strategy: ${mergeStrategy.type}`, {
      currentLength: currentContent.length,
      suggestionLength: aiSuggestion.length,
      extractedLength: extractedContent.length,
      strategy: mergeStrategy
    });
    
    // If no new content found, return original
    if (!extractedContent.trim()) {
      console.log('[SmartMerger] No new content detected, returning original');
      return currentContent;
    }

    let mergedContent: string;
    
    switch (mergeStrategy.type) {
      case 'append':
        mergedContent = smartContentMerger.appendContent(currentContent, extractedContent);
        break;
      
      case 'prepend':
        mergedContent = smartContentMerger.prependContent(currentContent, extractedContent);
        break;
      
      case 'replace-section':
        mergedContent = smartContentMerger.replaceSectionContent(currentContent, extractedContent, mergeStrategy);
        break;
      
      case 'merge-paragraphs':
        mergedContent = smartContentMerger.mergeParagraphs(currentContent, extractedContent);
        break;
      
      case 'insert-at-line':
        mergedContent = smartContentMerger.insertAtPosition(currentContent, extractedContent, mergeStrategy.targetLine || 0);
        break;
      
      case 'enhance-existing':
        mergedContent = smartContentMerger.enhanceExisting(currentContent, extractedContent);
        break;
      
      case 'replace-all':
        mergedContent = aiSuggestion.trim();
        break;
      
      default:
        mergedContent = smartContentMerger.appendContent(currentContent, extractedContent);
        break;
    }
    
    return mergedContent;
  },

  /**
   * Extract only the new/different content from AI suggestion
   */
  extractOnlyNewContent: (currentContent: string, aiSuggestion: string): string => {
    // First, clean the AI suggestion to remove commentary
    const cleanedSuggestion = aiSuggestion
      .split('\n')
      .filter(line => {
        const trimmed = line.trim();
        if (!trimmed) return false;
        
        // Filter out AI commentary
        if (trimmed.match(/^(Here's|Here is|I suggest|Consider|You might want to|Let me|I'll|I can)/i)) return false;
        if (trimmed.match(/^(This would|That would|These would|This will|This should)/i)) return false;
        if (trimmed.match(/^(To improve|To enhance|To address|For better)/i)) return false;
        if (trimmed.match(/^(The following|Below is|Above is|Based on)/i)) return false;
        
        return true;
      })
      .join('\n');
    
    const currentParagraphs = currentContent.split('\n\n').filter(p => p.trim());
    const suggestionParagraphs = cleanedSuggestion.split('\n\n').filter(p => p.trim());
    
    const newParagraphs = suggestionParagraphs.filter(suggestionPara => {
      // Lower minimum length requirement to capture smaller but important additions
      if (suggestionPara.length < 20) return false;
      
      // Lower similarity threshold to catch more genuinely new content
      const hasOverlap = currentParagraphs.some(currentPara => 
        smartContentMerger.calculateSimilarity(currentPara, suggestionPara) > 0.2
      );
      
      return !hasOverlap;
    });
    
    return newParagraphs.join('\n\n');
  },

  /**
   * Find the best insertion point for new content
   */
  findBestInsertionPoint: (currentContent: string, suggestion: string): number => {
    const lines = currentContent.split('\n');
    
    // Look for logical break points (empty lines, section headers)
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].trim() === '' || /^#+\s|^\d+\.|^[A-Z][^a-z]*:/.test(lines[i])) {
        return i;
      }
    }
    
    return lines.length;
  },

  /**
   * Find the best section to replace
   */
  findBestReplacementSection: (currentContent: string, suggestion: string): string => {
    const currentLines = currentContent.split('\n');
    const suggestionLines = suggestion.split('\n');
    
    // Look for matching headers or similar content
    const suggestionHeaders = suggestionLines.filter(line => 
      /^#+\s|^\d+\.|^[A-Z][^a-z]*:/.test(line.trim())
    );
    
    if (suggestionHeaders.length > 0) {
      return suggestionHeaders[0];
    }
    
    return 'main-content';
  },

  /**
   * Generates a preview of what the merge would look like
   */
  generateMergePreview: (currentContent: string, aiSuggestion: string, strategy?: MergeStrategy): MergePreview => {
    const extracted = contentExtractor.extractImplementableContent(aiSuggestion);
    const mergeStrategy = strategy || smartContentMerger.analyzeBestMergeStrategy(currentContent, extracted.implementableContent);
    const merged = smartContentMerger.smartMerge(currentContent, aiSuggestion, mergeStrategy);
    
    const changes = smartContentMerger.analyzeChanges(currentContent, merged);
    
    return {
      original: currentContent,
      merged,
      changes,
      strategy: mergeStrategy,
      extractedContent: extracted
    };
  },

  /**
   * Enhances existing content with AI suggestions
   */
  enhanceExisting: (current: string, suggestion: string): string => {
    const currentParagraphs = current.split('\n\n').filter(p => p.trim());
    const suggestionParagraphs = suggestion.split('\n\n').filter(p => p.trim());
    
    // Find the best place to integrate the enhancement
    let enhanced = current;
    
    suggestionParagraphs.forEach(sugPara => {
      // Look for similar existing content to enhance
      const bestMatch = currentParagraphs.reduce((best, curPara, index) => {
        const similarity = smartContentMerger.calculateSimilarity(curPara, sugPara);
        return similarity > best.similarity ? { similarity, index, paragraph: curPara } : best;
      }, { similarity: 0, index: -1, paragraph: '' });
      
      if (bestMatch.similarity > 0.5) {
        // Enhance the existing paragraph
        const enhancedParagraph = smartContentMerger.enhanceParagraph(bestMatch.paragraph, sugPara);
        enhanced = enhanced.replace(bestMatch.paragraph, enhancedParagraph);
      } else {
        // Add as new content at appropriate location
        enhanced = smartContentMerger.appendContent(enhanced, sugPara);
      }
    });
    
    return enhanced;
  },

  /**
   * Appends new content while preserving structure
   */
  appendContent: (current: string, suggestion: string): string => {
    const trimmedCurrent = current.trim();
    const trimmedSuggestion = suggestion.trim();
    
    // Add appropriate spacing
    const separator = trimmedCurrent.endsWith('.') ? '\n\n' : '\n\n';
    
    return `${trimmedCurrent}${separator}${trimmedSuggestion}`;
  },

  /**
   * Prepends new content while preserving structure
   */
  prependContent: (current: string, suggestion: string): string => {
    const trimmedCurrent = current.trim();
    const trimmedSuggestion = suggestion.trim();
    
    return `${trimmedSuggestion}\n\n${trimmedCurrent}`;
  },

  /**
   * Replaces specific sections based on headers or content markers
   */
  replaceSectionContent: (current: string, suggestion: string, strategy: MergeStrategy): string => {
    const currentLines = current.split('\n');
    const suggestionLines = suggestion.split('\n');
    
    if (strategy.targetSection) {
      const headerText = smartContentMerger.extractHeaderText(strategy.targetSection);
      const sectionStart = currentLines.findIndex(line => 
        smartContentMerger.extractHeaderText(line) === headerText
      );
      
      if (sectionStart !== -1) {
        // Find end of section
        const sectionEnd = currentLines.findIndex((line, index) => 
          index > sectionStart && /^#+\s|^\d+\.|^[A-Z][^a-z]*:/.test(line.trim())
        );
        
        const endIndex = sectionEnd === -1 ? currentLines.length : sectionEnd;
        
        // Replace the section
        const before = currentLines.slice(0, sectionStart);
        const after = currentLines.slice(endIndex);
        
        return [...before, ...suggestionLines, ...after].join('\n');
      }
    }
    
    // If no specific section found, append
    return smartContentMerger.appendContent(current, suggestion);
  },

  /**
   * Intelligently merges paragraphs without losing existing content
   */
  mergeParagraphs: (current: string, suggestion: string): string => {
    const currentParagraphs = current.split('\n\n').filter(p => p.trim());
    const suggestionParagraphs = suggestion.split('\n\n').filter(p => p.trim());
    
    // Look for similar paragraphs to enhance rather than duplicate
    const enhancedParagraphs = [...currentParagraphs];
    
    suggestionParagraphs.forEach(sugPara => {
      const similarIndex = enhancedParagraphs.findIndex(curPara => 
        smartContentMerger.calculateSimilarity(curPara, sugPara) > 0.6
      );
      
      if (similarIndex !== -1) {
        // Enhance existing paragraph
        enhancedParagraphs[similarIndex] = smartContentMerger.enhanceParagraph(
          enhancedParagraphs[similarIndex], 
          sugPara
        );
      } else {
        // Add new paragraph
        enhancedParagraphs.push(sugPara);
      }
    });
    
    return enhancedParagraphs.join('\n\n');
  },

  /**
   * Inserts content at a specific position
   */
  insertAtPosition: (current: string, suggestion: string, position: number): string => {
    const lines = current.split('\n');
    const insertIndex = Math.min(position, lines.length);
    
    const before = lines.slice(0, insertIndex);
    const after = lines.slice(insertIndex);
    
    return [...before, '', suggestion, '', ...after].join('\n');
  },

  /**
   * Extracts the main text from a header line
   */
  extractHeaderText: (line: string): string => {
    return line.replace(/^#+\s*|^\d+\.\s*|:$/, '').trim().toLowerCase();
  },

  /**
   * Calculates similarity between two text blocks
   */
  calculateSimilarity: (text1: string, text2: string): number => {
    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);
    
    const commonWords = words1.filter(word => words2.includes(word));
    const totalWords = new Set([...words1, ...words2]).size;
    
    return commonWords.length / totalWords;
  },

  /**
   * Enhances an existing paragraph with new content
   */
  enhanceParagraph: (original: string, enhancement: string): string => {
    // If enhancement is longer and contains the original concept, use enhancement
    if (enhancement.length > original.length * 1.2 && 
        smartContentMerger.calculateSimilarity(original, enhancement) > 0.7) {
      return enhancement;
    }
    
    // Otherwise, combine them intelligently
    return `${original.trim()} ${enhancement.trim()}`;
  },

  /**
   * Analyzes changes between original and merged content
   */
  analyzeChanges: (original: string, merged: string): Array<{
    type: 'addition' | 'modification' | 'deletion';
    content: string;
    position: number;
  }> => {
    const originalLines = original.split('\n');
    const mergedLines = merged.split('\n');
    
    const changes: Array<{
      type: 'addition' | 'modification' | 'deletion';
      content: string;
      position: number;
    }> = [];
    
    // Simple diff detection
    let originalIndex = 0;
    let mergedIndex = 0;
    
    while (originalIndex < originalLines.length || mergedIndex < mergedLines.length) {
      const originalLine = originalLines[originalIndex] || '';
      const mergedLine = mergedLines[mergedIndex] || '';
      
      if (originalLine === mergedLine) {
        originalIndex++;
        mergedIndex++;
      } else if (originalIndex < originalLines.length && mergedIndex < mergedLines.length) {
        // Modification
        changes.push({
          type: 'modification',
          content: mergedLine,
          position: mergedIndex
        });
        originalIndex++;
        mergedIndex++;
      } else if (originalIndex >= originalLines.length) {
        // Addition
        changes.push({
          type: 'addition',
          content: mergedLine,
          position: mergedIndex
        });
        mergedIndex++;
      } else {
        // Deletion
        changes.push({
          type: 'deletion',
          content: originalLine,
          position: originalIndex
        });
        originalIndex++;
      }
    }
    
    return changes;
  }
};
