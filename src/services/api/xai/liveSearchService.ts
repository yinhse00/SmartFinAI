
import { getGrokApiKey } from '@/services/apiKeyService';

export interface LiveSearchQuery {
  query: string;
  max_results?: number;
  search_depth?: 'basic' | 'advanced';
  include_domains?: string[];
  exclude_domains?: string[];
}

export interface LiveSearchResult {
  title: string;
  url: string;
  content: string;
  published_date?: string;
  score?: number;
}

export interface LiveSearchResponse {
  results: LiveSearchResult[];
  query: string;
  total_results: number;
}

/**
 * xAI Live Search API service for real-time web search
 */
export const liveSearchService = {
  /**
   * Perform a live search using xAI's Live Search API
   */
  search: async (query: LiveSearchQuery): Promise<LiveSearchResponse> => {
    const apiKey = getGrokApiKey();
    if (!apiKey) {
      throw new Error('Grok API key not found');
    }

    console.log('Performing live search:', query);

    try {
      const response = await fetch('/api/grok/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          query: query.query,
          max_results: query.max_results || 10,
          search_depth: query.search_depth || 'basic',
          include_domains: query.include_domains,
          exclude_domains: query.exclude_domains
        })
      });

      if (!response.ok) {
        throw new Error(`Live search API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Live search results:', data);

      return {
        results: data.results || [],
        query: query.query,
        total_results: data.total_results || 0
      };
    } catch (error) {
      console.error('Live search error:', error);
      throw error;
    }
  },

  /**
   * Search for regulatory updates and announcements
   */
  searchRegulatory: async (query: string): Promise<LiveSearchResponse> => {
    return liveSearchService.search({
      query: `${query} HKEX SFC Hong Kong regulatory`,
      max_results: 8,
      search_depth: 'advanced',
      include_domains: [
        'hkex.com.hk',
        'sfc.hk',
        'info.gov.hk',
        'legco.gov.hk'
      ]
    });
  },

  /**
   * Search for market conditions and current events
   */
  searchMarketConditions: async (query: string): Promise<LiveSearchResponse> => {
    return liveSearchService.search({
      query: `${query} Hong Kong stock market trading`,
      max_results: 6,
      search_depth: 'basic',
      include_domains: [
        'hkex.com.hk',
        'reuters.com',
        'bloomberg.com',
        'scmp.com'
      ]
    });
  },

  /**
   * Search for company-specific information
   */
  searchCompanyInfo: async (companyName: string, query: string): Promise<LiveSearchResponse> => {
    return liveSearchService.search({
      query: `${companyName} ${query} Hong Kong listed company`,
      max_results: 5,
      search_depth: 'advanced'
    });
  }
};
