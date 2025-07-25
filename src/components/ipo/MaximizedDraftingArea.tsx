import React, { useState, useEffect } from 'react';
import { useIPOContentGeneration } from '@/hooks/useIPOContentGeneration';
import { IPOContentGenerationRequest, IPOContentGenerationResponse } from '@/types/ipo';
import { DraftingHeader } from './drafting/DraftingHeader';
import { DraftContentArea } from './drafting/DraftContentArea';
import { useToast } from '@/hooks/use-toast';
import { documentService } from '@/services/documents/documentService';
import { ipoContentGenerationService } from '@/services/ipo/ipoContentGenerationService';

interface MaximizedDraftingAreaProps {
  projectId: string;
  selectedSection: string;
  onSelectSection: (section: string) => void;
  onToggleChat: () => void;
  isChatOpen: boolean;
  onPassContentToChat: (content: string, onUpdate: (newContent: string) => void) => void;
}

export const MaximizedDraftingArea: React.FC<MaximizedDraftingAreaProps> = ({
  projectId,
  selectedSection,
  onSelectSection,
  onToggleChat,
  isChatOpen,
  onPassContentToChat
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedSection, setLastSavedSection] = useState<string>('');
  const { toast } = useToast();

  const {
    isGenerating,
    isLoading,
    generatedContent,
    lastGeneratedResponse,
    generateContent,
    regenerateContent,
    loadExistingContent,
    setGeneratedContent,
    clearContent
  } = useIPOContentGeneration();

  // Auto-save and load content when section changes
  useEffect(() => {
    const handleSectionChange = async () => {
      if (!projectId) return;

      // Auto-save current content before switching sections
      if (lastSavedSection && lastSavedSection !== selectedSection && generatedContent.trim()) {
        console.log('🔄 Auto-saving content before section switch');
        await saveCurrentContent(lastSavedSection);
      }

      // Clear content state when switching sections
      if (selectedSection && selectedSection !== lastSavedSection) {
        console.log('🔄 Switching to section:', selectedSection);
        clearContent();
        
        // Load existing content for new section
        await loadExistingContent(projectId, selectedSection, true);
        setLastSavedSection(selectedSection);
      }
    };

    handleSectionChange();
  }, [projectId, selectedSection, generatedContent, lastSavedSection, loadExistingContent, clearContent]);

  // Pass current content to chat when it opens or content changes
  useEffect(() => {
    if (isChatOpen && generatedContent) {
      onPassContentToChat(generatedContent, setGeneratedContent);
    }
  }, [isChatOpen, generatedContent, onPassContentToChat, setGeneratedContent]);

  const saveCurrentContent = async (sectionType: string = selectedSection) => {
    if (!generatedContent.trim() || !projectId || !sectionType) return;

    setIsSaving(true);
    try {
      console.log('💾 Saving content for section:', sectionType);
      
      const response: IPOContentGenerationResponse = {
        content: generatedContent,
        sources: lastGeneratedResponse?.sources || [],
        confidence_score: lastGeneratedResponse?.confidence_score || 0.8,
        regulatory_compliance: lastGeneratedResponse?.regulatory_compliance || {
          requirements_met: [],
          missing_requirements: [],
          recommendations: []
        },
        quality_metrics: lastGeneratedResponse?.quality_metrics || {
          completeness: 0.8,
          accuracy: 0.8,
          regulatory_alignment: 0.8,
          professional_language: 0.8
        }
      };

      await ipoContentGenerationService.saveSectionContent(projectId, sectionType, response);
      
      toast({
        title: "Saved",
        description: "Section content has been saved successfully.",
      });
    } catch (error) {
      console.error('❌ Save error:', error);
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save content",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = () => {
    saveCurrentContent();
  };

  const handleExport = async (format: 'word' | 'pdf' | 'excel') => {
    if (!generatedContent) {
      toast({
        title: "No Content",
        description: "Please generate content before exporting.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    try {
      const sectionTitle = getSectionTitle(selectedSection);
      const filename = `${sectionTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`;
      
      let blob: Blob;
      let mimeType: string;
      let fileExtension: string;

      switch (format) {
        case 'word':
          blob = await documentService.generateWordDocument(generatedContent);
          mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          fileExtension = 'docx';
          break;
        case 'pdf':
          // PDF generation would be implemented here
          throw new Error('PDF export not yet implemented');
        case 'excel':
          // Excel generation would be implemented here  
          throw new Error('Excel export not yet implemented');
        default:
          throw new Error('Unsupported export format');
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.${fileExtension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: `${sectionTitle} exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to export document",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Get section title for display
  const getSectionTitle = (section: string) => {
    const sectionMap = {
      'overview': 'Business Overview',
      'history': 'History & Development', 
      'products': 'Products & Services',
      'strengths': 'Competitive Strengths',
      'strategy': 'Business Strategy',
      'summary': 'Financial Summary',
      'statements': 'Financial Statements',
      'analysis': 'Management Analysis',
      'business_risks': 'Business Risks',
      'financial_risks': 'Financial Risks',
      'regulatory_risks': 'Regulatory Risks',
      'board': 'Board of Directors',
      'management': 'Senior Management',
      'governance': 'Corporate Governance',
      'industry_regulation': 'Industry Regulation',
      'compliance': 'Compliance Framework',
      'use_of_proceeds': 'Use of Proceeds',
      'future_outlook': 'Future Outlook'
    };
    return sectionMap[section] || 'Business Section';
  };

  return (
    <div className="h-full flex flex-col">
      <DraftingHeader
        selectedSection={selectedSection}
        onSelectSection={onSelectSection}
        isChatOpen={isChatOpen}
        onToggleChat={onToggleChat}
        onSave={handleSave}
        onExport={handleExport}
        isExporting={isExporting}
        isSaving={isSaving}
      />

      <DraftContentArea
        generatedContent={generatedContent}
        setGeneratedContent={setGeneratedContent}
        isEditMode={true} // Always in edit mode
        setIsEditMode={() => {}} // No toggle needed
        isGenerating={isGenerating}
        isLoading={isLoading}
        onRegenerate={() => {}} // Remove regenerate functionality
        layoutMode="drafting"
        sectionType={selectedSection}
      />
    </div>
  );
};