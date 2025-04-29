
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
    /^(\d+[A-Z]?)\.\s+/m  // Match lines starting with chapter numbers
  ];
  
  for (const pattern of chapterPatterns) {
    const match = content.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  // Special check for known chapters
  if (content.includes("Connected Transactions") && 
      (content.includes("Chapter 14A") || content.includes("14A"))) {
    return "14A";
  }
  
  if (content.includes("Notifiable Transactions") && 
      (content.includes("Chapter 14") || content.includes("14 "))) {
    return "14";
  }
  
  if (content.toLowerCase().includes("connected transactions") && 
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
    // First try to detect global chapter for the entire document
    const documentChapter = detectChapter(content);
    
    // Simple parsing - split by rule numbers
    // Enhanced pattern to better match listing rule formats in chapters 13, 14, 14A
    const rulePattern = /(\d+[A-Z]?\.\d+(?:\.\d+)*)\s+([^.]+)\.([^]*?)(?=\d+[A-Z]?\.\d+|$)/g;
    
    let match;
    while ((match = rulePattern.exec(content)) !== null) {
      const ruleNumber = match[1].trim();
      const title = match[2].trim();
      let ruleContent = match[3].trim();
      
      // Check for minimum valid content
      if (ruleContent.length < 10) {
        errors.push(`Rule ${ruleNumber} has suspiciously short content, might be parsing error`);
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
    
    // Special handling for chapters 13, 14, 14A when no provisions are found
    if (provisions.length === 0) {
      // Try an alternative parsing approach for structured content
      // Split by sections that look like rules
      const alternativeRulePattern = /((?:\d+[A-Z]?\.)+\d+)\s+([^\n]+)/g;
      
      while ((match = alternativeRulePattern.exec(content)) !== null) {
        const ruleNumber = match[1].trim();
        const title = match[2].trim();
        
        // Find the end of this section (start of next rule or end of content)
        const startPos = match.index + match[0].length;
        const nextRuleMatch = alternativeRulePattern.exec(content);
        alternativeRulePattern.lastIndex = match.index + match[0].length; // Reset position
        
        const endPos = nextRuleMatch ? nextRuleMatch.index : content.length;
        const ruleContent = content.substring(startPos, endPos).trim();
        
        if (ruleContent.length < 10) continue;
        
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
    }
    
    if (provisions.length === 0) {
      errors.push('No provisions were successfully parsed from the content');
    }
  } catch (error) {
    errors.push(`Error parsing regulatory text: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  return { provisions, errors };
};
