

import { grokService } from '@/services/grokService';
import { Step4Result } from '../types';
import { safelyExtractText } from '@/services/utils/responseUtils';
import { searchIndexRoutingService } from '@/services/intelligence/searchIndexRoutingService';

/**
 * Enhanced Step 4 Orchestrator with Pure Database-First Execution Guidance
 * - Prioritizes Supabase database execution content with complete precedence
 * - Uses database-exclusive strategy when any database content found
 * - Eliminates hardcoded content interference
 */
export const orchestrateStep4 = async (params: any, setStepProgress: (progress: string) => void): Promise<Step4Result> => {
  setStepProgress('Analyzing execution requirements with pure database priority...');
  
  try {
    let executionContext = '';
    let searchStrategy = 'no_results';
    let databaseResultsCount = 0;
    let searchTime = 0;
    let databaseHasContent = false;
    
    // Phase 1: Leverage existing query analysis
    const queryAnalysis = params.searchMetadata?.queryAnalysis;
    
    // Phase 2: Database-First Search for execution-specific content
    if (queryAnalysis) {
      setStepProgress('Searching execution guidance database with complete priority...');
      
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
        // ANY database results means database-exclusive approach
        databaseHasContent = true;
        setStepProgress('Found authoritative execution guidance in database');
        
        const databaseContext = searchIndexRoutingService.formatSearchResultsToContext(searchResults);
        executionContext = `--- EXECUTION GUIDANCE DATABASE RESULTS (Authoritative Source) ---\n\n${databaseContext}`;
        searchStrategy = 'database_exclusive';
        
        setStepProgress(`Using ${searchResults.totalResults} execution guidance items from database exclusively`);
        console.log('Database-exclusive strategy activated for execution - bypassing all hardcoded content');
      }
    }
    
    // Phase 3: Conditional Grok Enhancement (ONLY if no database content exists)
    if (!databaseHasContent) {
      setStepProgress('No database content found - using supplementary execution context...');
      
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
            businessDayCalculations: true,
            supplementaryOnly: true
          } 
        }
      );
      
      const grokExecutionContext = safelyExtractText(grokResponse);
      
      if (grokExecutionContext && grokExecutionContext.trim() !== '') {
        executionContext = grokExecutionContext;
        searchStrategy = 'grok_supplementary';
      }
    } else {
      // Database content found - maintain database-exclusive approach
      console.log('Database content available - maintaining database-exclusive approach for execution');
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
          executionSpecific: true,
          databaseExclusive: databaseHasContent
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

