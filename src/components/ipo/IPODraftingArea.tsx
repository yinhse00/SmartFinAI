import React, { useState, useEffect } from 'react';
import { useIPOContentGeneration } from '@/hooks/useIPOContentGeneration';
import { IPOContentGenerationRequest } from '@/types/ipo';
import { EnhancedSourcesDisplay } from './EnhancedSourcesDisplay';
import { DraftingHeader } from './drafting/DraftingHeader';
import { DraftContentArea } from './drafting/DraftContentArea';
import { SourcesFooter } from './drafting/SourcesFooter';
import { TabNavigation } from './drafting/TabNavigation';
import { InputGenerateTab } from './drafting/InputGenerateTab';

interface IPODraftingAreaProps {
  projectId: string;
  selectedSection: string;
  onToggleChat: () => void;
  isChatOpen: boolean;
  onPassContentToChat: (content: string, onUpdate: (newContent: string) => void) => void;
  layoutMode?: 'drafting' | 'tab';
}

export const IPODraftingArea: React.FC<IPODraftingAreaProps> = ({
  projectId,
  selectedSection,
  onToggleChat,
  isChatOpen,
  onPassContentToChat,
  layoutMode = 'drafting'
}) => {
  const [activeTab, setActiveTab] = useState('draft');
  const [isEditMode, setIsEditMode] = useState(false);
  const [keyElements, setKeyElements] = useState({
    company_description: '',
    principal_activities: '',
    business_model: ''
  });

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

  // Update content when generated content changes
  useEffect(() => {
    if (generatedContent) {
      setActiveTab('draft');
    }
  }, [generatedContent]);

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

  const handleGenerateContent = async () => {
    const request: IPOContentGenerationRequest = {
      project_id: projectId,
      section_type: selectedSection,
      key_elements: keyElements,
      industry_context: 'Hong Kong IPO',
      regulatory_requirements: ['HKEX Main Board', 'App1A Part A']
    };

    await generateContent(request);
  };

  const handleRegenerateContent = async () => {
    const request: IPOContentGenerationRequest = {
      project_id: projectId,
      section_type: selectedSection,
      key_elements: keyElements,
      industry_context: 'Hong Kong IPO',
      regulatory_requirements: ['HKEX Main Board', 'App1A Part A']
    };

    await regenerateContent(request);
  };

  const handleUploadDD = () => {
    console.log('Upload DD documents');
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
      'risk_factors': 'Risk Factors'
    };
    return sectionMap[section] || 'Business Section';
  };

  if (layoutMode === 'drafting') {
    // Simplified drafting layout - full screen draft editor
    return (
      <div className="h-full flex flex-col">
        <DraftingHeader
          sectionTitle={getSectionTitle(selectedSection)}
          isChatOpen={isChatOpen}
          onToggleChat={onToggleChat}
          layoutMode={layoutMode}
        />

        <DraftContentArea
          generatedContent={generatedContent}
          setGeneratedContent={setGeneratedContent}
          isEditMode={isEditMode}
          setIsEditMode={setIsEditMode}
          isGenerating={isGenerating}
          isLoading={isLoading}
          onRegenerate={handleRegenerateContent}
          layoutMode={layoutMode}
        />

        <SourcesFooter
          lastGeneratedResponse={lastGeneratedResponse}
          onViewSources={() => setActiveTab('sources')}
        />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header with Controls */}
      <div className="border-b bg-background p-4">
        <DraftingHeader
          sectionTitle={getSectionTitle(selectedSection)}
          isChatOpen={isChatOpen}
          onToggleChat={onToggleChat}
          layoutMode={layoutMode}
        />
        
        {/* Tab Navigation in Header */}
        <div className="mt-3">
          <TabNavigation
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>
      </div>

      {/* Maximized Content Area */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'draft' && (
          <DraftContentArea
            generatedContent={generatedContent}
            setGeneratedContent={setGeneratedContent}
            isEditMode={isEditMode}
            setIsEditMode={setIsEditMode}
            isGenerating={isGenerating}
            isLoading={isLoading}
            onRegenerate={handleRegenerateContent}
            layoutMode={layoutMode}
          />
        )}

        {activeTab === 'input' && (
          <InputGenerateTab
            keyElements={keyElements}
            setKeyElements={setKeyElements}
            isGenerating={isGenerating}
            onGenerate={handleGenerateContent}
            onUploadDD={handleUploadDD}
          />
        )}

        {activeTab === 'sources' && (
          <div className="h-full">
            <EnhancedSourcesDisplay sources={lastGeneratedResponse?.sources || []} />
          </div>
        )}
      </div>
    </div>
  );
};