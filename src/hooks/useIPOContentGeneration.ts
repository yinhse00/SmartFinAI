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
    setIsGenerating(true);
    try {
      // Generate the content
      const response = await ipoContentGenerationService.generateSectionContent(request);
      setLastGeneratedResponse(response);
      setGeneratedContent(response.content);

      // Save to database
      const savedSection = await ipoContentGenerationService.saveSectionContent(
        request.project_id,
        request.section_type,
        response
      );

      toast({
        title: "Content Generated Successfully",
        description: `Generated ${response.content.split(' ').length} words with ${response.confidence_score.toFixed(1)} confidence score`,
      });

      return savedSection;
    } catch (error) {
      console.error('Content generation error:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate content. Please try again.",
        variant: "destructive"
      });
      return null;
    } finally {
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