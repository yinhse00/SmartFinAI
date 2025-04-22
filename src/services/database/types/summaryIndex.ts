
/**
 * Types for summary index functionality
 */

/**
 * Represents an entry in the summary index
 */
export interface SummaryIndexEntry {
  id: string;
  title: string;
  keywords: string[];
  summary: string;
  sourceId: string;
  category: string;
  sourceFile?: string; // Source file name used for specific file search
}

