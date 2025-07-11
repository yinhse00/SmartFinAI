
import { supabase } from '@/integrations/supabase/client';
import { grokApiService } from '../api/grokApiService';

export interface RegulatoryContext {
  provisions: Array<{
    id: string;
    title: string;
    content: string;
    rule_number: string;
    source: string;
  }>;
  faqs: Array<{
    id: string;
    particulars: string;
    category: string;
    reference_nos?: string;
  }>;
  vettingRequirements: Array<{
    id: string;
    description: string;
    matter_transaction_question: string;
    is_vetting_required: boolean;
  }>;
  searchStrategy: string;
  confidence: number;
}

export interface DiscoveryResult {
  context: RegulatoryContext;
  processingTime: number;
  tablesSearched: string[];
  reasoning: string;
}

/**
 * AI-driven regulatory discovery service that uses search_index and regulatory tables
 */
export const aiRegulatoryDiscoveryService = {
  /**
   * Discover relevant regulatory context using AI-driven search strategy
   */
  discoverRegulatoryContext: async (transactionDescription: string): Promise<DiscoveryResult> => {
    const startTime = Date.now();
    console.log('Starting AI-driven regulatory discovery for:', transactionDescription);

    try {
      // Phase 1: AI analyzes transaction and determines search strategy
      const searchStrategy = await aiRegulatoryDiscoveryService.determineSearchStrategy(transactionDescription);
      
      // Phase 2: Execute parallel searches based on AI strategy
      const contextPromises = [
        aiRegulatoryDiscoveryService.searchRegulatoryProvisions(searchStrategy.keywords),
        aiRegulatoryDiscoveryService.searchFAQs(searchStrategy.keywords, searchStrategy.targetParty),
        aiRegulatoryDiscoveryService.searchVettingRequirements(searchStrategy.keywords),
        aiRegulatoryDiscoveryService.searchIndexGuidance(searchStrategy.keywords)
      ];

      const [provisions, faqs, vettingRequirements, indexGuidance] = await Promise.all(contextPromises);

      const context: RegulatoryContext = {
        provisions: provisions || [],
        faqs: faqs || [],
        vettingRequirements: vettingRequirements || [],
        searchStrategy: searchStrategy.reasoning,
        confidence: searchStrategy.confidence
      };

      const processingTime = Date.now() - startTime;
      console.log(`Regulatory discovery completed in ${processingTime}ms`);

      return {
        context,
        processingTime,
        tablesSearched: ['search_index', 'listingrule_listed_faq', 'listingrule_new_faq', 'announcement_pre_vetting_requirements'],
        reasoning: searchStrategy.reasoning
      };

    } catch (error) {
      console.error('Error in regulatory discovery:', error);
      
      return {
        context: {
          provisions: [],
          faqs: [],
          vettingRequirements: [],
          searchStrategy: 'Error in AI discovery, using fallback',
          confidence: 0.3
        },
        processingTime: Date.now() - startTime,
        tablesSearched: [],
        reasoning: 'Discovery failed, using fallback approach'
      };
    }
  },

  /**
   * Use AI to determine optimal search strategy
   */
  determineSearchStrategy: async (transactionDescription: string): Promise<{
    keywords: string[];
    targetParty: 'listed' | 'new_listing' | 'both';
    reasoning: string;
    confidence: number;
    focusAreas: string[];
  }> => {
    try {
      const systemPrompt = `You are a Hong Kong financial regulatory expert. Analyze this transaction description and determine the optimal search strategy for finding relevant regulatory provisions.

Transaction: "${transactionDescription}"

Return a JSON object with:
{
  "keywords": ["key", "regulatory", "terms"],
  "targetParty": "listed" | "new_listing" | "both",
  "reasoning": "Brief explanation of search strategy",
  "confidence": 0.8,
  "focusAreas": ["takeovers", "listing_rules", "disclosure", "etc"]
}

Focus on identifying:
- Key regulatory concepts (takeovers, connected transactions, disclosure, etc.)
- Whether this involves listed companies or new listing applicants
- Specific HKEX/SFC areas that apply
- Transaction type implications

Return ONLY the JSON object.`;

      const response = await grokApiService.callChatCompletions({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analyze: ${transactionDescription}` }
        ],
        model: 'grok-4-0709',
        temperature: 0.1,
        max_tokens: 800,
        metadata: { processingStage: 'regulatory_discovery' }
      });

      const content = response?.choices?.[0]?.message?.content || '';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const strategy = JSON.parse(jsonMatch[0]);
        return {
          keywords: strategy.keywords || [],
          targetParty: strategy.targetParty || 'both',
          reasoning: strategy.reasoning || 'AI strategy determination',
          confidence: strategy.confidence || 0.7,
          focusAreas: strategy.focusAreas || []
        };
      }

      throw new Error('Unable to parse AI strategy response');

    } catch (error) {
      console.error('Error determining search strategy:', error);
      
      // Fallback strategy based on keyword detection
      const description = transactionDescription.toLowerCase();
      const keywords = [];
      
      if (description.includes('takeover') || description.includes('general offer')) {
        keywords.push('takeover', 'general offer', 'mandatory offer');
      }
      if (description.includes('connected') || description.includes('related party')) {
        keywords.push('connected transaction', 'related party');
      }
      if (description.includes('disclosure') || description.includes('announcement')) {
        keywords.push('disclosure', 'announcement');
      }
      if (description.includes('listing') || description.includes('ipo')) {
        keywords.push('listing', 'ipo', 'new listing');
      }

      return {
        keywords: keywords.length > 0 ? keywords : ['transaction', 'regulatory'],
        targetParty: 'both',
        reasoning: 'Fallback keyword-based strategy',
        confidence: 0.5,
        focusAreas: ['general']
      };
    }
  },

  /**
   * Search search_index and source tables for regulatory provisions
   */
  searchRegulatoryProvisions: async (keywords: string[]) => {
    try {
      const searchTerms = keywords.join(' OR ');
      
      // Search search_index for relevant entries
      const { data, error } = await supabase
        .from('search_index')
        .select('*')
        .ilike('particulars', `%${searchTerms}%`)
        .limit(10);

      if (error) {
        console.error('Error searching search_index:', error);
        return [];
      }

      return data?.map(item => ({
        id: item.id,
        title: `Entry from ${item.tableindex || 'Unknown Source'}`,
        content: item.particulars || '',
        rule_number: item.id,
        source: item.tableindex || 'Search Index'
      })) || [];

    } catch (error) {
      console.error('Error in searchRegulatoryProvisions:', error);
      return [];
    }
  },

  /**
   * Search FAQ tables based on target party
   */
  searchFAQs: async (keywords: string[], targetParty: string) => {
    try {
      const searchTerms = keywords.join(' OR ');
      const faqs = [];

      // Search listed company FAQs
      if (targetParty === 'listed' || targetParty === 'both') {
        const { data: listedFaqs } = await supabase
          .from('listingrule_listed_faq')
          .select('id, particulars, category, reference_nos')
          .ilike('particulars', `%${searchTerms}%`)
          .limit(5);

        if (listedFaqs) {
          faqs.push(...listedFaqs.map(faq => ({
            id: faq.id,
            particulars: faq.particulars,
            category: `Listed - ${faq.category}`,
            reference_nos: faq.reference_nos
          })));
        }
      }

      // Search new listing FAQs
      if (targetParty === 'new_listing' || targetParty === 'both') {
        const { data: newFaqs } = await supabase
          .from('listingrule_new_faq')
          .select('id, faqtopic, topic, question_no')
          .or(`faqtopic.ilike.%${searchTerms}%,topic.ilike.%${searchTerms}%`)
          .limit(5);

        if (newFaqs) {
          faqs.push(...newFaqs.map(faq => ({
            id: faq.id,
            particulars: faq.faqtopic || faq.topic || '',
            category: `New Listing - ${faq.topic || 'General'}`,
            reference_nos: faq.question_no
          })));
        }
      }

      return faqs;

    } catch (error) {
      console.error('Error searching FAQs:', error);
      return [];
    }
  },

  /**
   * Search vetting requirements
   */
  searchVettingRequirements: async (keywords: string[]) => {
    try {
      const searchTerms = keywords.join(' OR ');
      
      const { data, error } = await supabase
        .from('announcement_pre_vetting_requirements')
        .select('id, description, matter_transaction_question, is_vetting_required')
        .or(`description.ilike.%${searchTerms}%,matter_transaction_question.ilike.%${searchTerms}%`)
        .limit(5);

      if (error) {
        console.error('Error searching vetting requirements:', error);
        return [];
      }

      return data?.map(item => ({
        id: item.id,
        description: item.description || '',
        matter_transaction_question: item.matter_transaction_question,
        is_vetting_required: item.is_vetting_required
      })) || [];

    } catch (error) {
      console.error('Error in searchVettingRequirements:', error);
      return [];
    }
  },

  /**
   * Search general index for additional guidance
   */
  searchIndexGuidance: async (keywords: string[]) => {
    try {
      const searchTerms = keywords.join(' OR ');
      
      const { data, error } = await supabase
        .from('search_index')
        .select('id, particulars, category, party, tableindex')
        .ilike('particulars', `%${searchTerms}%`)
        .limit(8);

      if (error) {
        console.error('Error searching index:', error);
        return [];
      }

      return data || [];

    } catch (error) {
      console.error('Error in searchIndexGuidance:', error);
      return [];
    }
  },

  /**
   * Format regulatory context for AI prompt inclusion
   */
  formatContextForPrompt: (context: RegulatoryContext): string => {
    let formattedContext = '';

    if (context.provisions.length > 0) {
      formattedContext += '\n=== RELEVANT REGULATORY PROVISIONS ===\n';
      context.provisions.forEach(provision => {
        formattedContext += `\n[${provision.rule_number}] ${provision.title}\n`;
        formattedContext += `${provision.content.substring(0, 500)}...\n`;
      });
    }

    if (context.faqs.length > 0) {
      formattedContext += '\n=== RELEVANT FAQs ===\n';
      context.faqs.forEach(faq => {
        formattedContext += `\n[${faq.category}] ${faq.particulars.substring(0, 300)}...\n`;
      });
    }

    if (context.vettingRequirements.length > 0) {
      formattedContext += '\n=== VETTING REQUIREMENTS ===\n';
      context.vettingRequirements.forEach(req => {
        formattedContext += `\n${req.matter_transaction_question}\n`;
        formattedContext += `Vetting Required: ${req.is_vetting_required ? 'Yes' : 'No'}\n`;
      });
    }

    return formattedContext;
  }
};
