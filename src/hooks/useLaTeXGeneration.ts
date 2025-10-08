import { useState, useCallback } from 'react';
import { latexContentService } from '@/services/ipo/latexContentService';
import { LaTeXGenerationRequest, LaTeXGenerationResponse } from '@/types/latex';
import { useToast } from '@/hooks/use-toast';
import { hasGrokApiKey } from '@/services/apiKeyService';

export const useLaTeXGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [latexContent, setLatexContent] = useState<string>('');
  const [lastResponse, setLastResponse] = useState<LaTeXGenerationResponse | null>(null);
  const { toast } = useToast();

  const generateLaTeX = async (request: LaTeXGenerationRequest): Promise<LaTeXGenerationResponse | null> => {
    console.log('🎯 useLaTeXGeneration: Starting LaTeX generation');
    setIsGenerating(true);
    
    try {
      // Check API key
      if (!hasGrokApiKey()) {
        throw new Error('No API key configured. Please set up your X.AI API key.');
      }
      
      console.log('🔄 Calling latexContentService.generateLaTeXSection...');
      const response = await latexContentService.generateLaTeXSection(request);
      
      console.log('✅ LaTeX generation successful:', {
        contentLength: response.latexContent?.length || 0,
        compilationReady: response.compilationReady,
        artifactId: response.artifactId
      });
      
      setLatexContent(response.latexContent);
      setLastResponse(response);

      toast({
        title: "LaTeX Generated Successfully",
        description: `Generated ${response.latexContent.split(' ').length} words. Compilation ${response.compilationReady ? 'ready' : 'needs review'}.`,
      });

      return response;
      
    } catch (error) {
      console.error('❌ LaTeX generation error:', error);
      toast({
        title: "LaTeX Generation Failed",
        description: error.message || "Failed to generate LaTeX content. Please try again.",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const applyTargetedEdits = async (
    projectId: string,
    sectionType: string,
    instructions: string
  ): Promise<LaTeXGenerationResponse | null> => {
    console.log('🎯 Applying targeted LaTeX edits:', instructions);
    setIsGenerating(true);
    
    try {
      const response = await latexContentService.applyTargetedEdits(
        projectId,
        sectionType,
        instructions
      );
      
      console.log('✅ Targeted edits applied successfully');
      setLatexContent(response.latexContent);
      setLastResponse(response);

      toast({
        title: "Edits Applied Successfully",
        description: "Your LaTeX document has been updated according to your instructions.",
      });

      return response;
      
    } catch (error) {
      console.error('❌ Error applying targeted edits:', error);
      toast({
        title: "Edit Failed",
        description: error.message || "Failed to apply edits. Please try again.",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const loadExistingLaTeX = useCallback(async (
    projectId: string, 
    sectionType: string
  ): Promise<boolean> => {
    console.log('🔄 Loading existing LaTeX content');
    setIsLoading(true);
    
    try {
      const existingSection = await latexContentService.loadLaTeXSection(projectId, sectionType);
      
      if (existingSection && existingSection.content) {
        console.log('✅ Found existing LaTeX content');
        setLatexContent(existingSection.content);
        
        // Reconstruct response object
        const reconstructedResponse: LaTeXGenerationResponse = {
          content: existingSection.content,
          latexContent: existingSection.content,
          sources: existingSection.sources || [],
          confidence_score: existingSection.confidence_score || 0.85,
          compilationReady: true, // Assume existing content is valid
          artifactId: `${projectId}_${sectionType}_existing`,
          regulatory_compliance: {
            requirements_met: ['Existing content loaded'],
            missing_requirements: [],
            recommendations: []
          },
          quality_metrics: {
            completeness: 0.85,
            accuracy: 0.85,
            regulatory_alignment: 0.85,
            professional_language: 0.85
          }
        };
        
        setLastResponse(reconstructedResponse);
        return true;
      } else {
        console.log('📝 No existing LaTeX content found');
        setLatexContent('');
        setLastResponse(null);
        return false;
      }
    } catch (error) {
      console.error('❌ Error loading existing LaTeX content:', error);
      toast({
        title: "Failed to Load Content",
        description: error.message || "Could not load existing LaTeX content",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const saveLaTeX = async (
    projectId: string,
    sectionType: string,
    content: string
  ): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const response: LaTeXGenerationResponse = {
        content,
        latexContent: content,
        sources: [],
        confidence_score: 0.85,
        compilationReady: true,
        artifactId: `${projectId}_${sectionType}_${Date.now()}`,
        regulatory_compliance: {
          requirements_met: ['Manual save'],
          missing_requirements: [],
          recommendations: []
        },
        quality_metrics: {
          completeness: 0.85,
          accuracy: 0.85,
          regulatory_alignment: 0.85,
          professional_language: 0.85
        }
      };
      
      await latexContentService.saveLaTeXSection(projectId, sectionType, response);
      
      toast({
        title: "LaTeX Saved",
        description: "Your LaTeX content has been saved successfully."
      });
      
      return true;
    } catch (error) {
      console.error('❌ Error saving LaTeX:', error);
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save LaTeX content",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const clearContent = () => {
    setLatexContent('');
    setLastResponse(null);
  };

  return {
    // State
    isGenerating,
    isLoading,
    latexContent,
    lastResponse,
    
    // Actions
    generateLaTeX,
    applyTargetedEdits,
    loadExistingLaTeX,
    saveLaTeX,
    clearContent,
    setLatexContent
  };
};