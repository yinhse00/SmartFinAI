import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  realTimeAnalyzer, 
  AnalysisResult, 
  ContentSuggestion 
} from '@/services/ipo/realTimeAnalyzer';

interface UseRealTimeAnalysisProps {
  content: string;
  sectionType: string;
  isEnabled?: boolean;
  debounceMs?: number;
}

export const useRealTimeAnalysis = ({
  content,
  sectionType,
  isEnabled = true,
  debounceMs = 1000
}: UseRealTimeAnalysisProps) => {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());
  const lastAnalysisRef = useRef<string>('');

  // Manual analysis only - no automatic content analysis
  // Real-time analysis is disabled to reduce API usage
  // Use forceAnalysis() method for manual analysis

  // Get filtered suggestions (excluding dismissed ones)
  const activeSuggestions = analysisResult?.suggestions.filter(
    suggestion => !dismissedSuggestions.has(suggestion.id)
  ) || [];

  // Apply a suggestion to the content
  const applySuggestion = useCallback((
    suggestion: ContentSuggestion,
    onContentUpdate: (newContent: string) => void
  ) => {
    if (!suggestion.replacement || !content) return;

    const beforeText = content.slice(0, suggestion.startIndex);
    const afterText = content.slice(suggestion.endIndex);
    const newContent = beforeText + suggestion.replacement + afterText;
    
    onContentUpdate(newContent);
    
    // Dismiss the applied suggestion
    setDismissedSuggestions(prev => new Set([...prev, suggestion.id]));
  }, [content]);

  // Dismiss a suggestion
  const dismissSuggestion = useCallback((suggestionId: string) => {
    setDismissedSuggestions(prev => new Set([...prev, suggestionId]));
  }, []);

  // Clear dismissed suggestions (useful when content changes significantly)
  const clearDismissedSuggestions = useCallback(() => {
    setDismissedSuggestions(new Set());
  }, []);

  // Get suggestions by type
  const getSuggestionsByType = useCallback((type: ContentSuggestion['type']) => {
    return activeSuggestions.filter(suggestion => suggestion.type === type);
  }, [activeSuggestions]);

  // Get suggestions by severity
  const getSuggestionsBySeverity = useCallback((severity: ContentSuggestion['severity']) => {
    return activeSuggestions.filter(suggestion => suggestion.severity === severity);
  }, [activeSuggestions]);

  // Get critical suggestions (errors and warnings)
  const criticalSuggestions = getSuggestionsBySeverity('error').concat(
    getSuggestionsBySeverity('warning')
  );

  // Force re-analysis
  const forceAnalysis = useCallback(() => {
    if (!content.trim()) return;
    
    setIsAnalyzing(true);
    const result = realTimeAnalyzer.performAnalysis(content, sectionType);
    setAnalysisResult(result);
    setIsAnalyzing(false);
    lastAnalysisRef.current = content;
  }, [content, sectionType]);

  // Clear analysis cache
  const clearCache = useCallback(() => {
    realTimeAnalyzer.clearCache();
  }, []);

  return {
    // Analysis state
    analysisResult,
    isAnalyzing,
    
    // Suggestions
    suggestions: activeSuggestions,
    criticalSuggestions,
    
    // Actions
    applySuggestion,
    dismissSuggestion,
    clearDismissedSuggestions,
    forceAnalysis,
    clearCache,
    
    // Utilities
    getSuggestionsByType,
    getSuggestionsBySeverity,
    
    // Statistics
    totalSuggestions: activeSuggestions.length,
    errorCount: getSuggestionsBySeverity('error').length,
    warningCount: getSuggestionsBySeverity('warning').length,
    suggestionCount: getSuggestionsBySeverity('suggestion').length,
    
    // Compliance score
    complianceScore: analysisResult?.complianceScore,
    
    // Content metrics
    wordCount: analysisResult?.wordCount || 0,
    readabilityScore: analysisResult?.readabilityScore || 0
  };
};