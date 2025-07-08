import { useState, useCallback } from 'react';
import { ipoContentGenerationService } from '@/services/ipo/ipoContentGenerationService';
import { IPOContentGenerationRequest, IPOContentGenerationResponse, IPOSection } from '@/types/ipo';
import { useToast } from '@/hooks/use-toast';

export const useIPOContentGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [lastGeneratedResponse, setLastGeneratedResponse] = useState<IPOContentGenerationResponse | null>(null);
  const { toast } = useToast();

  const generateContent = async (request: IPOContentGenerationRequest): Promise<IPOSection | null> => {
    console.log('🎯 useIPOContentGeneration: Starting generation process');
    setIsGenerating(true);
    try {
      console.log('📋 Request being sent to service:', request);
      
      // Generate the content
      console.log('🔄 Calling ipoContentGenerationService.generateSectionContent...');
      const response = await ipoContentGenerationService.generateSectionContent(request);
      
      console.log('✅ Service response received:', {
        contentLength: response.content?.length || 0,
        sourcesCount: response.sources?.length || 0,
        confidence: response.confidence_score
      });
      
      setLastGeneratedResponse(response);
      setGeneratedContent(response.content);
      console.log('📝 State updated with generated content');

      // Save to database
      console.log('💾 Saving content to database...');
      const savedSection = await ipoContentGenerationService.saveSectionContent(
        request.project_id,
        request.section_type,
        response
      );
      console.log('✅ Content saved to database successfully');

      toast({
        title: "Content Generated Successfully",
        description: `Generated ${response.content.split(' ').length} words with ${response.confidence_score.toFixed(1)} confidence score`,
      });

      return savedSection;
    } catch (error) {
      console.error('❌ Content generation error in hook:', error);
      console.error('📋 Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate content. Please try again.",
        variant: "destructive"
      });
      return null;
    } finally {
      console.log('🏁 Generation process completed, setting isGenerating to false');
      setIsGenerating(false);
    }
  };

  const regenerateContent = async (request: IPOContentGenerationRequest): Promise<IPOSection | null> => {
    return generateContent(request);
  };

  const loadExistingContent = useCallback(async (projectId: string, sectionType: string): Promise<boolean> => {
    console.log('🔄 Loading existing content for:', { projectId, sectionType });
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
    generateContent,
    regenerateContent,
    loadExistingContent,
    clearContent,
    setGeneratedContent
  };
};