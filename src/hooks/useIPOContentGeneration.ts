import { useState } from 'react';
import { ipoContentGenerationService } from '@/services/ipo/ipoContentGenerationService';
import { IPOContentGenerationRequest, IPOContentGenerationResponse, IPOSection } from '@/types/ipo';
import { useToast } from '@/hooks/use-toast';

export const useIPOContentGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
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

  const clearContent = () => {
    setGeneratedContent('');
    setLastGeneratedResponse(null);
  };

  return {
    isGenerating,
    generatedContent,
    lastGeneratedResponse,
    generateContent,
    regenerateContent,
    clearContent,
    setGeneratedContent
  };
};