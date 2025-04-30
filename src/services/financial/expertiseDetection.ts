export function isSimpleConversationalQuery(prompt: string): boolean {
  const lowerPrompt = prompt.toLowerCase().trim();
  
  // Explicitly handle definition queries for connected persons and regulatory terms
  const definitionPatterns = [
    'what is', 
    'define', 
    'definition of', 
    'explain the term', 
    'meaning of'
  ];
  
  const complexDefinitionTerms = [
    'connected person', 
    'connected transaction', 
    'chapter 14a', 
    'listing rules', 
    'regulatory definition',
    'hkex definition'
  ];
  
  // Check for definition queries with complex regulatory terms
  const isDefinitionQuery = definitionPatterns.some(pattern => 
    lowerPrompt.includes(pattern) && 
    complexDefinitionTerms.some(term => lowerPrompt.includes(term))
  );
  
  // If it's a detailed definition query, it's NOT a simple conversational query
  if (isDefinitionQuery) {
    return false;
  }
  
  // Previous existing checks
  if (lowerPrompt.length < 15) {
    return true;
  }
  
  // Don't treat specific rule references as conversational
  if (/(rule\s+\d+\.\d+[A-Z]?|rule\s+\d+)/i.test(prompt)) {
    return false;
  }
  
  // Don't treat rights issue with independent shareholders' approval as conversational
  if (lowerPrompt.includes('rights issue') && 
      (lowerPrompt.includes('independent') || lowerPrompt.includes('shareholder') || 
       lowerPrompt.includes('approval') || lowerPrompt.includes('aggregate'))) {
    return false;
  }
  
  // Common conversational patterns
  const conversationalPatterns = [
    'hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening',
    'how are you', 'what is your name', 'who are you', 'what can you do',
    'thanks', 'thank you', 'goodbye', 'bye', 'see you', 'talk to you later',
    'what is your strength', 'your strength', 'your capabilities', 'your features',
    'help me', 'i need help', 'can you help', 'assist me', 'introduction',
    'tell me about yourself', 'what are you'
  ];
  
  // Check if query contains conversational patterns
  for (const pattern of conversationalPatterns) {
    if (lowerPrompt.includes(pattern)) {
      return true;
    }
  }
  
  // If query doesn't contain any financial terms, it's likely conversational
  const financialTerms = [
    'listing', 'rules', 'takeover', 'prospectus', 'ipo', 'transaction',
    'rights issue', 'offer', 'securities', 'shares', 'waiver', 'exemption',
    'disclosure', 'circular', 'chapter', 'rule', 'schedule', 'timetable'
  ];
  
  // If the query doesn't contain any financial terms, consider it conversational
  return !financialTerms.some(term => lowerPrompt.includes(term));
}

export function detectFinancialExpertiseArea(query: string): string {
  const lowerQuery = query.toLowerCase();
  
  // Check for specialist technology / Chapter 18C related queries
  if (lowerQuery.includes('chapter 18c') || 
      lowerQuery.includes('specialist technology') ||
      lowerQuery.includes('pre-commercial company') ||
      lowerQuery.includes('commercial company requirements') ||
      lowerQuery.includes('18c requirements')) {
    return 'specialist_technology';
  }
  
  // Check for connected transactions and persons
  if (lowerQuery.includes('connected person') || 
      lowerQuery.includes('connected transaction') ||
      lowerQuery.includes('chapter 14a')) {
    return 'connected_transactions';
  }
  
  // Check for rights issue related queries
  if (lowerQuery.includes('rights issue')) {
    return 'rights_issue';
  }
  
  // Check for listing rules
  if (lowerQuery.includes('listing rule') || 
      lowerQuery.includes('chapter') ||
      /rule\s+\d+/.test(lowerQuery)) {
    return 'listing_rules';
  }
  
  // Check for takeovers code
  if (lowerQuery.includes('takeover') || 
      lowerQuery.includes('whitewash') ||
      lowerQuery.includes('mandatory offer')) {
    return 'takeovers_code';
  }
  
  // Default to general if no specific area is detected
  return 'general';
}

// Add the missing detectQueryType function that's being imported in step1Initial.ts
export function detectQueryType(query: string): string {
  // First check if it's a conversational query
  if (isSimpleConversationalQuery(query)) {
    return 'conversational';
  }
  
  // Otherwise determine the financial expertise area
  return detectFinancialExpertiseArea(query);
}
