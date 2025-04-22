
import { RegulatoryEntry } from "../types";
import { SummaryIndexEntry } from "../types/summaryIndex";
import { extractKeyTerms } from "./textProcessing";

/**
 * Generate a summary entry from a regulatory entry
 */
export function generateSummaryEntry(entry: RegulatoryEntry): SummaryIndexEntry {
  // Extract keywords from title and content
  const titleKeywords = extractKeyTerms(entry.title.toLowerCase());
  const contentKeywords = extractKeyTerms(entry.content.toLowerCase());
  
  // Merge keywords and remove duplicates
  const allKeywords = [...new Set([...titleKeywords, ...contentKeywords])];
  
  // Generate a brief summary (first 200 characters)
  const summary = entry.content.substring(0, 200) + '...';
  
  // Determine if this is from a summary index file
  const sourceFile = entry.title.includes('Summary and Keyword Index') ? entry.title : undefined;
  
  return {
    id: `summary-${entry.id}`,
    title: entry.title,
    keywords: allKeywords,
    summary,
    sourceId: entry.id,
    category: entry.category,
    sourceFile
  };
}

