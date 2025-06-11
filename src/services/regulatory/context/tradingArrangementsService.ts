import { RegulatoryEntry } from '../../database/types';
import { searchService } from '../../databaseService';
import { GUIDE_COVERED_ACTIONS } from '../../constants/financialConstants';
import { supabase } from '@/integrations/supabase/client';

/**
 * Service for trading arrangement searches with reference document integration
 */
export const tradingArrangementsService = {
  /**
   * Find documents related to trading arrangements, including uploaded reference documents
   */
  findTradingArrangementDocuments: async (normalizedQuery: string, isCorporateAction: boolean): Promise<RegulatoryEntry[]> => {
    let tradingArrangementsResults: RegulatoryEntry[] = [];
    
    // First, search for uploaded reference documents containing timetable information
    const referenceDocuments = await searchReferenceDocuments(normalizedQuery);
    if (referenceDocuments.length > 0) {
      console.log(`Found ${referenceDocuments.length} reference documents with timetable content`);
      tradingArrangementsResults.push(...referenceDocuments);
    }
    
    if (isCorporateAction) {
      console.log('Identified as corporate action trading arrangement query');
      
      // Direct search for Trading Arrangement guide by title
      const guideResults = await searchService.searchByTitle("Guide on Trading Arrangements");
      console.log(`Found ${guideResults.length} Trading Arrangement documents by title search`);
      tradingArrangementsResults.push(...guideResults);
      
      // If title search didn't yield results, try content search
      if (guideResults.length === 0) {
        const contentResults = await searchService.search("guide on trading arrangements for selected types of corporate actions", "listing_rules");
        console.log(`Found ${contentResults.length} results from trading arrangement keyword search`);
        tradingArrangementsResults.push(...contentResults);
      }
      
      // If still no results, try specific corporate action type
      if (tradingArrangementsResults.length === 0) {
        const corporateActionType = extractCorporateActionType(normalizedQuery);
        if (corporateActionType) {
          const typeResults = await searchService.search(`trading arrangements ${corporateActionType}`, "listing_rules");
          console.log(`Found ${typeResults.length} results using '${corporateActionType}' keyword`);
          tradingArrangementsResults.push(...typeResults);
        }
      }
    }
    
    return tradingArrangementsResults;
  },
  
  /**
   * Find timetable-related documents including reference documents
   */
  findTimetableDocuments: async (query: string, isGeneralOffer: boolean): Promise<RegulatoryEntry[]> => {
    let timetableResults: RegulatoryEntry[] = [];
    
    // First, search reference documents for timetable content
    const referenceDocuments = await searchReferenceDocuments(query);
    if (referenceDocuments.length > 0) {
      console.log(`Found ${referenceDocuments.length} reference documents with timetable information`);
      timetableResults.push(...referenceDocuments);
    }
    
    if (isGeneralOffer) {
      // Special handling for general offer timetable requests
      const offerResults = await searchService.search('general offer timetable takeovers', 'takeovers');
      console.log(`Found ${offerResults.length} results using 'general offer timetable' keyword`);
      timetableResults.push(...offerResults);
    } else {
      // Try to determine specific corporate action type
      const corporateActionType = extractCorporateActionType(query.toLowerCase());
      
      if (corporateActionType) {
        // Search for timetable info for specific corporate action
        const typeResults = await searchService.search(`${corporateActionType} timetable`, 'listing_rules');
        console.log(`Found ${typeResults.length} results using '${corporateActionType} timetable' keyword`);
        timetableResults.push(...typeResults);
      }
      
      // If no specific results, default to rights issue timetable
      if (timetableResults.filter(r => r.category === 'listing_rules').length === 0) {
        const defaultResults = await searchService.search('rights issue timetable', 'listing_rules');
        console.log(`Found ${defaultResults.length} results using 'rights issue timetable' keyword`);
        timetableResults.push(...defaultResults);
      }
    }
    
    return timetableResults;
  },
  
  /**
   * Add trading arrangements guide reference if necessary
   */
  addTradingArrangementGuideReference: (results: RegulatoryEntry[], queryType: string): RegulatoryEntry[] => {
    let enhancedResults = [...results];
    
    // Add trading arrangements guide reference for covered corporate actions
    if (GUIDE_COVERED_ACTIONS.includes(queryType) && 
        !results.some(r => r.title.toLowerCase().includes('trading arrangements'))) {
      console.log("Adding trading arrangements guide reference");
      enhancedResults.push({
        id: 'guide-trading-arrangements',
        title: "Guide on Trading Arrangements for Selected Types of Corporate Actions",
        source: "HKEX",
        content: "This guide covers trading arrangements for rights issues, open offers, share consolidations or sub-divisions, changes in board lot size, and changes of company name or addition of Chinese name. It outlines the standard execution process and timetables approved by HKEX.",
        category: "listing_rules",
        lastUpdated: new Date(),
        status: 'active'
      });
    }
    
    return enhancedResults;
  },
  
  /**
   * Add rights issue timetable fallback if necessary
   */
  addRightsIssueTimetableFallback: (results: RegulatoryEntry[], query: string): RegulatoryEntry[] => {
    let enhancedResults = [...results];
    
    // Special case for rights issue timetables if needed
    if (query.toLowerCase().includes('rights issue') && 
        (query.toLowerCase().includes('timetable') || 
         query.toLowerCase().includes('schedule') ||
         query.toLowerCase().includes('timeline')) &&
        enhancedResults.length < 2) {
      console.log("Enhancing rights issue timetable context with fallback information");
      enhancedResults.push({
        id: 'fallback-rights-issue-timetable',
        title: "Rights Issue Timetable",
        source: "Listing Rules Chapter 10",
        content: "Rights issue timetables typically follow a structured timeline from announcement to dealing day. Key dates include record date, PAL dispatch, rights trading period, and acceptance deadline.",
        category: "listing_rules",
        lastUpdated: new Date(),
        status: 'active'
      });
    }
    
    return enhancedResults;
  }
};

