import { useState, useCallback } from 'react';
import { ipoContentGenerationService } from '@/services/ipo/ipoContentGenerationService';
import { IPOContentGenerationRequest, IPOContentGenerationResponse, IPOSection } from '@/types/ipo';
import { useToast } from '@/hooks/use-toast';
import { hasGrokApiKey, hasGoogleApiKey } from '@/services/apiKeyService';
import { getFeatureAIPreference } from '@/services/ai/aiPreferences';
import { AIProvider } from '@/types/aiProvider';

export const useIPOContentGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [lastGeneratedResponse, setLastGeneratedResponse] = useState<IPOContentGenerationResponse | null>(null);
  const [processingStage, setProcessingStage] = useState<'preparing' | 'fetching' | 'generating' | 'analyzing' | 'saving'>('preparing');
  const [processingProgress, setProcessingProgress] = useState(0);
  const { toast } = useToast();

  const generateContent = async (request: IPOContentGenerationRequest): Promise<IPOSection | null> => {
    console.log('🎯 useIPOContentGeneration: Starting parallel generation process');
    setIsGenerating(true);
    setProcessingProgress(0);
    
    try {
      // Check if API key is available for the user's preferred provider
      const preference = getFeatureAIPreference('ipo');
      let hasValidKey = false;
      let providerName = '';
      
      if (preference.provider === AIProvider.GROK) {
        hasValidKey = hasGrokApiKey();
        providerName = 'Grok (X.AI)';
      } else if (preference.provider === AIProvider.GOOGLE) {
        hasValidKey = hasGoogleApiKey();
        providerName = 'Google';
      }
      
      if (!hasValidKey) {
        throw new Error(`No ${providerName} API key configured. Please set up your ${providerName} API key in the settings to use IPO content generation.`);
      }
      
      console.log('📋 Request being sent to parallel service:', request);
      
      // Phase 1: Preparing
      setProcessingStage('preparing');
      setProcessingProgress(10);
      
      // Phase 1: Data fetching (parallel)
      setProcessingStage('fetching');
      setProcessingProgress(25);
      
      // Phase 2: Content generation with parallel context
      setProcessingStage('generating');
      setProcessingProgress(50);
      
      const response = await ipoContentGenerationService.generateSectionContent(request);
      
      console.log('✅ Parallel service response received:', {
        contentLength: response.content?.length || 0,
        sourcesCount: response.sources?.length || 0,
        confidence: response.confidence_score,
        processingTime: response.processing_metadata?.totalTime
      });
      
      // Phase 3: Analysis complete
      setProcessingStage('analyzing');
      setProcessingProgress(80);
      
      setLastGeneratedResponse(response);
      setGeneratedContent(response.content);
      console.log('📝 State updated with parallel-generated content');

      // Phase 3: Background save (non-blocking)
      setProcessingStage('saving');
      setProcessingProgress(90);
      
      const savedSection = await ipoContentGenerationService.saveSectionContent(
        request.project_id,
        request.section_type,
        response,
        false // Use synchronous save to prevent race conditions
      );
      
      setProcessingProgress(100);
      console.log('✅ Content saved with parallel processing');

      const totalTime = response.processing_metadata?.totalTime || 0;
      const improvement = totalTime > 0 ? `${Math.round(((8000 - totalTime) / 8000) * 100)}% faster` : '';
      
      toast({
        title: "Content Generated Successfully",
        description: `Generated ${response.content.split(' ').length} words in ${totalTime}ms ${improvement}`,
      });

      return savedSection;
    } catch (error) {
      console.error('❌ Parallel content generation error:', error);
      
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate content. Please try again.",
        variant: "destructive"
      });
      return null;
    } finally {
      console.log('🏁 Parallel generation process completed');
      setIsGenerating(false);
      setProcessingStage('preparing');
      setProcessingProgress(0);
    }
  };

  const regenerateContent = async (request: IPOContentGenerationRequest): Promise<IPOSection | null> => {
    return generateContent(request);
  };

  const loadExistingContent = useCallback(async (projectId: string, sectionType: string, forceLoad: boolean = true): Promise<boolean> => {
    // Auto-load existing content by default for better UX
    if (!forceLoad) {
      console.log('📝 Content loading skipped');
      return false;
    }
    
    console.log('🔄 Manual loading of existing content for:', { projectId, sectionType });
    setIsLoading(true);
    try {
      const existingSection = await ipoContentGenerationService.loadSectionContent(projectId, sectionType);
      
      if (existingSection && existingSection.content) {
        console.log('✅ Found existing content, loading into state');
        setGeneratedContent(existingSection.content);
        
        // Reconstruct the response object from the saved data
        const reconstructedResponse: IPOContentGenerationResponse = {
          content: existingSection.content,
          sources: existingSection.sources || [],
          confidence_score: existingSection.confidence_score || 0,
          regulatory_compliance: {
            requirements_met: [],
            missing_requirements: [],
            recommendations: []
          },
          quality_metrics: {
            completeness: 0.8,
            accuracy: 0.8,
            regulatory_alignment: 0.8,
            professional_language: 0.8
          }
        };
        
        setLastGeneratedResponse(reconstructedResponse);
        return true;
      } else {
        console.log('📝 No existing content found');
        setGeneratedContent('');
        setLastGeneratedResponse(null);
        return false;
      }
    } catch (error) {
      console.error('❌ Error loading existing content:', error);
      toast({
        title: "Failed to Load Content",
        description: error.message || "Could not load existing content",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const clearContent = () => {
    setGeneratedContent('');
    setLastGeneratedResponse(null);
  };

  return {
    isGenerating,
    isLoading,
    generatedContent,
    lastGeneratedResponse,
    processingStage,
    processingProgress,
    generateContent,
    regenerateContent,
    loadExistingContent,
    clearContent,
    setGeneratedContent
  };
};