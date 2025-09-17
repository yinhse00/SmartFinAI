/**
 * Smart Content Merger for IPO Prospectus
 * Intelligently merges AI suggestions with existing content instead of replacing everything
 */
import { contentExtractor } from './contentExtractor';

export interface MergeStrategy {
  type: 'append' | 'prepend' | 'replace-section' | 'merge-paragraphs' | 'insert-at-position' | 'enhance-existing';
  position?: number;
  sectionIdentifier?: string;
  preserveStructure?: boolean;
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
   * Analyzes content and suggests the best merge strategy
   */
  analyzeBestMergeStrategy: (currentContent: string, aiSuggestion: string): MergeStrategy => {
    const extracted = contentExtractor.extractImplementableContent(aiSuggestion);
    const similarity = smartContentMerger.calculateSimilarity(currentContent, extracted.implementableContent);
    // Use content extractor's type determination
    switch (extracted.contentType) {
      case 'replacement':
        return { type: 'replace-section', sectionIdentifier: 'auto-detected', preserveStructure: true };
      case 'enhancement':
        return { type: 'enhance-existing', preserveStructure: true };
      case 'correction':
        return { type: 'replace-section', sectionIdentifier: 'auto-detected', preserveStructure: true };
      case 'addition':
      default:
        return similarity > 0.7 
          ? { type: 'merge-paragraphs', preserveStructure: true }
          : { type: 'append', preserveStructure: true };
    }
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
        sectionIdentifier: suggestionHeaders[0],
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
    // Extract clean implementable content first
    const cleanedSuggestion = contentExtractor.cleanContent(aiSuggestion);
    
    if (!cleanedSuggestion.trim()) {
      return currentContent; // No implementable content found
    }
    
    const mergeStrategy = strategy || smartContentMerger.analyzeBestMergeStrategy(currentContent, cleanedSuggestion);
    
    switch (mergeStrategy.type) {
      case 'append':
        return smartContentMerger.appendContent(currentContent, cleanedSuggestion);
      
      case 'prepend':
        return smartContentMerger.prependContent(currentContent, cleanedSuggestion);
      
      case 'replace-section':
        return smartContentMerger.replaceSectionContent(currentContent, cleanedSuggestion, mergeStrategy);
      
      case 'merge-paragraphs':
        return smartContentMerger.mergeParagraphs(currentContent, cleanedSuggestion);
      
      case 'insert-at-position':
        return smartContentMerger.insertAtPosition(currentContent, cleanedSuggestion, mergeStrategy.position || 0);
      
      case 'enhance-existing':
        return smartContentMerger.enhanceExisting(currentContent, cleanedSuggestion);
      
      default:
        return currentContent + '\n\n' + cleanedSuggestion;
    }
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
    if (!strategy.preserveStructure) {
      return suggestion;
    }
    
    const currentLines = current.split('\n');
    const suggestionLines = suggestion.split('\n');
    
    if (strategy.sectionIdentifier) {
      const headerText = smartContentMerger.extractHeaderText(strategy.sectionIdentifier);
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
