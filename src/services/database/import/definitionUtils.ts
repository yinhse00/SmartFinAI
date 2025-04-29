
import { regulatoryDatabaseService } from '../regulatoryDatabaseService';

/**
 * Helper to extract definitions from content
 */
export const extractDefinitions = (content: string, categoryId: string | undefined): { term: string; definition: string }[] => {
  const definitions: { term: string; definition: string }[] = [];
  
  if (!content || content.trim().length === 0) {
    return definitions;
  }
  
  // Look for pattern where terms are defined
  // Example: "Associate" means in relation to any person...
  const definitionPatterns = [
    // Pattern for quoted terms
    /[""]([^""]+)[""] means\s+([^.]+\.)/g,
    // Pattern for capitalized terms
    /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+means\s+([^.]+\.)/g,
    // Pattern for "X is defined as..." format
    /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+is defined as\s+([^.]+\.)/g,
    // Pattern for enclosed in quotes with definition following
    /["']([^"']+)["']\s+(?:refers to|is|are)\s+([^.]+\.)/g,
    // Pattern for "X has the meaning..." format
    /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+has the meaning\s+([^.]+\.)/g
  ];
  
  for (const pattern of definitionPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      if (match[1] && match[2] && match[1].trim().length > 0 && match[2].trim().length > 0) {
        definitions.push({
          term: match[1].trim(),
          definition: match[2].trim()
        });
      }
    }
  }
  
  // Look for definition lists
  const definitionListPattern = /\(([^)]+)\)\s+(?:means|refers to|is defined as)\s+([^.]+\.)/g;
  while ((match = definitionListPattern.exec(content)) !== null) {
    if (match[1] && match[2] && match[1].trim().length > 0 && match[2].trim().length > 0) {
      definitions.push({
        term: match[1].trim(),
        definition: match[2].trim()
      });
    }
  }
  
  console.log(`Extracted ${definitions.length} definitions from content`);
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
  
  try {
    if (!provision.content || provision.content.trim().length === 0) {
      console.log('No content to process for definitions');
      return definitionsAdded;
    }
    
    const definitions = extractDefinitions(provision.content, categoryId);
    console.log(`Found ${definitions.length} definitions to add from provision ${provision.id}`);
    
    for (const def of definitions) {
      try {
        const added = await regulatoryDatabaseService.addDefinition({
          term: def.term,
          definition: def.definition,
          category_id: categoryId,
          source_provision_id: provision.id
        });
        
        if (added) {
          definitionsAdded++;
        }
      } catch (err) {
        console.error(`Error adding definition for term '${def.term}':`, err);
      }
    }
    
    console.log(`Successfully added ${definitionsAdded} definitions from provision ${provision.id}`);
    return definitionsAdded;
  } catch (error) {
    console.error('Error processing definitions:', error);
    return definitionsAdded;
  }
};
