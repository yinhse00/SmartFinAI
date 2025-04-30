
import { DocumentCategory } from '@/types/references';
import { RegulationProvision } from '../types/index';

/**
 * Helper to extract chapter from rule number
 */
export const extractChapter = (ruleNumber: string): string | undefined => {
  // Patterns like "13.45", "14A.32", etc.
  const match = ruleNumber.match(/^(\d+[A-Z]?)/);
  return match ? match[1] : undefined;
};

/**
 * Detect if content contains chapter information
 */
export const detectChapter = (content: string): string | undefined => {
  // Look for chapter headers in common formats
  const chapterPatterns = [
    /Chapter\s+(\d+[A-Z]?)/i,
    /CHAPTER\s+(\d+[A-Z]?)/,
    /^(\d+[A-Z]?)\.(\d+)/m,  // Match patterns like "14.1" or "14A.2" at line start
    /\b(\d+[A-Z]?)\.(\d+)/   // Match patterns like "14.1" or "14A.2" anywhere
  ];
  
  for (const pattern of chapterPatterns) {
    const match = content.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  // Special check for known chapters based on content
  if (content.toLowerCase().includes("connected transactions") && 
      (content.includes("Chapter 14A") || content.includes("14A"))) {
    return "14A";
  }
  
  if (content.toLowerCase().includes("notifiable transactions") && 
      (content.includes("Chapter 14") || content.includes("14 "))) {
    return "14";
  }
  
  if (content.toLowerCase().includes("equity securities") && 
      (content.includes("Chapter 13") || content.includes("13."))) {
    return "13";
  }
  
  return undefined;
};

/**
 * Parse a regulatory document text into provisions
 */
export const parseRegulatoryText = (
  content: string,
  category: DocumentCategory,
  sourceDocumentId?: string
): { provisions: Omit<RegulationProvision, 'id'>[], errors: string[] } => {
  const provisions: Omit<RegulationProvision, 'id'>[] = [];
  const errors: string[] = [];
  
  try {
    if (!content || content.trim().length === 0) {
      errors.push('Empty content provided');
      return { provisions, errors };
    }

    console.log(`Parsing content (${content.length} chars) for category: ${category}`);
    
    // First try to detect global chapter for the entire document
    const documentChapter = detectChapter(content);
    console.log(`Detected document chapter: ${documentChapter || 'None'}`);
    
    // Try multiple parsing approaches in sequence until one works
    const parseApproaches = [
      parseRuleNumberBasedApproach,
      parseNumberedListApproach,
      parseHeadingBasedApproach,
      parseParagraphBasedApproach  // New fallback approach
    ];
    
    for (const parseApproach of parseApproaches) {
      const parsedProvisions = parseApproach(content, documentChapter, sourceDocumentId);
      if (parsedProvisions.length > 0) {
        console.log(`Successfully parsed ${parsedProvisions.length} provisions using ${parseApproach.name}`);
        provisions.push(...parsedProvisions);
        break;
      }
    }
    
    // Fall back to a single provision if no structured parsing worked
    if (provisions.length === 0) {
      console.log("Falling back to single provision for entire content");
      let title = "Regulatory Content";
      let ruleNumber = documentChapter ? `${documentChapter}.0` : "0.0";
      
      // Try to extract a title from the first line or first heading
      const firstLineMatch = content.match(/^\s*(.*?)\r?\n/);
      if (firstLineMatch && firstLineMatch[1].trim().length > 0) {
        title = firstLineMatch[1].trim();
      }
      
      provisions.push({
        rule_number: ruleNumber,
        title: title,
        content: content,
        chapter: documentChapter,
        source_document_id: sourceDocumentId
      });
    }
    
    // Double-check after all attempts that we have at least one provision
    if (provisions.length === 0) {
      errors.push('No provisions were successfully parsed from the content');
    }
  } catch (error) {
    errors.push(`Error parsing regulatory text: ${error instanceof Error ? error.message : String(error)}`);
    console.error("Parsing error:", error);
  }
  
  return { provisions, errors };
};

/**
 * Parse content using rule number based approach
 */
const parseRuleNumberBasedApproach = (
  content: string, 
  documentChapter?: string,
  sourceDocumentId?: string
): Omit<RegulationProvision, 'id'>[] => {
  const provisions: Omit<RegulationProvision, 'id'>[] = [];
  
  // Pattern for matching rule numbers and their content
  // Enhanced to better match listing rule formats in chapters 13, 14, 14A
  const rulePattern = /(\d+[A-Z]?\.\d+(?:\.\d+)*)\s+([^.]+)\.([^]*?)(?=\d+[A-Z]?\.\d+|$)/g;
  
  let match;
  while ((match = rulePattern.exec(content)) !== null) {
    const ruleNumber = match[1].trim();
    const title = match[2].trim();
    let ruleContent = match[3].trim();
    
    // Skip entries with insufficient content (likely false positives)
    if (ruleContent.length < 5) {
      continue;
    }
    
    // First try to get chapter from rule number, then fallback to document chapter
    let chapter = extractChapter(ruleNumber);
    if (!chapter && documentChapter) {
      chapter = documentChapter;
    }
    
    provisions.push({
      rule_number: ruleNumber,
      title: title, 
      content: ruleContent,
      chapter: chapter,
      source_document_id: sourceDocumentId
    });
  }
  
  return provisions;
};

/**
 * Parse content using numbered list approach
 */
const parseNumberedListApproach = (
  content: string, 
  documentChapter?: string,
  sourceDocumentId?: string
): Omit<RegulationProvision, 'id'>[] => {
  const provisions: Omit<RegulationProvision, 'id'>[] = [];
  
  // Patterns that look for numbered sections
  const numberPattern = /^\s*(\d+[A-Z]?(?:\.\d+)*)\s+([^\n.]+)(?:\.|\n)([^]*?)(?=^\s*\d+[A-Z]?(?:\.\d+)*\s|$)/gm;
  
  let match;
  while ((match = numberPattern.exec(content)) !== null) {
    const ruleNumber = match[1].trim();
    const title = match[2].trim();
    let ruleContent = match[3].trim();
    
    // Skip entries with insufficient content
    if (ruleContent.length < 5 || title.length < 2) {
      continue;
    }
    
    // First try to get chapter from rule number, then fallback to document chapter
    let chapter = extractChapter(ruleNumber);
    if (!chapter && documentChapter) {
      chapter = documentChapter;
    }
    
    provisions.push({
      rule_number: ruleNumber,
      title: title, 
      content: ruleContent,
      chapter: chapter,
      source_document_id: sourceDocumentId
    });
  }
  
  return provisions;
};

/**
 * Parse content using heading based approach
 */
const parseHeadingBasedApproach = (
  content: string, 
  documentChapter?: string,
  sourceDocumentId?: string
): Omit<RegulationProvision, 'id'>[] => {
  const provisions: Omit<RegulationProvision, 'id'>[] = [];
  
  // Split by headings (lines in all caps or with specific formatting)
  const lines = content.split('\n');
  let currentTitle = "";
  let currentContent = "";
  let currentIndex = 1;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Detect headings (all caps, starts with numbers, etc)
    if (line.length > 0 && (
        line === line.toUpperCase() || 
        /^\d+\.\s+[A-Z]/.test(line) ||
        /^[A-Z][a-z]+\s+[A-Z][a-z]+/.test(line))) {
      
      // Save previous section if exists
      if (currentTitle && currentContent) {
        const ruleNumber = documentChapter 
          ? `${documentChapter}.${currentIndex}` 
          : `${currentIndex}`;
        
        provisions.push({
          rule_number: ruleNumber,
          title: currentTitle, 
          content: currentContent,
          chapter: documentChapter,
          source_document_id: sourceDocumentId
        });
        
        currentIndex++;
      }
      
      // Start new section
      currentTitle = line;
      currentContent = "";
    } else if (currentTitle) {
      // Add content to current section
      currentContent += line + "\n";
    }
  }
  
  // Add final section
  if (currentTitle && currentContent) {
    const ruleNumber = documentChapter 
      ? `${documentChapter}.${currentIndex}` 
      : `${currentIndex}`;
    
    provisions.push({
      rule_number: ruleNumber,
      title: currentTitle, 
      content: currentContent,
      chapter: documentChapter,
      source_document_id: sourceDocumentId
    });
  }
  
  return provisions;
};

/**
 * Parse content by paragraphs if all else fails
 */
const parseParagraphBasedApproach = (
  content: string, 
  documentChapter?: string,
  sourceDocumentId?: string
): Omit<RegulationProvision, 'id'>[] => {
  const provisions: Omit<RegulationProvision, 'id'>[] = [];
  
  // Split content into paragraphs (separated by double newlines)
  const paragraphs = content.split(/\n\s*\n/);
  
  if (paragraphs.length <= 1) {
    return []; // Not enough paragraphs to parse
  }
  
  let title = "Chapter Content";
  // Try to use first paragraph as title if it's short enough
  if (paragraphs[0].length < 100) {
    title = paragraphs[0].trim();
    paragraphs.shift();
  }
  
  // Combine remaining paragraphs as content
  if (paragraphs.length > 0) {
    const ruleNumber = documentChapter 
      ? `${documentChapter}.1` 
      : `1.0`;
    
    provisions.push({
      rule_number: ruleNumber,
      title: title,
      content: paragraphs.join('\n\n'),
      chapter: documentChapter,
      source_document_id: sourceDocumentId
    });
  }
  
  return provisions;
};
