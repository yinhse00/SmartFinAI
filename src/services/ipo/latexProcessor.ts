/**
 * LaTeX Document Processor for IPO Prospectus Drafting
 * Handles parsing, targeted editing, and content replacement in LaTeX documents
 */

export interface LaTeXSection {
  type: 'section' | 'subsection' | 'subsubsection' | 'table' | 'list' | 'paragraph';
  title?: string;
  content: string;
  startIndex: number;
  endIndex: number;
  level?: number;
}

export interface LaTeXDocument {
  content: string;
  sections: LaTeXSection[];
  tables: LaTeXSection[];
  metadata: {
    artifactId?: string;
    title?: string;
    contentType: 'text/latex';
    lastModified: Date;
  };
}

export interface LaTeXEditRequest {
  targetType: 'section' | 'table' | 'content' | 'calculation';
  targetIdentifier: string; // e.g., "Company Overview", "Key Products", specific text
  operation: 'replace' | 'insert' | 'delete' | 'calculate';
  newContent?: string;
  preserveFormatting?: boolean;
}

export interface LaTeXEditResult {
  success: boolean;
  updatedContent: string;
  changes: {
    type: string;
    location: string;
    oldContent: string;
    newContent: string;
  }[];
  validationResults: {
    syntaxValid: boolean;
    compilationReady: boolean;
    issues: string[];
  };
}

export class LaTeXProcessor {
  
  /**
   * Parse LaTeX document into structured sections
   */
  parseDocument(latexContent: string): LaTeXDocument {
    const sections: LaTeXSection[] = [];
    const tables: LaTeXSection[] = [];
    
    // Parse sections (subsection*, section, etc.)
    const sectionMatches = this.findSections(latexContent);
    sections.push(...sectionMatches);
    
    // Parse tables
    const tableMatches = this.findTables(latexContent);
    tables.push(...tableMatches);
    
    return {
      content: latexContent,
      sections,
      tables,
      metadata: {
        contentType: 'text/latex',
        lastModified: new Date()
      }
    };
  }

  /**
   * Apply targeted edits to LaTeX document
   */
  applyEdits(document: LaTeXDocument, edits: LaTeXEditRequest[]): LaTeXEditResult {
    let updatedContent = document.content;
    const changes: LaTeXEditResult['changes'] = [];
    
    try {
      for (const edit of edits) {
        const result = this.applySingleEdit(updatedContent, edit, document);
        if (result.success) {
          updatedContent = result.content;
          changes.push(...result.changes);
        } else {
          throw new Error(`Edit failed: ${result.error}`);
        }
      }

      // Validate the updated content
      const validation = this.validateLaTeX(updatedContent);
      
      return {
        success: true,
        updatedContent,
        changes,
        validationResults: validation
      };
      
    } catch (error) {
      return {
        success: false,
        updatedContent: document.content,
        changes,
        validationResults: {
          syntaxValid: false,
          compilationReady: false,
          issues: [error.message]
        }
      };
    }
  }

  /**
   * Process natural language instructions to generate edit requests
   */
  parseInstructions(instruction: string, document: LaTeXDocument): LaTeXEditRequest[] {
    const edits: LaTeXEditRequest[] = [];
    const lowerInstruction = instruction.toLowerCase();
    
    // Revenue update patterns
    if (lowerInstruction.includes('revenue') && lowerInstruction.includes('update')) {
      const revenueMatch = instruction.match(/revenue.*?(\$?\d+(?:\.\d+)?\s*(?:million|billion)?)/i);
      if (revenueMatch) {
        edits.push({
          targetType: 'content',
          targetIdentifier: 'revenue',
          operation: 'replace',
          newContent: revenueMatch[1],
          preserveFormatting: true
        });
      }
    }
    
    // CAGR calculation patterns
    if (lowerInstruction.includes('cagr') || lowerInstruction.includes('compound annual growth')) {
      edits.push({
        targetType: 'calculation',
        targetIdentifier: 'cagr',
        operation: 'calculate',
        preserveFormatting: true
      });
    }
    
    // Table addition patterns
    if (lowerInstruction.includes('add') && lowerInstruction.includes('table')) {
      const tableMatch = instruction.match(/add.*?to.*?([\w\s]+table)/i);
      if (tableMatch) {
        edits.push({
          targetType: 'table',
          targetIdentifier: tableMatch[1],
          operation: 'insert',
          preserveFormatting: true
        });
      }
    }
    
    // Section updates
    const sectionMatch = instruction.match(/(?:update|modify|change).*?(company overview|business overview|key products|financial summary)/i);
    if (sectionMatch) {
      edits.push({
        targetType: 'section',
        targetIdentifier: sectionMatch[1],
        operation: 'replace',
        preserveFormatting: true
      });
    }
    
    return edits;
  }

