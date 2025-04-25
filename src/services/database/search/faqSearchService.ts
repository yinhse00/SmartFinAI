
import { RegulatoryEntry } from '../types';
import { extractKeyTerms, calculateRelevanceScore } from '../utils/textProcessing';

export const faqSearchService = {
  isFaqQuery(query: string): boolean {
    return query.toLowerCase().includes('faq') || 
           query.toLowerCase().includes('continuing obligation') ||
           Boolean(query.match(/\b10\.4\b/));
  },

  prioritizeFaqResults(entries: RegulatoryEntry[]): RegulatoryEntry[] {
    if (!entries.length) return entries;

    // Identify FAQ entries
    const faqEntries = entries.filter(entry => 
      entry.title.includes('10.4') || 
      entry.title.toLowerCase().includes('faq') || 
      entry.title.toLowerCase().includes('continuing obligation')
    );

    if (faqEntries.length > 0) {
      console.log(`Found ${faqEntries.length} FAQ-related entries to prioritize`);
      const otherEntries = entries.filter(entry => !faqEntries.includes(entry));
      return [...faqEntries, ...otherEntries];
    }

    return entries;
  },
  
  rankFaqResultsByRelevance(entries: RegulatoryEntry[], query: string): RegulatoryEntry[] {
    if (!entries.length) return entries;
    
    // Extract search terms for relevance scoring
    const searchTerms = extractKeyTerms(query.toLowerCase());
    
    // Score and sort entries
    const scoredEntries = entries.map(entry => ({
      entry,
      score: calculateRelevanceScore(entry.content, entry.title, searchTerms)
    }));
    
    // First prioritize FAQ entries, then sort by relevance score
    const faqScoredEntries = scoredEntries.filter(item => 
      item.entry.title.includes('10.4') || 
      item.entry.title.toLowerCase().includes('faq') || 
      item.entry.title.toLowerCase().includes('continuing obligation')
    );
    
    const otherScoredEntries = scoredEntries.filter(item => 
      !faqScoredEntries.some(faq => faq.entry.id === item.entry.id)
    );
    
    // Sort each group by score
    faqScoredEntries.sort((a, b) => b.score - a.score);
    otherScoredEntries.sort((a, b) => b.score - a.score);
    
    // Combine the groups
    return [...faqScoredEntries, ...otherScoredEntries].map(item => item.entry);
  }
};
