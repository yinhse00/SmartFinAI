
import { regulatoryDatabaseService } from '../regulatoryDatabaseService';

/**
 * Helper to extract definitions from content
 */
export const extractDefinitions = (content: string, categoryId: string | undefined): { term: string; definition: string }[] => {
  const definitions: { term: string; definition: string }[] = [];
  
  // Look for pattern where terms are defined
  // Example: "Associate" means in relation to any person...
  const definitionPatterns = [
    /[""]([^""]+)[""] means\s+([^.]+\.)/g,
    /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+means\s+([^.]+\.)/g,
    // Add pattern for "X is defined as..." format
    /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+is defined as\s+([^.]+\.)/g,
    // Add pattern for enclosed in quotes with definition following
    /["']([^"']+)["']\s+(?:refers to|is|are)\s+([^.]+\.)/g
  ];
  
  for (const pattern of definitionPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      definitions.push({
        term: match[1].trim(),
        definition: match[2].trim()
      });
    }
  }
  
  return definitions;
};

/**
 * Process and add definitions from a provision
 */
export const processDefinitions = async (
  provision: { id: string; content: string },
  categoryId: string | undefined
): Promise<number> => {
  let definitionsAdded = 0;
  
  const definitions = extractDefinitions(provision.content, categoryId);
  
  for (const def of definitions) {
    const added = await regulatoryDatabaseService.addDefinition({
      term: def.term,
      definition: def.definition,
      category_id: categoryId,
      source_provision_id: provision.id
    });
    
    if (added) {
      definitionsAdded++;
    }
  }
  
  return definitionsAdded;
};
