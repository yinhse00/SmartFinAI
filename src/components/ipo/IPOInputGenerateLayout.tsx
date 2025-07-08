import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Upload, 
  Sparkles, 
  Loader2, 
  FileText, 
  Building, 
  Target,
  TrendingUp,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { useIPOContentGeneration } from '@/hooks/useIPOContentGeneration';
import { IPOContentGenerationRequest } from '@/types/ipo';
import { useToast } from '@/hooks/use-toast';

interface IPOInputGenerateLayoutProps {
  projectId: string;
  selectedSection: string;
  onSectionSelect: (section: string) => void;
  onContentGenerated: () => void;
}

const QUICK_SECTIONS = [
  { id: 'overview', title: 'Business Overview', icon: Building, description: 'Company description and core business' },
  { id: 'strategy', title: 'Business Strategy', icon: Target, description: 'Strategic objectives and competitive positioning' },
  { id: 'future_outlook', title: 'Future Outlook', icon: TrendingUp, description: 'Growth prospects and market opportunities' }
];

export const IPOInputGenerateLayout: React.FC<IPOInputGenerateLayoutProps> = ({
  projectId,
  selectedSection,
  onSectionSelect,
  onContentGenerated
}) => {
  const [keyElements, setKeyElements] = useState({
    company_description: '',
    principal_activities: '',
    business_model: ''
  });

  const {
    isGenerating,
    generatedContent,
    generateContent,
    clearContent
  } = useIPOContentGeneration();
  
  const { toast } = useToast();

  // Auto-switch to drafting layout when content is generated
  useEffect(() => {
    if (generatedContent && !isGenerating) {
      setTimeout(() => {
        onContentGenerated();
      }, 1500); // Small delay to show success state
    }
  }, [generatedContent, isGenerating, onContentGenerated]);

  const handleGenerateContent = async () => {
    console.log('🎯 IPOInputGenerateLayout: Generate button clicked');
    console.log('📋 Current form data:', keyElements);
    console.log('🎯 Selected section:', selectedSection);
    console.log('🏢 Project ID:', projectId);

    // Validate inputs
    if (!keyElements.company_description?.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a company description before generating content.",
        variant: "destructive"
      });
      return;
    }

    const request: IPOContentGenerationRequest = {
      project_id: projectId,
      section_type: selectedSection,
      key_elements: keyElements,
      industry_context: 'Hong Kong IPO',
      regulatory_requirements: ['HKEX Main Board', 'App1A Part A']
    };

    console.log('📤 Sending generation request:', request);
    const result = await generateContent(request);
    console.log('📥 Generation result:', result ? 'Success' : 'Failed');
  };

  const handleUploadDD = () => {
    console.log('Upload DD documents');
  };

  const selectedSectionData = QUICK_SECTIONS.find(s => s.id === selectedSection) || QUICK_SECTIONS[0];

  return (
    <div className="h-full bg-gradient-to-br from-background to-muted/20">
      {/* Header */}
      <div className="border-b bg-background/80 backdrop-blur-sm p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">Content Generation</h2>
              <p className="text-muted-foreground">
                Configure and generate IPO prospectus content with AI assistance
              </p>
            </div>
            {generatedContent && (
              <Badge variant="default" className="bg-green-500">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Content Ready
              </Badge>
            )}
          </div>
          
          {/* Quick Section Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Quick Start:</span>
            {QUICK_SECTIONS.map((section) => {
              const Icon = section.icon;
              return (
                <Button
                  key={section.id}
                  variant={selectedSection === section.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => onSectionSelect(section.id)}
                  className="h-8"
                >
                  <Icon className="h-3 w-3 mr-2" />
                  {section.title}
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <ScrollArea className="h-[calc(100vh-10rem)]">
        <div className="max-w-6xl mx-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Input Configuration */}
            <div className="space-y-6">
              {/* Selected Section Info */}
              <Card className="border-primary/20">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <selectedSectionData.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{selectedSectionData.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">{selectedSectionData.description}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Company Description
                      </label>
                      <Textarea
                        placeholder="Describe the company's core business, market position, and key value propositions..."
                        value={keyElements.company_description}
                        onChange={(e) => setKeyElements(prev => ({
                          ...prev,
                          company_description: e.target.value
                        }))}
                        rows={4}
                        className="resize-none"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Principal Activities
                      </label>
                      <Textarea
                        placeholder="List the main business activities, revenue streams, and operational focus areas..."
                        value={keyElements.principal_activities}
                        onChange={(e) => setKeyElements(prev => ({
                          ...prev,
                          principal_activities: e.target.value
                        }))}
                        rows={3}
                        className="resize-none"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Business Model
                      </label>
                      <Textarea
                        placeholder="Explain how the company generates revenue, key competitive advantages, and market strategy..."
                        value={keyElements.business_model}
                        onChange={(e) => setKeyElements(prev => ({
                          ...prev,
                          business_model: e.target.value
                        }))}
                        rows={3}
                        className="resize-none"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Generation Controls */}
              <Card>
                <CardContent className="pt-6">
                  <Button 
                    className="w-full h-12 text-base" 
                    onClick={handleGenerateContent}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Generating Content...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5 mr-2" />
                        Generate {selectedSectionData.title}
                      </>
                    )}
                  </Button>
                  
                  {generatedContent && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800">Content Generated Successfully</span>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={onContentGenerated}
                          className="border-green-300 text-green-700 hover:bg-green-100"
                        >
                          Switch to Editor
                          <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                      <p className="text-xs text-green-700 mt-1">
                        Ready to edit and refine in the drafting workspace
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Support & Upload */}
            <div className="space-y-6">
              {/* Due Diligence Upload */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Supporting Documents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                    <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                    <h4 className="font-medium mb-2">Upload Due Diligence Documents</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Upload relevant business documents to enhance content generation
                    </p>
                    <Button variant="outline" onClick={handleUploadDD}>
                      Select Documents
                    </Button>
                  </div>
                  
                  <div className="mt-6">
                    <h4 className="text-sm font-medium mb-3">Recommended Document Types:</h4>
                    <div className="space-y-2">
                      {[
                        'Business plans and strategy documents',
                        'Management presentations',
                        'Market research and analysis',
                        'Financial statements and projections',
                        'Product/service documentation',
                        'Industry reports and benchmarks'
                      ].map((item, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Content Preview */}
              {generatedContent && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Generated Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted/50 rounded-lg p-4 max-h-60 overflow-y-auto">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {generatedContent.substring(0, 500)}
                        {generatedContent.length > 500 && '...'}
                      </p>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{generatedContent.split(' ').length} words generated</span>
                      <Button variant="ghost" size="sm" onClick={clearContent}>
                        Clear & Restart
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};