/**
 * Diff Generator Service - Creates visual diffs showing exactly what will change
 */
export interface DiffChange {
  type: 'addition' | 'modification' | 'unchanged';
  content: string;
  lineNumber: number;
}

export interface DiffResult {
  changes: DiffChange[];
  summary: {
    additions: number;
    modifications: number;
    totalLines: number;
  };
  description: string;
}

export class DiffGenerator {
  /**
   * Generate a visual diff between original and modified content
   */
  generateDiff(original: string, modified: string): DiffResult {
    const originalLines = original.split('\n').filter(line => line.trim());
    const modifiedLines = modified.split('\n').filter(line => line.trim());
    
    const changes: DiffChange[] = [];
    let additions = 0;
    let modifications = 0;
    
    // Simple line-by-line comparison for now
    const maxLines = Math.max(originalLines.length, modifiedLines.length);
    
    for (let i = 0; i < maxLines; i++) {
      const originalLine = originalLines[i] || '';
      const modifiedLine = modifiedLines[i] || '';
      
      if (i >= originalLines.length) {
        // New line added
        changes.push({
          type: 'addition',
          content: modifiedLine,
          lineNumber: i + 1
        });
        additions++;
      } else if (i >= modifiedLines.length) {
        // Line removed (we'll skip showing deletions for simplicity)
        continue;
      } else if (originalLine !== modifiedLine) {
        // Line modified
        const similarity = this.calculateSimilarity(originalLine, modifiedLine);
        if (similarity > 0.3) {
          changes.push({
            type: 'modification',
            content: modifiedLine,
            lineNumber: i + 1
          });
          modifications++;
        } else {
          changes.push({
            type: 'addition',
            content: modifiedLine,
            lineNumber: i + 1
          });
          additions++;
        }
      } else {
        // Line unchanged
        changes.push({
          type: 'unchanged',
          content: originalLine,
          lineNumber: i + 1
        });
      }
    }
    
    const description = this.generateDescription(additions, modifications);
    
    return {
      changes,
      summary: {
        additions,
        modifications,
        totalLines: modifiedLines.length
      },
      description
    };
  }
  
  /**
   * Generate a smart diff that focuses on meaningful changes
   */
  generateSmartDiff(original: string, aiSuggestion: string): DiffResult {
    // Extract only the meaningful content from AI suggestion
    const cleanSuggestion = this.extractMeaningfulContent(aiSuggestion);
    
    // Find the best insertion point or modification target
    const mergedContent = this.createMinimalMerge(original, cleanSuggestion);
    
    return this.generateDiff(original, mergedContent);
  }

  /**
   * Generate a focused diff that shows only changes and additions
   */
  generateFullDiff(original: string, aiSuggestion: string): DiffResult {
    const cleanSuggestion = this.extractMeaningfulContent(aiSuggestion);
    const originalParagraphs = original.split('\n\n').filter(p => p.trim());
    const suggestionParagraphs = cleanSuggestion.split('\n\n').filter(p => p.trim());
    
    const changes: DiffChange[] = [];
    let additions = 0;
    let modifications = 0;
    
    // Find relevant original sections that might be modified
    const relevantOriginalSections: string[] = [];
    
    // Check each suggestion paragraph against original to find modifications
    suggestionParagraphs.forEach(suggestionPara => {
      if (suggestionPara.length < 30) return; // Skip very short segments
      
      const bestMatch = originalParagraphs.find(origPara => {
        const similarity = this.calculateSimilarity(origPara, suggestionPara);
        return similarity > 0.15 && similarity < 0.8; // Potential modification
      });
      
      if (bestMatch && !relevantOriginalSections.includes(bestMatch)) {
        relevantOriginalSections.push(bestMatch);
        changes.push({
          type: 'modification',
          content: suggestionPara,
          lineNumber: modifications + 1
        });
        modifications++;
      } else {
        // Check if this is genuinely new content
        const hasAnyOverlap = originalParagraphs.some(origPara => 
          this.calculateSimilarity(origPara, suggestionPara) > 0.2
        );
        
        if (!hasAnyOverlap) {
          changes.push({
            type: 'addition',
            content: suggestionPara,
            lineNumber: modifications + additions + 1
          });
          additions++;
        }
      }
    });
    
    const description = this.generateDescription(additions, modifications);
    
    return {
      changes,
      summary: {
        additions,
        modifications,
        totalLines: additions + modifications
      },
      description
    };
  }
  
  /**
   * Extract only implementable content from AI suggestion
   */
  private extractMeaningfulContent(suggestion: string): string {
    // Remove AI commentary patterns
    const lines = suggestion.split('\n');
    const meaningfulLines = lines.filter(line => {
      const trimmed = line.trim();
      if (!trimmed) return false;
      
      // Skip AI commentary patterns
      if (trimmed.match(/^(Here's|Here is|I suggest|Consider|You might want to|Let me|I'll|I can)/i)) return false;
      if (trimmed.match(/^(This would|That would|These would|This will|This should)/i)) return false;
      if (trimmed.match(/^(To improve|To enhance|To address|For better)/i)) return false;
      if (trimmed.match(/^(The following|Below is|Above is)/i)) return false;
      if (trimmed.length < 15) return false;
      
      return true;
    });
    
    return meaningfulLines.join('\n');
  }
  
  /**
   * Create minimal merge focusing on additions and enhancements
   */
  private createMinimalMerge(original: string, suggestion: string): string {
    const originalParagraphs = original.split('\n\n').filter(p => p.trim());
    const suggestionParagraphs = suggestion.split('\n\n').filter(p => p.trim());
    
    // For simplicity, append suggestions that don't overlap with existing content
    const merged = [...originalParagraphs];
    
    suggestionParagraphs.forEach(sugPara => {
      const hasOverlap = originalParagraphs.some(origPara => 
        this.calculateSimilarity(origPara, sugPara) > 0.6
      );
      
      if (!hasOverlap) {
        merged.push(sugPara);
      }
    });
    
    return merged.join('\n\n');
  }
  
  /**
   * Calculate similarity between two texts
   */
  private calculateSimilarity(text1: string, text2: string): number {
    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);
    
    const intersection = words1.filter(word => words2.includes(word));
    const union = [...new Set([...words1, ...words2])];
    
    return intersection.length / union.length;
  }
  
  /**
   * Generate human-readable description of changes
   */
  private generateDescription(additions: number, modifications: number): string {
    const parts = [];
    
    if (additions > 0) {
      parts.push(`add ${additions} new ${additions === 1 ? 'section' : 'sections'}`);
    }
    
    if (modifications > 0) {
      parts.push(`enhance ${modifications} existing ${modifications === 1 ? 'section' : 'sections'}`);
    }
    
    if (parts.length === 0) {
      return 'No changes needed';
    }
    
    return `AI will ${parts.join(' and ')}`;
  }
}

export const diffGenerator = new DiffGenerator();
