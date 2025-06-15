
import { grokService } from '@/services/grokService';
import { Step4Result } from '../types';
import { safelyExtractText } from '@/services/utils/responseUtils';
import { searchIndexRoutingService } from '@/services/intelligence/searchIndexRoutingService';

/**
 * Enhanced Step 4 Orchestrator with Database-First Execution Guidance
 * - Prioritizes Supabase database execution content over Grok's general knowledge
 * - Uses database-exclusive strategy for authoritative execution procedures
 * - Combines process guidance with regulatory timetables and documentation
 */
export const orchestrateStep4 = async (params: any, setStepProgress: (progress: string) => void): Promise<Step4Result> => {
  setStepProgress('Analyzing execution requirements with database priority...');
  
  try {
    let executionContext = '';
    let searchStrategy = 'grok_only';
    let databaseResultsCount = 0;
    let searchTime = 0;
    let databaseHasHighConfidence = false;
    
    // Phase 1: Leverage existing query analysis
    const queryAnalysis = params.searchMetadata?.queryAnalysis;
    
    // Phase 2: Database-First Search for execution-specific content
    if (queryAnalysis) {
      setStepProgress('Searching execution guidance and timetables in database...');
      
      // Target execution-specific tables
      const executionAnalysis = {
        ...queryAnalysis,
        intent: 'process',
        relevantTables: [
          'execution_lr_documentations',
          'listingrules_new_timetable', 
          'execution_procedures',
          'process_checklists',
          'announcement_pre_vetting_requirements'
        ]
      };
      
      const searchResults = await searchIndexRoutingService.executeParallelSearches(
        `Execution process: ${params.query}`,
        executionAnalysis
      );
      
      databaseResultsCount = searchResults.totalResults;
      searchTime = searchResults.executionTime;
      
      if (searchResults.totalResults > 0) {
        // Check for high-confidence execution matches
        const hasSpecificMatches = searchResults.searchResults.some(result => 
          result.relevanceScore > 0.6 || 
          result.results.some(item => 
            item.title?.toLowerCase().includes('execution') ||
            item.title?.toLowerCase().includes('timetable') ||
            item.title?.toLowerCase().includes('process') ||
            item.particulars?.toLowerCase().includes('procedure') ||
            item.particulars?.toLowerCase().includes('timeline') ||
            item.particulars?.toLowerCase().includes(params.query.toLowerCase().slice(0, 15))
          )
        );
        
        if (hasSpecificMatches) {
          databaseHasHighConfidence = true;
          setStepProgress('Found authoritative execution guidance in database');
        }
        
        const databaseContext = searchIndexRoutingService.formatSearchResultsToContext(searchResults);
        executionContext = `--- EXECUTION GUIDANCE DATABASE RESULTS (Authoritative Source) ---\n\n${databaseContext}`;
        searchStrategy = databaseHasHighConfidence ? 'database_exclusive' : 'database_primary';
        
        setStepProgress(`Found ${searchResults.totalResults} execution guidance items from database`);
      }
    }
    
    // Phase 3: Conditional Grok Enhancement (only if not database-exclusive)
    if (!databaseHasHighConfidence) {
      setStepProgress('Enhancing with additional execution expertise...');
      
      const systemPrompt = `You are a Hong Kong financial regulatory expert specializing in execution processes, timetables, and business day calculations.

Focus on providing:
1. Step-by-step execution procedures
2. Accurate timetables with business day calculations
3. Required documentation and forms
4. Key deadlines and milestones
5. Regulatory approval processes
6. Practical implementation guidance

Consider Hong Kong business days (exclude weekends and public holidays) for all timeline calculations.`;
      
      const grokResponse = await grokService.getRegulatoryContext(
        `${systemPrompt}\n\nExecution guidance for: ${params.query}`,
        { 
          metadata: { 
            specializedQuery: 'execution',
            enhancedProcessing: true,
            businessDayCalculations: true
          } 
        }
      );
      
      const grokExecutionContext = safelyExtractText(grokResponse);
      
      if (grokExecutionContext && grokExecutionContext.trim() !== '') {
        if (executionContext) {
          // Database results first, then complementary Grok content
          executionContext += '\n\n--- ADDITIONAL EXECUTION CONTEXT ---\n\n' + grokExecutionContext;
          searchStrategy = 'database_primary';
        } else {
          executionContext = grokExecutionContext;
          searchStrategy = 'grok_primary';
        }
      }
    } else {
      // Database-exclusive strategy - skip Grok to prevent conflicts
      console.log('Using database-exclusive strategy for execution - preventing potential conflicts');
    }
    
    // Phase 4: Enhance with existing regulatory context (database context first)
    let finalContext = executionContext;
    if (params.regulatoryContext || params.listingRulesContext || params.takeoversCodeContext) {
      const existingContext = params.regulatoryContext || 
                             params.listingRulesContext || 
                             params.takeoversCodeContext || '';
      
      if (existingContext) {
        finalContext = existingContext + '\n\n--- EXECUTION GUIDANCE ---\n\n' + executionContext;
      }
    }
    
    const hasExecutionGuidance = executionContext && executionContext.trim() !== '';
    
    if (hasExecutionGuidance) {
      setStepProgress('Database-first execution guidance prepared with business day calculations');
      
      return {
        shouldContinue: true,
        nextStep: 'response',
        query: params.query,
        executionGuidance: executionContext,
        regulatoryContext: finalContext,
        executionRequired: true,
        hasEnhancedGuidance: true,
        skipSequentialSearches: Boolean(params.skipSequentialSearches),
        isRegulatoryRelated: true,
        searchMetadata: {
          searchStrategy,
          queryAnalysis,
          databaseResultsCount,
          searchTime,
          executionSpecific: true
        }
      };
    } else {
      setStepProgress('Basic execution guidance available');
      
      // Fallback to existing context with execution flag
      return {
        shouldContinue: true,
        nextStep: 'response',
        query: params.query,
        regulatoryContext: params.regulatoryContext || params.listingRulesContext || params.takeoversCodeContext || '',
        executionRequired: true,
        hasEnhancedGuidance: false,
        skipSequentialSearches: Boolean(params.skipSequentialSearches),
        isRegulatoryRelated: true,
        searchMetadata: {
          searchStrategy: 'basic_execution',
          queryAnalysis,
          databaseResultsCount: 0,
          searchTime
        }
      };
    }
    
  } catch (error) {
    console.error('Error in database-first step 4 orchestrator:', error);
    
    // Fallback to basic execution response
    return {
      shouldContinue: true,
      nextStep: 'response',
      query: params.query,
      regulatoryContext: params.regulatoryContext || '',
      executionRequired: true,
      error,
      skipSequentialSearches: Boolean(params.skipSequentialSearches),
      isRegulatoryRelated: true,
      searchMetadata: {
        searchStrategy: 'error_fallback',
        searchTime: 0
      }
    };
  }
};
