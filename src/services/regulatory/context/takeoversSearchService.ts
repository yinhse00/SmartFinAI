
/**
 * Service for searching takeovers-related documents
 */
import { RegulatoryEntry } from '../../database/types';
import { searchService } from '../../database/searchService';

export const takeoversSearchService = {
  /**
   * Find documents related to general offers
   */
  findGeneralOfferDocuments: async (query: string, isWhitewashQuery: boolean): Promise<RegulatoryEntry[]> => {
    // Expand search terms to include takeover code related terms
    const searchTerms = [
      'general offer',
      'takeover',
      'acquisition',
      'mandatory offer',
      'voluntary offer',
      'code on takeovers',
      'takeovers code',
      'takeovers and mergers'
    ];
    
    // Add whitewash-specific terms if needed
    if (isWhitewashQuery) {
      searchTerms.push('whitewash');
      searchTerms.push('whitewashed');
      searchTerms.push('waiver');
    }
    
    // Create an enhanced query combining original query with takeover terms
    const enhancedQuery = `${query} ${searchTerms.join(' ')}`;
    
    // Search for takeover code documents with enhanced query
    // Updated to use search instead of findDocuments
    const results = await searchService.search(enhancedQuery, 'takeovers');
    
    return results;
  },
  
  /**
   * Find general takeover documents
   */
  findTakeoverDocuments: async (query: string): Promise<RegulatoryEntry[]> => {
    // Search for takeover code documents
    // Updated to use search instead of findDocuments
    return await searchService.search(query, 'takeovers');
  },
  
  /**
   * Add whitewash fallback document if needed
   */
  addWhitewashFallbackIfNeeded: (results: RegulatoryEntry[], isWhitewashQuery: boolean): RegulatoryEntry[] => {
    // If it's a whitewash query and we don't have enough results, add a fallback document
    if (isWhitewashQuery && results.length < 2) {
      console.log("Adding whitewash fallback document");
      
      const whitewashFallback: RegulatoryEntry = {
        id: 'whitewash-fallback',
        category: 'takeovers',
        title: 'Whitewash Waiver Guidelines',
        content: `Whitewash Waivers under the Hong Kong Takeovers Code:
        
1. Definition: A "whitewash waiver" refers to a waiver from the obligation to make a mandatory general offer under Rule 26 of the Takeovers Code.

2. Application: When an issue of new securities would result in the acquirer holding 30% or more voting rights (or if already between 30-50%, increasing by more than 2% in 12 months).

3. Requirements for Whitewash Waiver:
   - The whitewash document must contain competent independent advice
   - The whitewash must be approved by independent shareholders
   - No disqualifying transactions within 6 months prior to announcement
   - Compliance with all other applicable rules and regulations

4. Independent Shareholder Approval:
   - A majority of independent votes cast at a properly convened meeting
   - Independent shareholders are those not involved in or interested in the transaction

5. Restrictions Post-Waiver:
   - No further acquisitions of voting rights for 6 months after the waiver
   - No disposals of securities for 6 months if it would reduce holding below waiver level`,
        source: 'Hong Kong Takeovers Code',
        lastUpdated: new Date(),
        status: 'active'
      };
      
      return [...results, whitewashFallback];
    }
    
    return results;
  },
  
  /**
   * Add general offer timetable fallback if needed
   */
  addGeneralOfferTimetableFallback: (results: RegulatoryEntry[], query: string, isGeneralOffer: boolean): RegulatoryEntry[] => {
    // Check if this is likely a query about offer timetables
    const isTimetableQuery = 
      query.toLowerCase().includes('timetable') ||
      query.toLowerCase().includes('timeline') ||
      query.toLowerCase().includes('schedule') ||
      query.toLowerCase().includes('when') ||
      query.toLowerCase().includes('process') ||
      query.toLowerCase().includes('how long');
      
    // Only add fallback if it's a timetable query for general offers and we don't have many results
    if (isGeneralOffer && isTimetableQuery && results.length < 2) {
      console.log("Adding general offer timetable fallback");
      
      const timetableFallback: RegulatoryEntry = {
        id: 'general-offer-timetable-fallback',
        category: 'takeovers',
        title: 'General Offer Timetable',
        content: `Typical Timetable for a General Offer under Hong Kong Takeovers Code:

Day 0: Announcement of firm intention to make an offer (Rule 3.5)
- Must identify offeror and terms of offer
- Must confirm financial resources available
- Must identify any pre-conditions

Within 21 days of announcement: Offer document must be posted (Rule 8.2)
- Must include all material information for shareholders
- Must follow content requirements in Schedule I & III
- Must include competent independent advice

Day 21 after posting: Initial closing date (minimum period for offer)
- First date offer can close (Rule 15.1)
- No extension if declared "no increase/no extension"

Day 28: Offeree board circular deadline (Rule 8.4)
- Board must issue response circular within 14 days of offer document posting
- Must include independent financial advice

Day 39: Final deadline for material new information (Rule 31.5)
- No material new information after Day 39
- Prevents last-minute changes that shareholders cannot evaluate

Day 46: Last day for revisions to offer (Rule 16)
- Any revised offer must remain open for 14 days
- No revisions in final 14 days of offer period

Day 60: Final day for offer to become/be declared unconditional as to acceptances (Rule 15.5)
- If not unconditional by this date, offer lapses
- All conditions must be met or waived

Unconditional Date + 7 days: Final closing date after unconditional (Rule 15.3)
- Offer must remain open for 14 days after becoming/being declared unconditional
- Provides time for remaining shareholders to accept

Closing Date + 10 business days: Payment deadline (Rule 20.1)
- Consideration must be paid within 10 business days of offer closing
- Applies to both initial and revised offers`,
        source: 'Hong Kong Takeovers Code',
        lastUpdated: new Date(),
        status: 'active'
      };
      
      return [...results, timetableFallback];
    }
    
    return results;
  }
};