/**
 * Search reference documents for timetable and trading arrangement content
 */
async function searchReferenceDocuments(query: string): Promise<RegulatoryEntry[]> {
  try {
    const normalizedQuery = query.toLowerCase();
    
    // Search for documents that contain timetable-related keywords
    const { data: referenceDocuments, error } = await supabase
      .from('reference_documents')
      .select('*')
      .or(`title.ilike.%timetable%,title.ilike.%trading%,title.ilike.%arrangement%,file_path.ilike.%timetable%`);
    
    if (error) {
      console.error('Error searching reference documents:', error);
      return [];
    }
    
    if (!referenceDocuments || referenceDocuments.length === 0) {
      return [];
    }
    
    console.log(`Found ${referenceDocuments.length} potentially relevant reference documents`);
    
    // Convert reference documents to RegulatoryEntry format
    const convertedDocs: RegulatoryEntry[] = referenceDocuments.map(doc => ({
      id: `ref-doc-${doc.id}`,
      title: doc.title,
      content: doc.description || `Reference document: ${doc.title}. This document contains specific timetable requirements and trading arrangement guidelines that should be followed when constructing timetables for corporate actions.`,
      source: `Reference Document - ${doc.file_path}`,
      category: 'reference_documents' as any,
      lastUpdated: new Date(doc.created_at),
      status: 'active' as any
    }));
    
    // Prioritize documents with "Timetable" in the name
    convertedDocs.sort((a, b) => {
      const aHasTimetable = a.title.toLowerCase().includes('timetable');
      const bHasTimetable = b.title.toLowerCase().includes('timetable');
      
      if (aHasTimetable && !bHasTimetable) return -1;
      if (!aHasTimetable && bHasTimetable) return 1;
      return 0;
    });
    
    return convertedDocs;
  } catch (error) {
    console.error('Error in searchReferenceDocuments:', error);
    return [];
  }
}

/**
 * Extract corporate action type from query
 * @param query The normalized query
 * @returns Corporate action type or undefined
 */
function extractCorporateActionType(query: string): string | undefined {
  if (query.includes('rights issue')) {
    return 'rights issue';
  }
  if (query.includes('open offer')) {
    return 'open offer';
  }
  if (query.includes('share consolidation') || query.includes('sub-division') || query.includes('subdivision')) {
    return 'share consolidation';
  }
  if (query.includes('board lot') || query.includes('lot size')) {
    return 'board lot change';
  }
  if (query.includes('company name') || query.includes('chinese name')) {
    return 'company name change';
  }
  return undefined;
}
