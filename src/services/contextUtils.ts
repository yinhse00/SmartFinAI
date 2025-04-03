
import { RegulatoryEntry } from './databaseService';

/**
 * Format regulatory entries as context for AI prompts
 */
export function formatRegulatoryEntriesAsContext(entries: RegulatoryEntry[]): string {
  return entries.map(entry => (
    `--- ${entry.title} (${entry.source}) ---\n` +
    `${entry.content}\n`
  )).join('\n\n');
}

/**
 * Create an enhanced prompt with document and regulatory context
 */
export function createEnhancedPrompt(prompt: string, documentContext?: string, regulatoryContext?: string): string {
  let enhancedPrompt = prompt;
  
  if (documentContext) {
    enhancedPrompt = 
      `Document Context:\n${documentContext}\n\n` +
      `Query: ${prompt}`;
  }
  
  if (regulatoryContext) {
    enhancedPrompt = 
      `Regulatory Context:\n${regulatoryContext}\n\n` +
      `${enhancedPrompt}`;
  }
  
  return enhancedPrompt;
}

/**
 * Extract references from regulatory context
 */
export function extractReferences(context: string): string[] {
  if (!context) return [];
  
  const references: string[] = [];
  const lines = context.split('\n');
  
  for (const line of lines) {
    // Look for lines that start with "--- " which indicates a reference title
    if (line.startsWith('--- ')) {
      // Extract the reference name between "--- " and " ---"
      const match = line.match(/--- (.*?) \(.*?\) ---/);
      if (match && match[1]) {
        references.push(match[1]);
      }
    }
  }
  
  // Return unique references
  return [...new Set(references)];
}
