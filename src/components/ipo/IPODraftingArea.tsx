import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageSquare, 
  FileText, 
  Upload, 
  Save, 
  Eye, 
  RotateCcw,
  ExternalLink,
  Sparkles,
  Loader2
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIPOContentGeneration } from '@/hooks/useIPOContentGeneration';
import { IPOContentGenerationRequest } from '@/types/ipo';

interface IPODraftingAreaProps {
  projectId: string;
  selectedSection: string;
  onToggleChat: () => void;
  isChatOpen: boolean;
  onPassContentToChat: (content: string, onUpdate: (newContent: string) => void) => void;
}

export const IPODraftingArea: React.FC<IPODraftingAreaProps> = ({
  projectId,
  selectedSection,
  onToggleChat,
  isChatOpen,
  onPassContentToChat
}) => {
  const [activeTab, setActiveTab] = useState('input');
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
    // This will open file upload dialog
    console.log('Upload DD documents');
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b bg-background p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Business Overview</h2>
            <p className="text-sm text-muted-foreground">
              App1A Part A para 32 - Company business description
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
      </div>

      {/* Main content */}
      <div className="flex-1 p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="input">Input & Generate</TabsTrigger>
            <TabsTrigger value="draft">Draft Content</TabsTrigger>
            <TabsTrigger value="sources">Sources</TabsTrigger>
          </TabsList>
          
          <TabsContent value="input" className="h-full mt-4">
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
          </TabsContent>
          
          <TabsContent value="draft" className="h-full mt-4">
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Draft Content</CardTitle>
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
              </CardHeader>
              <CardContent className="h-full">
                <Textarea
                  placeholder="Generated content will appear here..."
                  value={generatedContent}
                  onChange={(e) => setGeneratedContent(e.target.value)}
                  className="h-[calc(100%-4rem)] resize-none"
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="sources" className="h-full mt-4">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-base">Source Attribution</CardTitle>
              </CardHeader>
              <CardContent>
                {lastGeneratedResponse?.sources && lastGeneratedResponse.sources.length > 0 ? (
                  <div className="space-y-4">
                    {lastGeneratedResponse.sources.map((source, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline">{source.source_type}</Badge>
                          <span className="text-xs text-muted-foreground">
                            Confidence: {(source.confidence_score * 100).toFixed(0)}%
                          </span>
                        </div>
                        <p className="text-sm">{source.content_snippet}</p>
                        {source.source_reference && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Source: {source.source_reference}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">No sources available yet</p>
                    <p className="text-xs">Generate content to see source attribution</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};