
/**
 * Process text content and convert regulatory references to clickable links
 */
export function processRegulatoryLinks(content: string): string {
  if (!content) return '';

  // Replace chapter references
  content = content.replace(
    /Chapter\s+(\d+[A-Z]?)/gi,
    '<a href="https://en-rules.hkex.com.hk/rulebook/chapter-$1" target="_blank" class="text-finance-medium-blue hover:text-finance-dark-blue dark:text-finance-light-blue dark:hover:text-finance-medium-blue underline">Chapter $1</a>'
  );

  // Replace rule references (e.g., Rule 7.19A)
  content = content.replace(
    /Rule\s+(\d+\.\d+[A-Z]?|\d+)/gi,
    '<a href="https://en-rules.hkex.com.hk/rulebook/rule-$1" target="_blank" class="text-finance-medium-blue hover:text-finance-dark-blue dark:text-finance-light-blue dark:hover:text-finance-medium-blue underline">Rule $1</a>'
  );

  // Replace practice note references
  content = content.replace(
    /Practice\s+Note\s+(\d+)/gi,
    '<a href="https://en-rules.hkex.com.hk/rulebook/practice-note-$1" target="_blank" class="text-finance-medium-blue hover:text-finance-dark-blue dark:text-finance-light-blue dark:hover:text-finance-medium-blue underline">Practice Note $1</a>'
  );

  return content;
}
