import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  MessageSquare, 
  FileText, 
  Upload, 
  Save, 
  Eye, 
  RotateCcw,
  ExternalLink,
  Sparkles,
  Loader2,
  ArrowRight
} from 'lucide-react';
import { useIPOContentGeneration } from '@/hooks/useIPOContentGeneration';
import { IPOContentGenerationRequest } from '@/types/ipo';
import { EnhancedSourcesDisplay } from './EnhancedSourcesDisplay';

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
  const [keyElements, setKeyElements] = useState({
    company_description: '',
    principal_activities: '',
    business_model: ''
  });

  const {
    isGenerating,
    generatedContent,
    lastGeneratedResponse,
    generateContent,
    regenerateContent,
    setGeneratedContent
  } = useIPOContentGeneration();

  // Update content when generated content changes
  useEffect(() => {
    if (generatedContent) {
      setActiveTab('draft');
    }
  }, [generatedContent]);

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
        {/* Minimal Header */}
        <div className="border-b bg-background p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">{getSectionTitle(selectedSection)}</h2>
              <p className="text-sm text-muted-foreground">
                App1A Part A - {getSectionTitle(selectedSection)} content
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Draft</Badge>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button variant="outline" size="sm">
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={onToggleChat}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                {isChatOpen ? 'Hide' : 'Show'} AI Chat
              </Button>
            </div>
          </div>
        </div>

        {/* Maximized Draft Content */}
        <div className="flex-1 p-6">
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <span className="font-medium">Draft Content</span>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleRegenerateContent}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RotateCcw className="h-4 w-4 mr-2" />
                  )}
                  Regenerate
                </Button>
              </div>
            </div>
            <Textarea
              placeholder="Your generated content will appear here. Use the AI chat to request improvements, compliance checks, or refinements..."
              value={generatedContent}
              onChange={(e) => setGeneratedContent(e.target.value)}
              className="flex-1 resize-none border-2 focus:ring-2 p-6 text-base leading-relaxed"
            />
          </div>
        </div>

        {/* Sources Footer */}
        {lastGeneratedResponse?.sources && lastGeneratedResponse.sources.length > 0 && (
          <div className="border-t bg-muted/30 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {lastGeneratedResponse.sources.length} source{lastGeneratedResponse.sources.length !== 1 ? 's' : ''} referenced
                </span>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setActiveTab('sources')}
              >
                View Sources
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header with Controls */}
      <div className="border-b bg-background p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold">{getSectionTitle(selectedSection)}</h2>
            <p className="text-sm text-muted-foreground">
              App1A Part A - {getSectionTitle(selectedSection)} content
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Draft</Badge>
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={onToggleChat}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              {isChatOpen ? 'Hide' : 'Show'} AI Chat
            </Button>
          </div>
        </div>
        
        {/* Tab Navigation in Header */}
        <div className="flex items-center gap-2">
          <Button 
            variant={activeTab === 'draft' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setActiveTab('draft')}
          >
            <FileText className="h-4 w-4 mr-2" />
            Draft Content
          </Button>
          <Button 
            variant={activeTab === 'input' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setActiveTab('input')}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Input & Generate
          </Button>
          <Button 
            variant={activeTab === 'sources' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setActiveTab('sources')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Sources
          </Button>
        </div>
      </div>

      {/* Maximized Content Area */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'draft' && (
          <div className="h-full p-4">
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  <span className="font-medium">Draft Content</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleRegenerateContent}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RotateCcw className="h-4 w-4 mr-2" />
                    )}
                    Regenerate
                  </Button>
                  <Button size="sm" disabled={!generatedContent}>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                </div>
              </div>
              <Textarea
                placeholder="Generated content will appear here..."
                value={generatedContent}
                onChange={(e) => setGeneratedContent(e.target.value)}
                className="flex-1 resize-none border-0 focus:ring-0 p-6 text-base leading-relaxed"
              />
            </div>
          </div>
        )}

        {activeTab === 'input' && (
          <div className="h-full p-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
              {/* Key Elements Input */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Key Elements Input
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Company Description
                    </label>
                    <Textarea
                      placeholder="Describe the company's core business..."
                      value={keyElements.company_description}
                      onChange={(e) => setKeyElements(prev => ({
                        ...prev,
                        company_description: e.target.value
                      }))}
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Principal Activities
                    </label>
                    <Textarea
                      placeholder="List the main business activities..."
                      value={keyElements.principal_activities}
                      onChange={(e) => setKeyElements(prev => ({
                        ...prev,
                        principal_activities: e.target.value
                      }))}
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Business Model
                    </label>
                    <Textarea
                      placeholder="Explain how the company generates revenue..."
                      value={keyElements.business_model}
                      onChange={(e) => setKeyElements(prev => ({
                        ...prev,
                        business_model: e.target.value
                      }))}
                      rows={3}
                    />
                  </div>
                  
                  <Button 
                    className="w-full" 
                    onClick={handleGenerateContent}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    {isGenerating ? 'Generating...' : 'Generate First Draft'}
                  </Button>
                </CardContent>
              </Card>

              {/* DD Document Upload */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Due Diligence Documents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-4">
                      Upload business-related DD documents
                    </p>
                    <Button variant="outline" onClick={handleUploadDD}>
                      Upload Documents
                    </Button>
                  </div>
                  
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Recommended Documents:</h4>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Business plan and strategy documents</li>
                      <li>• Management presentations</li>
                      <li>• Market research reports</li>
                      <li>• Competitive analysis</li>
                      <li>• Product/service documentation</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
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