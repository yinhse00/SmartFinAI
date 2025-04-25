
import { RegulatoryEntry } from '../types';

export const faqSearchService = {
  isFaqQuery(query: string): boolean {
    return query.toLowerCase().includes('faq') || 
           query.toLowerCase().includes('continuing obligation') ||
           Boolean(query.match(/\b10\.4\b/));
  },

  prioritizeFaqResults(entries: RegulatoryEntry[]): RegulatoryEntry[] {
    if (!entries.length) return entries;

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
  }
};
