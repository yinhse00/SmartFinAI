
import { grokService } from '@/services/grokService';
import { Step4Result } from '../types';
import { safelyExtractText } from '@/services/utils/responseUtils';
import { searchIndexRoutingService } from '@/services/intelligence/searchIndexRoutingService';

/**
 * Enhanced Step 4 Orchestrator with database-backed execution guidance
 * - Uses intelligent search routing for execution-specific content
 * - Combines process guidance with regulatory timetables and documentation
 * - Maintains business day calculation logic
 */
export const orchestrateStep4 = async (params: any, setStepProgress: (progress: string) => void): Promise<Step4Result> => {
  setStepProgress('Analyzing execution requirements...');
  
  try {
    let executionContext = '';
    let searchStrategy = 'grok_only';
    let databaseResultsCount = 0;
    let searchTime = 0;
    
    // Phase 1: Leverage existing query analysis if available
    const queryAnalysis = params.searchMetadata?.queryAnalysis;
    
    // Phase 2: Search for execution-specific database content
    if (queryAnalysis) {
      setStepProgress('Searching execution guidance and timetables...');
      
      // Target execution-specific tables
      const executionAnalysis = {
        ...queryAnalysis,
        intent: 'process',
        relevantTables: [
          'execution_lr_documentations',
          'listingrules_new_timetable', 
          'execution_procedures',
          'process_checklists'
        ]
      };
      
      const searchResults = await searchIndexRoutingService.executeParallelSearches(
        `Execution process: ${params.query}`,
        executionAnalysis
      );
      
      databaseResultsCount = searchResults.totalResults;
      searchTime = searchResults.executionTime;
      
      if (searchResults.totalResults > 0) {
        const databaseContext = searchIndexRoutingService.formatSearchResultsToContext(searchResults);
        executionContext = databaseContext;
        searchStrategy = 'database_primary';
        
        setStepProgress(`Found ${searchResults.totalResults} execution guidance items`);
      }
    }
    
    // Phase 3: Get Grok's enhanced execution guidance with business day awareness
    setStepProgress('Generating comprehensive execution guidance...');
    
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
    
    // Phase 4: Combine database and Grok execution guidance
    if (executionContext && grokExecutionContext) {
      executionContext = grokExecutionContext + '\n\n--- Detailed Execution Procedures ---\n\n' + executionContext;
      searchStrategy = 'hybrid_grok_database';
    } else if (grokExecutionContext) {
      executionContext = grokExecutionContext;
      searchStrategy = searchStrategy === 'database_primary' ? 'grok_primary' : 'grok_only';
    }
    
    // Phase 5: Enhance with existing regulatory context
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
      setStepProgress('Execution guidance prepared with business day calculations');
      
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
    console.error('Error in enhanced step 4 orchestrator:', error);
    
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
