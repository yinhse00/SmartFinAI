import { useState, useEffect, useCallback } from 'react';
import { 
  Presentation, 
  PresentationSlide, 
  SlideType, 
  PresentationType 
} from '@/types/presentation';
import { documentService } from '@/services/documents/documentService';
import { toast } from 'sonner';

interface UsePresentationProps {
  projectId?: string;
  presentationType: PresentationType;
}

export const usePresentation = ({ projectId, presentationType }: UsePresentationProps) => {
  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Initialize or load presentation
  useEffect(() => {
    const initializePresentation = async () => {
      setIsLoading(true);
      try {
        // Try to load existing presentation
        const existingPresentation = await loadPresentation(projectId);
        
        if (existingPresentation) {
          setPresentation(existingPresentation);
        } else {
          // Create new presentation
          const newPresentation = createNewPresentation(presentationType, projectId);
          setPresentation(newPresentation);
        }
      } catch (error) {
        console.error('Failed to initialize presentation:', error);
        // Create default presentation as fallback
        const defaultPresentation = createNewPresentation(presentationType, projectId);
        setPresentation(defaultPresentation);
      } finally {
        setIsLoading(false);
      }
    };

    initializePresentation();
  }, [projectId, presentationType]);

  const loadPresentation = async (projectId?: string): Promise<Presentation | null> => {
    // In a real implementation, this would load from your backend
    // For now, we'll check localStorage
    if (projectId) {
      const stored = localStorage.getItem(`presentation-${projectId}`);
      if (stored) {
        return JSON.parse(stored);
      }
    }
    return null;
  };

  const createNewPresentation = (type: PresentationType, projectId?: string): Presentation => {
    const now = new Date().toISOString();
    
    // Create initial slides based on presentation type
    const initialSlides = createInitialSlides(type);
    
    return {
      id: `presentation-${Date.now()}`,
      title: getPresentationTitle(type),
      type,
      slides: initialSlides,
      metadata: {
        projectId,
        createdAt: now,
        updatedAt: now,
        version: 1
      },
      settings: {
        theme: {
          primaryColor: '#3b82f6',
          secondaryColor: '#1e293b',
          backgroundColor: '#ffffff',
          textColor: '#1f2937',
          accentColor: '#10b981',
          fontFamily: 'Arial'
        },
        template: 'professional',
        exportSettings: {
          format: 'pptx',
          quality: 'high',
          includeNotes: true
        }
      }
    };
  };

  const createInitialSlides = (type: PresentationType): PresentationSlide[] => {
    const now = new Date().toISOString();
    
    const commonSlides: Partial<PresentationSlide>[] = [
      {
        type: 'title' as SlideType,
        title: 'Title Slide',
        content: {
          title: getPresentationTitle(type),
          bulletPoints: []
        }
      }
    ];

    if (type === 'ipo_roadshow') {
      return [
        ...commonSlides,
        {
          type: 'agenda' as SlideType,
          title: 'Agenda',
          content: {
            title: 'Agenda',
            bulletPoints: [
              'Investment Highlights',
              'Business Overview',
              'Financial Performance',
              'Market Opportunity',
              'Use of Proceeds',
              'Risk Factors'
            ]
          }
        },
        {
          type: 'executive_summary' as SlideType,
          title: 'Investment Highlights',
          content: {
            title: 'Investment Highlights',
            bulletPoints: [
              'Market-leading position in growing industry',
              'Strong financial performance and growth trajectory',
              'Experienced management team with proven track record',
              'Clear strategy for value creation'
            ]
          }
        }
      ].map((slide, index) => ({
        id: `slide-${index + 1}`,
        type: slide.type!,
        title: slide.title!,
        content: slide.content!,
        order: index,
        metadata: {
          createdAt: now,
          updatedAt: now,
          isGenerated: false
        }
      }));
    }

    if (type === 'investment_banking_pitch') {
      return [
        ...commonSlides,
        {
          type: 'executive_summary' as SlideType,
          title: 'Executive Summary',
          content: {
            title: 'Executive Summary',
            bulletPoints: [
              'Strategic rationale for transaction',
              'Compelling valuation opportunity',
              'Strong market fundamentals',
              'Experienced advisory team'
            ]
          }
        },
        {
          type: 'credentials' as SlideType,
          title: 'Our Credentials',
          content: {
            title: 'Our Credentials',
            bulletPoints: [
              'Leading advisor in sector with 50+ transactions',
              'Deep industry expertise and relationships',
              'Proven track record of successful outcomes',
              'Comprehensive global platform'
            ]
          }
        }
      ].map((slide, index) => ({
        id: `slide-${index + 1}`,
        type: slide.type!,
        title: slide.title!,
        content: slide.content!,
        order: index,
        metadata: {
          createdAt: now,
          updatedAt: now,
          isGenerated: false
        }
      }));
    }

    // Default slides for other types
    return commonSlides.map((slide, index) => ({
      id: `slide-${index + 1}`,
      type: slide.type!,
      title: slide.title!,
      content: slide.content!,
      order: index,
      metadata: {
        createdAt: now,
        updatedAt: now,
        isGenerated: false
      }
    }));
  };

  const getPresentationTitle = (type: PresentationType): string => {
    const titles = {
      ipo_roadshow: 'IPO Roadshow Presentation',
      investment_banking_pitch: 'Investment Banking Pitch Book',
      deal_structuring: 'Deal Structuring Presentation',
      custom: 'Custom Presentation'
    };
    return titles[type];
  };

  const addSlide = useCallback(async (type: SlideType, afterIndex?: number): Promise<PresentationSlide | null> => {
    if (!presentation) return null;

    const now = new Date().toISOString();
    const insertIndex = afterIndex !== undefined ? afterIndex + 1 : presentation.slides.length;

    const newSlide: PresentationSlide = {
      id: `slide-${Date.now()}`,
      type,
      title: getDefaultSlideTitle(type),
      content: getDefaultSlideContent(type),
      order: insertIndex,
      metadata: {
        createdAt: now,
        updatedAt: now,
        isGenerated: false
      }
    };

    setPresentation(prev => {
      if (!prev) return null;
      
      const newSlides = [...prev.slides];
      newSlides.splice(insertIndex, 0, newSlide);
      
      // Update order for subsequent slides
      newSlides.forEach((slide, index) => {
        slide.order = index;
      });

      return {
        ...prev,
        slides: newSlides,
        metadata: {
          ...prev.metadata,
          updatedAt: now
        }
      };
    });

    return newSlide;
  }, [presentation]);

  const updateSlide = useCallback(async (slideId: string, updates: Partial<PresentationSlide>) => {
    if (!presentation) return;

    const now = new Date().toISOString();

    setPresentation(prev => {
      if (!prev) return null;

      return {
        ...prev,
        slides: prev.slides.map(slide => 
          slide.id === slideId 
            ? { 
                ...slide, 
                ...updates,
                metadata: {
                  ...slide.metadata,
                  updatedAt: now
                }
              }
            : slide
        ),
        metadata: {
          ...prev.metadata,
          updatedAt: now
        }
      };
    });
  }, [presentation]);

  const deleteSlide = useCallback(async (slideId: string) => {
    if (!presentation) return;

    setPresentation(prev => {
      if (!prev) return null;

      const newSlides = prev.slides
        .filter(slide => slide.id !== slideId)
        .map((slide, index) => ({ ...slide, order: index }));

      return {
        ...prev,
        slides: newSlides,
        metadata: {
          ...prev.metadata,
          updatedAt: new Date().toISOString()
        }
      };
    });
  }, [presentation]);

  const reorderSlides = useCallback(async (fromIndex: number, toIndex: number) => {
    if (!presentation) return;

    setPresentation(prev => {
      if (!prev) return null;

      const newSlides = [...prev.slides];
      const [movedSlide] = newSlides.splice(fromIndex, 1);
      newSlides.splice(toIndex, 0, movedSlide);

      // Update order for all slides
      newSlides.forEach((slide, index) => {
        slide.order = index;
      });

      return {
        ...prev,
        slides: newSlides,
        metadata: {
          ...prev.metadata,
          updatedAt: new Date().toISOString()
        }
      };
    });
  }, [presentation]);

  const savePresentation = useCallback(async () => {
    if (!presentation) return;

    setIsSaving(true);
    try {
      // In a real implementation, this would save to your backend
      // For now, save to localStorage
      localStorage.setItem(`presentation-${presentation.id}`, JSON.stringify(presentation));
      
      if (projectId) {
        localStorage.setItem(`presentation-${projectId}`, JSON.stringify(presentation));
      }

      toast.success('Presentation saved successfully');
    } catch (error) {
      console.error('Failed to save presentation:', error);
      toast.error('Failed to save presentation');
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [presentation, projectId]);

  const exportPresentation = useCallback(async (format: 'pptx' | 'pdf') => {
    if (!presentation) return;

    setIsExporting(true);
    try {
      // Convert presentation to content string for export
      const content = convertPresentationToContent(presentation);
      
      if (format === 'pptx') {
        const blob = await documentService.generatePowerPointDocument(content, presentation.title);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${presentation.title}.pptx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // For PDF, we'll use the PDF generation service
        const blob = await documentService.generatePdfDocument(content);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${presentation.title}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      toast.success(`Presentation exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Failed to export presentation:', error);
      toast.error('Failed to export presentation');
      throw error;
    } finally {
      setIsExporting(false);
    }
  }, [presentation]);

  const convertPresentationToContent = (presentation: Presentation): string => {
    return presentation.slides
      .map(slide => {
        let content = `# ${slide.content.title || slide.title}\n\n`;
        
        if (slide.content.bulletPoints) {
          content += slide.content.bulletPoints
            .map(point => `• ${point}`)
            .join('\n');
        }
        
        if (slide.content.notes) {
          content += `\n\nNotes: ${slide.content.notes}`;
        }
        
        return content;
      })
      .join('\n\n---\n\n');
  };

  const getDefaultSlideTitle = (type: SlideType): string => {
    const titles = {
      title: 'Title Slide',
      agenda: 'Agenda',
      executive_summary: 'Executive Summary',
      business_overview: 'Business Overview',
      financial_highlights: 'Financial Highlights',
      market_opportunity: 'Market Opportunity',
      competitive_advantages: 'Competitive Advantages',
      use_of_proceeds: 'Use of Proceeds',
      management_team: 'Management Team',
      risk_factors: 'Risk Factors',
      credentials: 'Our Credentials',
      contact: 'Contact Information',
      appendix: 'Appendix',
      custom: 'New Slide'
    };
    return titles[type];
  };

  const getDefaultSlideContent = (type: SlideType) => {
    const defaultContent = {
      title: getDefaultSlideTitle(type),
      bulletPoints: [''],
      notes: ''
    };

    // Add type-specific default content
    if (type === 'agenda') {
      defaultContent.bulletPoints = [
        'Executive Summary',
        'Business Overview',
        'Financial Performance',
        'Market Opportunity',
        'Next Steps'
      ];
    }

    return defaultContent;
  };

  return {
    presentation,
    isLoading,
    isSaving,
    isExporting,
    addSlide,
    updateSlide,
    deleteSlide,
    reorderSlides,
    savePresentation,
    exportPresentation
  };
};