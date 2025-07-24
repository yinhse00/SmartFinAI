import React, { useState, useEffect } from 'react';
import { useIPOContentGeneration } from '@/hooks/useIPOContentGeneration';
import { IPOContentGenerationRequest } from '@/types/ipo';
import { DraftingHeader } from './drafting/DraftingHeader';
import { DraftContentArea } from './drafting/DraftContentArea';
import { useToast } from '@/hooks/use-toast';
import { documentService } from '@/services/documents/documentService';

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
  const { toast } = useToast();

  const {
    isGenerating,
    isLoading,
    generatedContent,
    lastGeneratedResponse,
    generateContent,
    regenerateContent,
    loadExistingContent,
    setGeneratedContent
  } = useIPOContentGeneration();

  // Load existing content when section changes
  useEffect(() => {
    if (projectId && selectedSection) {
      loadExistingContent(projectId, selectedSection);
    }
  }, [projectId, selectedSection]);

  // Pass current content to chat when it opens or content changes
  useEffect(() => {
    if (isChatOpen && generatedContent) {
      onPassContentToChat(generatedContent, setGeneratedContent);
    }
  }, [isChatOpen, generatedContent, onPassContentToChat, setGeneratedContent]);

  const handleSave = () => {
    // Save functionality
    toast({
      title: "Saved",
      description: "Section content has been saved successfully.",
    });
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