  /**
   * Generate LaTeX content with AI assistance
   */
  async generateLaTeXContent(prompt: string, template?: string): Promise<string> {
    // This would integrate with the existing AI service
    const enhancedPrompt = `
Generate professional LaTeX content for an IPO prospectus section.

REQUIREMENTS:
- Use proper LaTeX formatting (\subsection*, \textbf{}, \item, etc.)
- Maintain Hong Kong IPO prospectus standards
- Include proper table formatting with booktabs
- Use professional investment banking language
- Ensure HKEX compliance

${template ? `TEMPLATE:\n${template}\n` : ''}

USER REQUEST:
${prompt}

Generate valid LaTeX code that can be compiled with latexmk:
`;

    // For now, return a placeholder - this would integrate with the existing Grok service
    return `\\subsection*{Generated Section}
\\textbf{Generated content based on: ${prompt}}

This section would contain properly formatted LaTeX content generated by the AI service.`;
  }

  private findSections(content: string): LaTeXSection[] {
    const sections: LaTeXSection[] = [];
    
    // Find all section types
    const sectionPatterns = [
      { type: 'section', regex: /\\section\*?\{([^}]+)\}/g },
      { type: 'subsection', regex: /\\subsection\*?\{([^}]+)\}/g },
      { type: 'subsubsection', regex: /\\subsubsection\*?\{([^}]+)\}/g }
    ];
    
    for (const pattern of sectionPatterns) {
      let match;
      while ((match = pattern.regex.exec(content)) !== null) {
        const startIndex = match.index;
        const endIndex = this.findSectionEnd(content, startIndex);
        
        sections.push({
          type: pattern.type as LaTeXSection['type'],
          title: match[1],
          content: content.slice(startIndex, endIndex),
          startIndex,
          endIndex
        });
      }
    }
    
    return sections.sort((a, b) => a.startIndex - b.startIndex);
  }

  private findTables(content: string): LaTeXSection[] {
    const tables: LaTeXSection[] = [];
    const tableRegex = /\\begin\{table\}[\s\S]*?\\end\{table\}/g;
    
    let match;
    while ((match = tableRegex.exec(content)) !== null) {
      // Extract table caption if present
      const captionMatch = match[0].match(/\\caption\{([^}]+)\}/);
      
      tables.push({
        type: 'table',
        title: captionMatch ? captionMatch[1] : 'Untitled Table',
        content: match[0],
        startIndex: match.index,
        endIndex: match.index + match[0].length
      });
    }
    
    return tables;
  }

  private findSectionEnd(content: string, startIndex: number): number {
    // Find the next section of same or higher level, or end of document
    const nextSectionRegex = /\\(?:section|subsection|subsubsection)\*?\{/g;
    nextSectionRegex.lastIndex = startIndex + 1;
    
    const nextMatch = nextSectionRegex.exec(content);
    return nextMatch ? nextMatch.index : content.length;
  }

  private applySingleEdit(
    content: string, 
    edit: LaTeXEditRequest, 
    document: LaTeXDocument
  ): { success: boolean; content: string; changes: any[]; error?: string } {
    
    try {
      switch (edit.operation) {
        case 'replace':
          return this.replaceContent(content, edit, document);
        case 'insert':
          return this.insertContent(content, edit, document);
        case 'calculate':
          return this.performCalculation(content, edit, document);
        default:
          throw new Error(`Unsupported operation: ${edit.operation}`);
      }
    } catch (error) {
      return {
        success: false,
        content,
        changes: [],
        error: error.message
      };
    }
  }

  private replaceContent(
    content: string, 
    edit: LaTeXEditRequest, 
    document: LaTeXDocument
  ): { success: boolean; content: string; changes: any[] } {
    
    if (edit.targetType === 'section') {
      // Find and replace section content
      const section = document.sections.find(s => 
        s.title?.toLowerCase().includes(edit.targetIdentifier.toLowerCase())
      );
      
      if (section && edit.newContent) {
        const newContent = content.slice(0, section.startIndex) + 
                          edit.newContent + 
                          content.slice(section.endIndex);
        
        return {
          success: true,
          content: newContent,
          changes: [{
            type: 'section_replace',
            location: section.title || 'Unknown section',
            oldContent: section.content,
            newContent: edit.newContent
          }]
        };
      }
    } else if (edit.targetType === 'content') {
      // Find and replace specific content
      const regex = new RegExp(edit.targetIdentifier, 'gi');
      if (regex.test(content) && edit.newContent) {
        const newContent = content.replace(regex, edit.newContent);
        
        return {
          success: true,
          content: newContent,
          changes: [{
            type: 'content_replace',
            location: edit.targetIdentifier,
            oldContent: edit.targetIdentifier,
            newContent: edit.newContent
          }]
        };
      }
    }
    
    throw new Error(`Target not found: ${edit.targetIdentifier}`);
  }

  private insertContent(
    content: string, 
    edit: LaTeXEditRequest, 
    document: LaTeXDocument
  ): { success: boolean; content: string; changes: any[] } {
    
    if (edit.targetType === 'table') {
      const table = document.tables.find(t => 
        t.title?.toLowerCase().includes(edit.targetIdentifier.toLowerCase())
      );
      
      if (table && edit.newContent) {
        // Find the table body and insert new row
        const tableBody = table.content;
        const endTabularMatch = tableBody.match(/\\end\{tabular\}/);
        
        if (endTabularMatch) {
          const insertPosition = table.startIndex + endTabularMatch.index;
          const newContent = content.slice(0, insertPosition) + 
                            edit.newContent + ' \\\\\n' +
                            content.slice(insertPosition);
          
          return {
            success: true,
            content: newContent,
            changes: [{
              type: 'table_insert',
              location: table.title || 'Unknown table',
              oldContent: '',
              newContent: edit.newContent
            }]
          };
        }
      }
    }
    
    throw new Error(`Cannot insert into: ${edit.targetIdentifier}`);
  }

  private performCalculation(
    content: string, 
    edit: LaTeXEditRequest, 
    document: LaTeXDocument
  ): { success: boolean; content: string; changes: any[] } {
    
    if (edit.targetIdentifier === 'cagr') {
      // Find revenue figures and calculate CAGR
      const revenueMatches = content.match(/USD\s+(\d+)\s+million.*?(\d{4}).*?USD\s+(\d+)\s+million.*?(\d{4})/i);
      
      if (revenueMatches) {
        const startValue = parseFloat(revenueMatches[1]);
        const startYear = parseInt(revenueMatches[2]);
        const endValue = parseFloat(revenueMatches[3]);
        const endYear = parseInt(revenueMatches[4]);
        
        const years = endYear - startYear;
        const cagr = (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
        const cagrFormatted = `${cagr.toFixed(1)}%`;
        
        // Replace existing CAGR if found
        const cagrRegex = /CAGR\s+of\s+[\d.]+%/i;
        const newContent = content.replace(cagrRegex, `CAGR of ${cagrFormatted}`);
        
        return {
          success: true,
          content: newContent,
          changes: [{
            type: 'calculation',
            location: 'CAGR calculation',
            oldContent: 'Previous CAGR value',
            newContent: cagrFormatted
          }]
        };
      }
    }
    
    throw new Error(`Cannot perform calculation: ${edit.targetIdentifier}`);
  }

  private validateLaTeX(content: string): LaTeXEditResult['validationResults'] {
    const issues: string[] = [];
    
    // Check for common LaTeX syntax issues
    const openBraces = (content.match(/\{/g) || []).length;
    const closeBraces = (content.match(/\}/g) || []).length;
    
    if (openBraces !== closeBraces) {
      issues.push('Mismatched braces');
    }
    
    // Check for unclosed environments
    const beginEnvironments = content.match(/\\begin\{(\w+)\}/g) || [];
    const endEnvironments = content.match(/\\end\{(\w+)\}/g) || [];
    
    if (beginEnvironments.length !== endEnvironments.length) {
      issues.push('Unclosed LaTeX environments');
    }
    
    // Check for required packages (basic validation)
    const hasDocumentClass = /\\documentclass/.test(content);
    const hasBeginDocument = /\\begin\{document\}/.test(content);
    
    const syntaxValid = issues.length === 0;
    const compilationReady = syntaxValid && hasDocumentClass && hasBeginDocument;
    
    return {
      syntaxValid,
      compilationReady,
      issues
    };
  }
}

export const latexProcessor = new LaTeXProcessor();