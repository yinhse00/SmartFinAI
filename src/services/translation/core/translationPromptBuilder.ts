
/**
 * Builds translation prompts for the API
 */
export const translationPromptBuilder = {
  /**
   * Creates a structured prompt for translation
   */
  buildTranslationPrompt(
    content: string, 
    sourceLanguage: 'en' | 'zh', 
    targetLanguage: 'en' | 'zh'
  ): any {
    const sourceLang = sourceLanguage === 'en' ? 'English' : 'Chinese';
    const targetLang = targetLanguage === 'en' ? 'English' : 'Chinese';
    
    return {
      messages: [
        { 
          role: 'system', 
          content: this.getSystemPrompt(sourceLang, targetLang) 
        },
        { 
          role: 'user', 
          content: content 
        }
      ],
      model: "grok-3-beta",
      temperature: 0.1, // Lower temperature for more accurate translations
      max_tokens: 10000,  // Increased token limit to prevent truncation
      top_p: 0.95        // Maintain high coherence
    };
  },
  
  /**
   * Generates the system prompt based on source and target languages
   */
  getSystemPrompt(sourceLang: string, targetLang: string): string {
    return `You are a professional financial translator specializing in Hong Kong regulations and markets. 
    Translate the following content from ${sourceLang} to ${targetLang} with high accuracy, maintaining the 
    same level of detail, comprehensiveness, and technical precision as the original text. 
    
    CRITICAL INSTRUCTIONS:
    1. Ensure the translation is COMPLETE - DO NOT OMIT ANY INFORMATION from the source text
    2. Maintain all technical financial terms accurately and consistently
    3. Keep the same structure, formatting, paragraphs, and sections as the original
    4. Translate everything including examples, citations, references, and lists
    5. Do not add explanations, metadata, comments, or any content not in the original
    6. Maintain formal tone appropriate for financial/regulatory documents
    7. The translation MUST BE THE SAME LENGTH or LONGER than the original to ensure no information is lost
    8. Pay special attention to translate all numerical data, dates, and percentages accurately
    9. If you cannot translate a term, keep the original term and add the translation in parentheses
    10. When translating Hong Kong Listing Rules or regulatory terms, use the officially recognized Chinese translations where available
    11. For Chapter 14A connected persons, ensure ALL categories and relationships described in the original text are included in your translation
    12. NEVER summarize or condense the content - translate EVERYTHING comprehensively
    
    Your translation must be comprehensive and maintain ALL the information, numbers, and details from the original text.
    
    THIS IS EXTREMELY IMPORTANT: If the source text contains information about connected persons under Chapter 14A, ensure ALL categories of connected persons, exemption thresholds, and regulatory requirements are completely preserved in the translation.`;
  }
};
