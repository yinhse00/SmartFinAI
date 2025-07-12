import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  Play, 
  AlertCircle, 
  CheckCircle, 
  Code, 
  Eye,
  Save,
  Download,
  Zap
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { latexProcessor, LaTeXDocument } from '@/services/ipo/latexProcessor';
import { latexContentService } from '@/services/ipo/latexContentService';
import { LaTeXGenerationResponse } from '@/types/latex';
import { useToast } from '@/hooks/use-toast';

interface LaTeXEditorProps {
  projectId: string;
  sectionType: string;
  initialContent?: string;
  onContentChange?: (content: string) => void;
  onSave?: (content: string) => void;
}

export const LaTeXEditor: React.FC<LaTeXEditorProps> = ({
  projectId,
  sectionType,
  initialContent = '',
  onContentChange,
  onSave
}) => {
  const [content, setContent] = useState(initialContent);
  const [parsedDocument, setParsedDocument] = useState<LaTeXDocument | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('editor');
  const { toast } = useToast();

  // Parse document when content changes
  useEffect(() => {
    if (content.trim()) {
      try {
        const document = latexProcessor.parseDocument(content);
        setParsedDocument(document);
        
        // Validate syntax
        const validation = latexProcessor['validateLaTeX'](content);
        setValidationResult(validation);
      } catch (error) {
        console.error('Error parsing LaTeX document:', error);
      }
    }
  }, [content]);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    onContentChange?.(newContent);
  };

  const handleSave = async () => {
    if (!content.trim()) return;
    
    setIsProcessing(true);
    try {
      await latexContentService.saveLaTeXSection(projectId, sectionType, {
        content,
        latexContent: content,
        sources: [],
        confidence_score: 0.85,
        compilationReady: validationResult?.compilationReady || false,
        artifactId: `${projectId}_${sectionType}_${Date.now()}`,
        regulatory_compliance: {
          requirements_met: [],
          missing_requirements: [],
          recommendations: []
        },
        quality_metrics: {
          completeness: 0.85,
          accuracy: 0.85,
          regulatory_alignment: 0.85,
          professional_language: 0.85
        }
      });
      
      onSave?.(content);
      toast({
        title: "LaTeX Content Saved",
        description: "Your LaTeX document has been saved successfully"
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyInstructions = async (instructions: string) => {
    if (!instructions.trim()) return;
    
    setIsProcessing(true);
    try {
      const result = await latexContentService.applyTargetedEdits(
        projectId,
        sectionType,
        instructions
      );
      
      setContent(result.latexContent);
      toast({
        title: "Instructions Applied",
        description: "Your LaTeX document has been updated according to the instructions"
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadLatex = () => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sectionType}_${Date.now()}.tex`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileText className="h-5 w-5" />
          <h3 className="text-lg font-semibold">LaTeX Editor</h3>
          {validationResult && (
            <Badge variant={validationResult.syntaxValid ? "default" : "destructive"}>
              {validationResult.syntaxValid ? (
                <CheckCircle className="h-3 w-3 mr-1" />
              ) : (
                <AlertCircle className="h-3 w-3 mr-1" />
              )}
              {validationResult.syntaxValid ? 'Valid' : 'Syntax Error'}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={downloadLatex}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button 
            size="sm" 
            onClick={handleSave}
            disabled={isProcessing}
          >
            <Save className="h-4 w-4 mr-2" />
            {isProcessing ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Validation Alerts */}
      {validationResult && !validationResult.syntaxValid && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            LaTeX syntax errors detected: {validationResult.issues.join(', ')}
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <div className="flex-1">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="editor" className="flex items-center space-x-2">
              <Code className="h-4 w-4" />
              <span>Editor</span>
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center space-x-2">
              <Eye className="h-4 w-4" />
              <span>Structure</span>
            </TabsTrigger>
            <TabsTrigger value="commands" className="flex items-center space-x-2">
              <Zap className="h-4 w-4" />
              <span>AI Commands</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="h-full mt-4">
            <Card className="h-full">
              <CardContent className="p-4 h-full">
                <Textarea
                  value={content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  placeholder="Enter your LaTeX content here..."
                  className="h-full font-mono text-sm resize-none"
                  style={{ minHeight: '400px' }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preview" className="h-full mt-4">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Document Structure</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  {parsedDocument ? (
                    <div className="space-y-4">
                      {/* Sections */}
                      {parsedDocument.sections.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2">Sections</h4>
                          <div className="space-y-2">
                            {parsedDocument.sections.map((section, index) => (
                              <div key={index} className="p-2 border rounded">
                                <div className="font-medium">{section.title}</div>
                                <div className="text-sm text-muted-foreground">
                                  Type: {section.type} | Length: {section.content.length} chars
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Tables */}
                      {parsedDocument.tables.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2">Tables</h4>
                          <div className="space-y-2">
                            {parsedDocument.tables.map((table, index) => (
                              <div key={index} className="p-2 border rounded">
                                <div className="font-medium">{table.title}</div>
                                <div className="text-sm text-muted-foreground">
                                  Length: {table.content.length} chars
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {parsedDocument.sections.length === 0 && parsedDocument.tables.length === 0 && (
                        <div className="text-center text-muted-foreground py-8">
                          No LaTeX structure detected. Add sections or tables to see the document structure.
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      Enter LaTeX content to see document structure
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="commands" className="h-full mt-4">
            <LaTeXCommandPanel 
              onApplyInstructions={handleApplyInstructions}
              isProcessing={isProcessing}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// Command Panel Component
const LaTeXCommandPanel: React.FC<{
  onApplyInstructions: (instructions: string) => void;
  isProcessing: boolean;
}> = ({ onApplyInstructions, isProcessing }) => {
  const [instructions, setInstructions] = useState('');

  const quickCommands = [
    'Update revenue to USD 80 million and recalculate CAGR',
    'Add new product to Key Products table',
    'Improve professional language',
    'Add regulatory citations',
    'Expand business model section'
  ];

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>AI Commands</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">
            Natural Language Instructions
          </label>
          <Textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="e.g., Update the revenue figure to USD 80 million and recalculate the CAGR..."
            className="mb-2"
          />
          <Button 
            onClick={() => onApplyInstructions(instructions)}
            disabled={!instructions.trim() || isProcessing}
            className="w-full"
          >
            <Play className="h-4 w-4 mr-2" />
            {isProcessing ? 'Processing...' : 'Apply Instructions'}
          </Button>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Quick Commands</label>
          <div className="space-y-2">
            {quickCommands.map((command, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="w-full text-left justify-start"
                onClick={() => setInstructions(command)}
              >
                {command}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};